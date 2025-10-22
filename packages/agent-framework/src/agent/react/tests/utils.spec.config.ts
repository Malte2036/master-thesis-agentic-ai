import { ListToolsResult } from '@modelcontextprotocol/sdk/types.js';

export const mockListToolsResult: ListToolsResult = {
  tools: [
    {
      name: 'get_user_info',
      description:
        'Get personal information about the user who asked the question. This function cannot get information about other users.',
      inputSchema: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
        $schema: 'http://json-schema.org/draft-07/schema#',
      },
    },
  ],
};
