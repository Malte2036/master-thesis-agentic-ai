import {
  compareTimes,
  createMCPServerFramework,
  Logger,
} from '@master-thesis-agentic-ai/agent-framework';
import { createResponseError } from '@master-thesis-agentic-ai/types';
import dotenv from 'dotenv';
import { z } from 'zod';
import { MoodleProvider } from './providers/moodleProvider';
import {
  filterAssignment,
  includeAssignmentInResponseSchema,
} from './schemas/moodle/assignment.utils';
import {
  filterCourse,
  includeCourseInResponseSchema,
} from './schemas/moodle/course.utils';
import {
  filterCourseContent,
  includeCourseContentInResponseSchema,
} from './schemas/moodle/course_content.utils';
import {
  filterUserInfo,
  includeUserInfoInResponseSchema,
} from './schemas/moodle/user.utils';
import { objectToHumanReadableString } from './utils/general.utils';

dotenv.config();

const logger = new Logger({ agentName: 'moodle-mcp' });

const moodleBaseUrl = process.env.MOODLE_BASE_URL;

if (!moodleBaseUrl) {
  throw new Error('MOODLE_BASE_URL is not set');
}

const moodleProvider = new MoodleProvider(logger, moodleBaseUrl);

const mcpServerFramework = createMCPServerFramework(logger, 'moodle-mcp');
const mcpServer = mcpServerFramework.getServer();

const moodleToken = process.env.MOODLE_TOKEN;
if (!moodleToken) {
  throw new Error('MOODLE_TOKEN is not set');
}

mcpServer.tool(
  'get_all_courses',
  'Get all courses that the user is enrolled in. Prefer "search_courses_by_name" if you need to get courses by name.',
  {
    include_in_response: includeCourseInResponseSchema,
  },
  async ({ include_in_response }) => {
    const userInfo = await moodleProvider.getUserInfo(moodleToken);
    if (!userInfo) {
      throw createResponseError('User info not found', 400);
    }

    const courses = await moodleProvider.getEnrolledCourses(
      moodleToken,
      userInfo.userid,
    );

    logger.debug(
      `include_in_response: ${JSON.stringify(include_in_response, null, 2)}`,
    );

    const filteredCourses = courses.map((course) =>
      filterCourse(course, include_in_response),
    );

    const humanReadableResponse = `We found ${
      filteredCourses.length
    } courses.\n${filteredCourses
      .map((course) => `- ${objectToHumanReadableString(course)}`)
      .join('\n')}`;

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
    include_in_response: includeCourseInResponseSchema,
  },
  async ({ course_name, include_in_response }) => {
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

    const filteredMerged = merged
      .map((course) => filterCourse(course, include_in_response))
      .filter((course) => course !== undefined);

    logger.log(`merged: ${JSON.stringify(filteredMerged, null, 2)}`);

    const humanReadableResponse = `We found ${
      filteredMerged.length
    } courses matching the search query "${course_name}":\n${filteredMerged
      .map((course) => `- ${objectToHumanReadableString(course)}`)
      .join('\n')}`;

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
  'Get contents of a specific course. The course is identified by the course_id parameter. Maybe you need to call find_course_id_by_name first to get the course_id.',
  {
    course_id: z.number().describe('ID of the course to get contents for'),
    include_in_response: includeCourseContentInResponseSchema,
  },
  async ({ course_id, include_in_response }) => {
    if (!course_id) {
      throw createResponseError('Course ID is required', 400);
    }

    const courseContents = await moodleProvider.getCourseContents(
      moodleToken,
      course_id,
    );

    const filteredCourseContents = courseContents
      .map((courseContent) =>
        filterCourseContent(courseContent, include_in_response),
      )
      .filter((course) => course !== undefined);

    const humanReadableResponse = `We found ${
      filteredCourseContents.length
    } course contents for course ${course_id}.\n${filteredCourseContents
      .map((courseContent) => `- ${objectToHumanReadableString(courseContent)}`)
      .join('\n')}`;

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
      .or(z.number())
      .nullish()
      .describe(
        'Get assignments due after this date. It can be a date string or a timestamp. For date strings include the timezone in the format "YYYY-MM-DD HH:MM:SS TZ" (e.g. "2025-01-01 00:00:00 UTC")',
      ),
    due_before: z
      .string()
      .or(z.number())
      .nullish()
      .describe(
        'Get assignments due before this date. It can be a date string or a timestamp. For date strings include the timezone in the format "YYYY-MM-DD HH:MM:SS TZ" (e.g. "2025-01-01 00:00:00 UTC")',
      ),
    include_in_response: includeAssignmentInResponseSchema,
  },
  async ({ include_in_response, due_after, due_before }) => {
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

    const filteredAssignments = allAssignments.map((assignment) =>
      filterAssignment(assignment, include_in_response),
    );
    const humanReadableResponse = `We found ${
      filteredAssignments.length
    } assignments for all courses.
    ${filteredAssignments
      .map((assignment) => `- ${objectToHumanReadableString(assignment)}`)
      .join('\n')}`;
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
    include_in_response: includeAssignmentInResponseSchema,
  },
  async ({ course_id, include_in_response }) => {
    logger.log(
      `get_assignments_for_course: ${JSON.stringify({ course_id }, null, 2)}`,
    );

    if (!course_id) {
      throw createResponseError('Course ID is required', 400);
    }

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

    const filteredAssignments = course.assignments.map((assignment) =>
      filterAssignment(assignment, include_in_response),
    );
    const humanReadableResponse = `We found ${
      filteredAssignments.length
    } assignments for course ${course_id}.
    ${filteredAssignments
      .map((assignment) => `- ${objectToHumanReadableString(assignment)}`)
      .join('\n')}`;
    return {
      content: [{ type: 'text', text: humanReadableResponse }],
    };
  },
);

mcpServer.tool(
  'get_user_info',
  'Get personal information about the user who asked the question. This function cannot get information about other users.',
  {
    include_in_response: includeUserInfoInResponseSchema,
  },
  async ({ include_in_response }) => {
    const userInfo = await moodleProvider.getUserInfo(moodleToken);
    if (!userInfo) {
      throw createResponseError('User info not found', 400);
    }
    const filteredUserInfo = filterUserInfo(userInfo, include_in_response);

    const humanReadableResponse = `We successfully retrieved the user info.\n${objectToHumanReadableString(
      filteredUserInfo,
    )}`;
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
