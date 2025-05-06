import dotenv from 'dotenv';
import { MoodleProvider } from './providers/moodleProvider';
import { RequestData, RequestDataSchema } from './schemas/request/request';
import {
  createAgentFramework,
  IAgentRequestHandler,
  ResponseError,
  createResponseError,
} from '@master-thesis-agentic-rag/agent-framework';

dotenv.config();

const moodleBaseUrl = process.env.MOODLE_BASE_URL;

if (!moodleBaseUrl) {
  throw new Error('MOODLE_BASE_URL is not set');
}

const moodleProvider = new MoodleProvider(moodleBaseUrl);

const agentFramework = createAgentFramework('moodle-agent');

const parseRequest = (query: Record<string, string>): RequestData => {
  const parsed = RequestDataSchema.safeParse(query);
  if (!parsed.success) {
    console.error('Invalid request data:', parsed.error.flatten());
    throw createResponseError('Invalid request data', 400);
  }
  return parsed.data;
};

const coursesHandler: IAgentRequestHandler = async (payload, callback) => {
  try {
    const requestData = parseRequest(payload.query);
    const userInfo = await moodleProvider.getUserInfo(requestData.moodle_token);
    if (!userInfo) {
      callback(createResponseError('User info not found', 400));
      return;
    }

    const courses = await moodleProvider.getEnrolledCourses(
      requestData.moodle_token,
      userInfo.userid,
    );
    callback(null, courses);
  } catch (error) {
    if (error instanceof Error) {
      const responseError = error as ResponseError;
      if (!responseError.statusCode) {
        responseError.statusCode = 500;
      }
      callback(error);
    } else {
      callback(createResponseError('Unknown error occurred', 500));
    }
  }
};

const assignmentsHandler: IAgentRequestHandler = async (payload, callback) => {
  try {
    const requestData = parseRequest(payload.query);
    const assignments = await moodleProvider.getAssignments(
      requestData.moodle_token,
    );
    callback(null, assignments);
  } catch (error) {
    if (error instanceof Error) {
      const responseError = error as ResponseError;
      if (!responseError.statusCode) {
        responseError.statusCode = 500;
      }
      callback(error);
    } else {
      callback(createResponseError('Unknown error occurred', 500));
    }
  }
};

const userHandler: IAgentRequestHandler = async (payload, callback) => {
  try {
    const requestData = parseRequest(payload.query);
    const userInfo = await moodleProvider.getUserInfo(requestData.moodle_token);
    if (!userInfo) {
      callback(createResponseError('User info not found', 400));
      return;
    }
    callback(null, userInfo);
  } catch (error) {
    if (error instanceof Error) {
      const responseError = error as ResponseError;
      if (!responseError.statusCode) {
        responseError.statusCode = 500;
      }
      callback(error);
    } else {
      callback(createResponseError('Unknown error occurred', 500));
    }
  }
};

agentFramework.registerEndpoint('courses', coursesHandler);
agentFramework.registerEndpoint('assignments', assignmentsHandler);
agentFramework.registerEndpoint('user', userHandler);

// Start the server and keep it running
agentFramework.listen().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
