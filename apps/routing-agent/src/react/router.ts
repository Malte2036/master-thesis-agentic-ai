import {
  AgentTools,
  AIProvider,
  CallToolResult,
  getAgentTools,
  ListToolsResult,
  MCPClient,
} from '@master-thesis-agentic-rag/agent-framework';
import {
  addIterationToRouterProcess,
  McpAgentCall,
  RouterProcess,
  RouterResponse,
  StructuredThoughtResponse,
  StructuredThoughtResponseSchema,
} from '@master-thesis-agentic-rag/types';
import chalk from 'chalk';

import {
  callMcpAgentsInParallel,
  getAllAgentsMcpClients,
} from '../agents/agent';
import { Router } from '../router';
import { ReActPrompt } from './prompt';

export class ReActRouter implements Router {
  constructor(
    private readonly aiProvider: AIProvider,
    private readonly structuredAiProvider: AIProvider,
  ) {}

  async *routeQuestion(
    question: string,
    maxIterations: number,
  ): AsyncGenerator<RouterProcess, RouterResponse, unknown> {
    const agents = await getAllAgentsMcpClients();
    const routerProcess: RouterProcess = {
      question,
      maxIterations,
      iterationHistory: [],
    };
    const generator = this.iterate(agents, routerProcess);
    while (true) {
      const { done, value } = await generator.next();
      if (done) {
        await Promise.all(
          agents.map((agent) =>
            agent.terminateSession().then(() => agent.disconnect()),
          ),
        );
        return value satisfies RouterResponse;
      }
      yield value satisfies RouterProcess;
    }
  }

  async *iterate(
    agents: MCPClient[],
    routerProcess: RouterProcess,
  ): AsyncGenerator<RouterProcess, RouterResponse, unknown> {
    const agentTools = await getAgentTools(agents);

    const maxIterations = routerProcess.maxIterations;
    let currentIteration = routerProcess.iterationHistory?.length ?? 0;

    while (currentIteration < maxIterations) {
      console.log(chalk.magenta('--------------------------------'));
      console.log(
        chalk.cyan('Iteration'),
        currentIteration + 1,
        '/',
        maxIterations,
      );
      console.log(chalk.magenta('--------------------------------'));

      const naturalLanguageThought = await this.getNaturalLanguageThought(
        agentTools,
        routerProcess,
      );

      const structuredThought = await this.getStructuredThought(
        naturalLanguageThought,
        agentTools,
      );

      if (structuredThought.isFinished) {
        console.log(chalk.magenta('Finished'));

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

      if (!structuredThought.agentCalls) {
        console.log(chalk.magenta('No agent calls found.'));
        return {
          process: routerProcess,
          error: 'No agent calls found. Please try rephrasing your question.',
        };
      }

      if (
        this.hasDuplicateAgentCalls(routerProcess, structuredThought.agentCalls)
      ) {
        console.log(
          chalk.red(
            'Detected loop with repeated agent calls. Breaking iteration. Wanted to call:',
          ),
          JSON.stringify(structuredThought.agentCalls, null, 2),
        );
        return {
          process: routerProcess,
          error:
            'I noticed we were repeating the same queries without progress.',
        };
      }

      this.logAgentCalls(structuredThought.agentCalls);

      const agentResponses = await callMcpAgentsInParallel(
        agents,
        structuredThought.agentCalls,
        maxIterations - currentIteration,
      );

      const observation = await this.observeAndSummarizeAgentResponses(
        routerProcess.question,
        structuredThought.agentCalls,
        agentResponses,
        structuredThought,
      );

      console.log(
        chalk.magenta('Observation of the current iteration:'),
        chalk.yellow(observation),
      );

      routerProcess = addIterationToRouterProcess(
        routerProcess,
        currentIteration,
        naturalLanguageThought,
        structuredThought,
        observation,
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
    agentTools: AgentTools,
    routerProcess: RouterProcess,
  ): Promise<string> {
    const systemPrompt = ReActPrompt.getNaturalLanguageThoughtPrompt(
      agentTools,
      routerProcess,
    );

    console.log(chalk.magenta('Generating natural language thought...'));

    const responseString = await this.aiProvider.generateText?.(
      routerProcess.question,
      systemPrompt,
    );

    if (!responseString) {
      throw new Error('No response from AI provider');
    }

    console.log(chalk.magenta('Natural language thought:'), responseString);

    return responseString;
  }

  async getStructuredThought(
    responseString: string,
    agentTools: Record<string, ListToolsResult>,
  ): Promise<StructuredThoughtResponse> {
    console.log(chalk.magenta('Generating structured thought...'));
    const structuredSystemPrompt =
      ReActPrompt.getStructuredThoughtPrompt(agentTools);

    const structuredResponse =
      await this.structuredAiProvider.generateJson<StructuredThoughtResponse>(
        responseString,
        structuredSystemPrompt,
        StructuredThoughtResponseSchema,
        0.1,
      );

    console.log(chalk.magenta('Structured thought:'), structuredResponse);
    return structuredResponse;
  }

  async observeAndSummarizeAgentResponses(
    question: string,
    agentCalls: McpAgentCall[],
    agentResponses: CallToolResult[],
    structuredThought?: StructuredThoughtResponse,
  ): Promise<string> {
    console.log(chalk.cyan('Observing and summarizing agent responses'));

    const systemPrompt = ReActPrompt.getNaturalLanguageObservationPrompt(
      agentCalls,
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

  private logAgentCalls(agentCalls: McpAgentCall[]) {
    console.log(chalk.cyan('Agent calls:'));
    const flattenedCalls = agentCalls.flatMap((agentCall) => [
      {
        agent: agentCall.agent,
        function: agentCall.function,
        parameters: JSON.stringify(agentCall.args, null, 2),
      },
    ]);
    console.table(flattenedCalls);
  }

  private hasDuplicateAgentCalls(
    routerProcess: RouterProcess,
    agentCalls: McpAgentCall[],
  ): boolean {
    // Serialize current agent calls to check for duplicates
    const currentAgentCallsStr = JSON.stringify(
      agentCalls.map((a) => ({
        ...a,
        description: undefined,
      })),
    );
    // Check if we're repeating the same calls - detect loop
    return (
      routerProcess.iterationHistory?.some(
        (response) =>
          JSON.stringify(response.structuredThought.agentCalls) ===
          currentAgentCallsStr,
      ) ?? false
    );
  }
}
