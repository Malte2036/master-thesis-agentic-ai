import {
  AgentClient,
  Logger,
  OllamaProvider,
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
    logger.log(chalk.magenta('Sending question to moodle agent:'));
    const moodleAgent = new AgentClient(logger, 1234);
    const moodleAgentResponse = await moodleAgent.call(body.prompt);
    logger.log('Result from moodle agent:', moodleAgentResponse);

    const aiProvider = getAIProvider(body.model);
    const friendlyResponse = await aiProvider.generateText(body.prompt, {
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant.
    You are given a user question and a list of steps the agent system has taken to answer that question.
    Each step includes a thought, an action (e.g. agent function call), and the corresponding result.
    
    Your task is to now respond to the original user question in a friendly, natural tone—while accurately summarizing what was done and what the current outcome is.
    
    You must:
    - Detect the language of the user's original question and answer in the same language.
    - Do not include id's, or other internal information, which are not relevant to the user.
    - Directly answer the user's question based on the available results.
    - Summarize the steps taken by the agents in a concise and understandable way.
    - Include any relevant numbers, course names, assignment titles, deadlines, etc., where appropriate. Do not make up any information.
    - If something failed (e.g. an agent call or calendar entry), explain what happened and suggest what the user could do next.
    - If the goal was achieved, clearly state that and include key results.
    - Keep the answer short, helpful, and user-facing. Do not expose internal logs or tool names.

    Format:
    - Use markdown formatting for your response.
    - Use bullet points for lists.
    - Use bold for important information.
    - Use italic for emphasis.
    - Use code blocks for code.
    - Use links for external resources.
    - Use tables for structured data.
    
    The agent execution results:
    ${moodleAgentResponse}
    `,
        },
      ],
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
