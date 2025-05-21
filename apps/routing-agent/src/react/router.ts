import {
  addIterationToRouterProcess,
  AgentCall,
  AgentCallFunction,
  AIProvider,
  getAgentConfigs,
  RouterResponse,
} from '@master-thesis-agentic-rag/agent-framework';
import chalk from 'chalk';

import { Router } from '../router';
import { ReActPrompt } from './prompt';
import {
  ReactActObserveAndSummarizeAgentResponsesResponse,
  ReactActObserveAndSummarizeAgentResponsesResponseSchema,
  ReactActThinkAndFindActionsResponse,
  ReactActThinkAndFindActionsResponseSchema,
} from './types';
import { callAgentsInParallel } from '../agents/agent';
import {
  AgentResponse,
  RouterProcess,
} from '@master-thesis-agentic-rag/agent-framework';

export class ReActRouter implements Router {
  constructor(private readonly aiProvider: AIProvider) {}

  async *routeQuestion(
    question: string,
    moodle_token: string,
    maxIterations: number,
  ): AsyncGenerator<RouterProcess, RouterResponse, unknown> {
    const routerProcess: RouterProcess = {
      question,
      maxIterations,
      iterationHistory: [],
    };

    for await (const process of this.iterate(routerProcess, moodle_token)) {
      yield process;
    }

    return {
      process: routerProcess,
    };
  }

  async *iterate(
    routerProcess: RouterProcess,
    moodle_token: string,
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

      const thinkAndFindResponse =
        await this.thinkAndFindActions(routerProcess);
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
            'Detected loop with repeated agent calls. Breaking iteration.',
          ),
        );
        return {
          process: routerProcess,
          error:
            'I noticed we were repeating the same queries without progress.',
        };
      }

      console.log(chalk.cyan('Agent calls:'));
      const flattenedCalls = agentCalls.flatMap(
        (agentCall: AgentCall) =>
          agentCall.functionsToCall?.map((functionCall: AgentCallFunction) => ({
            agent: agentCall.agentName,
            function: functionCall.functionName,
            functionDescription: functionCall.description,
            parameters: JSON.stringify(functionCall.parameters, null, 2),
          })) || [],
      );
      console.table(flattenedCalls);

      const agentResponses = await callAgentsInParallel(
        [{ agentCalls }],
        moodle_token,
        maxIterations - currentIteration,
      );

      const { summary } = await this.observeAndSummarizeAgentResponses(
        routerProcess.question,
        agentResponses.filter(Boolean) as AgentResponse[],
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
    routerProcess: RouterProcess,
  ): Promise<ReactActThinkAndFindActionsResponse> {
    const agents = getAgentConfigs(false);
    const systemPrompt = ReActPrompt.getThinkAndFindActionPrompt(
      agents,
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
    agentResponses: AgentResponse[],
    thinkAndFindResponse?: ReactActThinkAndFindActionsResponse,
  ): Promise<ReactActObserveAndSummarizeAgentResponsesResponse> {
    console.log(chalk.cyan('Observing and summarizing agent responses'));

    const systemPrompt = ReActPrompt.getObserveAndSummarizeAgentResponsesPrompt(
      agentResponses,
      thinkAndFindResponse,
    );

    return await this.aiProvider.generateText<ReactActObserveAndSummarizeAgentResponsesResponse>(
      question,
      systemPrompt,
      ReactActObserveAndSummarizeAgentResponsesResponseSchema,
    );
  }
}
