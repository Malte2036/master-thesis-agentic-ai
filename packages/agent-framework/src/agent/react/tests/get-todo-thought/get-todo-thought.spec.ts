import {
  RouterProcess,
  ToolCallWithResult,
} from '@master-thesis-agentic-ai/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../../logger';
import { AIProvider } from '../../../../services';
import { getTodoThought } from '../../get-todo-thought';
import { mockAgentTools } from '../router.spec.config';
import { TEST_AI_PROVIDERS, TEST_CONFIG, setupTest } from '../spec.config';
import { stripThoughts } from '../../../../utils/llm';

vi.setConfig(TEST_CONFIG);

describe('getTodoThought', () => {
  for (const { provider, model, structuredModel } of TEST_AI_PROVIDERS) {
    describe(`with model ${model} and structured model ${
      structuredModel ?? model
    }`, () => {
      let aiProvider: AIProvider;
      let logger: Logger;

      beforeEach(() => {
        const setup = setupTest(provider, model, structuredModel);

        aiProvider = setup.aiProvider;
        logger = setup.logger;
      });

      it('should generate a todo thought', async () => {
        const routerProcess: RouterProcess = {
          question: 'What is the weather in Tokyo?',
          maxIterations: 3,
          iterationHistory: [],
          contextId: 'test-context-id',
          agentTools: mockAgentTools,
        };

        const result = await getTodoThought(routerProcess, aiProvider, logger);

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);

        const strippedResult = stripThoughts(result);
        expect(strippedResult.length).toBeGreaterThan(0);

        expect(strippedResult).toMatch(/<TODO_LIST>/);
        expect(strippedResult).toMatch(/<\/TODO_LIST>/);
        expect(strippedResult).toMatch(/- \[ \] .*weather.*/i);
      });

      it('should generate a todo thought with a previous todo list', async () => {
        const routerProcess: RouterProcess = {
          question: 'What is the weather in Tokyo?',
          maxIterations: 3,
          iterationHistory: [
            {
              iteration: 0,
              naturalLanguageThought: 'What is the weather in Tokyo?',
              todoThought:
                '<TODO_LIST>\n- [ ] Get the weather in Tokyo\n</TODO_LIST>',
              structuredThought: {
                functionCalls: [
                  {
                    type: 'mcp',
                    function: 'get_weather',
                    args: {
                      location: 'Tokyo',
                    },
                    result: 'The weather in Tokyo is sunny.',
                  },
                ] satisfies ToolCallWithResult[],
                isFinished: false,
              },
            },
          ],
          contextId: 'test-context-id',
          agentTools: mockAgentTools,
        };

        const result = await getTodoThought(routerProcess, aiProvider, logger);

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);

        const strippedResult = stripThoughts(result);
        expect(strippedResult.length).toBeGreaterThan(0);

        expect(strippedResult).toMatch(/<TODO_LIST>/);
        expect(strippedResult).toMatch(/<\/TODO_LIST>/);
        expect(strippedResult).toMatch(/- \[x\] Get the weather in Tokyo/i);
      });

      it('should generate a complex todo thought', async () => {
        const routerProcess: RouterProcess = {
          question:
            'For all my current Moodle courses this semester, show me a timeline of the next 30 days that includes: (1) all upcoming assignment deadlines, (2) any quizzes or exams, and (3) the corresponding lecture or material links for each item. Then create calendar events for everything that is still open, but only if the workload in that week is not already above 3 deadlines or exams. At the end, give me a short summary per course of where I’m currently most overloaded.',
          maxIterations: 3,
          iterationHistory: [],
          contextId: 'test-context-id',
          agentTools: mockAgentTools,
        };

        const result = await getTodoThought(routerProcess, aiProvider, logger);

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);

        const strippedResult = stripThoughts(result);
        expect(strippedResult.length).toBeGreaterThan(0);

        expect(strippedResult).toMatch(/<TODO_LIST>/);
        expect(strippedResult).toMatch(/<\/TODO_LIST>/);
        expect(strippedResult).toMatch(/- \[ \] .*weather.*/i);
      });
    });
  }
});
