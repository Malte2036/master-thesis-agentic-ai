import {
  AIProvider,
  CallToolResult,
  ListToolsResult,
  MCPClient,
} from '@master-thesis-agentic-rag/agent-framework';
import {
  addIterationToRouterProcess,
  McpAgentCall,
  RouterProcess,
  RouterResponse,
} from '@master-thesis-agentic-rag/types';
import chalk from 'chalk';

import {
  callMcpAgentsInParallel,
  getAllAgentsMcpClients,
} from '../agents/agent';
import { Router } from '../router';
import { ReActPrompt } from './prompt';
import {
  ReactActThinkAndFindActionsResponse,
  StrukturedThoughtResponse,
  StrukturedThoughtResponseSchema,
} from './types';

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

      const summary = await this.observeAndSummarizeAgentResponses(
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

    const responseString = await this.getNaturalLanguageThought(
      agents,
      routerProcess,
    );

    const structuredResponse = await this.getStructuredThought(
      responseString,
      agentTools,
    );

    return {
      thought: responseString,
      agentCalls: structuredResponse.agentCalls,
      isFinished: structuredResponse.isFinished,
    };
  }

  async getNaturalLanguageThought(
    agents: MCPClient[],
    routerProcess: RouterProcess,
  ): Promise<string> {
    const agentTools: Record<string, ListToolsResult> = {};
    for (const agent of agents) {
      const tools = await agent.listTools();
      agentTools[agent.name] = tools;
    }

    const systemPrompt = ReActPrompt.getThinkAndFindActionPrompt(
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
  ): Promise<StrukturedThoughtResponse> {
    console.log(chalk.magenta('Generating structured thought...'));
    const structuredSystemPrompt =
      ReActPrompt.getThinkAndFindActionToToolCallPrompt(agentTools);

    const structuredResponse =
      await this.structuredAiProvider.generateJson<StrukturedThoughtResponse>(
        responseString,
        structuredSystemPrompt,
        StrukturedThoughtResponseSchema,
      );

    console.log(chalk.magenta('Structured thought:'), structuredResponse);
    return structuredResponse;
  }

  async observeAndSummarizeAgentResponses(
    question: string,
    agentCalls: McpAgentCall[],
    agentResponses: CallToolResult[],
    thinkAndFindResponse?: StrukturedThoughtResponse,
  ): Promise<string> {
    console.log(chalk.cyan('Observing and summarizing agent responses'));

    const systemPrompt = ReActPrompt.getObserveAndSummarizeAgentResponsesPrompt(
      agentCalls,
      agentResponses,
      thinkAndFindResponse,
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
}
