import { AgentTool } from '@master-thesis-agentic-ai/types';

export const moodleAgentToolsMock: AgentTool[] = [
  {
    name: 'get_all_courses',
    description:
      'Get all courses that the user is enrolled in. Prefer "search_courses_by_name" if you need to get courses by name.',
    args: {},
  },
  {
    name: 'search_courses_by_name',
    description:
      'Find courses by a search query for the course name. If there are multiple courses, return all of them. Important: Prefer this over "get_all_courses" if you need to get courses by name.',
    args: {
      course_name: {
        type: 'string',
        description: 'Name of the course to search for',
        required: true,
      },
    },
  },
  {
    name: 'get_course_contents',
    description:
      'Get contents of a specific course. The course is identified by the course_id parameter. Maybe you need to call find_course_id_by_name first to get the course_id.',
    args: {
      course_id: {
        type: 'number',
        description: 'ID of the course to get contents for',
        required: true,
      },
    },
  },
  {
    name: 'get_assignments_for_all_courses',
    description:
      'Get all assignments for the user in all courses. Prefer "get_assignments_for_course" if you need to get assignments for a specific course.',
    args: {
      due_after: {
        type: 'string | number',
        description:
          'Get assignments due after this date. It can be a date string or a timestamp. For date strings include the timezone in the format "YYYY-MM-DD HH:MM:SS TZ" (e.g. "2025-01-01 00:00:00 UTC")',
        required: false,
      },
      due_before: {
        type: 'string | number',
        description:
          'Get assignments due before this date. It can be a date string or a timestamp. For date strings include the timezone in the format "YYYY-MM-DD HH:MM:SS TZ" (e.g. "2025-01-01 00:00:00 UTC")',
        required: false,
      },
    },
  },
  {
    name: 'get_assignments_for_course',
    description:
      'Get all assignments for a specific course. Prefer this over "get_assignments_for_all_courses" if you need to get assignments for a specific course.',
    args: {
      course_id: {
        type: 'number',
        description: 'ID of the course to get assignments for',
        required: true,
      },
    },
  },
  {
    name: 'get_user_info',
    description:
      'Get personal information about the user who asked the question. This function cannot get information about other users.',
    args: {},
  },
];
