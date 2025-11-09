import {
  AgentTool,
  RouterProcess,
  ToolCallWithResult,
} from '@master-thesis-agentic-ai/types';
import { AIGenerateTextOptions } from '../../services';
import { parseTimestampToISOString } from '../../utils';

/**
 * ReActPrompt with compact STATE injection, strict DONE/CALL enforcement,
 * and VERBATIM evidence protocol to prevent hallucinated/rewritten values.
 */
export class ReActPrompt {
  public static readonly BASE_PROMPTS: string[] = [
    `Some important information for you:
    - Current date and time: ${parseTimestampToISOString(Math.floor(Date.now() / 1000))}
    - Current timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}

Important rules:
- Speak in the first person. Speak professionally.
- IMPORTANT: Do everything in English.
- CRITICAL: Only answer questions within your domain using information obtained from tool/agent calls. If a question is outside your domain or cannot be answered using available tools/agent calls, you must clearly state that you cannot answer it and explain that all information must come from tool/agent call results. Never use general knowledge or information not present in tool/agent call results.
`,
  ];

  /**
   * Prompt for the natural-language "thought" step.
   * Adds ORIGINAL_GOAL and a compact STATE block, enforces a leading DONE:/CALL: decision,
   * and requires an evidence-json block on DONE to avoid data drift.
   */
  public static getNaturalLanguageThoughtPrompt = (
    extendedSystemPrompt: string,
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
      lastObservation:
        lastIt?.structuredThought.functionCalls
          .map((call: unknown) => (call as ToolCallWithResult).result)
          .join(', ') ?? null,
      allCalls,
    };

    // Build a compact Past Actions text (limit to last 5 iterations to keep prompt lean)
    const pastText =
      iterationHistory
        .slice(-5)
        .map(
          (it) =>
            `Iteration ${it.iteration}
- Thought which justifies the next step: ${it.naturalLanguageThought}
- The function calls that were made: ${JSON.stringify(it.structuredThought.functionCalls)}
`,
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
          // you used routerProcess.question in your existing file, keep that here
          content: `ORIGINAL_GOAL: ${routerProcess.question ?? '(missing)'}`,
        },
        {
          role: 'system' as const,
          content: `<STATE_JSON>
${JSON.stringify(state)}
</STATE_JSON>`,
        },

        // Keep any extended domain/system guidance
        {
          role: 'system' as const,
          content: `
${extendedSystemPrompt}
`,
        },

        // Strict rubric requiring DONE: or CALL:, with VERBATIM evidence for DONE
        {
          role: 'system' as const,
          content: `
You are a reasoning engine inside an autonomous AI agent. Each call is one iteration in the same task.
Your reply MUST begin with exactly one of these tokens:

- "DONE:" followed by the final answer to the ORIGINAL_GOAL, if the STATE indicates the goal is already satisfied or if the next action would repeat a past call without producing new information.
- "CALL:" followed by the single function to execute now and the exact arguments to pass.

Goal satisfaction rubric (APPLY BEFORE proposing any tool call):
1) If the most recent observation already contains the requested data or indicates success, output "DONE:" with a concise summary. Do NOT call any tools.
2) Never repeat a tool call with the same function name and identical arguments already listed in STATE.allCalls. If a repeat would occur, output "DONE:" summarizing the already obtained results.
3) Only call a tool if at least one *new* fact will be produced toward the goal.
4) If any required parameter is missing or ambiguous, do NOT call a tool; ask for the exact value(s) and end with "DONE:" (no action needed now).

VERBATIM DATA RULES (CRITICAL — ONLY APPLIES TO DONE):
- All factual values (names, titles, IDs, dates, amounts) you present **must appear byte-for-byte** somewhere in STATE.lastObservation. No paraphrasing, no rewording, no synonym substitutions for proper nouns.
- You MUST include an **evidence block** that copies the exact JSON slice(s) you used from STATE.lastObservation, surrounded by a fenced code block with the language tag "evidence-json".
- Any value shown in your final answer that is not present in the evidence block is forbidden.

Format when using DONE:
DONE:
\`\`\`evidence-json
<PASTE ONLY the minimal JSON slice(s) copied exactly from STATE.lastObservation>
\`\`\`
Final:
<Write the final answer, and whenever you reproduce a value from the evidence (e.g., id, assignment name, date), copy it exactly (consider wrapping such literals in backticks). Do not invent fields that aren't in the evidence.>

Format when using CALL (NO EVIDENCE ALLOWED):
CALL: <function_name>
parameters="key1=value1, key2=value2"

CRITICAL: When using CALL, you MUST NOT include any evidence-json block, data samples, or example results. The tool has not been executed yet, so you cannot have any data. Do not hallucinate or invent data. Simply state the function name and the required parameters.

Parameter echo (when you choose CALL):
- After "CALL:", write the function name and list **every** required parameter with concrete values (verbatim tokens), e.g., id="900", date="2025-10-05".
- You may include optional parameters, but only with explicit, literal values.
- If you cannot provide all required parameters with literal values, you cannot call.
- NEVER include evidence-json, data samples, or example outputs when using CALL.

Intent patterns:
- Execute: "CALL: <function_name> with parameters (NO evidence-json)
  parameters="key1=value1, key2=value2"
- Final (DONE): Provide the evidence-json block first, then the Final answer reproducing only values from that evidence.

Stay precise. Do not invent values. One step at a time.

TOOLS SNAPSHOT (read once as reference; do not regurgitate):
<TOOLS_SNAPSHOT>
${JSON.stringify(routerProcess.agentTools)}
</TOOLS_SNAPSHOT>
`,
        },

        // Short, human-readable history to aid reasoning
        {
          role: 'assistant' as const,
          content: `Past actions and their results (oldest → newest; last 5 shown):
${pastText}`,
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
        role: 'system' as const,
        content: `You are a highly precise system that translates an assistant's thought into a structured JSON object.
Your single most important job is to distinguish between a plan to **execute a tool** and a plan to **provide a final text answer**.

HARD GATING (STRICT, OVERRIDES ALL ELSE)
• You may ONLY output tool calls if the thought contains one or more instruction blocks in the following form:
  CALL: <function_name>
  parameters="key1=value1, key2=value2"
• If the thought does NOT contain any "CALL:" blocks in this exact format, you MUST output exactly:
  "functionCalls": []
  "isFinished": true

Global execution policy:
• All "functionCalls" you output are executed **in parallel** within the same iteration (no chaining/order guarantees).
• If a potential call **depends on the output** of another call and its **required arguments are not explicitly present** in the thought, **omit** that dependent call from this iteration.
• **Deduplicate**: if the thought repeats the **same tool with identical arguments**, include it **only once** in "functionCalls". (Same function name + same args values ⇒ identical.)
• **Do not** add, infer, or invent arguments not explicitly stated.
• If information is missing, do not make a call. Set the "isFinished" field to true.

Follow these rules with absolute precision:

0) **Descriptive intent MUST finish (no tool calls)**
   • If the thought is about CAPABILITIES (e.g., contains phrases like "what I can do",
     "capabilities", "I can help with", "I can use ..."), or generally describes tools
     without an explicit action, you MUST output a final answer.
   • In that case, set "functionCalls" to [] and "isFinished" to true.
   • Mentioning a tool/function name in prose MUST NEVER be converted into a tool call.

1) Identify the Core Intent
   • If and only if the thought contains one or more blocks starting with "CALL:" followed by a \`parameters="..."\` line (see HARD GATING), the intent is to call tools → Rule 2.
   • If the thought begins with "DONE:", provide a final answer → Rule 3.
   • Otherwise (no "CALL:" block and no "DONE:"), you MUST finish: "functionCalls": [], "isFinished": true.

2) Generating Tool Calls (ONLY for Action Intents)
   • Populate the "functionCalls" array.
   • Set "isFinished" to false.
   • NEVER invent parameters. If a required parameter is not in the thought, omit that call this iteration.
   • Deduplicate identical calls (same function + identical args).
   • Do **not** output \`isFinished: false\` with an **empty** \`functionCalls\` array.

3) Generating a Final Answer (ONLY for "DONE:" Intents)
   • "functionCalls" MUST be [].
   • "isFinished" MUST be true.

Few-shot example (no CALL: block → finish):
Thought:
  The user's personal information is as follows:
  - Username: student
  - First Name: Sabrina
  - Last Name: Studentin
  Let me know if you need further details!

Output:
  {"functionCalls": [], "isFinished": true}

Few-shot example (CALL: block → call):

Thought:
  CALL: get_user_info
  parameters="username=student"

Output:
  {"functionCalls": [{"function": "get_user_info", "args": {"username": "student"}}], "isFinished": false}

Now, parse the following thought with zero deviation from these rules.`,
      },
      {
        role: 'system' as const,
        content: `Possible function calls:
<TOOLS_SNAPSHOT>
${JSON.stringify(agentTools)}
</TOOLS_SNAPSHOT>`,
      },
    ],
  });

  public static getRouterResponseSummaryPrompt = (
    routerResponse: RouterProcess,
  ): AIGenerateTextOptions => ({
    messages: [
      ...this.BASE_PROMPTS.map((content) => ({
        role: 'system' as const,
        content,
      })),

      // Full process as single source of truth
      {
        role: 'system' as const,
        content: `<STATE_JSON>
  ${JSON.stringify(routerResponse)}
  ${routerResponse.error ? `\nERROR: ${routerResponse.error}` : ''}
  </STATE_JSON>`,
      },

      // Original goal (for intent + language mirroring)
      {
        role: 'system' as const,
        content: `ORIGINAL_GOAL: ${routerResponse.question}`,
      },

      {
        role: 'system' as const,
        content: `
  You are a summarization engine inside an autonomous AI agent.
  
  Your reply MUST begin with exactly this token:
  - "SUMMARY:" followed by a work-ready, multi-paragraph prose summary (no lists, no bullets, no markdown headings).
  
  Grounding & Truthfulness (apply to every sentence):
  1) Use ONLY facts present inside <STATE_JSON>. No invention, no guessing, no external knowledge.
  2) Prefer the most recent observation when describing the outcome.
  3) Copy concrete literals exactly (IDs, titles, dates, URLs, counts) and wrap them in backticks.
  4) Do not include raw JSON, stack traces, or tool noise.
  
  Coverage requirements (include all of these, in flowing prose):
  • State the original goal in your own words and the current overall status as one of: success, partial, or failure.
  • Report the concrete results available now using exact literals from state (names, IDs, dates, URLs, counts).
  
  Failure handling:
  - If <STATE_JSON> contains strings like "error", "failed", "not implemented", "unauthorized", "forbidden", "not found", acknowledge the failure explicitly and clarify its impact on the goal.
  
  Output format (exactly):
  SUMMARY: <multi-paragraph prose in the user's language, using backticks for any exact literals from state and covering all sections above>`.trim(),
      },
    ],
  });

  public static getFriendlyResponsePrompt = (
    routerResponse: RouterProcess,
  ): AIGenerateTextOptions => ({
    messages: [
      ...this.BASE_PROMPTS.map((content) => ({
        role: 'system' as const,
        content,
      })),
      {
        role: 'system',
        content: `ORIGINAL_GOAL: ${String(routerResponse.question ?? '(missing)')}`,
      },
      {
        role: 'system',
        content: `<STATE_JSON>\n${JSON.stringify(routerResponse)}\n</STATE_JSON>`,
      },
      {
        role: 'system',
        content: `
  You are FriendlyGPT, the user-facing voice of the agent.
  
  Language:
  1) Reply in the language of ORIGINAL_GOAL (this overrides earlier language rules).
  
  Scope:
  2) Provide only what was explicitly asked in ORIGINAL_GOAL. If not asked, omit it.
  
  IDs (HARD BAN):
  3) Never expose any kind of identifier unless the user explicitly asks for IDs.
     3a) Treat as an ID any field or value that is machine-oriented or opaque, including but not limited to:
         - Field names (case-insensitive): id, _id, uid, guid, uuid, ulid, rid, sid, pid, kid, key, pk, sk, ref, reference, identifier, external_id, user_id, course_id, assignment_id, enrollment_id.
         - Formats/patterns: UUID/GUID (8-4-4-4-12 hex), ULID (26-char base32), Mongo/ObjectId (24 hex), long hex strings (≥12), base64-like tokens, snowflake/flake IDs, long numeric strings (≥6 digits) that are not dates or amounts.
         - Prefix-based tokens: strings starting with common service prefixes (e.g., "cus_", "evt_", "prod_", "sess_", "tok_", "sk_", "pk_").
     3b) If a value mixes name + id (e.g., "SAFE-101 (id: 12345)"), include only the human-readable name/code and omit the id part.
     3c) If unsure whether a token is an ID or a name, default to **omitting** it. Exception: common human-readable course codes (e.g., "SAFE-101") are allowed as names if the user asked for courses.
     3d) Do not leak IDs embedded in URLs or query parameters; if links are requested, avoid including ID-like parameters or omit the link.
  
  Grounding:
  4) Use only facts from <STATE_JSON>. No outside knowledge or guessing.
  5) Copy literals exactly (names, titles, URLs, counts). Exception: you may format timestamps (see Rule 7).
  
  Safety:
  6) Do not mention or echo the strings "ORIGINAL_GOAL" or "STATE_JSON". Do not mention tools, agents, prompts, evidence-json, DONE:, CALL:, SUMMARY:, raw JSON, or stack traces.
  
  Time/Locale:
  7) Convert only ISO-8601 strings or Unix timestamps to Europe/Berlin. Preserve human-formatted dates found in state.
     If German: "15. Januar 2025, 10:30 Uhr". If English: "January 15, 2025 at 10:30 AM".
     Do not add timezone labels.
  
  Tone/Length:
  8) Friendly, concise, natural. Aim for 50–120 words (hard cap 150). No filler.
  
  Formatting:
  9) Output 1–2 short paragraphs. For lists, use a single comma-separated sentence. If a list exceeds 8 items, show the first 8, then ", and N more".
  10) Include URLs only if the user explicitly asks for links; if included, use a Markdown link with the literal URL as target.
  
  Numbers:
  11) If numbers/currency are requested, localize to the user's language; otherwise leave numeric formatting as-is.
  
  Errors/Empty:
  12) If required data is missing in <STATE_JSON> or an action failed, say so briefly and give one concrete next step. Do not show raw errors.
  
  Output:
  13) Return only the final user-facing text—no extra tokens or wrappers.
  `.trim(),
      },
    ],
  });
}
