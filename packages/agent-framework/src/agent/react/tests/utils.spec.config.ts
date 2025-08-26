import { ListToolsResult } from '@modelcontextprotocol/sdk/types.js';

export const mockListToolsResult: ListToolsResult = {
  tools: [
    {
      name: 'get_user_info',
      description:
        'Get personal information about the user who asked the question. This function cannot get information about other users.',
      inputSchema: {
        type: 'object',
        properties: {
          include_in_response: {
            type: 'object',
            properties: {
              username: {
                type: ['boolean', 'null'],
                description:
                  'Whether to include the username in the response. Often this is an email address.',
              },
              firstname: {
                type: ['boolean', 'null'],
                description:
                  'Whether to include the first name in the response',
              },
              lastname: {
                type: ['boolean', 'null'],
                description: 'Whether to include the last name in the response',
              },
              siteurl: {
                type: ['boolean', 'null'],
                description: 'Whether to include the site url in the response',
              },
              userpictureurl: {
                type: ['boolean', 'null'],
                description:
                  'Whether to include the user picture url in the response',
              },
              userlang: {
                type: ['boolean', 'null'],
                description:
                  'Whether to include the user language in the response',
              },
            },
            additionalProperties: false,
          },
        },
        required: ['include_in_response'],
        additionalProperties: false,
        $schema: 'http://json-schema.org/draft-07/schema#',
      },
    },
  ],
};
