import { ListToolsResult } from '@modelcontextprotocol/sdk/types.js';

export const getMockAgentTools = (): ListToolsResult => ({
  tools: [
    {
      name: 'get_weather',
      description: 'Get the weather for a location',
      inputSchema: {
        type: 'object',
        properties: {
          location: {
            type: 'string',
            description: 'The location to get the weather for',
          },
        },
        required: ['location'],
      },
    },
  ],
});
