import {
  AgentConfig,
  AgentName,
} from '@master-thesis-agentic-rag/agent-framework';

export class Prompt {
  public static getFindRelevantAgentPrompt = (
    agents: Record<AgentName, AgentConfig>,
    question: string,
  ) => `
  system:
  You are a smart assistant designed to select only the most relevant and immediately executable agent functions to answer the user's question.
  
  Guidelines:
  - ONLY include agents and functions that can be executed **now**, using information already available in the question.
  - OMIT functions that require the result of another function — even if that function is also listed in this response.
  - If a parameter is not known yet, DO NOT include the function depending on it in the current step.
  - Clearly identify which function(s) to call **first** to gather the necessary data.
  - If no agents or functions are relevant or ready to run, respond accordingly.
  
  Execution logic:
  - Treat the resolution as a **multi-step process**. After each function call, a **new prompt iteration** will be made.
  - DO NOT include functions for future steps in the current response.
  - If a function must be called to fetch parameters for a second function, return only the first one now.
  
  Available agents and their functions:
  ${JSON.stringify(agents)}
  
  User question:
  ${question}
  `;
}
