import {
  AgentCard,
  AgentClient,
  AgentToolSchema,
  Logger,
  ReActRouter,
  getAIProvider,
  getFriendlyResponse,
} from '@master-thesis-agentic-ai/agent-framework';
import { RouterProcess, RouterResponse } from '@master-thesis-agentic-ai/types';
import chalk from 'chalk';
import cors from 'cors';
import { randomUUID } from 'crypto';
import express from 'express';
import { z } from 'zod/v4';
import { handleToolCalls } from './handle-tool-calls';

const logger = new Logger({ agentName: 'routing-agent' });

const AGENT_URLS = process.env['AGENT_URLS']?.split(',') || [];
if (AGENT_URLS.length === 0) {
  throw new Error('AGENT_URLS is not set');
}

// Store active SSE connections
const activeConnections = new Map<string, express.Response>();

const RequestBodySchema = z.object({
  prompt: z.string(),
  max_iterations: z.number().optional().default(5),
});

type RequestBody = z.infer<typeof RequestBodySchema>;

const expressApp = express();
expressApp.use(cors());
expressApp.use(express.json());

// SSE endpoint for streaming updates
expressApp.get('/stream/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId;
  logger.log('Client connected to SSE endpoint for session:', sessionId);

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

  // Send initial connection message
  res.write('data: {"type":"connected","data":"Connected to SSE stream"}\n\n');

  // Store the connection
  activeConnections.set(sessionId, res);

  // Set up keep-alive ping
  const keepAliveInterval = setInterval(() => {
    if (activeConnections.has(sessionId)) {
      try {
        res.write(': ping\n\n');
      } catch {
        logger.debug('Keep-alive ping failed, connection may be closed');
        clearInterval(keepAliveInterval);
        activeConnections.delete(sessionId);
      }
    } else {
      clearInterval(keepAliveInterval);
    }
  }, 30000); // Send ping every 30 seconds

  // Remove connection when client disconnects
  req.on('close', () => {
    logger.log('Client disconnected from SSE stream');
    clearInterval(keepAliveInterval);
    activeConnections.delete(sessionId);
  });

  // Handle errors
  req.on('error', (error) => {
    logger.error('SSE connection error:', error);
    clearInterval(keepAliveInterval);
    activeConnections.delete(sessionId);
  });

  // Handle aborted requests
  req.on('aborted', () => {
    logger.log('SSE connection aborted');
    clearInterval(keepAliveInterval);
    activeConnections.delete(sessionId);
  });
});

// Helper function to send SSE updates
const sendSSEUpdate = (sessionId: string, data: unknown) => {
  logger.debug('Sending SSE update:', data);
  const connection = activeConnections.get(sessionId);
  if (connection) {
    try {
      const message = `data: ${JSON.stringify(data)}\n\n`;
      connection.write(message);
      logger.debug('SSE update sent successfully');
    } catch (error) {
      logger.error('Error sending SSE update:', error);
      // Check if connection is still writable
      if (connection.destroyed || connection.writableEnded) {
        logger.log('Connection is closed, removing from active connections');
        activeConnections.delete(sessionId);
      }
    }
  } else {
    logger.debug('No active connection found for session:', sessionId);
  }
};

expressApp.post('/ask', async (req, res) => {
  let body: RequestBody;
  try {
    const parsed = RequestBodySchema.safeParse(req.body);

    if (!parsed.success) {
      logger.error('Error parsing request body:', parsed.error);
      res.status(400).json({
        error: 'Missing required fields in request body',
      });
      return;
    }

    body = parsed.data;
  } catch (error) {
    logger.error('Error parsing request body:', error);
    res.status(400).json({
      error: 'Invalid request body',
    });
    return;
  }

  let contextId: string = randomUUID();
  if (
    req.headers['x-test-id'] &&
    typeof req.headers['x-test-id'] === 'string' &&
    req.headers['x-test-id'].length > 0
  ) {
    contextId = req.headers['x-test-id'] as string;
  }

  logger.log(chalk.cyan('--------------------------------'));
  logger.log(chalk.cyan('User question:'), body.prompt);
  logger.log(chalk.cyan('Using max iterations:'), body.max_iterations);
  logger.log(chalk.cyan('Context ID:'), contextId);
  logger.log(chalk.cyan('--------------------------------'));

  const id = randomUUID();
  logger.debug('Session ID:', String(id));

  res.json({
    id,
    status: 'processing',
    message: 'Question received and processing started',
  });

  try {
    const aiProvider = getAIProvider(logger);

    logger.log(chalk.magenta('Finding out which agent to call first:'));

    const availableAgents = await Promise.all(
      AGENT_URLS.map((url) => AgentClient.createFromUrl(logger, url)),
    );

    const availableAgentsCards = await Promise.all(
      availableAgents.map((agent) => agent.getAgentCard()),
    );

    const agentTools = availableAgentsCards.map((agent: AgentCard) =>
      AgentToolSchema.parse({
        name: agent.name,
        description: agent.description,
        args: {
          prompt: {
            type: 'string',
            description: 'The prompt to call the agent with',
            required: true,
          },
          reason: {
            type: 'string',
            description: 'The reason for calling the agent',
            required: true,
          },
        },
      }),
    );
    logger.log(chalk.magenta('Available agents:'));
    logger.table(agentTools);

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
        handleToolCalls(logger, functionCalls, availableAgents, contextId),
      async () => {
        logger.log('Disconnecting from Client');
      },
    );

    const generator = agentRouter.routeQuestion(
      body.prompt,
      body.max_iterations,
      contextId,
    );
    let results: RouterResponse;
    while (true) {
      const { done, value } = await generator.next();
      if (done) {
        results = value as RouterResponse;
        break;
      }

      const step = value as RouterProcess;
      sendSSEUpdate(id, {
        type: 'iteration_update',
        data: step,
      });

      // logger.log('Step:', value);
    }

    const friendlyResponse = await getFriendlyResponse(
      results,
      aiProvider,
      logger,
    );

    logger.log(chalk.green('Final friendly response:'), friendlyResponse);

    // Send final SSE update
    sendSSEUpdate(id, {
      type: 'final_response',
      data: {
        finalResponse: friendlyResponse,
      },
    });

    logger.log(chalk.green('Processing completed successfully'));
  } catch (error) {
    logger.error('Error processing question:', error);

    // Send error SSE update
    sendSSEUpdate(id, {
      type: 'error',
      data:
        error instanceof Error
          ? error.message
          : 'An error occurred while processing your question.',
    });
  } finally {
    // Ensure we always clean up the connection
    setTimeout(() => {
      if (activeConnections.has(id)) {
        logger.log('Cleaning up SSE connection for session:', id);
        activeConnections.delete(id);
      }
    }, 5000); // Clean up after 5 seconds
  }
});

expressApp.get('/models', async (req, res) => {
  try {
    const aiProvider = getAIProvider(logger);
    const models = await aiProvider.getModels();
    res.json(models);
  } catch (error) {
    logger.error('Error getting models:', error);
    res.status(500).json({ error: 'An error occurred while getting models.' });
  }
});

expressApp.get('/health', (req, res) => {
  res.send('OK');
});

// Start the server and keep it running
expressApp.listen(3000, () => {
  logger.log(`Server is running on port 3000`);
});
