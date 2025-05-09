import { z } from 'zod';

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

const AGENT_CONFIGS: Record<string, AgentConfig> = {
  'frontdoor-agent': {
    port: 3000,
    name: 'frontdoor-agent',
    friendlyName: 'Frontdoor Agent',
    description: 'Ask questions about the university',
    functions: [],
  },
  'moodle-agent': {
    port: 3003,
    name: 'moodle-agent',
    friendlyName: 'Moodle Agent',
    description: 'Get information about university courses and assignments',
    functions: [
      {
        name: 'user',
        description: 'Get personal information about the user',
        parameters: {},
      },
      // {
      //   name: 'courses',
      //   description: 'Get all courses that the user is enrolled in',
      //   parameters: {},
      // },
      {
        name: 'find_course_by_name',
        description: 'Find a course by a search query for the course name',
        parameters: {
          course_name: {
            type: 'string',
            description: 'The name of the course to find',
          },
        },
      },
      {
        name: 'course_contents',
        description:
          'Get contents of a specific course. The course is identified by the course_id parameter. Maybe you need to call find_course_id_by_name first to get the course_id.',
        parameters: {
          course_id: {
            type: 'number',
            description: 'The id of the course.',
          },
        },
      },
      {
        name: 'assignments',
        description: 'Get all assignments the user has access to',
        parameters: {},
      },
    ],
  },
  'calendar-agent': {
    port: 3004,
    name: 'calendar-agent',
    friendlyName: 'Calendar Agent',
    description:
      "This agent is responsible for creating calendar events. It is used to create events in the user's calendar.",
    functions: [
      {
        name: 'create_calendar_event',
        description: 'Create a calendar event',
        parameters: {
          event_name: {
            type: 'string',
            description: 'The name of the event to create',
          },
          event_description: {
            type: 'string',
            description: 'The description of the event to create',
          },
          event_start_date: {
            type: 'string',
            description: 'The start date of the event to create',
          },
          event_end_date: {
            type: 'string',
            description: 'The end date of the event to create',
          },
        },
      },
    ],
  },
};

export type AgentName = keyof typeof AGENT_CONFIGS;

export const AgentNameSchema = z.enum(
  Object.keys(AGENT_CONFIGS) as [AgentName, ...AgentName[]],
);

export function getAgentConfigs(
  includeFrontdoorAgent = true,
): Record<AgentName, AgentConfig> {
  if (includeFrontdoorAgent) {
    return AGENT_CONFIGS;
  }

  return Object.fromEntries(
    Object.entries(AGENT_CONFIGS).filter(([key]) => key !== 'frontdoor-agent'),
  );
}

export function getAgentConfig(agentName: AgentName): AgentConfig {
  return AGENT_CONFIGS[agentName];
}

export function getAgentUrl(agentName: AgentName, path?: string): string {
  const config = getAgentConfig(agentName);
  const port = config.port;

  return `http://localhost:${port}${path ?? ''}`;
}
