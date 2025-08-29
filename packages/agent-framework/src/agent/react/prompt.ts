import { RouterProcess } from '@master-thesis-agentic-ai/types';
import { AIGenerateTextOptions } from '../../services';
import { AgentTool } from './types';

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

  /**
   * Prompt for the natural-language "thought" step.
   */
  public static getNaturalLanguageThoughtPrompt = (
    extendedSystemPrompt: string,
    agentTools: AgentTool[],
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

Decide **exactly one immediate step** — a single function call (or a final answer) — using only the facts you already know.

Process (follow in order, do each step at most once):
1) Read the TOOLS SNAPSHOT (below) exactly once and extract relevant informations.
2) Distinguish intent:
   - If the user asks about capabilities, respond *descriptively* (no tool calls) and **do not plan execution**.
   - If acting, choose **one** tool **only if all required parameters are present**.
3) Move the user one step closer to their goal.

Parameter-echo mandate (CRITICAL for action):
- When you decide to execute a function, you MUST **explicitly restate every required parameter and its concrete value** that you will pass.
- Restate parameter names exactly as in the tool schema and values **verbatim** as found in the user request/iteration history. If an ISO date is present (YYYY-MM-DD), include that exact token in your thought.
- If a required parameter is **missing or ambiguous**, you MUST NOT execute any function. Instead, ask for the missing info in your thought and stop.

Principles:
- Answer with your thought process (natural language).
- **Distinguish Intent** clearly:
  - Execute: “I will now use {agent}/{function} with: param1=…, param2=…, …”
  - Describe: “I have the capability to …” (no call now)
- Choose a function only when **all required parameters are fully specified**. Except the 'include_in_response' parameter, which you need to interpret from the user request by yourself.
- Mention the **agent/function name** you intend to use and **list each required arg with its exact value**.
- Stay in your domain; if ambiguous, assume the request is in your domain.
- One step at a time; reevaluate after each response.
- If you already have enough info to answer directly, finish and provide the answer (no function).

Strictly forbidden:
- Fabricating, translating, abbreviating, coercing, or inferring parameter values not stated.
- Ignoring facts from the question or iteration history.
- Calling or referencing any agent/function **not** in the available list.
- Repeating a call with identical parameters.
- Vague phrasing like “with the specified dates” — **you must restate the actual values** (e.g., \`date=2025-10-05\`, \`returnDate=2025-10-18\`).

Failure modes to avoid (these will fail tests):
- Missing any required parameter in the thought.
- Omitting concrete tokens like dates (“2025-10-05”), locations (“BER”, “HND”), counts (“passengers=2”).

— — —
### Examples
(Available Tools for this examples:  search_flights, get_flight_status, query_finance_price, get_exchange_rate, kb_vector_search, kb_fetch_document, create_calendar_event, run_sql_query, web_retrieve_and_summarize, translate_text)

# A) Action (Travel planning; all params present)
I will now use the **search_flights** agent to find a round-trip. **Parameters** I will pass:
- origin="BER"
- destination="HND"
- date="2025-10-05"
- returnDate="2025-10-18"
- passengers=2
- cabin="premium"

# B) Descriptive (Capabilities; no execution)
I have the capability to use **search_flights** for trip discovery and **get_flight_status** for live status checks. Since the user asked about capabilities, I will not execute any function now.

# C) Missing required params (ask, do not execute)
I cannot execute **search_flights** yet. **Missing required parameters**:
- origin (e.g., "BER")
- date (YYYY-MM-DD)
Please provide origin and an exact departure date. I will proceed once I have them.

# D) RAG ask but one-step only (dependent data missing)
I will call **kb_vector_search** with:
- query="atlas incident runbook"
(topK is optional; if I choose it, I must state the exact value, e.g., topK=3)
I will NOT call **kb_fetch_document** now because no literal docId is present yet.

# E) No tool available to answer the question (no tool calls)
I cannot answer the question because no tool is available to answer it.

— — —

TOOLS SNAPSHOT:
${JSON.stringify(agentTools, null, 2)}
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
    agentTools: AgentTool[],
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
   • You MUST include the "include_in_response" parameter (object) in the args of **every** function call.
   • The "isFinished" field MUST be false.
   • NEVER invent parameters. If a required parameter is not in the thought, do not make that call in this iteration.
   • Omit any **dependent** call that lacks its required arguments (e.g., do not call "kb_fetch_document" without a literal "docId" in the thought).
   • **Deduplicate** identical calls (same function + identical args).

3) Generating a Final Answer (ONLY for Descriptive Intents)
   • The "functionCalls" array MUST be empty ([]).
   • The "isFinished" field MUST be true.
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
  "isFinished": false
}

---
Example 2: Descriptive Intent (THIS IS THE MOST IMPORTANT EXAMPLE)
Thought: "What I Can Do: I can help with Moodle-related functions like \`search_courses_by_name\` to find courses and \`get_assignments\` to retrieve assignments."
Correct JSON:
{
  "functionCalls": [],
  "isFinished": true
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
  "isFinished": false
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
  "isFinished": false
}

---
Example 5: Missing Required Params (Ask, Do Not Execute)
Thought: "I cannot execute function get_weather_info yet. Missing required parameters:\n- city (e.g., \\"Cologne\\")\n\nPlease provide a city or your coordinates to proceed. If you share your coordinates, I will call find_city_by_coordinates."
Correct JSON:
{
  "functionCalls": [],
  "isFinished": true
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
