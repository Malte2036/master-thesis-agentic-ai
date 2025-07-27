import {
  createAgentFramework,
  Logger,
} from '@master-thesis-agentic-ai/agent-framework';
import { createResponseError } from '@master-thesis-agentic-ai/types';
import dotenv from 'dotenv';
import { z } from 'zod';
import { MoodleProvider } from './providers/moodleProvider';
import { Assignment } from './schemas/moodle/assignment';
import { Course } from './schemas/moodle/course';
import { CourseContent } from './schemas/moodle/course_content';
import { UserInfo } from './schemas/moodle/user';

dotenv.config();

const logger = new Logger({ agentName: 'moodle-mcp' });

const moodleBaseUrl = process.env.MOODLE_BASE_URL;

if (!moodleBaseUrl) {
  throw new Error('MOODLE_BASE_URL is not set');
}

const moodleProvider = new MoodleProvider(logger, moodleBaseUrl);

const agentFramework = createAgentFramework(logger, 'moodle-mcp');
const mcpServer = agentFramework.getServer();

const moodleToken = process.env.MOODLE_TOKEN;
if (!moodleToken) {
  throw new Error('MOODLE_TOKEN is not set');
}
const includeCourseInResponseSchema = z
  .object({
    summary: z
      .boolean()
      .nullish()
      .describe('Whether to include the course summary in the response'),
    courseimage: z
      .boolean()
      .nullish()
      .describe('Whether to include the course image in the response'),
    displayname: z
      .boolean()
      .nullish()
      .describe('Whether to include the course display name in the response'),
    completed: z
      .boolean()
      .nullish()
      .describe(
        'Whether to include the course completed status in the response',
      ),
    startdate: z
      .boolean()
      .nullish()
      .describe('Whether to include the course start date in the response'),
    enddate: z
      .boolean()
      .nullish()
      .describe('Whether to include the course end date in the response'),
    isfavourite: z
      .boolean()
      .nullish()
      .describe(
        'Whether to include the course favourite status in the response',
      ),
    hidden: z
      .boolean()
      .nullish()
      .describe('Whether to include the course hidden status in the response'),
  })
  .nullish();

const includeCourseContentInResponseSchema = z
  .object({
    summary: z.boolean().nullish(),
    modules: z
      .object({
        description: z
          .boolean()
          .nullish()
          .describe(
            'Whether to include the module description in the response',
          ),
        modname: z
          .boolean()
          .nullish()
          .describe('Whether to include the module name in the response'),
        contents: z
          .boolean()
          .nullish()
          .describe('Whether to include the module contents in the response'),
      })
      .nullish()
      .describe('Whether to include the module in the response'),
  })
  .nullish();

const includeAssignmentInResponseSchema = z.object({
  name: z.boolean().nullish(),
  description: z.boolean().nullish(),
  due: z.boolean().nullish(),
  grading: z.boolean().nullish(),
  submission: z.boolean().nullish(),
});

const includeUserInfoInResponseSchema = z.object({
  username: z
    .boolean()
    .nullish()
    .describe(
      'Whether to include the username in the response. Often this is an email address.',
    ),
  firstname: z
    .boolean()
    .nullish()
    .describe('Whether to include the first name in the response'),
  lastname: z
    .boolean()
    .nullish()
    .describe('Whether to include the last name in the response'),
  siteurl: z
    .boolean()
    .nullish()
    .describe('Whether to include the site url in the response'),
  userpictureurl: z
    .boolean()
    .nullish()
    .describe('Whether to include the user picture url in the response'),
  userlang: z
    .boolean()
    .nullish()
    .describe('Whether to include the user language in the response'),
});

/**
 * Filters a course object based on the include_in_response configuration
 */
function filterCourseByInclude(
  data: { id: number; fullname: string },
  include_in_response?: z.infer<typeof includeCourseInResponseSchema>,
): Partial<Course> | undefined {
  const filteredCourse: Partial<Course> = {
    id: data.id,
    fullname: data.fullname,
  };

  Object.entries(include_in_response ?? {}).forEach(([key, value]) => {
    if (value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (filteredCourse as any)[key] = data[key as keyof typeof data];
    }
  });

  return filteredCourse;
}

/**
 * Filters an assignment object based on the include_in_response configuration
 */
function filterAssignmentByInclude(
  data: Assignment,
  include_in_response?: z.infer<typeof includeAssignmentInResponseSchema>,
): Partial<Assignment> {
  const filteredAssignment: Partial<Assignment> = {
    id: data.id,
    name: data.name,
  };

  Object.entries(include_in_response ?? {}).forEach(([key, value]) => {
    if (value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (filteredAssignment as any)[key] = data[key as keyof typeof data];
    }
  });

  return filteredAssignment;
}

function filterCourseContentByInclude(
  data: CourseContent,
  include_in_response?: z.infer<typeof includeCourseContentInResponseSchema>,
): Partial<CourseContent> | undefined {
  const filteredCourseContent: Partial<CourseContent> = {
    id: data.id,
    name: data.name,
  };

  Object.entries(include_in_response ?? {}).forEach(([key, value]) => {
    if (value) {
      const valueToInclude = data[key as keyof typeof data];

      if (key === 'modules' && Array.isArray(valueToInclude)) {
        const modules = valueToInclude as CourseContent['modules'];
        // TODO: Filter modules by include_in_response
        filteredCourseContent.modules = modules;
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (filteredCourseContent as any)[key] = valueToInclude;
      }
    }
  });

  return filteredCourseContent;
}

function filterUserInfoByInclude(
  data: UserInfo,
  include_in_response?: z.infer<typeof includeUserInfoInResponseSchema>,
): Partial<UserInfo> {
  const filteredUserInfo: Partial<UserInfo> = {};

  Object.entries(include_in_response ?? {}).forEach(([key, value]) => {
    if (value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (filteredUserInfo as any)[key] = data[key as keyof typeof data];
    }
  });

  return filteredUserInfo;
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
      filterCourseByInclude(course, include_in_response),
    );

    logger.debug(
      `get_all_courses: ${JSON.stringify(filteredCourses, null, 2)}`,
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(filteredCourses) }],
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

    const filteredMerged = merged.map((course) =>
      filterCourseByInclude(course, include_in_response),
    );

    logger.log(`merged: ${JSON.stringify(filteredMerged, null, 2)}`);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(filteredMerged),
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

    const filteredCourseContents = courseContents.map((courseContent) =>
      filterCourseContentByInclude(courseContent, include_in_response),
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(filteredCourseContents) }],
    };
  },
);

mcpServer.tool(
  'get_all_assignments_for_all_courses',
  'Get all assignments the user has access to. Prefer "assignments_for_course" if you need to get assignments for a specific course.',
  {
    include_in_response: includeAssignmentInResponseSchema,
  },
  async ({ include_in_response }) => {
    const assignmentsResponse =
      await moodleProvider.getAssignments(moodleToken);
    const allAssignments = assignmentsResponse.courses.flatMap(
      (course) => course.assignments ?? [],
    );
    const filteredAssignments = allAssignments.map((assignment) =>
      filterAssignmentByInclude(assignment, include_in_response),
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(filteredAssignments) }],
    };
  },
);

mcpServer.tool(
  'get_assignments_for_course',
  'Get all assignments for a specific course. Prefer this over "assignments" if you need to get assignments for a specific course.',
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
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify([]),
          },
        ],
      };
    }

    const filteredAssignments = course.assignments.map((assignment) =>
      filterAssignmentByInclude(assignment, include_in_response),
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(filteredAssignments) }],
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
    const filteredUserInfo = filterUserInfoByInclude(
      userInfo,
      include_in_response,
    );
    return {
      content: [{ type: 'text', text: JSON.stringify(filteredUserInfo) }],
    };
  },
);

// Start the server and keep it running
agentFramework.listen().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
