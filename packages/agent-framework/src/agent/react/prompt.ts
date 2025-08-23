import {
  FunctionCall,
  RouterProcess,
  StructuredThoughtResponse,
} from '@master-thesis-agentic-ai/types';
import {
  ListToolsResult,
  CallToolResult,
} from '@modelcontextprotocol/sdk/types.js';
import { AIGenerateTextOptions } from '../../services';

interface SchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  properties?: { [key: string]: SchemaProperty };
  required?: string[];
}

export class ReActPrompt {
  public static readonly BASE_PROMPTS: string[] = [
    `Some important information for you:
    - Current date and time: ${new Date().toLocaleString('en-US', {
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

  // ensure that there aren't to much information in the prompt
  private static getAgentToolsString = (
    agentTools: ListToolsResult,
  ): string => {
    const processProperties = (properties: {
      [key: string]: SchemaProperty;
    }): { [key: string]: SchemaProperty } => {
      return Object.fromEntries(
        Object.entries(properties).map(([key, value]) => {
          if (value.type === 'object' && value.properties) {
            return [
              key,
              {
                type: 'object',
                description: value.description,
                properties: processProperties(value.properties),
                ...(value.required &&
                  value.required.length > 0 && { required: value.required }),
              },
            ];
          }
          return [
            key,
            {
              type: value.type,
              description: value.description,
              ...(value.enum && { enum: value.enum }),
            },
          ];
        }),
      );
    };

    return JSON.stringify(
      agentTools.tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
          type: 'object',
          properties: processProperties(
            (tool.inputSchema?.properties as {
              [key: string]: SchemaProperty;
            }) ?? {},
          ),
          ...(tool.inputSchema?.required &&
            tool.inputSchema.required.length > 0 && {
              required: tool.inputSchema.required,
            }),
        },
      })),
      null,
      2,
    );
  };

  /**
   * Prompt for the natural-language "thought" step.
   */
  public static getNaturalLanguageThoughtPrompt = (
    extendedSystemPrompt: string,
    agentTools: ListToolsResult,
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
          ${extendedSystemPrompt}

Decide **exactly one immediate step**—a single function call (or a final answer)—using only the facts you already know.


Process (follow in order, and do each step at most once):
1) Read the TOOLS SNAPSHOT (below) exactly once and extract tool names.
   - Write a single line: "Tools found: <comma-separated names>" and do not repeat this line again in this iteration.
2) Distinguish intent:
   - If the user asks about capabilities, respond descriptively (no tool calls).
   - If acting, choose **one** tool only if **all required parameters are present**.
3) Move the user one step closer to their goal.

Principles:
- Answer with your thought process.
- **Distinguish Intent**:
    - To **execute** a function for a task, use active phrasing like "I will now use..." or "I need to call...". This is for actively solving a user's request.
    - To **describe** a function because the user is asking about your abilities, state "I have the capability to..." and describe the function without planning to execute it.
- Move the user one step closer to their goal in every iteration.
- Choose a function to **execute** only when **all required parameters are fully specified**.
- When planning a function call, describe it in natural language and explicitly mention the agent name.
- Think strictly about what is needed to answer the user's question; do not plan work that is out of scope.
- Plan one step at a time; reevaluate after each response.
- When you already have enough information from the iteration history to answer the user's question, state explicitly that you are finished, answer the question and do not call any more functions.
- You are scoped to only a single specific domain. Do not think about other domains. Other AI Agents will be used to handle other domains.
- If there are ambiguities in the request, it always refers to your domain.

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
  - The function calls that were made: ${JSON.stringify(it.structuredThought.functionCalls, null, 2)}
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
    agentTools: ListToolsResult,
  ): AIGenerateTextOptions => ({
    messages: [
      {
        role: 'system',
        content: `You are a highly precise system that translates an assistant's thought process into a structured JSON object.
Your single most important job is to distinguish between a plan to **execute a tool** and a plan to **provide a final text answer**.

Global execution policy:
• All "functionCalls" you output are executed **in parallel** within the same iteration (no chaining/order guarantees).
• If a potential call **depends on the output** of another call and its **required arguments are not explicitly present** in the thought, **omit** that dependent call from this iteration.
• **Deduplicate**: if the thought repeats the **same tool with identical arguments**, include it **only once** in "functionCalls". (Same function name + the same args fields with the same values ⇒ identical.)
• Do **not** add, infer, or invent arguments that are not explicitly stated.
• If information is missing, do not make a call. Set the "isFinished" field to true.

Follow these rules with absolute precision:

1) Identify the Core Intent
   • If the thought contains explicit action phrases like "I will call...", "I will use...", "I need to execute...", the intent is to **call a tool**. Proceed to Rule 2.
   • If the thought is a descriptive statement, a list of capabilities, or a direct message to the user (e.g., "I can do the following...", "Here are your assignments..."), the intent is to **provide a final answer**. Proceed to Rule 3.

2) Generating Tool Calls (ONLY for Action Intents)
   • You MUST populate the "functionCalls" array.
   • You MUST include the "include_in_response" parameter in the args of **every** function call.
   • The "finalAnswer" field MUST be null.
   • The "isFinished" field MUST be false.
   • NEVER invent parameters. If a required parameter is not in the thought, do not make that call in this iteration.
   • Omit any **dependent** call that lacks its required arguments (e.g., do not call "kb_fetch_document" without a literal "docId" in the thought).
   • **Deduplicate** identical calls (same function + identical args).

3) Generating a Final Answer (ONLY for Descriptive Intents)
   • The "functionCalls" array MUST be empty ([]).
   • The "isFinished" field MUST be true.
   • The "finalAnswer" field MUST contain the full text of the thought, as this is the message intended for the user.
   • CRITICAL: If a function name is mentioned as part of a list or description (e.g., "I can use the \`search_courses\` function"), you MUST NOT treat it as a tool call.

---
Example 1: Action Intent (Single Call)
Thought: "I need to find the course ID for 'Computer Science'. I will use the moodle-mcp's \`search_courses_by_name\` function to do this."
Correct JSON:
{
  "functionCalls": [
    {
      "function": "search_courses_by_name",
      "args": {
        "name": "Computer Science",
        "include_in_response": { "summary": true, "completed": true, "hidden": true }
      }
    }
  ],
  "isFinished": false,
  "finalAnswer": null
}

---
Example 2: Descriptive Intent (THIS IS THE MOST IMPORTANT EXAMPLE)
Thought: "What I Can Do: I can help with Moodle-related functions like \`search_courses_by_name\` to find courses and \`get_assignments\` to retrieve assignments."
Correct JSON:
{
  "functionCalls": [],
  "isFinished": true,
  "finalAnswer": "What I Can Do: I can help with Moodle-related functions like \`search_courses_by_name\` to find courses and \`get_assignments\` to retrieve assignments."
}

---
Example 3: Parallel + Deduplication
Thought: "Run translate_text on 'Hello' to 'de'. Also translate_text on 'Hello' to 'de'. And run kb_vector_search with query 'atlas' (topK 3) and include the snippet, scores and metadata."
Correct JSON (deduplicated translate_text):
{
  "functionCalls": [
    {
      "function": "translate_text",
      "args": {
        "text": "Hello",
        "targetLang": "de",
        "include_in_response": { "targetLang": true, "sourceLang": false }
      }
    },
    {
      "function": "kb_vector_search",
      "args": {
        "query": "atlas",
        "topK": 3,
        "include_in_response": { "snippet": true, "scores": true, "metadata": true }
      }
    }
  ],
  "isFinished": false,
  "finalAnswer": null
}

---
Example 4: Dependent Call Omitted (No docId present)
Thought: "First search for the atlas runbook, then fetch the document. I don't know the docId yet."
Correct JSON (omit kb_fetch_document this iteration):
{
  "functionCalls": [
    {
      "function": "kb_vector_search",
      "args": {
        "query": "atlas runbook",
        "include_in_response": { "snippet": true, "scores": true, "metadata": false }
      }
    }
  ],
  "isFinished": false,
  "finalAnswer": null
}
---
Now, parse the following thought with zero deviation from these rules.`,
      },
      {
        role: 'system',
        content: `Possible function calls: ${JSON.stringify(agentTools, null, 2)}`,
      },
    ],
  });
}
