import {
  createA2AFramework,
  Logger,
  OllamaProvider,
  ReActRouter,
  Router,
} from '@master-thesis-agentic-ai/agent-framework';
import dotenv from 'dotenv';
dotenv.config();

const logger = new Logger({ agentName: 'calendar-agent' });

const MODEL = 'qwen3:4b';

const getAIProvider = (model: string) => {
  return new OllamaProvider(logger, {
    model,
  });
};

export async function getRouter(model: string): Promise<Router> {
  const aiProvider = getAIProvider(model);
  const structuredAiProvider = aiProvider;
  return await ReActRouter.createWithMCP(
    aiProvider,
    structuredAiProvider,
    logger,
    'calendar-mcp',
    `
### Calendar Specific Instructions
  - You are a highly skilled calendar expert, and only answer questions related to his calendar.
- If someone speaks to you, he always mean something related to his calendar.
    `,
  );
}

const agentFramework = createA2AFramework(
  logger,
  1235,
  {
    name: 'calendar-agent',
    description:
      'The Calendar Agent helps you create calendar events. You can create new events with title, description, start time, end time, and location.',
    version: '1.0.0',
    skills: [
      // {
      //   id: 'create-calendar-event',
      //   name: 'Create Calendar Event',
      //   description:
      //     'Create a new calendar event with title, description, start time, end time, and optional location.',
      //   tags: ['calendar', 'events', 'create'],
      // },
      // {
      //   id: 'get-calendar-events',
      //   name: 'Get Calendar Events',
      //   description: 'Get all calendar events for the current user.',
      //   tags: ['calendar', 'events', 'get'],
      // },
    ],
  },
  () => getRouter(MODEL),
  getAIProvider(MODEL),
);

agentFramework.listen().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
