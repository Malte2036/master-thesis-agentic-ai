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
      {
        name: 'courses',
        description: 'Get all courses that the user is enrolled in',
        parameters: {},
      },
      {
        name: 'find_course_id',
        description: 'Find the course id of a given course name search query',
        parameters: {
          course_name: {
            type: 'string',
            description: 'The name of the course to find the id of',
          },
        },
      },
      {
        name: 'course_contents',
        description: 'Get contents of a given course',
        parameters: {
          course_id: {
            type: 'number',
            description: 'The id of the course to get the contents of',
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
