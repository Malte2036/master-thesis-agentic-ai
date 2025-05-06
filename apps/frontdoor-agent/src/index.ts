import {
  createAgentFramework,
  IAgentRequestHandler,
  ResponseError,
  createResponseError,
} from '@master-thesis-agentic-rag/agent-framework';
import { routeQuestion } from './router';

const agentFramework = createAgentFramework('frontdoor-agent');

const askHandler: IAgentRequestHandler = async (payload, callback) => {
  try {
    const { prompt, moodle_token } = payload.body as {
      prompt: string;
      moodle_token: string;
    };
    console.log('Received question:', prompt);

    if (!prompt || !moodle_token) {
      callback(
        createResponseError(
          'Missing required fields: prompt and moodle_token',
          400,
        ),
      );
      return;
    }

    const result = await routeQuestion(prompt, moodle_token);
    callback(null, result);
  } catch (error) {
    console.error('Error processing question:', error);
    if (error instanceof Error) {
      const responseError = error as ResponseError;
      if (!responseError.statusCode) {
        responseError.statusCode = 500;
      }
      callback(error);
    } else {
      callback(
        createResponseError(
          'An error occurred while processing your question.',
          500,
        ),
      );
    }
  }
};

agentFramework.registerEndpoint('ask', askHandler);

// Start the server and keep it running
agentFramework.listen().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
