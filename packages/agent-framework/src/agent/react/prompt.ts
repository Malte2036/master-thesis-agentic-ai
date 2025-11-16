import {
  AgentTool,
  RouterProcess,
  ToolCallWithResult,
} from '@master-thesis-agentic-ai/types';
import { AIGenerateTextOptions } from '../../services';
import { getCurrentTimestamp } from '../../utils';

/**
 * ReActPrompt with compact STATE injection, strict DONE/CALL enforcement,
 * a VERBATIM evidence protocol to prevent hallucinated/rewritten values,
 * and a separate TODO planning module for multi-step tasks.
 */
export class ReActPrompt {
  public static readonly BASE_PROMPTS: string[] = [
    `Some important information for you:
    - Current date and time: ${getCurrentTimestamp().toISOString()}
    - Current timezone: ${Intl.DateTimeFormat().resolvedOptions().timeZone}

Important rules:
- Speak in the first person. Speak professionally.
- IMPORTANT: Do everything in English.
- CRITICAL: Only answer questions within your domain using information obtained from tool/agent calls. If a question is outside your domain or cannot be answered using available tools/agent calls, you must clearly state that you cannot answer it and explain that all information must come from tool/agent call results. Never use general knowledge or information not present in tool/agent call results.
`,
  ];

  private static buildSharedContext(routerProcess: RouterProcess) {
    const iterationHistory = routerProcess.iterationHistory ?? [];
    const lastIt =
      iterationHistory.length > 0
        ? iterationHistory[iterationHistory.length - 1]
        : undefined;

    const isRoutingAgent = routerProcess.agentTools.some(
      (t) => t.name === 'moodle-agent',
    );

    const latestObservation =
      lastIt?.structuredThought?.functionCalls
        ?.map((c: unknown) => (c as ToolCallWithResult).result ?? '')
        .join(', ') ?? 'null';

    const minimalToolsSnapshot =
      routerProcess.agentTools?.map((t: AgentTool) => ({
        name: t.name,
        description: t.description,
      })) ?? [];

    const previousTodo =
      lastIt?.todoThought && lastIt.todoThought.length > 0
        ? lastIt.todoThought
        : '<TODO_LIST>\n</TODO_LIST>';

    return {
      iterationHistory,
      lastIt,
      isRoutingAgent,
      latestObservation,
      minimalToolsSnapshot,
      previousTodo,
    };
  }

  /**
   * Prompt for the natural-language "thought" step.
   * Adds ORIGINAL_GOAL and a compact STATE block, incorporates the current TODO_LIST,
   * enforces a leading DONE:/CALL: decision, and requires an evidence-json block on DONE
   * to avoid data drift.
   */
  public static getNaturalLanguageThoughtPrompt = (
    extendedSystemPrompt: string,
    routerProcess: RouterProcess,
    currentTodoThought: string | undefined,
  ): AIGenerateTextOptions => {
    const { iterationHistory, lastIt } = this.buildSharedContext(routerProcess);

    const allCalls = iterationHistory.flatMap(
      (it) => it.structuredThought?.functionCalls ?? [],
    );

    const state = {
      lastAction: lastIt?.structuredThought?.functionCalls ?? [],
      lastObservation:
        lastIt?.structuredThought?.functionCalls
          ?.map((call: unknown) => (call as ToolCallWithResult).result)
          .join(', ') ?? null,
      allCalls,
    };

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

    const { previousTodo } = this.buildSharedContext(routerProcess);

    const todoList =
      currentTodoThought && currentTodoThought.trim().length > 0
        ? currentTodoThought
        : previousTodo;

    return {
      messages: [
        ...this.BASE_PROMPTS.map((content) => ({
          role: 'system' as const,
          content,
        })),
        {
          role: 'system' as const,
          content: `ORIGINAL_GOAL: ${routerProcess.question ?? '(missing)'}`,
        },
        {
          role: 'system' as const,
          content: `<STATE_JSON>
${JSON.stringify(state)}
</STATE_JSON>`,
        },
        {
          role: 'system' as const,
          content: todoList,
        },
        {
          role: 'system' as const,
          content: `
${extendedSystemPrompt}
`,
        },
        {
          role: 'system' as const,
          content: `
You are a reasoning engine inside an autonomous AI agent. Each call is one iteration in the same task.

You receive:
- ORIGINAL_GOAL: the user's initial request.
- <STATE_JSON>: a compact snapshot of previous actions and their observations.
- <TODO_LIST>…</TODO_LIST>: the current multi-step plan, maintained by a separate internal planning module.

Division of responsibilities:
- The TODO list is the primary plan to achieve ORIGINAL_GOAL. It is maintained by another module.
- Your job is NOT to edit or rewrite the TODO list.
- Your job IS to:
  • Use the TODO list to decide which single step to advance next.
  • Check <STATE_JSON> and the most recent observation to avoid redundant work.
  • Decide whether to finish (DONE) or execute exactly one tool call (CALL) in this iteration.

Planning vs efficiency:
- Always aim for the **shortest successful sequence of tool calls** that fully satisfies ORIGINAL_GOAL.
- If calling an additional tool would only reconfirm, decorate, or slightly refine information you already have enough to answer the goal, you MUST NOT call it. Instead, finish with DONE in this iteration.
- Do NOT explore capabilities or "nice to have" extra data once the goal can already be answered correctly.

Default behavior:
- Focus on the next unchecked task ("- [ ] ...") in <TODO_LIST> that is relevant to ORIGINAL_GOAL.
- Before calling any tool, inspect STATE_JSON.lastObservation and STATE_JSON.allCalls:
  • If the current TODO step is already satisfied by the existing state, treat it as done and move on mentally to the next TODO step.
  • If calling a tool would repeat a previous call with identical arguments, do NOT call it again.

Internal reasoning length (VERY IMPORTANT):
- Keep your internal reasoning before "DONE:" or "CALL:" **short and focused**.
- Use at most a few concise sentences (roughly <= 5) to justify your choice. Do NOT explain every detail or restate long context.

Your reply MUST begin with exactly one of these tokens:

- "DONE:" followed by the final answer to the ORIGINAL_GOAL, if the STATE indicates the goal is already satisfied or if the next action would repeat a past call without producing new information.
- "CALL:" followed by the single function to execute now and the exact arguments to pass.

Goal satisfaction rubric (APPLY BEFORE proposing any tool call):
1) If the most recent observation already contains the requested data or indicates success, output "DONE:" with a concise summary. Do NOT call any tools.
2) Never repeat a tool call with the same function name and identical arguments already listed in STATE.allCalls. If a repeat would occur, output "DONE:" summarizing the already obtained results.
3) Only call a tool if at least one *new* fact will be produced toward the goal.
4) If any required parameter is missing or ambiguous, do NOT call a tool; ask for the exact value(s) and end with "DONE:" (no action needed now).
5) If ORIGINAL_GOAL can already be completely answered using only STATE.lastObservation, you MUST respond with DONE in this iteration and you MUST NOT call any further tools.

VERBATIM DATA RULES (CRITICAL — ONLY APPLIES TO DONE):
- All factual values (names, titles, IDs, dates, amounts) you present **must appear byte-for-byte** somewhere in STATE.lastObservation. No paraphrasing, no rewording, no synonym substitutions for proper nouns.
- You MUST aggressively trim the JSON slice(s) you use as evidence to **only** the fields you actually reference in the Final answer. Do NOT include large HTML/text blobs, full tables, or long logs if you only need a few fields.
- If an object contains long text fields that you do not need (e.g., full HTML content), you MUST omit those fields from the evidence-json block.
- You MUST include an **evidence block** that copies the exact JSON slice(s) you used from STATE.lastObservation, surrounded by a fenced code block with the language tag "evidence-json".
- Any value shown in your final answer that is not present in the evidence block is forbidden.

Format when using DONE:
DONE:
\`\`\`evidence-json
<PASTE ONLY the minimal JSON slice(s) copied exactly from STATE.lastObservation>
\`\`\`
Final:
<Write the final answer, and whenever you reproduce a value from the evidence (e.g., id, assignment name, date), copy it exactly (consider wrapping such literals in backticks). Do not invent fields that aren't in the evidence. 
Critically, in the Final section you MUST:
- Answer ONLY what ORIGINAL_GOAL explicitly asks for.
- Avoid adding extra related facts, assignments, suggestions, or commentary that the user did not request.>

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
      {
        role: 'system' as const,
        content: `<STATE_JSON>
  ${JSON.stringify(routerResponse)}
  ${routerResponse.error ? `\nERROR: ${routerResponse.error}` : ''}
  </STATE_JSON>`,
      },
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
      
      Grounding:
      3) Use only facts from <STATE_JSON>. No outside knowledge or guessing.
      4) Copy literals exactly (names, titles, URLs, counts). When dates/times appear as ISO, you MUST humanize them and never show raw ISO.
      
      Safety:
      5) Do not mention or echo the strings "ORIGINAL_GOAL" or "STATE_JSON". Do not mention tools, agents, prompts, evidence-json, DONE:, CALL:, SUMMARY:, raw JSON, or stack traces.
      
      CRITICAL REDACTION POLICY (OVERRIDES EVERYTHING ELSE):
      
      6) You MUST NOT expose any kind of identifier unless the user explicitly asks for IDs.
      
         6a) Treat as a forbidden ID any field or value that is machine-oriented or opaque, including but not limited to:
             - Field names (case-insensitive) containing: id, _id, uid, guid, uuid, ulid, rid, sid, pid, kid, key, pk, sk, ref, reference,
               identifier, external_id, user_id, course_id, assignment_id, enrollment_id, "User ID", "Course ID".
             - Values in those columns (e.g. "3" when shown under "User ID", or "123456", "b7c9f0d1a2b3c4d5e6f7a8b9").
             - UUID-like or long hex strings (>= 12 chars), base64-like tokens, long numeric strings (>= 6 digits) that are not clear dates or amounts.
             - IDs embedded in URLs or query parameters.
      
         6b) If a value mixes a name and an ID, e.g. "Intro to Safety (id: 12345)", you MUST remove the ID part and keep only the human label: "Intro to Safety".
      
         6c) If you are unsure whether something is an ID or not, treat it as an ID and remove it.
      
         6d) If a row/bullet contains only ID-like information (e.g. "- User ID: 3"), you MUST omit that row/bullet entirely.
      
         6e) Example (BAD → GOOD):
             BAD:
               - **User ID**: 3
               - **Username**: student
             GOOD:
               - **Username**: student
      
      SELF-CHECK BEFORE ANSWERING:
      
      7) Before you send your final answer, imagine you have written it already and review it:
         - If it contains any field whose label includes "id" (e.g. "User ID", "course_id") or any obviously machine-like token,
           you MUST remove or anonymize those parts.
         - Only after you have removed all such IDs, output the final, redacted answer.
      
      Errors/Empty:
      8) If required data is missing in <STATE_JSON> or an action failed, say so briefly and give one concrete next step. Do not show raw errors.
      9) Keep your answer as short and focused as possible while fully satisfying ORIGINAL_GOAL.
         - If the goal is to confirm a fact, answer with a direct confirmation and only the strictly necessary supporting details.
         - If the goal is to list items (courses, assignments, events, pages, forums), provide the list and avoid unrelated context, commentary, or suggestions.
      `.trim(),
      },
    ],
  });

  public static getTodoThoughtPrompt = (
    routerProcess: RouterProcess,
  ): AIGenerateTextOptions => {
    const {
      iterationHistory,
      isRoutingAgent,
      latestObservation,
      minimalToolsSnapshot,
      previousTodo,
    } = this.buildSharedContext(routerProcess);

    const pastText =
      iterationHistory
        .slice(-3)
        .map(
          (it) =>
            `Iteration ${it.iteration}
      - Thought: ${it.naturalLanguageThought}
      - Calls: ${JSON.stringify(it.structuredThought?.functionCalls ?? [])}
      `,
        )
        .join('\n') || '— none —';

    return {
      messages: [
        ...this.BASE_PROMPTS.map((content) => ({
          role: 'system' as const,
          content,
        })),
        {
          role: 'system' as const,
          content: `ORIGINAL_GOAL: ${routerProcess.question ?? '(missing)'}`,
        },
        {
          role: 'system' as const,
          content: `<PREVIOUS_TODO_LIST>
  ${previousTodo}
  </PREVIOUS_TODO_LIST>`,
        },
        {
          role: 'system' as const,
          content: `<LATEST_OBSERVATION>
  ${latestObservation}
  </LATEST_OBSERVATION>`,
        },
        {
          role: 'system' as const,
          content: `<TOOLS_SNAPSHOT>
  ${JSON.stringify(minimalToolsSnapshot)}
  </TOOLS_SNAPSHOT>`,
        },
        {
          role: 'system' as const,
          content: `
  You are an internal planning module.
  
  Your job:
  - Maintain a TODO list that tracks the steps needed to achieve ORIGINAL_GOAL.
  - Update the existing TODO list based on PREVIOUS_TODO_LIST and LATEST_OBSERVATION.
  - Break the goal into concrete steps that could realistically be advanced using the tools described in <TOOLS_SNAPSHOT>.
  ${
    isRoutingAgent
      ? `- When splitting work into tasks, keep each task **as large as possible and only as small as necessary** for the tools' domain:
    • Prefer one task per logical domain/agent (e.g., "gather all needed Moodle data", "update the calendar") instead of many tiny tool-level tasks.
    • Only split into smaller tasks when it increases clarity or corresponds to clearly separate phases that cannot reasonably be handled together.
    • Do NOT create a separate task for every capability or function (e.g., "search courses", "view assignments", "view schedule") unless the ORIGINAL_GOAL truly needs them as distinct steps.`
      : `- You may create multiple tasks that correspond to distinct tool actions or phases, but avoid unnecessary micro-steps that do not add clarity.
    • Group closely related operations into a single task when they naturally belong together.`
  }
  
  - Mark tasks as done when appropriate, based on LATEST_OBSERVATION:
    • Use "- [x]" for tasks that were successfully completed and contributed to the goal.
  - Preserve useful existing tasks instead of rewriting everything from scratch.
  - Try to keep the TODO list compact. In most cases, you should have **no more than 3 active (unchecked) top-level tasks** at a time.
    • If ORIGINAL_GOAL can be solved with 1–2 tool calls or the current LATEST_OBSERVATION alone, keep the TODO list minimal (one or two tasks, or even all checked).
    • Do NOT add speculative future tasks once the remaining steps are obvious or already covered.
  
  STRICT EVOLUTION RULES (CRITICAL):
  - Treat PREVIOUS_TODO_LIST as an append-only log of tasks.
  - You MUST NOT:
    • delete any existing task line,
    • reorder existing tasks,
    • or change the text of any existing task (apart from the checkbox prefix).
  - The ONLY allowed modifications to existing lines are:
    • changing "- [ ]" to "- [x]" when the task is clearly completed,
    • keeping "- [x]" as it is once set.
  - If you need to refine or add detail to a task, **append a new follow-up task** instead of editing the original line.
  - You MAY append new tasks at the end of the list (or as indented subtasks), but you MUST keep all previous tasks exactly as they were, apart from the checkbox prefix.
  
  CRITICAL CONTENT RULES FOR TASKS:
  - Each task MUST be a short, high-level action description, e.g. "Extract pages and forums for Intro to Safety".
  - A task MUST fit on a single line. Do NOT include colons followed by bullet lists, multi-line descriptions, or paragraphs.
  - You MUST NOT copy raw data from LATEST_OBSERVATION into the TODO list:
    • Do NOT include JSON, object dumps, or structured data.
    • Do NOT include file URLs, IDs, query parameters, or long paths (e.g., "http://moodle:80/webservice/...").
    • Do NOT include long inline content excerpts from pages, forums, or documents.
  - You may refer to what has been done in a **summarized** way only, e.g.:
    • GOOD: "- [x] Extracted pages and forums for the Intro to Safety course"
    • BAD:  "- [x] Extracted pages and forums from "Intro to Safety" course: 1. Course Syllabus ... (with all details, URLs, IDs, etc.)"
  
  Guidance:
  - You MUST NOT write actual "CALL:" blocks here.
  ${
    isRoutingAgent
      ? `- Do not mention actual tool or agent names in the TODO list. Use human/domain language like "gather all relevant Moodle course and assignment data" or "update the calendar with the required events".
  - The TODO list is a human-level plan for the overall orchestration, not executable code.`
      : `- You MAY mention tool or agent names in the TODO list when it improves clarity (e.g., "Fetch all current Moodle courses via moodle-agent.get_all_courses").
  - Even when mentioning tools, do NOT write actual "CALL:" blocks or full argument lists. The TODO list remains a human-level plan, not executable code.`
  }
  - Do not try to decide DONE/CALL here; that is handled by another module.
  
  Output format (CRITICAL):
  - Output ONLY a TODO list wrapped exactly like this:
  
  <TODO_LIST>
  - [x] First task
  - [ ] Second task
  - [ ] Third task
  </TODO_LIST>
  
  Formatting rules:
  - One task per line, starting with "- [ ]" or "- [x]".
  - Optional subtasks are indented by two spaces: "  - [ ] Subtask".
  - Do NOT output anything before <TODO_LIST> or after </TODO_LIST>.
  - Do NOT add explanations, comments, or markdown outside of the list.
  `.trim(),
        },
        {
          role: 'assistant',
          content: `Recent iterations (oldest → newest, max 3):\n${pastText}`,
        },
      ],
    };
  };
}
