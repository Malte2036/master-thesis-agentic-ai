import {
  AgentConfig,
  AgentName,
  AIGenerateTextOptions,
} from '@master-thesis-agentic-rag/agent-framework';
import { AgentResponse } from '../agents/types';
import {
  ReactActObserveAndSummarizeAgentResponsesResponse,
  ReactActThinkAndFindActionsResponse,
} from './types';

export class ReActPrompt {
  public static readonly BASE_PROMPTS: string[] = [
    `Current date and time: ${new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })}`,
  ];

  public static getThinkAndFindActionPrompt = (
    agents: Record<AgentName, AgentConfig>,
    previousSummaries: ReactActObserveAndSummarizeAgentResponsesResponse[],
  ): AIGenerateTextOptions => ({
    messages: [
      ...this.BASE_PROMPTS.map((prompt) => ({
        role: 'system' as const,
        content: prompt,
      })),
      {
        role: 'system' as const,
        content: `You are a smart assistant that selects only the most relevant and executable agent functions to answer the user's question in as few steps as possible.
  
  You must follow these rules strictly:

  ## 💡 ReAct Prompt
  - You are a ReAct agent.
  - You are given a user question and a list of available agents and their functions.
  - You need to think about the user question and find the next step to answer the question.
  - If it make sense to call multiple agents in parallel, do so.
  - You need to return the agent and function that you think is the most relevant to answer the question.
  - You need to return the agentCalls array with the agent and function that you think is the most relevant for the next step.
  - It's critical to avoid repeating the same agent calls in successive iterations. If you're about to call the same function with the same parameters as in previous iterations, choose a different, more specific approach.
  - If previous calls didn't yield the desired information, try different functions or parameters rather than repeating the same call.
  - Always move forward with new information gathered from previous calls. Use the information you've already obtained rather than requesting it again.
  - The isFinished flag should only be set to true in the iteration AFTER the last agent call. This means:
    1. If you need to make one more agent call, set isFinished to false
    2. Only set isFinished to true in the next iteration after observing the results of the last agent call
    3. This ensures we properly observe and process the final agent's response before concluding
  - Never set isFinished to true in the same iteration where you're making an agent call.`,
      },
      {
        role: 'system',
        content: `Available agents and their functions: ${JSON.stringify(
          agents,
          null,
          2,
        )}`,
      },
      {
        role: 'system' as const,
        content: `Previous summaries: ${JSON.stringify(
          previousSummaries,
          null,
          2,
        )}`,
      },
    ],
  });

  public static getObserveAndSummarizeAgentResponsesPrompt = (
    agentResponses: AgentResponse[],
    thinkAndFindResponse?: ReactActThinkAndFindActionsResponse,
  ): AIGenerateTextOptions => ({
    messages: [
      ...this.BASE_PROMPTS.map((prompt) => ({
        role: 'system' as const,
        content: prompt,
      })),
      {
        role: 'system' as const,
        content: `You are a smart assistant that observes the responses of the agents and summarizes them.
  
  You must follow these rules strictly:
  
  ## 💡 Observe and Summarize Agent Responses 
  - You are given a list of agent responses from multiple agent calls.
  - You need to carefully observe these responses and create a detailed summary.
  - Focus on information that is relevant to the user's original question.
  - Identify any sub-steps that were taken and include them in your summary.
  - Highlight important data points and conclusions from each agent's response.
  - The summary should be structured in a way that shows the logical progression of steps taken.
  - Include any action items or next steps that should be taken based on the agent responses.
  - If the agent responses include specific information such as course IDs, deadlines, or other actionable data, make sure to include these in your summary to enable proper next steps.
  - Avoid recommending actions that would lead to repeated/duplicate agent calls.
  - Your summary will be used to formulate the final response to the user's question.`,
      },
      {
        role: 'system' as const,
        content: `Agent responses: ${JSON.stringify(agentResponses, null, 2)}
${thinkAndFindResponse ? `\nOriginal thought process: ${JSON.stringify(thinkAndFindResponse, null, 2)}` : ''}`,
      },
    ],
  });
}
