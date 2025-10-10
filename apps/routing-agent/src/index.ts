import {
  AgentCard,
  AgentSkill,
  AgentClient,
  Logger,
  OllamaProvider,
  generateFriendlyResponse,
  ReActRouter,
  AgentTool,
} from '@master-thesis-agentic-ai/agent-framework';
import { RouterResponse } from '@master-thesis-agentic-ai/types';
import chalk from 'chalk';
import cors from 'cors';
import express from 'express';
import { uuidv4, z } from 'zod/v4';
import { handleToolCalls } from './handle-tool-calls';

const logger = new Logger({ agentName: 'routing-agent' });

const OLLAMA_BASE_URL = process.env['OLLAMA_BASE_URL'];
logger.log(`OLLAMA_BASE_URL: ${OLLAMA_BASE_URL}`);

// Store active SSE connections
const activeConnections = new Map<string, express.Response>();

const getAIProvider = (model: string) => {
  return new OllamaProvider(logger, {
    baseUrl: OLLAMA_BASE_URL,
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

    const mockCalendarAgent = {
      getAgentCard: async () => ({
        name: 'calendar-agent',
        skills: [
          {
            id: '1',
            name: 'calendar',
            description: 'Calendar agent',
            tags: ['calendar'],
          },
        ],
      }),
      call: async (prompt: string) => {
        if (prompt.includes('create')) {
          return {
            response: 'We successfully created the calendar event.',
          };
        }
        return {
          response: 'The Calendar agent is not implemented yet.',
        };
      },
    } as unknown as AgentClient;

    const agents: { [key: string]: AgentClient } = {
      'moodle-agent': moodleAgent,
      'calendar-agent': mockCalendarAgent,
    };

    const availableAgents = Object.values(agents);
    const availableAgentsCards = await Promise.all(
      availableAgents.map((agent) => agent.getAgentCard()),
    );

    const minimalAgentsCards = availableAgentsCards.map((agent: AgentCard) => ({
      name: agent.name,
      description: agent.capabilities,
      // skills: agent.skills.map((skill: AgentSkill) => ({
      //   name: skill.name,
      //   description: skill.description,
      //   tags: skill.tags,
      // })),
      skills: agent.skills
        .map((skill: AgentSkill) => skill.description)
        .join('\n'),
    }));
    logger.log(chalk.magenta('Available agents:'));
    logger.table(minimalAgentsCards);

    const agentTools = availableAgentsCards.map((agent: AgentCard) => ({
      name: agent.name,
      description: `Description of the agent: ${agent.description}
      Skills of the agent: ${agent.skills
        .map(
          (skill: AgentSkill) => `
        Skill Name: ${skill.name}
        Skill Description: ${skill.description}
        Skill Tags: ${skill.tags.join(', ')}
      `,
        )
        .join('\n')}
      `,
      args: {
        include_in_response: {
          type: 'object',
          properties: {},
          required: true,
        },
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
    })) satisfies AgentTool[];

    const agentRouter = new ReActRouter(
      aiProvider,
      aiProvider,
      logger,
      agentTools,
      `You are **RouterGPT**, the dispatcher in a multi-agent system.`,
      ``,
      (logger, functionCalls) => handleToolCalls(logger, functionCalls, agents),
      async () => {
        logger.log('Disconnecting from Client');
      },
    );

    const generator = agentRouter.routeQuestion(
      body.prompt,
      body.max_iterations,
    );
    let results: RouterResponse;
    while (true) {
      const { done, value } = await generator.next();
      if (done) {
        results = value;
        break;
      }

      logger.log('Step:', value);
    }

    const finalResponse = await generateFriendlyResponse({
      userPrompt: body.prompt,
      agentResponse: JSON.stringify(results, null, 2),
      aiProvider: aiProvider,
    });

    logger.log(chalk.green('Final friendly response:'), finalResponse);

    // Send final SSE update
    sendSSEUpdate(id, {
      type: 'final_response',
      data: {
        finalResponse,
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

expressApp.get('/health', async (req, res) => {
  res.send('OK');
});

// Start the server and keep it running
expressApp.listen(3000, () => {
  logger.log(`Server is running on port 3000`);
});
