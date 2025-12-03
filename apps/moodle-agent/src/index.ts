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
    'moodle-agent',
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
      'The Moodle Agent is a specialized AI assistant for Moodle Learning Management System (LMS) operations. It provides comprehensive access to course management, assignment tracking, and user information through a set of powerful MCP tools. The agent can retrieve all enrolled courses, search for specific courses by name, inspect detailed course contents, view assignments across all courses or for specific courses with optional date filtering, and access personal user information. It uses ReAct reasoning to intelligently route user requests to the appropriate Moodle API functions, making it an essential tool for students and educators navigating their Moodle environment.',
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
