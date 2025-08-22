import {
  AgentCard,
  AgentSkill,
  AgentClient,
  Logger,
  OllamaProvider,
  generateFriendlyResponse,
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
        return {
          response: 'The Calendar agent is not implemented yet.',
        };
      },
    } as unknown as AgentClient;

    const availableAgents = [moodleAgent, mockCalendarAgent];
    const availableAgentsCards = await Promise.all(
      availableAgents.map((agent) => agent.getAgentCard()),
    );

    const DecideAgentSchema = z.object({
      agent: z.string(),
      reasoning: z.string(),
      prompt: z.string(),
    });

    const minimalAgentsCards = availableAgentsCards.map((agent: AgentCard) => ({
      name: agent.name,
      description: agent.capabilities,
      skills: agent.skills.map((skill: AgentSkill) => ({
        name: skill.name,
        description: skill.description,
        tags: skill.tags,
      })),
    }));
    logger.log(chalk.magenta('Available agents:'));
    logger.table(minimalAgentsCards);

    const decision = await aiProvider.generateJson(
      body.prompt,
      {
        messages: [
          {
            role: 'system',
            content: `
            
You are **RouterGPT**, the dispatcher in a multi-agent system.

──────────── INPUTS ────────────
• The next message you see from role "user" is the raw user_question.
• agents_json (see bottom): each object has
    – name             (string)
    – description      (string)
    – skills           (array of objects with name, description, and tags)

────────────  OUTPUT  ────────────
Return ONLY this JSON (no markdown, no extra keys):

{
  "agent":   "<best agent name | null>",
  "reasoning":  "Your thinking process"
  "prompt":  "The prompt to call the agent with to get one step closer to the answer",
}

────────────  RULES  ────────────
1. You do not need to keep the user's language intact. Write in your own language. Be precise. Be neutral.
2. Drop irrelevant clauses (e.g. weather if no agent handles weather).
3. If nothing matches, set "agent" : "null".
4. Do **not** add any text outside the JSON object.


───────── FEW-SHOT EXAMPLES ────────
### A
User: “Ich will mich für einen Job als Softwareentwickler bewerben und es regnet.
       Was sind meine Abgaben diese Woche?”
Agents (excerpt):
[
  {"name":"moodle-agent","capability_tags":["assignments", "user-info"]},
  {"name":"weather-agent","capability_tags":["weather"]}
]
Expected JSON:
{
  "agent": "moodle-agent",
  "prompt": "Was sind meine Assignments diese Woche?",
  "reason": "Frage bezieht sich auf Assignments; Wetter ist irrelevant."
}

### B
User: “Brauche ich heute einen Regenschirm?”
Same agents list.
Expected JSON:
{
  "agent": "weather-agent",
  "prompt": "Brauche ich heute einen Regenschirm?",
  "reason": "Frage bezieht sich aufs Wetter."
}

### C

User: “Can you remind me what email I use here and tell me what deadlines are due this week?”
Same agents list.
Expected JSON:
{
  "agent": "moodle-agent",
  "prompt": "What’s my email address and what are my assignments this week?",
  "reason": "Question is about the email, which might be included in user info and assignments."
}

            `,
          },
          {
            role: 'system',
            content: `
            The available agents are:
            ${JSON.stringify(minimalAgentsCards, null, 2)}
            `,
          },
        ],
      },
      DecideAgentSchema,
    );

    const parsedDecision = DecideAgentSchema.parse(decision);

    logger.log(chalk.magenta('Reasoning:'), parsedDecision.reasoning);

    logger.log(chalk.magenta('Agent to call:'), parsedDecision.agent);
    logger.log(
      chalk.magenta('Prompt to call the agent with:'),
      parsedDecision.prompt,
    );

    let agentClient = undefined;
    switch (parsedDecision.agent) {
      case 'moodle-agent':
        agentClient = moodleAgent;
        break;
      case 'calendar-agent':
        agentClient = mockCalendarAgent;
    }

    let agentResponse = '';

    if (agentClient) {
      agentResponse = await agentClient.call(parsedDecision.prompt);
    } else {
      logger.log('No agent were called');
    }

    logger.log('Result from agent:', agentResponse);

    const friendlyResponse = await generateFriendlyResponse({
      userPrompt: body.prompt,
      agentResponse: agentResponse,
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
