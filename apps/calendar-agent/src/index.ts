import {
  createA2AFramework,
  Logger,
  OllamaProvider,
  ReActRouter,
  Router,
} from '@master-thesis-agentic-ai/agent-framework';
import dotenv from 'dotenv';
dotenv.config();

const HOSTNAME = process.env.HOSTNAME || 'localhost';

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
  HOSTNAME,
  1235,
  {
    name: 'calendar-agent',
    description:
      'The Calendar Agent is a specialized AI assistant for comprehensive calendar management and event scheduling. It provides full CRUD operations for calendar events through Google Calendar integration, including creating new events with detailed descriptions and ISO-formatted timestamps, updating existing events by event ID, retrieving all calendar events for complete schedule overview, and searching events using free-text queries for intelligent event discovery. The agent uses ReAct reasoning to intelligently route user requests to the appropriate Google Calendar API functions, making it an essential tool for personal and professional schedule management, meeting coordination, and time planning.',
    version: '1.0.0',
    skills: [],
  },
  () => getRouter(MODEL),
  getAIProvider(MODEL),
);

agentFramework.listen().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
