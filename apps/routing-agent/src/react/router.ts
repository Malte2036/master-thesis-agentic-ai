import {
  addIterationToRouterProcess,
  AIProvider,
  CallToolResult,
  getAgentConfigs,
  ListToolsResult,
  McpAgentCall,
  MCPClient,
  RouterResponse,
} from '@master-thesis-agentic-rag/agent-framework';
import chalk from 'chalk';

import { RouterProcess } from '@master-thesis-agentic-rag/agent-framework';
import {
  callMcpAgentsInParallel,
  getAllAgentsMcpClients,
} from '../agents/agent';
import { Router } from '../router';
import { ReActPrompt } from './prompt';
import {
  ReactActObserveAndSummarizeAgentResponsesResponse,
  ReactActObserveAndSummarizeAgentResponsesResponseSchema,
  ReactActThinkAndFindActionsResponse,
  ReactActThinkAndFindActionsResponseSchema,
} from './types';

export class ReActRouter implements Router {
  constructor(private readonly aiProvider: AIProvider) {}

  async *routeQuestion(
    question: string,
    moodle_token: string,
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

      const thinkAndFindResponse = await this.thinkAndFindActions(
        agents,
        routerProcess,
      );
      const { agentCalls, isFinished } = thinkAndFindResponse;

      console.log(
        chalk.magenta('Thought process:'),
        chalk.yellow(thinkAndFindResponse.thought),
      );

      if (isFinished) {
        console.log(chalk.magenta('Finished'));

        routerProcess = addIterationToRouterProcess(
          routerProcess,
          currentIteration,
          thinkAndFindResponse.thought,
          'Finished',
          agentCalls,
          isFinished,
        );
        return {
          process: routerProcess,
        };
      }

      if (!agentCalls) {
        console.log(chalk.magenta('No agent calls found.'));
        return {
          process: routerProcess,
          error: 'No agent calls found. Please try rephrasing your question.',
        };
      }

      // Serialize current agent calls to check for duplicates
      const currentAgentCallsStr = JSON.stringify(
        agentCalls.map((a) => ({
          ...a,
          description: undefined,
        })),
      );

      // Check if we're repeating the same calls - detect loop
      const hasDuplicateCalls = routerProcess.iterationHistory?.some(
        (response) =>
          JSON.stringify(response.agentCalls) === currentAgentCallsStr,
      );

      if (hasDuplicateCalls) {
        console.log(
          chalk.red(
            'Detected loop with repeated agent calls. Breaking iteration. Wanted to call:',
          ),
          JSON.stringify(agentCalls, null, 2),
        );
        return {
          process: routerProcess,
          error:
            'I noticed we were repeating the same queries without progress.',
        };
      }

      this.logAgentCalls(agentCalls);

      const agentResponses = await callMcpAgentsInParallel(
        agents,
        agentCalls,
        maxIterations - currentIteration,
      );

      const { summary } = await this.observeAndSummarizeAgentResponses(
        routerProcess.question,
        agentCalls,
        agentResponses,
        thinkAndFindResponse,
      );

      console.log(
        chalk.magenta('Summary of the current iteration:'),
        chalk.yellow(summary),
      );

      routerProcess = addIterationToRouterProcess(
        routerProcess,
        currentIteration,
        thinkAndFindResponse.thought,
        summary,
        agentCalls,
        isFinished,
      );

      yield routerProcess;
      currentIteration++;
    }

    return {
      error: 'Maximum number of iterations reached.',
      process: routerProcess,
    };
  }

  async thinkAndFindActions(
    agents: MCPClient[],
    routerProcess: RouterProcess,
  ): Promise<ReactActThinkAndFindActionsResponse> {
    const agentTools: Record<string, ListToolsResult> = {};
    for (const agent of agents) {
      const tools = await agent.listTools();
      agentTools[agent.name] = tools;
    }

    const systemPrompt = ReActPrompt.getThinkAndFindActionPrompt(
      agentTools,
      routerProcess,
    );

    return await this.aiProvider.generateText<ReactActThinkAndFindActionsResponse>(
      routerProcess.question,
      systemPrompt,
      ReactActThinkAndFindActionsResponseSchema,
    );
  }

  async observeAndSummarizeAgentResponses(
    question: string,
    agentCalls: McpAgentCall[],
    agentResponses: CallToolResult[],
    thinkAndFindResponse?: ReactActThinkAndFindActionsResponse,
  ): Promise<ReactActObserveAndSummarizeAgentResponsesResponse> {
    console.log(chalk.cyan('Observing and summarizing agent responses'));

    const systemPrompt = ReActPrompt.getObserveAndSummarizeAgentResponsesPrompt(
      agentCalls,
      agentResponses,
      thinkAndFindResponse,
    );

    return await this.aiProvider.generateText<ReactActObserveAndSummarizeAgentResponsesResponse>(
      question,
      systemPrompt,
      ReactActObserveAndSummarizeAgentResponsesResponseSchema,
    );
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
}
