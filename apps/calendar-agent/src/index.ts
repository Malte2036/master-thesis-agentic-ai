import {
  createA2AFramework,
  getAIProvider,
  Logger,
  MCPReActRouterRouter,
  Router,
  RouterAIOptions,
  RouterSystemPromptOptions,
} from '@master-thesis-agentic-ai/agent-framework';
import dotenv from 'dotenv';
dotenv.config();

const HOSTNAME = process.env.HOSTNAME || 'localhost';

const logger = new Logger({ agentName: 'calendar-agent' });

export async function getRouter(): Promise<Router> {
  const aiProvider = getAIProvider(logger);

  const aiOptions: RouterAIOptions = {
    aiProvider,
    structuredAiProvider: aiProvider,
  };

  const systemPromptOptions: RouterSystemPromptOptions = {
    extendedNaturalLanguageThoughtSystemPrompt: `
    ### Calendar Specific Instructions
      - You are a highly skilled calendar expert, and only answer questions related to his calendar.
    - If someone speaks to you, he always mean something related to his calendar.
        `,
  };

  return await MCPReActRouterRouter.create(
    logger,
    aiOptions,
    systemPromptOptions,
    'calendar-mcp',
  );
}

const agentFramework = createA2AFramework(
  logger,
  HOSTNAME,
  1235,
  {
    name: 'calendar-agent',
    description:
      'The Calendar Agent is a specialized AI assistant for calendar management and event scheduling. It can create new events, update existing events, view your calendar schedule, and search for events. It is an essential tool for personal and professional schedule management, meeting coordination, and time planning.',
    version: '1.0.0',
    skills: [],
  },
  () => getRouter(),
  getAIProvider(logger),
);

agentFramework.listen().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
