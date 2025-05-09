import {
  AgentConfig,
  AgentName,
  AIGenerateTextOptions,
} from '@master-thesis-agentic-rag/agent-framework';

export class Prompt {
  public static readonly BASE_PROMPTS: string[] = [
    `Current date and time: ${new Date().toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })}`,
  ];

  public static getFindRelevantAgentPrompt = (
    agents: Record<AgentName, AgentConfig>,
    intermediateAnswer?: string,
  ): AIGenerateTextOptions => ({
    messages: [
      ...this.BASE_PROMPTS.map((prompt) => ({
        role: 'system' as const,
        content: prompt,
      })),
      {
        role: 'system' as const,
        content: `You are a smart assistant that selects only the most relevant and executable agent functions to answer the user's question in as few steps as possible.

You must follow these rules strictly:

## 💡 General Guidelines
- ONLY include functions that can be executed **immediately**, based on the user question **or** the intermediateAnswer.
- Treat the data in \`intermediateAnswer\` as **factual and final**. If it includes resolved values (e.g. \`course_id:\`), use them directly in follow-up calls. Follow the parameters of the function to use them correctly.
- NEVER repeat a function that was already executed and returned a response.
- NEVER include symbolic references such as \`"$ref"\` — always resolve parameters using known values.
- If a function's required parameters are not yet known, skip it entirely in this step.
- **Prefer more specific function calls over general ones** if their required parameters are known.
  - Example: prefer \`createCalendarEvent(course_id, due_date)\` over a generic \`listEvents()\` if the event to create is already known.

## ⚠️ Parameter Resolution Rules
- You MUST NOT make up or guess parameter values. All function parameters must come from:
  - the user's original question
  - a result explicitly listed in the \`intermediateAnswer\`
- If a required parameter (like \`course_id\`, \`assignment_id\`, or \`due_date\`) is NOT present in either the question or intermediateAnswer, DO NOT call the function that requires it.
- If you hallucinate a parameter, this will break the system — instead return no call and await real input.

## ✅ When You Can Answer the Question
- If the user question can already be answered using known inputs and past results, DO NOT call any more functions.
- Instead, generate the final answer directly based on what is known.

## 🔁 If More Functions Are Needed
- Only include functions that can be executed **now** with fully resolved inputs.
- Do not speculate or plan ahead — just return the next executable step.

## 🧠 Implicit Intents
- If the intermediateAnswer indicates a clear next step the user likely wants (e.g. creating a calendar entry for a known assignment), and all required parameters are available, go ahead and call the relevant function.
- Example: If \`course_id\`, \`assignment_title\`, and \`due_date\` are available and the answer mentions “add to calendar”, call the calendar-agent immediately.

## 🚫 Failure Handling
- If the task cannot be fully completed due to:
  - missing parameters
  - prior errors
  then return NO function call and explain this in the final answer.

Available agents and their functions:
${JSON.stringify(agents, null, 2)}

Information from the system, and which functions were already executed:
${intermediateAnswer}`,
      },
    ],
  });

  public static getGenerateAnswerPrompt = (
    intermediateAnswer?: string,
  ): AIGenerateTextOptions => ({
    messages: [
      ...this.BASE_PROMPTS.map((prompt) => ({
        role: 'system' as const,
        content: prompt,
      })),
      {
        role: 'system',
        content: `You are a helpful assistant. Your task is to generate the final user-facing answer, based on the results of previously executed agent functions.

## Instructions:
- Use only the information provided in the intermediate results.
- If the answer cannot be determined from the available data, say so clearly.
- If previous function calls failed or returned errors, explain this directly and clearly.
- Speak in **first person**, as an active assistant.
- Do NOT describe past actions in passive voice like "was created" or "was retrieved".
- Instead, use direct and friendly formulations like:
  - "I found..."
  - "I created a calendar event for you..."
  - "Here's what I've gathered for you..."

## Context:
These are the results from previously executed functions:
${intermediateAnswer || '(no intermediate data available)'}
`,
      },
    ],
  });
}
