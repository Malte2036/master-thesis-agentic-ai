import {
  AIProvider,
  getAgentConfig,
  getAgentConfigs,
} from '@master-thesis-agentic-rag/agent-framework';
import { callAgent } from '../agents/agent';
import { AgentCalls, AgentCallsSchema, AgentResponse } from '../agents/types';
import { LegacyPrompt } from './prompt';
import { Router } from '../router';

const MAX_CALLS = 5;

export class LegacyRouter implements Router {
  constructor(private readonly aiProvider: AIProvider) {}

  private async findRelevantAgents(
    question: string,
    intermediateAnswer?: string,
  ): Promise<AgentCalls> {
    const agents = getAgentConfigs(false);

    const systemPrompt = LegacyPrompt.getFindRelevantAgentPrompt(
      agents,
      intermediateAnswer,
    );

    return await this.aiProvider.generateText<AgentCalls>(
      question,
      systemPrompt,
      AgentCallsSchema,
    );
  }

  private async generateAnswer(
    question: string,
    intermediateAnswer?: string,
  ): Promise<AgentResponse[]> {
    const systemPrompt =
      LegacyPrompt.getGenerateAnswerPrompt(intermediateAnswer);

    return await this.aiProvider.generateText<AgentResponse[]>(
      question,
      systemPrompt,
      AgentCallsSchema,
    );
  }

  private async handleQuestion(
    question: string,
    moodle_token: string,
    remainingCalls: number,
    intermediateAnswer?: string,
  ): Promise<AgentResponse[]> {
    console.log();

    console.log('--------------------------------');
    console.log('Iteration', MAX_CALLS - remainingCalls, '/', MAX_CALLS);
    console.log('--------------------------------');

    if (remainingCalls < 0) {
      return [
        {
          agent: 'default',
          response:
            'Maximum number of LLM calls reached. Please try rephrasing your question.',
          function: undefined,
        },
      ];
    }

    const response = await this.findRelevantAgents(
      question,
      intermediateAnswer,
    );

    if (!response) {
      return [
        {
          agent: 'default',
          response:
            'I could not determine which agent should handle your question. Please try rephrasing it.',
          function: undefined,
        },
      ];
    }

    if (response.answer && response.agentCalls?.length === 0) {
      console.log('Finished with answer', response.answer);
      return [
        {
          agent: 'default',
          response: response.answer,
          function: undefined,
        },
      ];
    }

    // Process all agent calls in parallel
    const agentCalls =
      response.agentCalls?.map((agentCall) => ({
        agent: getAgentConfig(agentCall.agentName),
        functions: agentCall.functionsToCall ?? [],
      })) ?? [];

    // Filter out agents with no functions
    const validAgents = agentCalls.filter(
      (agent) => agent.functions.length > 0,
    );

    if (validAgents.length === 0) {
      if (response.answer) {
        return [
          {
            agent: 'default',
            response: response.answer,
            function: undefined,
          },
        ];
      }
      return [
        {
          agent: 'default',
          response:
            'None of the selected agents have any functions. Please try rephrasing it.',
          function: undefined,
        },
      ];
    }

    console.log(
      'Processing agents:',
      validAgents.map((a) => a.agent.friendlyName).join(', '),
    );

    // Call all functions from all agents in parallel
    const allResponses = await Promise.all(
      validAgents.flatMap((agent) =>
        agent.functions.map((agentFunction) =>
          callAgent(agent.agent, agentFunction, moodle_token),
        ),
      ),
    );

    // If this was the last call, return the responses
    if (remainingCalls === 0) {
      const answer = await this.generateAnswer(
        question,
        JSON.stringify(allResponses),
      );
      console.log('Answer after last iteration', answer);
      return answer;
    }

    intermediateAnswer += `Iteration ${MAX_CALLS - remainingCalls}/${MAX_CALLS}: ${JSON.stringify(allResponses)}`;

    // Recursively handle the next iteration with the current response
    return this.handleQuestion(
      question,
      moodle_token,
      remainingCalls - 1,
      intermediateAnswer,
    );
  }

  async routeQuestion(
    question: string,
    moodle_token: string,
  ): Promise<AgentResponse[]> {
    return this.handleQuestion(question, moodle_token, MAX_CALLS);
  }
}
