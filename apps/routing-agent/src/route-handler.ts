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

    **IMPORTANT - Primary Agent:**
    - The **moodle-agent** is the main agent for the user's domain in most cases.
    - When in doubt about which agent to call, the moodle-agent may be able to help.
    - Prefer the moodle-agent for educational content, courses, assignments, grades, and general academic tasks.
    - Use specialized agents (like calendar-agent) only when the task specifically requires their unique capabilities.

    Always include the "prompt" and "reason" in the function calls.`,

    // ## Example 1
    // User: What assignments are due next week?
    // CALL: moodle-agent
    // prompt="Get the assignments."
    // parameters="due_before='next week'"

    // ## Example 2
    // User: Schedule a meeting with John on Wednesday (2023-11-07) from 3 PM to 4 PM to discuss the upcoming sprint deliverables.
    // CALL: calendar-agent
    // prompt="Create a calendar event"
    // parameters="event_name='Meeting with John', event_description='Discuss the upcoming sprint deliverables', event_start_date='Wednesday (2023-11-07) at 3 PM', event_end_date='Wednesday (2023-11-07) at 4 PM'",
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
