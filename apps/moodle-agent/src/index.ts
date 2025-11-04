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
import { moodlePrompt } from './prompt';
dotenv.config();

const HOSTNAME = process.env.HOSTNAME || 'localhost';

const logger = new Logger({ agentName: 'moodle-agent' });

export async function getRouter(): Promise<Router> {
  const aiProvider = getAIProvider(logger);

  const aiOptions: RouterAIOptions = {
    aiProvider,
    structuredAiProvider: aiProvider,
  };

  const systemPromptOptions: RouterSystemPromptOptions = {
    extendedNaturalLanguageThoughtSystemPrompt: moodlePrompt,
  };

  return await MCPReActRouterRouter.create(
    logger,
    aiOptions,
    systemPromptOptions,
    'moodle-mcp',
  );
}

const agentFramework = createA2AFramework(
  logger,
  HOSTNAME,
  1234,
  {
    name: 'moodle-agent',
    description:
      'The Moodle Agent is a specialized AI assistant for Moodle Learning Management System (LMS) operations. It can help you view your enrolled courses, search for courses, see course details, check assignments across all courses or filter by specific courses and dates, and access your personal user information. It is an essential tool for students and educators navigating their Moodle environment.',
    version: '1.1.0',
    skills: [],
  },
  () => getRouter(),
  getAIProvider(logger),
);

agentFramework.listen().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
