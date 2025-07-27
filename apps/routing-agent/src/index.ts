import {
  AgentClient,
  Logger,
  OllamaProvider,
  generateFriendlyResponse,
  getAgentTools,
} from '@master-thesis-agentic-ai/agent-framework';
import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import { uuidv4, z } from 'zod/v4';

const logger = new Logger({ agentName: 'routing-agent' });

const OllamaBaseUrl = 'http://10.50.60.153:11434';

// Store active SSE connections
const activeConnections = new Map<string, express.Response>();

const getAIProvider = (model: string) => {
  return new OllamaProvider(logger, {
    baseUrl: OllamaBaseUrl,
    model,
  });
};

const RequestBodySchema = z.object({
  prompt: z.string(),
  router: z.enum(['legacy', 'react']).optional().default('react'),
  max_iterations: z.number().optional().default(5),
  model: z.string().optional().default('mixtral:8x7b'),
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

  // Send initial connection message
  res.write('data: {"type":"connected","data":"Connected to SSE stream"}\n\n');

  // Store the connection
  activeConnections.set(sessionId, res);

  // Remove connection when client disconnects
  req.on('close', () => {
    logger.log('Client disconnected');
    activeConnections.delete(sessionId);
  });

  // Handle errors
  req.on('error', (error) => {
    logger.error('SSE connection error:', error);
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
    } catch (error) {
      logger.error('Error sending SSE update:', error);
      activeConnections.delete(sessionId);
    }
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

  logger.log(chalk.cyan('--------------------------------'));
  logger.log(chalk.cyan('User question:'), body.prompt);
  logger.log(chalk.cyan('Using model:'), body.model);
  logger.log(chalk.cyan('Using router:'), body.router);
  logger.log(chalk.cyan('Using max iterations:'), body.max_iterations);
  logger.log(chalk.cyan('--------------------------------'));

  const id = uuidv4().toString();
  res.json({
    id,
    status: 'processing',
    message: 'Question received and processing started',
  });

  try {
    const aiProvider = getAIProvider(body.model);

    logger.log(chalk.magenta('Finding out which agent to call first:'));
    const moodleAgent = new AgentClient(logger, 1234);
    const moodleAgentCard = await moodleAgent.getAgentCard();

    const DecideAgentSchema = z.object({
      agent: z.string(),
      prompt: z.string(),
    });

    const decision = await aiProvider.generateJson(
      `You are a routing agent for an multi agent ai system.
      You are given a user's question and a list of agents with their capabilities.
      Your task is to decide, which agent should be called first to answer the user's question.
      You need to return the agent name and generate a specific prompt to call the agent with.
      It should be a question that is specific to the user's question and the agent's capabilities.
      It should include all information you have at the moment, which might be relevant to the user's question.
      The user's question is: ${body.prompt}
      The available agents are:
      ${JSON.stringify(moodleAgentCard, null, 2)}
      `,
      undefined,
      DecideAgentSchema,
    );

    const { agent, prompt } = DecideAgentSchema.parse(decision);

    logger.log(chalk.magenta('Agent to call:'), agent);
    logger.log(chalk.magenta('Prompt to call the agent with:'), prompt);

    logger.log(chalk.magenta('Sending question to moodle agent:'));

    const moodleAgentResponse = await moodleAgent.call(prompt);
    logger.log('Result from moodle agent:', moodleAgentResponse);

    const friendlyResponse = await generateFriendlyResponse({
      userPrompt: body.prompt,
      agentResponse: moodleAgentResponse,
      aiProvider,
    });

    logger.log(chalk.green('Friendly response:'), friendlyResponse);

    // Send final SSE update
    sendSSEUpdate(id, {
      type: 'final_response',
      data: {
        friendlyResponse,
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
  }
});

expressApp.get('/models', async (req, res) => {
  try {
    const aiProvider = getAIProvider('qwen3:4b');
    const models = await aiProvider.getModels();
    res.json(models);
  } catch (error) {
    logger.error('Error getting models:', error);
    res.status(500).json({ error: 'An error occurred while getting models.' });
  }
});

expressApp.get('/test', async (req, res) => {
  const moodleAgent = new AgentClient(logger, 1234);
  const result = await moodleAgent.call('What is my moodle email address?');
  logger.log('Result from moodle agent:', result);
  res.send(result);
});

// Start the server and keep it running
expressApp.listen(3000, () => {
  logger.log(`Server is running on port 3000`);
});
