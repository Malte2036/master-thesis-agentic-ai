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

Example:
___
User: What's the weather like in New York?
Thought: I need to check the current weather in New York. Since this is a direct question about current weather conditions, I should use the weather agent's get_weather function. The city parameter is clearly specified as "New York" in the user's question, so I have all the required information to make this call.

I will call the "get_weather" function from the "weather-agent" with the parameters:
- city: "New York"
This will provide us with the current weather conditions in New York.
___



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
          content: `You are an expert summariser. Create direct, factual summaries of agent responses.

Rules:
• List ALL information from the responses as simple bullet points
• Use ONLY information explicitly present in the responses
• Preserve exact details, numbers, and facts
• Do not add any thinking process or commentary
• Do not add any formatting like bold or italics
• Do not add any section headers or categories

DO NOT:
• Add external facts or assumptions
• Include suggestions not in the responses
• Modify or interpret the information
• Shorten or abbreviate any names, titles, or other identifiers.
• Omit significant details
• Add any thinking process or analysis
• Add any formatting or styling`,
        },
        {
          role: 'assistant',
          content: `The agent responses: ${JSON.stringify(merged, null, 2)}`,
        },
      ],
    };
  };
}
