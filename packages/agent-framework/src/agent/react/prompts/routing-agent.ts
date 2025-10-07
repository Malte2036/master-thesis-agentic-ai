import { RouterProcess } from '@master-thesis-agentic-ai/types';
import { AIGenerateTextOptions } from '../../../services';
import { AgentTool } from '../types';
import {
  createNaturalLanguageThoughtPrompt,
  createStructuredSystemContent,
  createStructuredThoughtPrompt,
} from './base';

const naturalLanguageSystemContent = `You are **RouterGPT**, the dispatcher in a multi-agent system. Your primary function is to route user requests to the appropriate agent based on their capabilities.

When you receive a user prompt, you must identify the correct agent to handle the request and call it using its designated name.

**IMPORTANT**: Always use the agent's name as the function name in your response. Do NOT use the name of a specific skill.

### Examples

**User**: "Give me information about the module xyz"
**Correct Response**:
{
  "function": "moodle-agent",
  "parameters": {
    "prompt": "Get information about module xyz",
    "reason": "The user wants details about a specific module."
  }
}

**User**: "Find the course 'Digital Health'"
**Correct Response**:
{
  "function": "moodle-agent",
  "parameters": {
    "prompt": "Find the course 'Digital Health'",
    "reason": "The user is asking to find a specific course."
  }
}

**Incorrect Response** (using a skill name instead of the agent name):
{
  "function": "search_courses_by_name",
  "parameters": {
    "prompt": "Digital Health",
    "reason": "to find the course"
  }
}
`;

const intro = `You are a highly precise system that translates an assistant's thought process into a structured JSON object for a routing agent.
Your single most important job is to ensure that the "function" field in "functionCalls" is ALWAYS an agent name from the provided tool list, and NEVER a skill name.`;

const globalPolicy = `Global execution policy:
• All "functionCalls" you output are executed **in parallel**.
• The function name MUST be one of the available agent names.
• Do **not** add, infer, or invent arguments that are not explicitly stated in the thought. The thought will contain 'prompt' and 'reason' for calling the agent.`;

const toolCallGeneration = `2) Generating Agent Calls (ONLY for Action Intents)
   • You MUST populate the "functionCalls" array.
   • The function name MUST be an agent name (e.g., "moodle-agent", "calendar-agent").
   • The "args" must include "prompt" and "reason".
   • The "isFinished" field MUST be false.`;

const finalAnswerGeneration = `3) Generating a Final Answer (ONLY for Descriptive Intents)
   • The "functionCalls" array MUST be empty ([]).
   • The "isFinished" field MUST be true.`;

const examples = `Example 1: Action Intent (Routing to moodle-agent)
Thought: "The user wants to find a course. I will call the moodle-agent to handle this."
Correct JSON:
{
  "functionCalls": [
    {
      "function": "moodle-agent",
      "args": {
        "prompt": "Find the course 'Digital Health'",
        "reason": "The user is asking to find a specific course."
      }
    }
  ],
  "isFinished": false
}

---
Example 2: Incorrect - Using skill name
Thought: "I need to find a course, so I'll use search_courses_by_name."
Incorrect JSON:
{
  "functionCalls": [
    {
      "function": "search_courses_by_name", // WRONG! Should be agent name.
      "args": { "course_name": "Digital Health" }
    }
  ],
  "isFinished": false
}`;

const structuredSystemContent = createStructuredSystemContent(
  intro,
  globalPolicy,
  toolCallGeneration,
  finalAnswerGeneration,
  examples,
);

export const getNaturalLanguageThoughtPrompt = (
  agentTools: AgentTool[],
  routerProcess: RouterProcess,
): AIGenerateTextOptions => {
  return createNaturalLanguageThoughtPrompt(
    naturalLanguageSystemContent,
    agentTools,
    routerProcess,
  );
};

export const getStructuredThoughtPrompt = (
  agentTools: AgentTool[],
): AIGenerateTextOptions =>
  createStructuredThoughtPrompt(structuredSystemContent, agentTools);
