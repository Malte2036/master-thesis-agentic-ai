import {
  createA2AFramework,
  Logger,
} from '@master-thesis-agentic-ai/agent-framework';
import dotenv from 'dotenv';
dotenv.config();

const logger = new Logger({ agentName: 'moodle-agent' });

const agentFramework = createA2AFramework(logger, 1234, {
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
});

agentFramework.listen().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
