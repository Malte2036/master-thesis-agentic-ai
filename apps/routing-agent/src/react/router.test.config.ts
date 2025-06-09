import {
  ListToolsResult,
  MCPClient,
} from '@master-thesis-agentic-rag/agent-framework';

export const TEST_AI_PROVIDERS: {
  provider: 'ollama' | 'groq';
  model: string;
  structuredModel?: string;
}[] = [
  // ollama models
  // { provider: 'ollama', model: 'llama3.1:8b' },
  // { provider: 'ollama', model: 'mistral:instruct' },
  { provider: 'ollama', model: 'qwen3:0.6b' },
  // { provider: 'ollama', model: 'qwen3:1.7b' },
  // { provider: 'ollama', model: 'qwen3:4b' },
  // { provider: 'ollama', model: 'deepseek-r1:1.5b' },
  // { provider: 'ollama', model: 'phi:2.7b' },

  // ollama with custom structured model
  { provider: 'ollama', model: 'qwen3:0.6b', structuredModel: 'phi:2.7b' },

  // groq models
  // { provider: 'groq', model: 'qwen-qwq-32b' },
  // { provider: 'groq', model: 'deepseek-r1:1.5b' },
];

export const createAgentTools = (): Record<string, ListToolsResult> =>
  ({
    'moodle-agent': {
      tools: [
        {
          name: 'find-course-id',
          description:
            'Find the course ID for a specific course from Moodle by its name',
          inputSchema: {
            type: 'object' as const,
            properties: {
              courseName: { type: 'string' },
            },
            required: ['courseName'],
          },
        },
        {
          name: 'get-course-info',
          description: 'Get information about a specific course from Moodle',
          inputSchema: {
            type: 'object' as const,
            properties: {
              courseId: { type: 'number' },
            },
            required: ['courseId'],
          },
        },
        {
          name: 'get-assignments',
          description: 'Get assignments for a specific course from Moodle',
          inputSchema: {
            type: 'object' as const,
            properties: {
              courseId: { type: 'number' },
            },
            required: ['courseId'],
          },
        },
      ],
    },
    'library-agent': {
      tools: [
        {
          name: 'search-resources',
          description: 'Search for academic books and papers',
          inputSchema: {
            type: 'object' as const,
            properties: {
              query: { type: 'string' },
              resourceType: { type: 'string' },
              yearFrom: { type: 'number' },
              maxResults: { type: 'number' },
            },
            required: ['query'],
          },
        },
      ],
    },
  }) satisfies Record<string, ListToolsResult>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createMockAgents = (jestInstance: any): MCPClient[] => {
  const agentTools = createAgentTools();

  return Object.entries(agentTools).map(
    ([agentName, toolsResult]) =>
      ({
        name: agentName,
        listTools: jestInstance.fn().mockResolvedValue({
          tools: toolsResult.tools.map(
            (tool: ListToolsResult['tools'][number]) => ({
              name: tool.name,
              description: tool.description,
              parameters: tool.inputSchema.properties,
            }),
          ),
        }),
      }) satisfies Partial<MCPClient> as MCPClient,
  );
};
