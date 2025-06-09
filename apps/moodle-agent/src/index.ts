import {
  createAgentFramework,
  Logger,
} from '@master-thesis-agentic-rag/agent-framework';
import { createResponseError } from '@master-thesis-agentic-rag/types';
import dotenv from 'dotenv';
import { MoodleProvider } from './providers/moodleProvider';
import { z } from 'zod/v3';

dotenv.config();

const logger = new Logger({ agentName: 'moodle-agent' });

const moodleBaseUrl = process.env.MOODLE_BASE_URL;

if (!moodleBaseUrl) {
  throw new Error('MOODLE_BASE_URL is not set');
}

const moodleProvider = new MoodleProvider(logger, moodleBaseUrl);

const agentFramework = createAgentFramework(logger, 'moodle-agent');
const mcpServer = agentFramework.getServer();

const moodleToken = process.env.MOODLE_TOKEN;
if (!moodleToken) {
  throw new Error('MOODLE_TOKEN is not set');
}

mcpServer.tool(
  'get_all_courses',
  'Get all courses that the user is enrolled in. Prefer "search_courses_by_name" if you need to get courses by name.',
  {},
  async () => {
    const userInfo = await moodleProvider.getUserInfo(moodleToken);
    if (!userInfo) {
      throw createResponseError('User info not found', 400);
    }

    const courses = await moodleProvider.getEnrolledCourses(
      moodleToken,
      userInfo.userid,
    );
    return { content: [{ type: 'text', text: JSON.stringify(courses) }] };
  },
);

mcpServer.tool(
  'search_courses_by_name',
  'Find courses by a search query for the course name. If there are multiple courses, return all of them. Important: Prefer this over "get_all_courses" if you need to get courses by name.',
  {
    course_name: z.string().describe('Name of the course to search for'),
  },
  async ({ course_name }) => {
    logger.log(
      `search_courses_by_name: ${JSON.stringify({ course_name }, null, 2)}`,
    );

    if (!course_name) {
      throw createResponseError('Course name is required', 400);
    }

    const [searchResponse, enrolledCourses] = await Promise.all([
      moodleProvider.findCoursesByName(moodleToken, course_name),
      (async () => {
        const userInfo = await moodleProvider.getUserInfo(moodleToken);
        if (!userInfo) {
          throw createResponseError('User info not found', 400);
        }

        return await moodleProvider.getEnrolledCourses(
          moodleToken,
          userInfo.userid,
        );
      })(),
    ]);

    const searchedEnrolledCourses = enrolledCourses.filter((course) =>
      searchResponse.courses.some((c) => c.id === course.id),
    );

    if (searchedEnrolledCourses.length === 0) {
      throw createResponseError('Course not found', 404);
    }

    const merged = searchedEnrolledCourses.map((course) => ({
      ...course,
      ...searchResponse.courses.find((c) => c.id === course.id),
    }));

    logger.log(`merged: ${JSON.stringify(merged, null, 2)}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(merged),
        },
      ],
    };
  },
);

mcpServer.tool(
  'get_course_contents',
  'Get contents of a specific course. The course is identified by the course_id parameter. Maybe you need to call find_course_id_by_name first to get the course_id.',
  {
    course_id: z.number().describe('ID of the course to get contents for'),
  },
  async ({ course_id }) => {
    if (!course_id) {
      throw createResponseError('Course ID is required', 400);
    }

    const courseContents = await moodleProvider.getCourseContents(
      moodleToken,
      course_id,
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(courseContents) }],
    };
  },
);

mcpServer.tool(
  'get_all_assignments_for_all_courses',
  'Get all assignments the user has access to. Prefer "assignments_for_course" if you need to get assignments for a specific course.',
  {},
  async () => {
    const assignments = await moodleProvider.getAssignments(moodleToken);
    return { content: [{ type: 'text', text: JSON.stringify(assignments) }] };
  },
);

mcpServer.tool(
  'get_assignments_for_course',
  'Get all assignments for a specific course. Prefer this over "assignments" if you need to get assignments for a specific course.',
  {
    course_id: z.number().describe('ID of the course to get assignments for'),
  },
  async ({ course_id }) => {
    logger.log(
      `get_assignments_for_course: ${JSON.stringify({ course_id }, null, 2)}`,
    );

    if (!course_id) {
      throw createResponseError('Course ID is required', 400);
    }

    const assignments = await moodleProvider.getAssignmentsForCourse(
      moodleToken,
      course_id,
    );
    return { content: [{ type: 'text', text: JSON.stringify(assignments) }] };
  },
);

mcpServer.tool(
  'get_user_info',
  'Get personal information about the user who asked the question. This function cannot get information about other users.',
  {},
  async () => {
    const userInfo = await moodleProvider.getUserInfo(moodleToken);
    if (!userInfo) {
      throw createResponseError('User info not found', 400);
    }
    return { content: [{ type: 'text', text: JSON.stringify(userInfo) }] };
  },
);

// Start the server and keep it running
agentFramework.listen().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
