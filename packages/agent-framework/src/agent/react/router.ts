import {
  addIterationToRouterProcess,
  FunctionCall,
  RouterProcess,
  RouterResponse,
} from '@master-thesis-agentic-ai/types';
import chalk from 'chalk';

import { MCPClient } from '../../adapters';
import {
  callMcpClientInParallel,
  getMcpClient,
} from '../../adapters/mcp/mcp_client_utils';
import { MCPName } from '../../config';
import { Logger } from '../../logger';
import { AIProvider } from '../../services';
import { Router } from '../router';
import { getNaturalLanguageThought } from './get-natural-language-thought';
import { getStructuredThought } from './get-structured-thought';
import { listAgentsToolsToAgentTools } from '../utils';

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
    const listAgentsTools = await mcpClient.listTools();
    const agentTools = listAgentsToolsToAgentTools(listAgentsTools);

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

      const naturalLanguageThought = await getNaturalLanguageThought(
        agentTools,
        routerProcess,
        this.aiProvider,
        this.logger,
        this.extendedNaturalLanguageThoughtSystemPrompt,
      );

      const structuredThought = await getStructuredThought(
        naturalLanguageThought,
        agentTools,
        this.structuredAiProvider,
        this.logger,
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
