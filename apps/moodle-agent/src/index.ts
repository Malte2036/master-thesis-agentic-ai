import {
  createA2AFramework,
  Logger,
  OllamaProvider,
  ReActRouter,
  Router,
} from '@master-thesis-agentic-ai/agent-framework';
import dotenv from 'dotenv';
dotenv.config();

const logger = new Logger({ agentName: 'moodle-agent' });

const OLLAMA_BASE_URL = 'http://10.50.60.153:11434';
const MODEL = 'qwen3:4b';

const getAIProvider = (model: string) => {
  return new OllamaProvider(logger, {
    baseUrl: OLLAMA_BASE_URL,
    model,
  });
};

const getRouter = (model: string): Router => {
  const aiProvider = getAIProvider(model);
  const structuredAiProvider = aiProvider;
  return new ReActRouter(
    aiProvider,
    structuredAiProvider,
    logger,
    'moodle-mcp',
  );
};

const agentFramework = createA2AFramework(
  logger,
  1234,
  {
    name: 'moodle-agent',
    description:
      'The Moodle Agent is a tool that can be used to manage Moodle courses. Moodle is a learning management system (LMS) that is used to create and manage online courses for universities.',
    version: '1.0.0',
    skills: [
      {
        id: 'get-all-courses',
        name: 'Get All Courses',
        description:
          'Get all courses from the user. This includes the course name, course id, and course description.',
        tags: ['moodle', 'courses'],
      },
      {
        id: 'get-user-info',
        name: 'Get User Info',
        description: 'Get information about the user in the context of moodle.',
        tags: ['moodle', 'user'],
      },
    ],
  },
  getRouter(MODEL),
  getAIProvider(MODEL),
);

agentFramework.listen().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
