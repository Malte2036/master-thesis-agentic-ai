import {
  AIGenerateTextOptions,
  CallToolResult,
  ListToolsResult,
} from '@master-thesis-agentic-rag/agent-framework';
import {
  McpAgentCall,
  McpAgentCallsSchema,
  RouterProcess,
} from '@master-thesis-agentic-rag/types';
import { StrukturedThoughtResponse } from './types';
import z from 'zod/v4';

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
    })}
    
    Important rules: 
    - Speak in the first person. Speak professionally.
    - Do everything in english.
    `,
  ];

  public static getThinkAndFindActionPrompt = (
    agentTools: Record<string, ListToolsResult>,
    routerProcess: RouterProcess,
  ): AIGenerateTextOptions => ({
    messages: [
      ...this.BASE_PROMPTS.map((prompt) => ({
        role: 'system' as const,
        content: prompt,
      })),
      {
        role: 'system' as const,
        content: `You are a task planning agent. You must carefully plan only the **next agent call(s)** based on available information.

🎯 Goal:
- Solve the user's request by calling agent functions one step at a time.
- Only call a function **if ALL required input parameters are currently available**.
- Never call a function that depends on results from future function calls.
- If a needed parameter is missing, you must plan a function call that retrieves it.

📌 How to plan:
1. Read the user's goal and the previous iteration history. We do not want to repeat the same calls.
2. Think step by step: What do we already know? What do we need next?
3. IMPORTANT: Plan ONLY the next immediate agent function to call.
   - Do **not** plan multiple steps ahead or future iterations.
   - Do **not** call a function that needs unknown input like \`course_id\` unless it is already available.
   - Do **not** plan multiple steps at once.
   - If multiple known calls are possible in parallel, list them.
   - Only gather information directly relevant to the user's request.

🧠 Response Processing:
- If a response contains the requested information and you can answer the user's request, say that you have finished.
- If a response is empty or doesn't contain the needed information, plan the next step.
- Do not repeat the same function call with the same parameters
- Trust the content of the responses - if information is present, use it
- We do only have the information that I gave you.

🔍 Do: 
- Ensure correct parameter types.
- Include every parameter in your response, which is needed to answer the user's request or call the next function(s).
- Include the agent name in your response.
- Include your full and detailed thought process in your response.

⚠️ Do not:
- Call functions that are not explicitly listed in the available agents and their functions.
- Call functions without complete parameters.
- Include any function calls that depend on results from other calls in the same iteration.
- Repeat a function call with the same parameters as in the iteration history.
- Gather more information than needed to answer the request.
- Ignore information that is already present in responses.
- Translate or modify any parameters - use them exactly as provided.
- Abbreviate or shorten any parameters - use them in their full form.
- Use placeholder values or templates in parameters (like "<result.course_id>" or "{{course_id}}") - only use actual values.


Additional rules:
- If multiple calls are possible in parallel, list them.
- If you need more information from the user, describe what you need.

📚 While planing your next step, consider the following iteration history. This is the history of the previous iterations you did before to solve the user's request: ${JSON.stringify(
          routerProcess.iterationHistory,
          null,
          2,
        )}

📋 The available agents and their functions are listed next: ${JSON.stringify(
          agentTools,
          null,
          2,
        )}
        
`,
      },
    ],
  });

  public static getThinkAndFindActionToToolCallPrompt = (
    agentTools: Record<string, ListToolsResult>,
  ): AIGenerateTextOptions => ({
    messages: [
      {
        role: 'system' as const,
        content: `We have the following possible agents and their functions: ${JSON.stringify(
          agentTools,
          null,
          2,
        )}`,
      },
      {
        role: 'system' as const,
        content: `You are a helpful assistant that understands and translates text to JSON format according to the following schema (ensure correct parameter types): 
        ${JSON.stringify(z.toJSONSchema(McpAgentCallsSchema), null, 2)}`,
      },
    ],
  });

  public static getObserveAndSummarizeAgentResponsesPrompt = (
    agentCalls: McpAgentCall[],
    agentResponses: CallToolResult[],
    thinkAndFindResponse?: StrukturedThoughtResponse,
  ): AIGenerateTextOptions => {
    const thinkAndFindAndAgentResponses = {
      ...thinkAndFindResponse,
      agentCalls: agentCalls.map((agentCall, index) => ({
        ...agentCall,
        response: {
          isError: agentResponses[index].isError ?? false,
          content: agentResponses[index].content,
          structuredContent: agentResponses[index].structuredContent,
        },
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
- Just observe the agent responses and do not make any assumptions.

✅ Example summary format:
Summary:
- The course "abc" was found with course_id xy.
- No assignments were found yet.
- The assignment "xyz" is due on 2025-06-01 and has the id 123.

Do: 
- Include every information from the agent responses in your summary, which may be relevant to the user's request or the next steps.


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
