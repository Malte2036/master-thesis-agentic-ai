import {
  AIProvider,
  ListToolsResult,
  MCPClient,
  OllamaProvider,
} from '@master-thesis-agentic-rag/agent-framework';
import { RouterProcess } from '@master-thesis-agentic-rag/types';
import { ReActRouter } from './router';
import { createAgentTools, createMockAgents } from './router.test.config';

// Mock the getAllAgentsMcpClients function
jest.mock('../agents/agent', () => ({
  getAllAgentsMcpClients: jest.fn(),
}));

import { getAllAgentsMcpClients } from '../agents/agent';

const OllamaBaseUrl = 'http://10.50.60.153:11434';

// Increase timeout for AI provider operations
jest.setTimeout(10000);

describe('ReActRouter', () => {
  let router: ReActRouter;
  let aiProvider: AIProvider;
  let structuredAiProvider: AIProvider;
  let mockAgents: MCPClient[];
  let agentTools: Record<string, ListToolsResult>;
  let mockGetAllAgentsMcpClients: jest.MockedFunction<
    typeof getAllAgentsMcpClients
  >;

  beforeEach(() => {
    aiProvider = new OllamaProvider({
      baseUrl: OllamaBaseUrl,
      model: 'llama3.1:8b',
      // model: 'mistral:instruct',
    });
    structuredAiProvider = aiProvider;
    // structuredAiProvider = new OllamaProvider({
    //   baseUrl: OllamaBaseUrl,
    //   // model: 'Osmosis/Osmosis-Structure-0.6B:latest',
    //   model: 'llama3.1:8b',
    //   // model: 'mistral:instruct',
    // });

    mockAgents = createMockAgents(jest);
    agentTools = createAgentTools();

    // Set up the mock to return our mock agents
    mockGetAllAgentsMcpClients = getAllAgentsMcpClients as jest.MockedFunction<
      typeof getAllAgentsMcpClients
    >;
    mockGetAllAgentsMcpClients.mockResolvedValue(mockAgents);

    router = new ReActRouter(aiProvider, structuredAiProvider);
  });

  describe('getStructuredThought', () => {
    it('should convert response string to structured agent calls using AI provider', async () => {
      const responseString =
        'I need to call the get-course-info function of the moodle agent to get course information for course ID 62031.';

      const result = await router.getStructuredThought(
        responseString,
        agentTools,
      );

      expect(result).toBeDefined();
      expect(result.agentCalls).toHaveLength(1);

      const courseInfoCall = result.agentCalls[0];
      expect(courseInfoCall.agent).toBe('moodle-agent');
      expect(courseInfoCall.function).toBe('get-course-info');
      expect(courseInfoCall.args).toMatchObject({
        courseId: 62031,
      });
    });

    it('should handle complex agent calls with multiple agents and parameters', async () => {
      const responseString =
        'I need to search for Computer Science academic resources with maximum 5 results using the library-agent.';

      const result = await router.getStructuredThought(
        responseString,
        agentTools,
      );

      expect(result).toBeDefined();
      expect(result.agentCalls).toHaveLength(1);

      const resourceCall = result.agentCalls[0];
      expect(resourceCall.agent).toBe('library-agent');
      expect(resourceCall.function).toBe('search-resources');
      expect(resourceCall.args).toMatchObject({
        query: expect.stringMatching(/computer science/i),
        maxResults: 5,
      });
    });
  });

  describe('getNaturalLanguageThought', () => {
    it('should generate natural language thought containing relevant keywords', async () => {
      const routerProcess: RouterProcess = {
        question:
          'What assignments are available in my Introduction to Computer Science course with the ID 8320?',
        maxIterations: 3,
        iterationHistory: [],
      };

      const result = await router.getNaturalLanguageThought(
        mockAgents,
        routerProcess,
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      const lowerResult = result.toLowerCase();

      expect(lowerResult).toMatch(/moodle.?agent/);
      expect(lowerResult).toMatch(/get.?assignments|get.?course.?info/);
      expect(lowerResult).toMatch(/8320/);
    });

    it('should generate thought for complex multi-agent scenario.', async () => {
      const routerProcess: RouterProcess = {
        question: 'Find all pending assignments in my Computer Science courses',
        maxIterations: 3,
        iterationHistory: [],
      };

      const result = await router.getNaturalLanguageThought(
        mockAgents,
        routerProcess,
      );

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      const lowerResult = result.toLowerCase();

      expect(lowerResult).toMatch(/moodle.?agent/);
      expect(lowerResult).toMatch(/find.?course.?id/);

      expect(lowerResult).toMatch(/computer science/);
    });
  });

  describe('observeAndSummarizeAgentResponses', () => {
    it.skip('should convert unix timestamps to readable format in agent response summaries', async () => {
      const question = 'What assignments are due soon?';

      const agentCalls = [
        {
          agent: 'moodle-agent',
          function: 'get-assignments',
          args: { courseId: 12345 },
        },
      ];

      const agentResponses = [
        {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                assignments: [
                  {
                    id: 1,
                    name: 'Math Homework',
                    duedate: 1735689600, // January 1, 2025, 00:00:00 UTC
                  },
                ],
              }),
            },
          ],
          isError: false,
        },
      ];

      const thinkAndFindResponse = {
        agentCalls: agentCalls,
        isFinished: false,
      };

      const summary = await router.observeAndSummarizeAgentResponses(
        question,
        agentCalls,
        agentResponses,
        thinkAndFindResponse,
      );

      expect(summary).toBeDefined();
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);

      const lowerSummary = summary.toLowerCase();
      expect(lowerSummary).toMatch(/january 01, 2025/);
    });
  });
});
