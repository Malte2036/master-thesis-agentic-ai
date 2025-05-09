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

const parseRequest = (body: unknown): RequestData => {
  const parsed = RequestDataSchema.safeParse(body);
  if (!parsed.success) {
    console.error('Invalid request data:', parsed.error.flatten());
    throw createResponseError('Invalid request data', 400);
  }
  return parsed.data;
};

const coursesHandler: IAgentRequestHandler = async (payload, callback) => {
  try {
    const requestData = parseRequest(payload.body);
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

const findCourseByName: IAgentRequestHandler = async (payload, callback) => {
  try {
    const requestData = parseRequest(payload.body);
    if (!requestData.course_name) {
      console.error('Course name is required');
      callback(createResponseError('Course name is required', 400));
      return;
    }

    const [searchResponse, enrolledCourses] = await Promise.all([
      moodleProvider.findCoursesByName(
        requestData.moodle_token,
        requestData.course_name,
      ),
      (async () => {
        const userInfo = await moodleProvider.getUserInfo(
          requestData.moodle_token,
        );
        if (!userInfo) {
          throw createResponseError('User info not found', 400);
        }

        return await moodleProvider.getEnrolledCourses(
          requestData.moodle_token,
          userInfo.userid,
        );
      })(),
    ]);

    const searchedEnrolledCourses = enrolledCourses.filter((course) =>
      searchResponse.courses.some((c) => c.id === course.id),
    );

    if (searchedEnrolledCourses.length === 0) {
      callback(createResponseError('Course not found', 404));
      return;
    }

    callback(null, searchedEnrolledCourses[0]);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error:', error);
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

const courseContentsHandler: IAgentRequestHandler = async (
  payload,
  callback,
) => {
  try {
    const requestData = parseRequest(payload.body);

    if (!requestData.course_id) {
      callback(createResponseError('Course ID is required', 400));
      return;
    }

    const courseContents = await moodleProvider.getCourseContents(
      requestData.moodle_token,
      requestData.course_id,
    );
    callback(null, courseContents);
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
    const requestData = parseRequest(payload.body);
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
    const requestData = parseRequest(payload.body);
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
agentFramework.registerEndpoint('find_course_by_name', findCourseByName);
agentFramework.registerEndpoint('assignments', assignmentsHandler);
agentFramework.registerEndpoint('course_contents', courseContentsHandler);
agentFramework.registerEndpoint('user', userHandler);

// Start the server and keep it running
agentFramework.listen().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
