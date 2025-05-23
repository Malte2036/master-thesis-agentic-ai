import {
  AgentConfig,
  AgentName,
  AgentResponse,
  AIGenerateTextOptions,
  RouterProcess,
} from '@master-thesis-agentic-rag/agent-framework';
import { ReactActThinkAndFindActionsResponse } from './types';

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
    routerProcess: RouterProcess,
  ): AIGenerateTextOptions => ({
    messages: [
      ...this.BASE_PROMPTS.map((prompt) => ({
        role: 'system' as const,
        content: prompt,
      })),
      {
        role: 'system' as const,
        content: `You are a ReAct planning agent. You must carefully plan only the **next agent call(s)** based on available information.

🎯 Goal:
- Solve the user's request by calling agent functions one step at a time.
- Only call a function **if all required input parameters are already known**.
- If a needed parameter is missing, you must plan a function call that retrieves it.

📌 How to plan:
1. Read the user's goal and previous summaries.
2. Think step by step: What do we already know? What do we need next?
3. Plan the next agent function(s) to call.
   - Do **not** call a function that needs unknown input like \`course_id\` unless it is already available.
   - Do **not** plan multiple steps at once.
   - If multiple known calls are possible in parallel, list them.

🧠 Reason step-by-step and choose **only actions ready to execute now**.
Avoid assumptions or speculative parameters.
You can asume, that the recent agent responses are still up-to-date. 

⚠️ Do not:
- Call functions without complete parameters.
- Repeat a call with the same parameters.
- Set isFinished: true in the same step as calling a function.

📋 The available agents and their functions are listed next.`,
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
          routerProcess.iterationHistory?.map((iteration) => iteration.summary),
          null,
          2,
        )}`,
      },
    ],
  });

  public static getObserveAndSummarizeAgentResponsesPrompt = (
    agentResponses: AgentResponse[],
    thinkAndFindResponse?: ReactActThinkAndFindActionsResponse,
  ): AIGenerateTextOptions => {
    const thinkAndFindAndAgentResponses = {
      ...thinkAndFindResponse,
      agentCalls: thinkAndFindResponse?.agentCalls?.map((agentCall, index) => ({
        ...agentCall,
        response: JSON.stringify(agentResponses[index].response, null, 2),
      })),
    };

    return {
      messages: [
        ...this.BASE_PROMPTS.map((prompt) => ({
          role: 'system' as const,
          content: prompt,
        })),
        {
          role: 'system' as const,
          content: `You are a summarization assistant. Your task is to review the agent responses and write a clear summary of what was discovered.

📌 Your goal:
- Extract useful facts, values, IDs, and other actionable information.
- Present them in a structured way so the next action can be planned efficiently.
- Highlight new data that unlocks further agent function calls.

✅ Example summary format:
Summary:
- The course "abc" was found with course_id xy.
- No assignments were found yet.
- The next step is to retrieve the assignments for this course using its course_id (including the real course_id here).

⚠️ Do not:
- Repeat agent calls already made.
- Include uncertain or inferred data not in the response.
- Recommend actions that lack sufficient input data.

📋 Agent responses and earlier plan are shown next.`,
        },
        {
          role: 'system' as const,
          content: `Agent responses and prior thought process: ${JSON.stringify(
            thinkAndFindAndAgentResponses,
            null,
            2,
          )}`,
        },
      ],
    };
  };
}
