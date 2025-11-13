import {
  Logger,
  getAIProvider,
} from '@master-thesis-agentic-ai/agent-framework';
import chalk from 'chalk';
import cors from 'cors';
import { randomUUID } from 'crypto';
import express from 'express';
import { z } from 'zod/v4';
import { processQuestion } from './route-handler';
import {
  cleanupConnection,
  sendSSEUpdate,
  setupSSEEndpoint,
} from './sse-handler';

const logger = new Logger({ agentName: 'routing-agent' });

const AGENT_URLS = process.env['AGENT_URLS']?.split(',') || [];
if (AGENT_URLS.length === 0) {
  throw new Error('AGENT_URLS is not set');
}

const RequestBodySchema = z.object({
  prompt: z.string(),
  max_iterations: z.number().optional().default(5),
  previous_context: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .optional()
    .default([]),
});

type RequestBody = z.infer<typeof RequestBodySchema>;

const expressApp = express();
expressApp.use(cors());
expressApp.use(express.json());

// Setup SSE endpoint
setupSSEEndpoint({ logger, app: expressApp });

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

  const id = randomUUID();

  logger.log(chalk.cyan('--------------------------------'));
  logger.log(chalk.cyan('User question:'), body.prompt);
  logger.log(chalk.cyan('Using max iterations:'), body.max_iterations);
  logger.log(chalk.cyan('Context ID:'), contextId);
  logger.log(chalk.cyan('Session ID:'), id);
  logger.log(chalk.cyan('--------------------------------'));

  res.json({
    id,
    status: 'processing',
    message: 'Question received and processing started',
  });

  try {
    const aiProvider = getAIProvider(logger);

    await processQuestion({
      logger,
      aiProvider,
      agentUrls: AGENT_URLS,
      prompt: body.prompt,
      previousContext: body.previous_context,
      maxIterations: body.max_iterations,
      contextId,
      sessionId: id,
    });

    logger.log(chalk.green('Processing completed successfully'));
  } catch (error) {
    logger.error('Error processing question:', error);

    // Send error SSE update
    sendSSEUpdate(logger, id, {
      type: 'error',
      data:
        error instanceof Error
          ? error.message
          : 'An error occurred while processing your question.',
    });
  } finally {
    // Ensure we always clean up the connection
    cleanupConnection(logger, id);
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
