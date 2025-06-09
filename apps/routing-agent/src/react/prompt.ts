import {
  AIGenerateTextOptions,
  CallToolResult,
  ListToolsResult,
} from '@master-thesis-agentic-rag/agent-framework';
import {
  McpAgentCall,
  RouterProcess,
  StructuredThoughtResponse,
} from '@master-thesis-agentic-rag/types';

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
- IMPORTANT: Do everything in English.
`,
  ];

  private static getAgentToolsString = (
    agentTools: Record<string, ListToolsResult>,
  ): string => {
    return JSON.stringify(
      Object.entries(agentTools)
        .map(([agentKey, toolsResult]) => {
          return toolsResult.tools.map((tool: object) => ({
            agentName: agentKey,
            ...tool,
          }));
        })
        .flat(),
      null,
      2,
    );
  };

  /**
   * Prompt for the natural-language "thought" step.
   */
  public static getNaturalLanguageThoughtPrompt = (
    agentTools: Record<string, ListToolsResult>,
    routerProcess: RouterProcess,
  ): AIGenerateTextOptions => {
    return {
      messages: [
        ...this.BASE_PROMPTS.map((content) => ({
          role: 'system' as const,
          content,
        })),
        {
          role: 'system',
          content: `
You are a task planner, who wants to help the user to achieve their goal. 
Decide **exactly one immediate step**—a single function call (or a set of calls that can run in parallel)—using only the facts you already know.

Principles
- Answer with your thought process.
- Move the user one step closer to their goal in every iteration.
- Choose a function only when **all required parameters are fully specified**.
- Describe the function call in natural language and explicitly mention the agent name.
- Think strictly about what is needed to answer the user's question; do not plan work that is out of scope.
- Plan one step at a time; reevaluate after each response.
- When you already have enough information from the iteration history to answer the user's question, state explicitly that you are finished, answer the question and do not call any more functions.

Strictly forbidden:
- Fabricating, translating or abbreviating parameter values.
- Ignoring facts from the question or iteration history.
- Calling or referencing any agent or function that is **not** in the available list.
- Repeating a call with identical parameters.
`,
        },
        {
          role: 'system',
          content: `Available agents and functions:
${this.getAgentToolsString(agentTools)}
`,
        },
        {
          role: 'assistant',
          content: `Iteration history (oldest → newest):
${
  routerProcess.iterationHistory
    ?.map(
      (it) =>
        `Iteration ${it.iteration}
- Thought which justifies the next step: ${it.naturalLanguageThought}
- The function calls that were made: ${JSON.stringify(it.structuredThought.agentCalls, null, 2)}
- The observation that was made after seeing the response of the function calls: ${it.observation}
`,
    )
    .join('\n') ?? '— none —'
}
`,
        },
      ],
    };
  };

  /**
   * Prompt for the structured-thought (JSON) step.
   */
  public static getStructuredThoughtPrompt = (
    agentTools: Record<string, ListToolsResult>,
  ): AIGenerateTextOptions => ({
    messages: [
      {
        role: 'system',
        content: `Translate the assistant's plan into JSON that conforms precisely to the following schema.
        - Only add information and agent calls that were explicitly stated in the user's thought process.
        - Ensure the agent calls are valid and that the parameters are correct (look at the possible agent calls).
        - Do not add any other information.
        `,
      },
      {
        role: 'system',
        content: `Possible agent calls: ${JSON.stringify(agentTools, null, 2)}`,
      },
    ],
  });

  /**
   * Prompt for the observation-summarisation step.
   */
  public static getNaturalLanguageObservationPrompt = (
    agentCalls: McpAgentCall[],
    agentResponses: CallToolResult[],
    structuredThought?: StructuredThoughtResponse,
  ): AIGenerateTextOptions => {
    const merged = {
      ...structuredThought,
      agentCalls: agentCalls.map((call, i) => ({
        ...call,
        response: {
          isError: agentResponses[i].isError ?? false,
          content: agentResponses[i].content,
          structuredContent: agentResponses[i].structuredContent,
        },
      })),
    };

    return {
      messages: [
        ...this.BASE_PROMPTS.map((content) => ({
          role: 'system' as const,
          content,
        })),
        {
          role: 'system',
          content: `Summarize the agent responses in bullet points. **Use ONLY information explicitly present in the responses; do NOT add external facts, suggestions, or examples. If a detail is not in the responses, leave it out.** Do not invent information.`,
        },
        {
          role: 'assistant',
          content: `The agent responses: ${JSON.stringify(merged, null, 2)}`,
        },
      ],
    };
  };
}
