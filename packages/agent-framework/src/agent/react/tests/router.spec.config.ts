import { AgentTool } from '../types';

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
