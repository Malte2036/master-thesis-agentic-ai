import {
  AIGenerateTextOptions,
  CallToolResult,
  ListToolsResult,
} from '@master-thesis-agentic-ai/agent-framework';
import {
  McpAgentCall,
  RouterProcess,
  StructuredThoughtResponse,
} from '@master-thesis-agentic-ai/types';

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
  Decide **exactly one immediate step**—a single function call (or a final answer)—using only the facts you already know.
  
  Principles
  - Answer with your thought process.
  - **Distinguish Intent**: Your thought process must be clear about your intent.
      - To **execute** a function for a task, use active phrasing like "I will now use..." or "I need to call...". This is for actively solving a user's request.
      - To **describe** a function because the user is asking about your abilities, state "I have the capability to..." and describe the function without planning to execute it.
  - Move the user one step closer to their goal in every iteration.
  - Choose a function to **execute** only when **all required parameters are fully specified**.
  - When planning a function call, describe it in natural language and explicitly mention the agent name.
  - Think strictly about what is needed to answer the user's question; do not plan work that is out of scope.
  - Plan one step at a time; reevaluate after each response.
  - When you already have enough information from the iteration history to answer the user's question, state explicitly that you are finished, answer the question and do not call any more functions.
  
  Example of Execution:
  ___
  User: What's the weather like in New York?
  Thought: I need to check the current weather in New York. To do this, I will use the weather agent's get_weather function. The city parameter is clearly specified as "New York".
  
  I will call the "get_weather" function from the "weather-agent" with the parameters:
  - city: "New York"
  This will provide us with the current weather conditions in New York.
  ___
  
  Example of Description:
  ___
  User: What can you do?
  Thought: The user is asking about my capabilities. I should list the available agents and their primary functions. I have the capability to get weather information using the "get_weather" function from the "weather-agent". I also have the capability to search for courses using the "search-courses" function from the "moodle-mcp". I will state that I am finished and present these capabilities.
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
        content: `You are a highly precise system that translates an assistant's thought process into a structured JSON object. Your single most important job is to distinguish between a plan to **execute a tool** and a plan to **provide a final text answer**.
      
      Follow these rules with absolute precision:
      
      1.  **Identify the Core Intent:**
          * Does the thought contain explicit action phrases like "I will call...", "I will use...", "I need to execute..."? If YES, the intent is to **call a tool**. Proceed to rule #2.
          * Is the thought a descriptive statement, a list of capabilities, or a direct message to the user (e.g., "I can do the following...", "Here are your assignments...")? If YES, the intent is to **provide a final answer**. Proceed to rule #3.
      
      2.  **Generating Tool Calls (ONLY for Action Intents):**
          * You MUST populate the 'agentCalls' array.
          * The 'finalAnswer' field MUST be null.
          * The 'isFinished' field MUST be false.
          * NEVER invent parameters. If a parameter is not in the thought, do not make a call.
      
      3.  **Generating a Final Answer (ONLY for Descriptive Intents):**
          * The 'agentCalls' array MUST be empty (\`[]\`).
          * The 'isFinished' field MUST be true.
          * The 'finalAnswer' field MUST contain the full text of the thought, as this is the message intended for the user.
          * **CRITICAL:** If a function name is mentioned as part of a list or description (e.g., "I can use the \`search_courses\` function"), you MUST NOT treat it as a tool call.
      
      ---
      **Example 1: Action Intent**
      Thought: "I need to find the course ID for 'Computer Science'. I will use the moodle-mcp's \`search_courses_by_name\` function to do this."
      Correct JSON:
      {
        "agentCalls": [{ "agent": "moodle-mcp", "function": "search_courses_by_name", "args": { "name": "Computer Science" } }],
        "isFinished": false,
        "finalAnswer": null
      }
      
      ---
      **Example 2: Descriptive Intent (THIS IS THE MOST IMPORTANT EXAMPLE)**
      Thought: "What I Can Do: I can help with Moodle-related functions like \`search_courses_by_name\` to find courses and \`get_assignments\` to retrieve assignments. I can also create calendar events."
      Correct JSON:
      {
        "agentCalls": [],
        "isFinished": true,
        "finalAnswer": "What I Can Do: I can help with Moodle-related functions like \`search_courses_by_name\` to find courses and \`get_assignments\` to retrieve assignments. I can also create calendar events."
      }
      ---
      
      Now, parse the following thought with zero deviation from these rules.`,
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
