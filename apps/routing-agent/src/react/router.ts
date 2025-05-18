import {
  AIProvider,
  getAgentConfigs,
} from '@master-thesis-agentic-rag/agent-framework';

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

  async routeQuestion(question: string, moodle_token: string): Promise<any> {
    return this.iterate(question, moodle_token, 5, []);
  }

  async iterate(
    question: string,
    moodle_token: string,
    remainingCalls: number,
    previousAgentResponses: ReactActThinkAndFindActionsResponse[] = [],
  ): Promise<any> {
    if (remainingCalls <= 0) {
      return {
        agent: 'default',
        response:
          'Maximum number of iterations reached. Please try a more specific question. Here is the summary of the previous iterations: ' +
          previousAgentResponses.map((response) => response.thought).join('\n'),
        function: undefined,
      };
    }

    const thinkAndFindResponse = await this.thinkAndFindActions(question);
    const { agentCalls, isFinished } = thinkAndFindResponse;

    if (isFinished) {
      return [...previousAgentResponses, thinkAndFindResponse];
    }

    if (!agentCalls) {
      return {
        agent: 'default',
        response: 'No agent calls found. Please try rephrasing your question.',
        function: undefined,
      };
    }

    // Serialize current agent calls to check for duplicates
    const currentAgentCallsStr = JSON.stringify(agentCalls);

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

    console.log('Summary', summary);

    const updatedPreviousAgentResponses = [
      ...previousAgentResponses,
      thinkAndFindResponse,
    ];

    return this.iterate(
      summary,
      moodle_token,
      remainingCalls - 1,
      updatedPreviousAgentResponses,
    );
  }

  async thinkAndFindActions(
    question: string,
  ): Promise<ReactActThinkAndFindActionsResponse> {
    const agents = getAgentConfigs(false);
    const systemPrompt = ReActPrompt.getThinkAndFindActionPrompt(agents);

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
    console.log('Observing and summarizing agent responses');
    console.log(thinkAndFindResponse);

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
