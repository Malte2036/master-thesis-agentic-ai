import { z } from 'zod/v4';

export interface AgentFunction {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AgentConfig {
  port: number;
  name: string;
  friendlyName: string;
  description: string;
  functions: AgentFunction[];
}

const MCP_CONFIGS: Record<'moodle-mcp' | 'calendar-mcp', AgentConfig> = {
  'moodle-mcp': {
    port: 3003,
    name: 'moodle-mcp',
    friendlyName: 'Moodle Agent',
    description:
      'Get information about university courses and assignments. All timestamps in responses are in Unix timestamp format (seconds since epoch) and in UTC timezone.',
    functions: [
      //   {
      //     name: 'get_user_info',
      //     description: 'Get personal information about the user',
      //     parameters: {},
      //   },
      //   {
      //     name: 'find_courses_by_name',
      //     description:
      //       'Find courses by a search query for the course name. If there are multiple courses, return all of them. Important: Prefer this over "courses" if you need to get courses by name.',
      //     parameters: {
      //       course_name: {
      //         type: 'string',
      //         description: 'The name of the course to find',
      //       },
      //     },
      //   },
      //   {
      //     name: 'get_all_courses',
      //     description:
      //       'Get all courses that the user is enrolled in. Important: Prefer "find_courses_by_name" if you need to get courses by name.',
      //     parameters: {},
      //   },
      //   {
      //     name: 'get_course_contents',
      //     description:
      //       'Get contents of a specific course. The course is identified by the course_id parameter. Maybe you need to call find_course_id_by_name first to get the course_id.',
      //     parameters: {
      //       course_id: {
      //         type: 'number',
      //         description: 'The id of the course.',
      //       },
      //     },
      //   },
      //   {
      //     name: 'get_assignments_for_course',
      //     description:
      //       'Get all assignments for a specific course. Important: Prefer this over "assignments" if you need to get assignments for a specific course.',
      //     parameters: {
      //       course_id: { type: 'number', description: 'The id of the course.' },
      //     },
      //   },
      //   {
      //     name: 'get_assignments_for_all_courses',
      //     description:
      //       'Get all assignments the user has access to. Important: Prefer "assignments_for_course" if you need to get assignments for a specific course.',
      //     parameters: {},
      //   },
    ],
  },
  'calendar-mcp': {
    port: 3004,
    name: 'calendar-mcp',
    friendlyName: 'Calendar Agent',
    description:
      "This agent is responsible for creating calendar events. It is used to create events in the user's calendar.",
    functions: [
      //     {
      //       name: 'create_calendar_event',
      //       description: 'Create a calendar event',
      //       parameters: {
      //         event_name: {
      //           type: 'string',
      //           description: 'The name of the event to create',
      //         },
      //         event_description: {
      //           type: 'string',
      //           description: 'The description of the event to create',
      //         },
      //         event_start_date: {
      //           type: 'string',
      //           description: 'The start date of the event to create',
      //         },
      //         event_end_date: {
      //           type: 'string',
      //           description: 'The end date of the event to create',
      //         },
      //       },
      //     },
    ],
  },
};

export type MCPName = keyof typeof MCP_CONFIGS;

export const MCPNameSchema = z.enum(
  Object.keys(MCP_CONFIGS) as [MCPName, ...MCPName[]],
);

export function getMCPConfig(agentName: MCPName): AgentConfig {
  return MCP_CONFIGS[agentName];
}

export function getMCPUrl(agentName: MCPName, path?: string): string {
  const config = getMCPConfig(agentName);
  const port = config.port;

  return `http://localhost:${port}${path ?? ''}`;
}
