import { RouterProcess } from '@master-thesis-agentic-ai/types';
import { AIGenerateTextOptions } from '../../services';
import { AgentTool } from './types';

/**
 * ReActPrompt with compact STATE injection and strict DONE/CALL enforcement.
 */
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
   * Adds ORIGINAL_GOAL and a compact STATE block, and enforces a leading DONE:/CALL: decision.
   */
  public static getNaturalLanguageThoughtPrompt = (
    extendedSystemPrompt: string,
    agentTools: AgentTool[],
    routerProcess: RouterProcess,
  ): AIGenerateTextOptions => {
    const iterationHistory = routerProcess.iterationHistory ?? [];
    const lastIt =
      iterationHistory.length > 0
        ? iterationHistory[iterationHistory.length - 1]
        : undefined;

    const allCalls = iterationHistory.flatMap(
      (it) => it.structuredThought?.functionCalls ?? [],
    );

    const state = {
      lastAction: lastIt?.structuredThought?.functionCalls ?? [],
      lastObservation: lastIt?.response ?? null,
      allCalls,
    };

    // Build a compact Past Actions text (limit to last 5 iterations to keep prompt lean)
    const pastText =
      iterationHistory
        .slice(-5)
        .map(
          (it) =>
            `Iteration ${it.iteration}\n` +
            `- Thought which justifies the next step: ${it.naturalLanguageThought}\n` +
            `- The function calls that were made: ${JSON.stringify(it.structuredThought.functionCalls, null, 2)}\n` +
            `- The response that was made after seeing the response of the function calls: ${it.response}\n`,
        )
        .join('\n') || '— none —';

    return {
      messages: [
        ...this.BASE_PROMPTS.map((content) => ({
          role: 'system' as const,
          content,
        })),
        // Provide the original user goal and a compact, machine-readable STATE first
        {
          role: 'system' as const,
          content: `ORIGINAL_GOAL: ${routerProcess.question ?? '(missing)'}`,
        },
        {
          role: 'system' as const,
          content: `STATE: ${JSON.stringify(state, null, 2)}`,
        },

        // Keep any extended domain/system guidance
        { role: 'system' as const, content: `\n${extendedSystemPrompt}\n` },

        // Strict rubric requiring DONE: or CALL:
        {
          role: 'system' as const,
          content: `\nYou are a reasoning engine inside an autonomous AI agent. Each call is one iteration in the same task.\nYour reply MUST begin with exactly one of these tokens:\n\n- "DONE:" followed by the final answer to the ORIGINAL_GOAL, if the STATE indicates the goal is already satisfied or if the next action would repeat a past call without producing new information.\n- "CALL:" followed by the single agent/function to execute now and the exact arguments to pass.\n\nGoal satisfaction rubric (APPLY BEFORE proposing any tool call):\n1) If the most recent observation already contains the data or indicates success completing the requested action, output "DONE:" with a concise summary. Do NOT call any tools.\n2) Never repeat a tool call with the same function name and identical arguments already listed in STATE.allCalls. If a repeat would occur, output "DONE:" summarizing the already obtained results.\n3) Only call a tool if at least one *new* fact will be produced toward the goal.\n4) If any required parameter is missing or ambiguous, do NOT call a tool; ask for the exact value(s) and end with "DONE:" (no action needed now).\n\nParameter echo (CRITICAL when you choose CALL):\n- After "CALL:", write "{agent}/{function}" and list **every** required parameter with concrete values (verbatim tokens), e.g., date="2025-10-05".\n- You may include optional parameters, but only with explicit, literal values.\n- If you cannot provide all required parameters with literal values, you cannot call.\n\nIntent patterns:\n- Execute: “CALL: moodle-agent/get_user_info with include_in_response={"username":true,"firstname":true,"lastname":true,"siteurl":true,"userpictureurl":true,"userlang":true}”\n- Describe (capabilities or final answer): “DONE: We already fetched the user profile (username, firstname, lastname, siteurl, userpictureurl, userlang). Here it is: …”\n\nStay precise. Do not invent values. One step at a time.\n\nTOOLS SNAPSHOT (read once as reference; do not regurgitate):\n${JSON.stringify(agentTools, null, 2)}\n`,
        },

        // Short, human-readable history to aid reasoning
        {
          role: 'assistant' as const,
          content: `Past actions and their results (oldest → newest; last 5 shown):\n${pastText}`,
        },
      ],
    };
  };

  /**
   * Prompt for the structured-thought (JSON) step.
   * No change needed here, but it already deduplicates and keeps isFinished consistent.
   */
  public static getStructuredThoughtPrompt = (
    agentTools: AgentTool[],
  ): AIGenerateTextOptions => ({
    messages: [
      {
        role: 'system' as const,
        content: `You are a highly precise system that translates an assistant's thought into a structured JSON object.\nYour single most important job is to distinguish between a plan to **execute a tool** and a plan to **provide a final text answer**.\n\nGlobal execution policy:\n• All "functionCalls" you output are executed **in parallel** within the same iteration (no chaining/order guarantees).\n• If a potential call **depends on the output** of another call and its **required arguments are not explicitly present** in the thought, **omit** that dependent call from this iteration.\n• **Deduplicate**: if the thought repeats the **same tool with identical arguments**, include it **only once** in "functionCalls". (Same function name + same args values ⇒ identical.)\n• **Do not** add, infer, or invent arguments not explicitly stated.\n• If information is missing, do not make a call. Set the "isFinished" field to true.\n\nFollow these rules with absolute precision:\n\n1) Identify the Core Intent\n   • If the thought contains explicit action phrases like "CALL:" and lists a concrete function with literal args, the intent is to **call a tool**. Proceed to Rule 2.\n   • If the thought begins with "DONE:", the intent is to **provide a final answer**. Proceed to Rule 3.\n\n2) Generating Tool Calls (ONLY for Action Intents)\n   • Populate the "functionCalls" array.\n   • Include the "include_in_response" parameter (object) in the args of **every** function call when it is required by the tool schema.\n   • Set "isFinished" to false.\n   • NEVER invent parameters. If a required parameter is not in the thought, omit that call this iteration.\n   • Deduplicate identical calls (same function + identical args).\n\n3) Generating a Final Answer (ONLY for "DONE:" Intents)\n   • "functionCalls" MUST be [].\n   • "isFinished" MUST be true.\n\n---\nExample 1: Action Intent (Single Call)\nThought: "CALL: moodle-agent/search_courses_by_name with course_name=\"Computer Science\" and include_in_response={\"summary\":true,\"completed\":true,\"hidden\":true}"\nCorrect JSON:\n{\n  "functionCalls": [\n    {\n      "function": "search_courses_by_name",\n      "args": {\n        "course_name": "Computer Science",\n        "include_in_response": { "summary": true, "completed": true, "hidden": true }\n      }\n    }\n  ],\n  "isFinished": false\n}\n\n---\nExample 2: Final Answer (DONE)\nThought: "DONE: I can use Moodle functions like search_courses_by_name and get_assignments, but since you asked about capabilities only, here is the description…"\nCorrect JSON:\n{\n  "functionCalls": [],\n  "isFinished": true\n}\n\n---\nExample 3: Parallel + Deduplication\nThought: "CALL: translate_text with text=\"Hello\", targetLang=\"de\". Also CALL: kb_vector_search with query=\"atlas\", topK=3 and include_in_response={\"snippet\":true,\"scores\":true,\"metadata\":true}."\nCorrect JSON:\n{\n  "functionCalls": [\n    {\n      "function": "translate_text",\n      "args": {\n        "text": "Hello",\n        "targetLang": "de",\n        "include_in_response": { "targetLang": true, "sourceLang": false }\n      }\n    },\n    {\n      "function": "kb_vector_search",\n      "args": {\n        "query": "atlas",\n        "topK": 3,\n        "include_in_response": { "snippet": true, "scores": true, "metadata": true }\n      }\n    }\n  ],\n  "isFinished": false\n}\n\n---\nExample 4: Dependent Call Omitted (No docId present)\nThought: "CALL: kb_vector_search with query=\"atlas runbook\". (Will fetch the doc later when I have a literal docId.)"\nCorrect JSON:\n{\n  "functionCalls": [\n    {\n      "function": "kb_vector_search",\n      "args": {\n        "query": "atlas runbook",\n        "include_in_response": { "snippet": true, "scores": true, "metadata": false }\n      }\n    }\n  ],\n  "isFinished": false\n}\n\n---\nExample 5: Missing Required Params (Ask, Do Not Execute)\nThought: "DONE: I cannot execute get_weather_info yet. Missing required parameter city (e.g., \"Cologne\"). Please provide it."\nCorrect JSON:\n{\n  "functionCalls": [],\n  "isFinished": true\n}\n\nNow, parse the following thought with zero deviation from these rules.`,
      },
      {
        role: 'system' as const,
        content: `Possible function calls: ${JSON.stringify(agentTools, null, 2)}`,
      },
    ],
  });
}
