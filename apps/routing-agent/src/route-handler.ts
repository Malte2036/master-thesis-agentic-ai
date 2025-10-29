import {
  AIProvider,
  Logger,
  ReActRouter,
  getFriendlyResponse,
} from '@master-thesis-agentic-ai/agent-framework';
import { RouterProcess, RouterResponse } from '@master-thesis-agentic-ai/types';
import chalk from 'chalk';
import { getAgents } from './get-agents';
import { handleToolCalls } from './handle-tool-calls';
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
}: RouteQuestionParams): Promise<RouterResponse> {
  logger.log(chalk.magenta('Finding out which agent to call first:'));

  // Get available agents and tools
  const { agentClients, agentTools } = await getAgents(logger, agentUrls);

  // Create router
  const agentRouter = new ReActRouter(
    aiProvider,
    aiProvider,
    logger,
    agentTools,
    `You are **RouterGPT**, the dispatcher in a multi-agent system.
    
    Always include the "prompt" and "reason" in the function calls.
    `,
    ``,
    (logger, functionCalls) =>
      handleToolCalls(logger, functionCalls, agentClients, contextId),
    async () => {
      logger.log('Disconnecting from Client');
    },
  );

  // Route the question
  const generator = agentRouter.routeQuestion(prompt, maxIterations, contextId);

  // Process the generator and send SSE updates
  let results: RouterResponse;
  while (true) {
    const { done, value } = await generator.next();
    if (done) {
      results = value as RouterResponse;
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
  process: RouterResponse['process'];
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
      process: results.process,
    },
  });

  return {
    friendlyResponse,
    process: results.process,
  };
}
