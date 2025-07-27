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

const OllamaBaseUrl = 'http://10.50.60.153:11434';

const getAIProvider = (model: string) => {
  return new OllamaProvider(logger, {
    baseUrl: OllamaBaseUrl,
    model,
  });
};

// const getStructuredAIProvider = (model: string) => {
//   return new OllamaProvider({
//     baseUrl: 'http://localhost:11434',
//     model: 'Osmosis/Osmosis-Structure-0.6B:latest',
//   });
// };

const getRouter = (model: string): Router => {
  const aiProvider = getAIProvider(model);
  const structuredAiProvider = aiProvider; //getStructuredAIProvider(model);
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
      'The Moodle Agent is a tool that can be used to manage Moodle courses.',
    version: '1.0.0',
    skills: [
      {
        id: 'get-all-courses',
        name: 'Get All Courses',
        description: 'Get all courses',
        tags: ['moodle'],
      },
      {
        id: 'get-user-info',
        name: 'Get User Info',
        description: 'Get information about the user',
        tags: ['moodle'],
      },
    ],
  },
  getRouter('qwen3:4b'),
);

agentFramework.listen().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
