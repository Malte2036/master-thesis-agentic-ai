import {
  compareTimes,
  createMCPServerFramework,
  getContextIdFromMcpServerRequestHandlerExtra,
  getCurrentTimestamp,
  Logger,
} from '@master-thesis-agentic-ai/agent-framework';
import { createResponseError } from '@master-thesis-agentic-ai/types';
import dotenv from 'dotenv';
import { z } from 'zod';
import { MoodleProvider } from './providers/moodleProvider';
import {
  objectsToHumanReadableString,
  generateColumnsFromZod,
} from '@master-thesis-agentic-ai/agent-framework';
import { CourseSchema } from './schemas/moodle/course';
import { AssignmentSchema } from './schemas/moodle/assignment';
import { CourseContentSchema } from './schemas/moodle/course_content';
import { UserInfoSchema } from './schemas/moodle/user';
import { moodleAuthRoutes } from './auth/moodle';

dotenv.config();

const logger = new Logger({ agentName: 'moodle-mcp' });

export const MOODLE_BASE_URL =
  process.env.NODE_ENV === 'test'
    ? 'http://wiremock:8080'
    : process.env.MOODLE_BASE_URL;

if (!MOODLE_BASE_URL) {
  throw new Error('MOODLE_BASE_URL is not set');
}
logger.debug('MOODLE_BASE_URL:', MOODLE_BASE_URL);

const MOODLE_USERNAME = process.env.MOODLE_USERNAME;
const MOODLE_PASSWORD = process.env.MOODLE_PASSWORD;

if (!MOODLE_USERNAME || !MOODLE_PASSWORD) {
  throw new Error('MOODLE_USERNAME or MOODLE_PASSWORD is not set');
}

const mcpServerFramework = createMCPServerFramework(
  logger,
  'moodle-mcp',
  moodleAuthRoutes(logger, MOODLE_BASE_URL),
);
const mcpServer = mcpServerFramework.getServer();

mcpServer.tool(
  'get_all_courses',
  'Get all courses that the user is enrolled in. Prefer "search_courses_by_name" if you need to get courses by name.',
  {},
  async (_, extra) => {
    const contextId = getContextIdFromMcpServerRequestHandlerExtra(extra);
    const moodleProvider = new MoodleProvider(
      logger,
      MOODLE_BASE_URL,
      contextId,
    );

    const moodleToken = await moodleProvider.getToken(
      MOODLE_USERNAME,
      MOODLE_PASSWORD,
    );
    const userInfo = await moodleProvider.getUserInfo(moodleToken);
    if (!userInfo) {
      throw createResponseError('User info not found', 400);
    }

    const courses = await moodleProvider.getEnrolledCourses(
      moodleToken,
      userInfo.userid,
    );

    logger.debug(`Found ${courses.length} courses`);

    const humanReadableResponse = `We found ${
      courses.length
    } courses.\n\n${objectsToHumanReadableString(courses, {
      columns: generateColumnsFromZod(CourseSchema, {
        exclude: ['assignments', 'courseimage', 'displayname'],
        maxLengths: {
          fullname: 60,
          summary: 100,
        },
      }),
      serializeOptions: {
        observation: {
          source: 'moodle_api',
          endpoint: 'get_all_courses',
          total_courses: courses.length,
          generated_at: getCurrentTimestamp().toISOString(),
        },
      },
    })}`;

    logger.log(`get_all_courses: \n${humanReadableResponse}`);

    return {
      content: [{ type: 'text', text: humanReadableResponse }],
    };
  },
);

mcpServer.tool(
  'search_courses_by_name',
  'Find courses by a search query for the course name. If there are multiple courses, return all of them. Important: Prefer this over "get_all_courses" if you need to get courses by name.',
  {
    course_name: z.string().describe('Name of the course to search for'),
  },
  async ({ course_name }, extra) => {
    const contextId = getContextIdFromMcpServerRequestHandlerExtra(extra);
    const moodleProvider = new MoodleProvider(
      logger,
      MOODLE_BASE_URL,
      contextId,
    );

    logger.log(
      `search_courses_by_name: ${JSON.stringify({ course_name }, null, 2)}`,
    );

    const moodleToken = await moodleProvider.getToken(
      MOODLE_USERNAME,
      MOODLE_PASSWORD,
    );

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

    const humanReadableResponse = `We found ${
      merged.length
    } courses matching the search query "${course_name}":\n\n${objectsToHumanReadableString(
      merged,
      {
        columns: generateColumnsFromZod(CourseSchema, {
          exclude: ['assignments', 'courseimage', 'displayname'],
          maxLengths: {
            fullname: 60,
            summary: 100,
          },
        }),
        serializeOptions: {
          observation: {
            source: 'moodle_api',
            endpoint: 'search_courses_by_name',
            search_query: course_name,
            total_courses: merged.length,
            generated_at: getCurrentTimestamp().toISOString(),
          },
        },
      },
    )}`;

    logger.log(`search_courses_by_name: \n${humanReadableResponse}`);

    return {
      content: [
        {
          type: 'text',
          text: humanReadableResponse,
        },
      ],
    };
  },
);

mcpServer.tool(
  'get_course_contents',
  'Get contents (modules + web service file urls) of a specific course. The course is identified by the course_id parameter.',
  {
    course_id: z.number().describe('ID of the course to get contents for'),
  },
  async ({ course_id }, extra) => {
    const contextId = getContextIdFromMcpServerRequestHandlerExtra(extra);
    const moodleProvider = new MoodleProvider(
      logger,
      MOODLE_BASE_URL,
      contextId,
    );

    const moodleToken = await moodleProvider.getToken(
      MOODLE_USERNAME,
      MOODLE_PASSWORD,
    );

    const courseContents = await moodleProvider.getCourseContents(
      moodleToken,
      course_id,
    );

    const humanReadableResponse = `We found ${
      courseContents.length
    } course contents for course ${course_id}.\n\n${objectsToHumanReadableString(
      courseContents,
      {
        columns: generateColumnsFromZod(CourseContentSchema, {
          maxLengths: {
            name: 80,
            summary: 150,
          },
        }),
        serializeOptions: {
          observation: {
            source: 'moodle_api',
            endpoint: 'get_course_contents',
            course_id: course_id,
            total_contents: courseContents.length,
            generated_at: getCurrentTimestamp().toISOString(),
          },
        },
      },
    )}`;

    logger.log(`get_course_contents: \n${humanReadableResponse}`);

    return {
      content: [{ type: 'text', text: humanReadableResponse }],
    };
  },
);

mcpServer.tool(
  'get_assignments_for_all_courses',
  'Get all assignments for the user in all courses. Prefer "get_assignments_for_course" if you need to get assignments for a specific course.',
  {
    due_after: z
      .string()
      .transform((value) => (value === 'null' ? null : value))
      .or(z.number())
      .nullish()
      .describe(
        'Get assignments due after this date. It can be a date string or a timestamp. For date strings include the timezone in the format "YYYY-MM-DD HH:MM:SS TZ" (e.g. "2025-01-01 00:00:00 UTC")',
      ),
    due_before: z
      .string()
      .transform((value) => (value === 'null' ? null : value))
      .or(z.number())
      .nullish()
      .describe(
        'Get assignments due before this date. It can be a date string or a timestamp. For date strings include the timezone in the format "YYYY-MM-DD HH:MM:SS TZ" (e.g. "2025-01-01 00:00:00 UTC")',
      ),
  },
  async ({ due_after, due_before }, extra) => {
    const contextId = getContextIdFromMcpServerRequestHandlerExtra(extra);
    const moodleProvider = new MoodleProvider(
      logger,
      MOODLE_BASE_URL,
      contextId,
    );
    const moodleToken = await moodleProvider.getToken(
      MOODLE_USERNAME,
      MOODLE_PASSWORD,
    );

    const assignmentsResponse =
      await moodleProvider.getAssignments(moodleToken);
    let allAssignments = assignmentsResponse.courses.flatMap(
      (course) => course.assignments ?? [],
    );

    if (due_after) {
      allAssignments = allAssignments.filter((assignment) =>
        compareTimes(assignment.duedate, due_after),
      );
    }

    if (due_before) {
      allAssignments = allAssignments.filter((assignment) =>
        compareTimes(due_before, assignment.duedate),
      );
    }

    logger.log(
      `get_assignments_for_all_courses: All assignments: ${JSON.stringify(
        allAssignments,
        null,
        2,
      )}`,
    );

    const humanReadableResponse = `We found ${
      allAssignments.length
    } assignments for all courses.\n\n${objectsToHumanReadableString(
      allAssignments,
      {
        columns: generateColumnsFromZod(AssignmentSchema, {
          exclude: [
            'maxgrade',
            'nosubmissions',
            'submissiondrafts',
            'timemodified',
            'cutoffdate',
            'gradingduedate',
            'teamsubmission',
            'requireallteammemberssubmit',
            'teamsubmissiongroupingid',
            'maxattempts',
            'timelimit',
          ],
          maxLengths: {
            name: 80,
          },
        }),
        serializeOptions: {
          observation: {
            source: 'moodle_api',
            endpoint: 'get_assignments_for_all_courses',
            total_assignments: allAssignments.length,
            ...(due_after && { due_after: String(due_after) }),
            ...(due_before && { due_before: String(due_before) }),
            generated_at: getCurrentTimestamp().toISOString(),
          },
        },
      },
    )}`;

    logger.log(`get_assignments_for_all_courses: \n${humanReadableResponse}`);

    return {
      content: [{ type: 'text', text: humanReadableResponse }],
    };
  },
);

mcpServer.tool(
  'get_assignments_for_course',
  'Get all assignments for a specific course. Prefer this over "get_assignments_for_all_courses" if you need to get assignments for a specific course.',
  {
    course_id: z.number().describe('ID of the course to get assignments for'),
  },
  async ({ course_id }, extra) => {
    const contextId = getContextIdFromMcpServerRequestHandlerExtra(extra);
    const moodleProvider = new MoodleProvider(
      logger,
      MOODLE_BASE_URL,
      contextId,
    );
    logger.log(
      `get_assignments_for_course: ${JSON.stringify({ course_id }, null, 2)}`,
    );

    const moodleToken = await moodleProvider.getToken(
      MOODLE_USERNAME,
      MOODLE_PASSWORD,
    );

    const course = await moodleProvider.getAssignmentsForCourse(
      moodleToken,
      course_id,
    );

    if (!course || !course.assignments) {
      logger.log(
        `get_assignments_for_course: No assignments found for course ${course_id}`,
      );
      return {
        content: [
          {
            type: 'text',
            text: `We found no assignments for course ${course_id}.`,
          },
        ],
      };
    }

    const humanReadableResponse = `We found ${
      course.assignments.length
    } assignments for course ${course_id}.\n\n${objectsToHumanReadableString(
      course.assignments,
      {
        columns: generateColumnsFromZod(AssignmentSchema, {
          exclude: [
            'course',
            'maxgrade',
            'nosubmissions',
            'submissiondrafts',
            'timemodified',
            'cutoffdate',
            'gradingduedate',
            'teamsubmission',
            'requireallteammemberssubmit',
            'teamsubmissiongroupingid',
            'maxattempts',
            'timelimit',
          ],
          maxLengths: {
            name: 80,
          },
        }),
        serializeOptions: {
          observation: {
            source: 'moodle_api',
            endpoint: 'get_assignments_for_course',
            course_id: course_id,
            total_assignments: course.assignments.length,
            generated_at: getCurrentTimestamp().toISOString(),
          },
        },
      },
    )}`;

    logger.log(`get_assignments_for_course: \n${humanReadableResponse}`);

    return {
      content: [{ type: 'text', text: humanReadableResponse }],
    };
  },
);

mcpServer.tool(
  'get_user_info',
  'Get personal information about the user who asked the question. This function cannot get information about other users.',
  {},

  async (_, extra) => {
    const contextId = getContextIdFromMcpServerRequestHandlerExtra(extra);

    const moodleProvider = new MoodleProvider(
      logger,
      MOODLE_BASE_URL,
      contextId,
    );
    const moodleToken = await moodleProvider.getToken(
      MOODLE_USERNAME,
      MOODLE_PASSWORD,
    );

    const userInfo = await moodleProvider.getUserInfo(moodleToken);
    if (!userInfo) {
      throw createResponseError('User info not found', 400);
    }
    const humanReadableResponse = `We successfully retrieved the user info.\n\n${objectsToHumanReadableString(
      [userInfo],
      {
        columns: generateColumnsFromZod(UserInfoSchema, {
          exclude: ['siteurl', 'userpictureurl', 'userlang'],
          maxLengths: {
            username: 30,
            firstname: 30,
            lastname: 30,
            fullname: 60,
            email: 50,
          },
        }),
        serializeOptions: {
          observation: {
            source: 'moodle_api',
            endpoint: 'get_user_info',
            generated_at: getCurrentTimestamp().toISOString(),
          },
        },
      },
    )}`;

    logger.log(`get_user_info: \n${humanReadableResponse}`);

    return {
      content: [{ type: 'text', text: humanReadableResponse }],
    };
  },
);

// Start the server and keep it running
mcpServerFramework.listen().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
