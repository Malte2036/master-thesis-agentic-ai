import {
  AgentTools,
  AIProvider,
  OllamaProvider,
  Logger,
  GroqProvider,
} from '@master-thesis-agentic-rag/agent-framework';
import { RouterProcess } from '@master-thesis-agentic-rag/types';
import { ReActRouter } from './router';
import {
  createAgentTools,
  TEST_AI_PROVIDERS,
  EXAMPLE_AGENT_RESPONSES,
} from './router.test.config';

// Mock the getAllAgentsMcpClients function
jest.mock('../agents/agent', () => ({
  getAllAgentsMcpClients: jest.fn(),
}));

const OllamaBaseUrl = 'http://10.50.60.153:11434';

// Increase timeout for AI provider operations
jest.setTimeout(10000);

describe('ReActRouter', () => {
  for (const { provider, model, structuredModel } of TEST_AI_PROVIDERS) {
    describe(`with model ${model} and structured model ${structuredModel ?? model}`, () => {
      let router: ReActRouter;
      let aiProvider: AIProvider;
      let structuredAiProvider: AIProvider;
      let agentTools: AgentTools;

      beforeEach(() => {
        const testName = expect.getState().currentTestName || 'unknown-test';
        const sanitizedTestName = testName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        const logger = new Logger({
          agentName: sanitizedTestName,
          logsSubDir: `${model}-${structuredModel ?? model}`,
        });

        if (provider === 'ollama') {
          aiProvider = new OllamaProvider(logger, {
            baseUrl: OllamaBaseUrl,
            model,
          });
        } else if (provider === 'groq') {
          aiProvider = new GroqProvider(logger, {
            model,
          });
        } else {
          throw new Error(`Unsupported provider: ${provider}`);
        }

        if (structuredModel) {
          structuredAiProvider = new OllamaProvider(logger, {
            baseUrl: OllamaBaseUrl,
            model: structuredModel,
          });
          logger.log(`Using structured model: ${structuredModel} for ${model}`);
        } else {
          structuredAiProvider = aiProvider;
        }

        agentTools = createAgentTools();
        router = new ReActRouter(aiProvider, structuredAiProvider, logger);
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
            agentTools,
            routerProcess,
          );

          expect(result).toBeDefined();
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);

          const lowerResult = result.toLowerCase();

          // it should get the assignments or first validate the course id
          expect(lowerResult).toMatch(/moodle.?agent/);
          expect(lowerResult).toMatch(/get.?assignments|find.?course.?id/);
          expect(lowerResult).toMatch(/8320/);
        });

        it('should generate thought for complex multi-agent scenario.', async () => {
          const routerProcess: RouterProcess = {
            question:
              'Find all pending assignments in my Computer Science courses',
            maxIterations: 3,
            iterationHistory: [],
          };

          const result = await router.getNaturalLanguageThought(
            agentTools,
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

        it('should consider the last observation from iterationHistory when generating thought', async () => {
          const routerProcess: RouterProcess = {
            question:
              'What assignments are available in my "Introduction to Computer Science" course?',
            maxIterations: 3,
            iterationHistory: [
              {
                iteration: 0,
                naturalLanguageThought:
                  'I need to call the get-course-info function of the moodle agent to get course information for the course "Introduction to Computer Science".',

                structuredThought: {
                  agentCalls: [
                    {
                      agent: 'moodle-mcp',
                      function: 'find-course-id',
                      args: { courseName: 'Introduction to Computer Science' },
                    },
                  ],
                  isFinished: false,
                },
                observation:
                  'The course "Introduction to Computer Science" is valid and the course has the ID 8320.',
              },
              {
                iteration: 1,
                naturalLanguageThought:
                  'I need to call the get-assignments function of the moodle agent to get assignments for course ID 8320.',
                structuredThought: {
                  agentCalls: [
                    {
                      agent: 'moodle-mcp',
                      function: 'get-assignments',
                      args: { courseId: 8320 },
                    },
                  ],
                  isFinished: false,
                },
                observation:
                  'There is an assignment with the name "Learning to Program" for course ID 8320 due on 2025-06-01. There is no other assignment for this course.',
              },
            ],
          };

          const result = await router.getNaturalLanguageThought(
            agentTools,
            routerProcess,
          );

          expect(result).toBeDefined();
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);

          const lowerResult = result.toLowerCase();
          // The generated thought should reference or be influenced by the last observation
          expect(lowerResult).toMatch(/learning to program/i);
          expect(lowerResult).toMatch(/2025-06-01/i);
        });

        it('should mention include_in_response parameters when user asks for specific course fields', async () => {
          const routerProcess: RouterProcess = {
            question:
              'Get all my courses but only show me the course names and IDs, I do not need descriptions or images.',
            maxIterations: 3,
            iterationHistory: [],
          };

          const result = await router.getNaturalLanguageThought(
            agentTools,
            routerProcess,
          );

          expect(result).toBeDefined();
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);

          const lowerResult = result.toLowerCase();

          // Should mention the moodle agent and get_all_courses function
          expect(lowerResult).toMatch(/moodle.?agent/);
          expect(lowerResult).toMatch(/get.?all.?courses/);

          // Should mention the specific fields requested
          expect(lowerResult).toMatch(/course.?name/);
          expect(lowerResult).toMatch(/course.?id/);

          // Should mention excluding unwanted fields
          expect(lowerResult).toMatch(/description|image/);
          expect(lowerResult).toMatch(
            /include.?in.?response|include.?response|specific.?fields/,
          );
        });

        it('should mention include_in_response parameters when user asks to exclude specific fields', async () => {
          const routerProcess: RouterProcess = {
            question:
              'Show me all my enrolled courses with full details but without the course images.',
            maxIterations: 3,
            iterationHistory: [],
          };

          const result = await router.getNaturalLanguageThought(
            agentTools,
            routerProcess,
          );

          expect(result).toBeDefined();
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);

          const lowerResult = result.toLowerCase();

          // Should mention the moodle agent and get_all_courses function
          expect(lowerResult).toMatch(/moodle.?agent/);
          expect(lowerResult).toMatch(/get.?all.?courses/);

          // Should mention excluding images
          expect(lowerResult).toMatch(/image/);
          expect(lowerResult).toMatch(/without|exclude|not|no/);

          // Should mention including other fields or using include_in_response
          expect(lowerResult).toMatch(
            /include.?in.?response|include.?response|specific.?fields|full.?details/,
          );
        });

        it('should mention include_in_response parameters when user asks for minimal course information', async () => {
          const routerProcess: RouterProcess = {
            question:
              'I just need a simple list of my course names, nothing else.',
            maxIterations: 3,
            iterationHistory: [],
          };

          const result = await router.getNaturalLanguageThought(
            agentTools,
            routerProcess,
          );

          expect(result).toBeDefined();
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);

          const lowerResult = result.toLowerCase();

          // Should mention the moodle agent and get_all_courses function
          expect(lowerResult).toMatch(/moodle.?agent/);
          expect(lowerResult).toMatch(/get.?all.?courses/);

          // Should mention only course names
          expect(lowerResult).toMatch(/course.?name/);
          expect(lowerResult).toMatch(/only|just|simple|minimal/);

          // Should mention using include_in_response to limit fields
          expect(lowerResult).toMatch(
            /include.?in.?response|include.?response|specific.?fields/,
          );
        });
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
          expect(courseInfoCall.agent).toBe('moodle-mcp');
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

        it('should correctly handle include_in_response parameters for get_all_courses', async () => {
          const responseString =
            'I need to call the get_all_courses function of the moodle-mcp to get all courses. I want to include course_id, course_name, and course_description in the response, but exclude course_image and course_url.';

          const result = await router.getStructuredThought(
            responseString,
            agentTools,
          );

          expect(result).toBeDefined();
          expect(result.agentCalls).toHaveLength(1);

          const getAllCoursesCall = result.agentCalls[0];
          expect(getAllCoursesCall.agent).toBe('moodle-mcp');
          expect(getAllCoursesCall.function).toBe('get_all_courses');
          expect(getAllCoursesCall.args).toMatchObject({
            include_in_response: {
              course_id: true,
              course_name: true,
              course_description: true,
            },
          });
        });

        it('should handle partial include_in_response parameters for get_all_courses', async () => {
          const responseString =
            'I need to call the get_all_courses function of the moodle-mcp to get all courses. I only want to include course_name and course_url in the response.';

          const result = await router.getStructuredThought(
            responseString,
            agentTools,
          );

          expect(result).toBeDefined();
          expect(result.agentCalls).toHaveLength(1);

          const getAllCoursesCall = result.agentCalls[0];
          expect(getAllCoursesCall.agent).toBe('moodle-mcp');
          expect(getAllCoursesCall.function).toBe('get_all_courses');
          expect(getAllCoursesCall.args).toMatchObject({
            include_in_response: expect.objectContaining({
              course_name: true,
              course_url: true,
            }),
          });
        });

        it('should handle get_all_courses without include_in_response parameters', async () => {
          const responseString =
            'I need to call the get_all_courses function of the moodle-mcp to get all courses with default parameters.';

          const result = await router.getStructuredThought(
            responseString,
            agentTools,
          );

          expect(result).toBeDefined();
          expect(result.agentCalls).toHaveLength(1);

          const getAllCoursesCall = result.agentCalls[0];
          expect(getAllCoursesCall.agent).toBe('moodle-mcp');
          expect(getAllCoursesCall.function).toBe('get_all_courses');
          // Should either have empty args or undefined include_in_response
          expect(getAllCoursesCall.args).toEqual(expect.objectContaining({}));
        });

        it('should not generate agent calls for thoughts that only describe capabilities', async () => {
          const responseString =
            'What I Can Do and My Functions: I can help with the following tasks using specific functions: 1. Moodle-related functions: - Search courses by name - Get course contents - Retrieve assignments for courses (with details like name, description, due dates, grading, and submission info) - Get user information (username, name, site URL, etc.). 2. Calendar management: - Create calendar events (e.g., scheduling checks or reminders).';
          const result = await router.getStructuredThought(
            responseString,
            agentTools,
          );

          expect(result).toBeDefined();
          // The core of the test: The model should understand this is a descriptive statement, not an action plan.
          expect(result.agentCalls).toHaveLength(0);
          expect(result.isFinished).toBe(true);
        });
      });

      describe('observeAndSummarizeAgentResponses', () => {
        it('should include all courses from agent response in the observation', async () => {
          const question = 'Can you get me all my modules?';

          const agentCalls = [
            {
              agent: 'moodle-mcp',
              function: 'get_all_courses',
              args: {},
            },
          ];

          const agentResponses = [EXAMPLE_AGENT_RESPONSES.getAllCourses];

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

          // Verify that all courses are mentioned in the summary
          const courses = [
            'D3.1 Einführung Künstliche Intelligenz',
            'D4.1.1 Machine Perception und Tracking',
            'D5.1.2: Advances in Intelligent Systems',
            'PF1.2 Designing Digital Health User Experience',
            'Masterprojekt 1',
            'Sendezentrum',
          ];
          courses.forEach((course) => {
            expect(summary).toContain(course);
          });
        });

        it.skip('should convert unix timestamps to readable format in agent response summaries', async () => {
          const question = 'What assignments are due soon?';

          const agentCalls = [
            {
              agent: 'moodle-mcp',
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
  }
});
