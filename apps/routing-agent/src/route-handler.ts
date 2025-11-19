import {
  A2AReActRouter,
  AIProvider,
  Logger,
  RouterAIOptions,
  RouterSystemPromptOptions,
  getFriendlyResponse,
} from '@master-thesis-agentic-ai/agent-framework';
import { RouterProcess } from '@master-thesis-agentic-ai/types';
import chalk from 'chalk';
import { getAgents } from './get-agents';
import { sendSSEUpdate } from './sse-handler';

type RouteQuestionParams = {
  logger: Logger;
  aiProvider: AIProvider;
  agentUrls: string[];
  prompt: string;
  maxIterations: number;
  contextId: string;
  sessionId: string;
};

/**
 * Process a question by routing it through available agents
 */
async function routeQuestion({
  logger,
  aiProvider,
  agentUrls,
  prompt,
  maxIterations,
  contextId,
  sessionId,
}: RouteQuestionParams): Promise<RouterProcess> {
  logger.log(chalk.magenta('Finding out which agent to call first:'));

  // Get available agents and tools
  const { agentClients, agentTools } = await getAgents(logger, agentUrls);

  const aiOptions: RouterAIOptions = {
    aiProvider,
    structuredAiProvider: aiProvider,
  };

  const systemPromptOptions: RouterSystemPromptOptions = {
    extendedNaturalLanguageThoughtSystemPrompt: `You are **RouterGPT**, the dispatcher in a multi-agent system. 
    Your goal is to route the user's request to the single most appropriate agent based on the *intent* of the action.
  
    **AGENT CAPABILITIES:**
  
    **1. moodle-agent (Academic Content Source)**
    - USE FOR: Retrieving course content, reading syllabi, finding assignment due dates, checking grades, or looking up specific course materials (PDFs, links).
    - KEYWORDS: "Course", "Assignment", "Syllabus", "Grade", "Submission", "Due Date", "Module".
    - *LIMITATION:* This agent CANNOT check your availability or modify your schedule.
  
    **2. calendar-agent (Time Management & Scheduling)**
    - USE FOR: creating events, checking availability ("am I free?"), finding specific *calendar events*, moving/rescheduling sessions, or renaming events.
    - KEYWORDS: "Event", "Calendar", "Schedule", "Free", "Busy", "Move", "Reschedule", "Rename", "Book", "Session".
    - *CRITICAL:* If the user mentions "Evening Study", "Math Review", or "Study Block", these are likely **calendar events**, not courses.
  
    **ROUTING LOGIC GUIDELINES:**
    1. **Distinguish "Course" vs. "Event":** - "Find the *course* 'Intro to Safety'" -> **moodle-agent**
       - "Find the *event* 'Safety Review'" -> **calendar-agent**
    2. **Action over Noun:** If the user wants to *modify* a time (e.g., "extend," "move"), ALWAYS use **calendar-agent**, even if the event is named after a school subject.
    3. **Parameters:** Extract precise parameters. If a date is mentioned (e.g., "next Monday"), calculate the ISO timestamp if possible or pass the natural language clearly.
  
    Always include the "prompt" and "reason" in the function calls.
  
    ## Example 1 (Academic Query)
    User: What assignments are due next week?
    CALL: moodle-agent
    prompt="Get all assignments with a due date falling in the next 7 days."
    parameters="due_before='2025-10-XX'..."
  
    ## Example 2 (Scheduling Query)
    User: Find my next "Evening Study" event and change the title to "Safety Study".
    CALL: calendar-agent
    reason="The user wants to modify an existing calendar event, not search for a course."
    prompt="Find the upcoming calendar event named 'Evening Study' and update its summary."
    parameters="search_query='Evening Study', new_title='Safety Study'"
    `,
  };

  // Create router
  const agentRouter = await A2AReActRouter.create(
    logger,
    aiOptions,
    systemPromptOptions,
    agentTools,
    agentClients,
  );

  // Route the question
  const generator = agentRouter.routeQuestion(prompt, maxIterations, contextId);

  // Process the generator and send SSE updates
  let results: RouterProcess;
  while (true) {
    const { done, value } = await generator.next();
    if (done) {
      results = value as RouterProcess;
      break;
    }

    const step = value as RouterProcess;
    sendSSEUpdate(logger, sessionId, {
      type: 'iteration_update',
      data: step,
    });
  }

  return results;
}

/**
 * Process a question and return the friendly response
 */
export async function processQuestion(params: RouteQuestionParams): Promise<{
  friendlyResponse: string;
  process: RouterProcess;
}> {
  const results = await routeQuestion(params);

  const friendlyResponse = await getFriendlyResponse(
    results,
    params.aiProvider,
    params.logger,
  );

  params.logger.log(chalk.green('Final friendly response:'), friendlyResponse);

  // Send final SSE update
  sendSSEUpdate(params.logger, params.sessionId, {
    type: 'final_response',
    data: {
      finalResponse: friendlyResponse,
      process: results,
    },
  });

  return {
    friendlyResponse,
    process: results,
  };
}
