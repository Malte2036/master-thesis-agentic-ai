import {
  AIProvider,
  getAgentConfigs,
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
import { AgentResponse } from '../agents/types';

export class ReActRouter implements Router {
  constructor(private readonly aiProvider: AIProvider) {}

  async routeQuestion(
    question: string,
    moodle_token: string,
    maxIterations: number,
  ): Promise<any> {
    const result = await this.iterate(
      question,
      moodle_token,
      maxIterations,
      maxIterations,
      [],
    );

    return result;
  }

  async iterate(
    question: string,
    moodle_token: string,
    remainingCalls: number,
    maxIterations: number,
    previousAgentResponses: ReactActThinkAndFindActionsResponse[] = [],
    previousSummaries: ReactActObserveAndSummarizeAgentResponsesResponse[] = [],
  ): Promise<any> {
    console.log(chalk.magenta('--------------------------------'));
    console.log(
      chalk.cyan('Iteration'),
      maxIterations - remainingCalls,
      '/',
      maxIterations,
    );
    console.log(chalk.magenta('--------------------------------'));

    if (remainingCalls <= 0) {
      console.log(chalk.magenta('Maximum number of iterations reached.'));
      return {
        agent: 'default',
        previousSummaries: [
          ...previousSummaries,
          { summary: 'Error: Maximum number of iterations reached.' },
        ],
        previousAgentResponses,
        function: undefined,
      };
    }

    const thinkAndFindResponse = await this.thinkAndFindActions(
      question,
      previousSummaries,
    );
    const { agentCalls, isFinished } = thinkAndFindResponse;

    console.log(
      chalk.magenta('Thought process:'),
      chalk.yellow(thinkAndFindResponse.thought),
    );

    if (isFinished) {
      console.log(chalk.magenta('Finished'));
      return {
        previousSummaries: [...previousSummaries, { summary: 'Finished' }],
        previousAgentResponses: [
          ...previousAgentResponses,
          thinkAndFindResponse,
        ],
      };
    }

    if (!agentCalls) {
      console.log(chalk.magenta('No agent calls found.'));
      return {
        agent: 'default',
        response: 'No agent calls found. Please try rephrasing your question.',
        function: undefined,
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
    const hasDuplicateCalls = previousAgentResponses.some(
      (response) =>
        JSON.stringify(response.agentCalls) === currentAgentCallsStr,
    );

    if (hasDuplicateCalls) {
      console.log(
        'Detected loop with repeated agent calls. Breaking iteration.',
      );
      return {
        agent: 'default',
        response:
          'I noticed we were repeating the same queries without progress.',
        function: undefined,
      };
    }

    console.log(chalk.cyan('Agent calls:'));
    const flattenedCalls = agentCalls.flatMap(
      (agentCall) =>
        agentCall.functionsToCall?.map((functionCall) => ({
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
      remainingCalls,
    );

    const { summary } = await this.observeAndSummarizeAgentResponses(
      question,
      agentResponses.filter(Boolean) as AgentResponse[],
      thinkAndFindResponse,
    );

    console.log(
      chalk.magenta('Summary of the current iteration:'),
      chalk.yellow(summary),
    );

    const updatedPreviousAgentResponses = [
      ...previousAgentResponses,
      thinkAndFindResponse,
    ];

    const updatedPreviousSummaries = [...previousSummaries, { summary }];

    return this.iterate(
      question,
      moodle_token,
      remainingCalls - 1,
      maxIterations,
      updatedPreviousAgentResponses,
      updatedPreviousSummaries,
    );
  }

  async thinkAndFindActions(
    question: string,
    previousSummaries: ReactActObserveAndSummarizeAgentResponsesResponse[],
  ): Promise<ReactActThinkAndFindActionsResponse> {
    const agents = getAgentConfigs(false);
    const systemPrompt = ReActPrompt.getThinkAndFindActionPrompt(
      agents,
      previousSummaries,
    );

    return await this.aiProvider.generateText<ReactActThinkAndFindActionsResponse>(
      question,
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
