import { AgentTool } from '@master-thesis-agentic-ai/types';

export const mockAgentTools: AgentTool[] = [
  {
    name: 'get_weather',
    description: 'Get the weather for a location',
    args: {
      location: {
        type: 'string',
        description: 'The location to get the weather for',
        required: true,
      },
    },
  },
];

export const mockAgentToolsSequentiel: AgentTool[] = [
  {
    name: 'get_assignments',
    description: 'Get the assignments for the user',
    args: {},
  },
  {
    name: 'create_calendar_event',
    description: 'Create a calendar event',
    args: {
      title: {
        type: 'string',
        description: 'The title of the calendar event',
        required: true,
      },
      start: {
        type: 'string',
        description: 'The start date of the calendar event',
        required: true,
      },
      end: {
        type: 'string',
        description: 'The end date of the calendar event',
        required: true,
      },
    },
  },
];
