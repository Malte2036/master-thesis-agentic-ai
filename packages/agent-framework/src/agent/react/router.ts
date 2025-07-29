import {
  addIterationToRouterProcess,
  FunctionCall,
  RouterProcess,
  RouterResponse,
  StructuredThoughtResponse,
  StructuredThoughtResponseSchema,
} from '@master-thesis-agentic-ai/types';
import chalk from 'chalk';

import {
  callMcpClientInParallel,
  getMcpClient,
} from '../../adapters/mcp/mcp_client_utils';
import { ReActPrompt } from './prompt';
import {
  ListToolsResult,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { MCPClient } from '../../adapters';
import { Logger } from '../../logger';
import { AIProvider } from '../../services';
import { Router } from '../router';
import { MCPName } from '../../config';

export class ReActRouter implements Router {
  constructor(
    private readonly aiProvider: AIProvider,
    private readonly structuredAiProvider: AIProvider,
    private readonly logger: Logger,
    private readonly mcpName: MCPName,
    private readonly extendedNaturalLanguageThoughtSystemPrompt: string,
  ) {}

  async *routeQuestion(
    question: string,
    maxIterations: number,
  ): AsyncGenerator<RouterProcess, RouterResponse, unknown> {
    const mcpClient = await getMcpClient(this.logger, this.mcpName);
    this.logger.log('MCP Client:', mcpClient.name);

    const routerProcess: RouterProcess = {
      question,
      maxIterations,
      iterationHistory: [],
    };
    const generator = this.iterate(mcpClient, routerProcess);
    while (true) {
      const { done, value } = await generator.next();
      if (done) {
        await mcpClient.terminateSession().then(() => mcpClient.disconnect());
        return value satisfies RouterResponse;
      }
      yield value satisfies RouterProcess;
    }
  }

  async *iterate(
    mcpClient: MCPClient,
    routerProcess: RouterProcess,
  ): AsyncGenerator<RouterProcess, RouterResponse, unknown> {
    const agentTools = await mcpClient.listTools();

    const maxIterations = routerProcess.maxIterations;
    let currentIteration = routerProcess.iterationHistory?.length ?? 0;

    while (currentIteration < maxIterations) {
      this.logger.log(chalk.magenta('--------------------------------'));
      this.logger.log(
        chalk.cyan('Iteration'),
        currentIteration + 1,
        '/',
        maxIterations,
      );
      this.logger.log(chalk.magenta('--------------------------------'));

      const naturalLanguageThought = await this.getNaturalLanguageThought(
        agentTools,
        routerProcess,
      );

      const structuredThought = await this.getStructuredThought(
        naturalLanguageThought,
        agentTools,
      );

      if (structuredThought.isFinished) {
        this.logger.log(chalk.magenta('Finished'));

        routerProcess = addIterationToRouterProcess(
          routerProcess,
          currentIteration,
          naturalLanguageThought,
          structuredThought,
          'Finished',
        );
        return {
          process: routerProcess,
        };
      }

      if (!structuredThought.functionCalls) {
        this.logger.log(chalk.magenta('No agent calls found.'));
        return {
          process: routerProcess,
          error: 'No agent calls found. Please try rephrasing your question.',
        };
      }

      if (
        this.hasDuplicateFunctionCalls(
          routerProcess,
          structuredThought.functionCalls,
        )
      ) {
        this.logger.log(
          chalk.red(
            'Detected loop with repeated agent calls. Breaking iteration. Wanted to call:',
          ),
          JSON.stringify(structuredThought.functionCalls, null, 2),
        );
        return {
          process: routerProcess,
          error:
            'I noticed we were repeating the same queries without progress.',
        };
      }

      this.logFunctionCalls(structuredThought.functionCalls);

      const agentResponses = await callMcpClientInParallel(
        this.logger,
        mcpClient,
        structuredThought.functionCalls,
        maxIterations - currentIteration,
      );

      this.logger.debug(
        chalk.magenta('The response from calling the agent functions:'),
        JSON.stringify(agentResponses, null, 2),
      );

      // const observation = await this.observeAndSummarizeAgentResponses(
      //   routerProcess.question,
      //   structuredThought.agentCalls,
      //   agentResponses,
      //   structuredThought,
      // );

      // this.logger.log(
      //   chalk.magenta('Observation of the current iteration:'),
      //   chalk.yellow(observation),
      // );

      // routerProcess = addIterationToRouterProcess(
      //   routerProcess,
      //   currentIteration,
      //   naturalLanguageThought,
      //   structuredThought,
      //   observation,
      // );

      routerProcess = addIterationToRouterProcess(
        routerProcess,
        currentIteration,
        naturalLanguageThought,
        structuredThought,
        JSON.stringify(agentResponses, null, 2),
      );

      yield routerProcess;
      currentIteration++;
    }

    return {
      error: 'Maximum number of iterations reached.',
      process: routerProcess,
    };
  }

  async getNaturalLanguageThought(
    agentTools: ListToolsResult,
    routerProcess: RouterProcess,
  ): Promise<string> {
    const systemPrompt = ReActPrompt.getNaturalLanguageThoughtPrompt(
      this.extendedNaturalLanguageThoughtSystemPrompt,
      agentTools,
      routerProcess,
    );

    this.logger.log(chalk.magenta('Generating natural language thought...'));

    const responseString = await this.aiProvider.generateText?.(
      routerProcess.question,
      systemPrompt,
    );

    if (!responseString) {
      throw new Error('No response from AI provider');
    }

    this.logger.log(chalk.magenta('Natural language thought:'), responseString);

    return responseString;
  }

  async getStructuredThought(
    responseString: string,
    agentTools: ListToolsResult,
  ): Promise<StructuredThoughtResponse> {
    this.logger.log(chalk.magenta('Generating structured thought...'));
    const structuredSystemPrompt =
      ReActPrompt.getStructuredThoughtPrompt(agentTools);

    const structuredResponse =
      await this.structuredAiProvider.generateJson<StructuredThoughtResponse>(
        responseString,
        structuredSystemPrompt,
        StructuredThoughtResponseSchema,
        0.1,
      );

    this.logger.log(
      chalk.magenta('Structured thought:'),
      JSON.stringify(structuredResponse, null, 2),
    );
    return structuredResponse;
  }

  async observeAndSummarizeAgentResponses(
    question: string,
    functionCalls: FunctionCall[],
    agentResponses: CallToolResult[],
    structuredThought?: StructuredThoughtResponse,
  ): Promise<string> {
    this.logger.log(chalk.cyan('Observing and summarizing agent responses'));

    const systemPrompt = ReActPrompt.getNaturalLanguageObservationPrompt(
      functionCalls,
      agentResponses,
      structuredThought,
    );

    const response = await this.aiProvider.generateText?.(
      question,
      systemPrompt,
    );

    if (!response) {
      throw new Error('No response from AI provider');
    }

    return response;
  }

  private logFunctionCalls(functionCalls: FunctionCall[]) {
    this.logger.log(chalk.cyan('Function calls:'));
    const flattenedCalls = functionCalls.flatMap((functionCall) => [
      {
        function: functionCall.function,
        parameters: JSON.stringify(functionCall.args, null, 2),
      },
    ]);
    this.logger.log(flattenedCalls);
  }

  private hasDuplicateFunctionCalls(
    routerProcess: RouterProcess,
    functionCalls: FunctionCall[],
  ): boolean {
    // Serialize current agent calls to check for duplicates
    const currentFunctionCallsStr = JSON.stringify(
      functionCalls.map((a) => ({
        ...a,
        description: undefined,
      })),
    );
    // Check if we're repeating the same calls - detect loop
    return (
      routerProcess.iterationHistory?.some(
        (response) =>
          JSON.stringify(response.structuredThought.functionCalls) ===
          currentFunctionCallsStr,
      ) ?? false
    );
  }
}
