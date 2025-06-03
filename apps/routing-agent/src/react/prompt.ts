import {
  AIGenerateTextOptions,
  CallToolResult,
  ListToolsResult,
} from '@master-thesis-agentic-rag/agent-framework';
import {
  McpAgentCall,
  McpAgentCallsSchema,
  RouterProcess,
  StructuredThoughtResponse,
} from '@master-thesis-agentic-rag/types';
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
- Do everything in English.
`,
  ];

  /**
   * Prompt for the natural-language "thought" step.
   */
  public static getNaturalLanguageThoughtPrompt = (
    agentTools: Record<string, ListToolsResult>,
    routerProcess: RouterProcess,
  ): AIGenerateTextOptions => {
    const lastObservation =
      routerProcess.iterationHistory?.[
        routerProcess.iterationHistory.length - 1
      ]?.observation ?? '';

    return {
      messages: [
        ...this.BASE_PROMPTS.map((content) => ({
          role: 'system' as const,
          content,
        })),
        {
          role: 'system',
          content: `You are a task planner, who wants to help the user to achieve their goal. Decide **exactly one immediate step**—a single function call (or a set of calls that can run in parallel)—using only the facts you already know.

Principles
- Move the user one step closer to their goal in every iteration.
- Choose a function only when **all required parameters are fully specified**.
- Think strictly about what is needed to answer the user's question; do not plan work that is out of scope.
- Plan one step at a time; reevaluate after each response.
- When you already have enough information from the iteration history to answer the user's question, state explicitly that you are finished and answer the question. Explain that you do not need to call any more functions.

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
${JSON.stringify(agentTools, null, 2)}
`,
        },
        {
          role: 'system',
          content: `Iteration history (oldest → newest):
${
  routerProcess.iterationHistory
    ?.map(
      (it) => `Iteration ${it.iteration}
- Thought: ${it.naturalLanguageThought}
- Agent calls: ${JSON.stringify(it.structuredThought.agentCalls, null, 2)}
- Observation: ${it.observation}
`,
    )
    .join('\n') ?? '— none —'
}
`,
        },
        lastObservation
          ? {
              role: 'system',
              content: `Carry these facts forward: "${lastObservation}"`,
            }
          : { role: 'system', content: '' },
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
        content: `Agents and functions: ${JSON.stringify(agentTools, null, 2)}`,
      },
      {
        role: 'system',
        content: `Translate the assistant's plan into JSON that conforms precisely to the following schema.
        - Only add information that was actually stated in the thought process.
        - Do not add any other information.
${JSON.stringify(z.toJSONSchema(McpAgentCallsSchema), null, 2)}`,
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
          role: 'system',
          content: JSON.stringify(merged, null, 2),
        },
      ],
    };
  };
}
