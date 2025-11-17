import { RouterProcess } from '@master-thesis-agentic-ai/types';
import { stripThoughts } from '../../../../utils/llm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../../logger';
import { AIProvider } from '../../../../services';
import { getNaturalLanguageThought } from '../../get-natural-language-thought';
import {
  mockAgentToolsRoutingReal,
  mockAgentToolsSequentiel,
} from '../router.spec.config';
import { TEST_AI_PROVIDERS, TEST_CONFIG, setupTest } from '../spec.config';

vi.setConfig(TEST_CONFIG);

describe('getNaturalLanguageThought (sequentiel)', () => {
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

      it('should generate natural language with only the next action', async () => {
        const routerProcess: RouterProcess = {
          question:
            'Get my assignments for the next week. And create a calendar event for the next assignment. The title of the calendar event should be the name of the assignment. The start date of the calendar event should be the due date of the assignment. The end date of the calendar event should be the due date of the assignment.',
          maxIterations: 3,
          iterationHistory: [],
          contextId: 'test-context-id',
          agentTools: mockAgentToolsSequentiel,
        };

        const result = await getNaturalLanguageThought(
          routerProcess,
          aiProvider,
          logger,
          '',
        );

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);

        const strippedResult = stripThoughts(result).toLowerCase();

        expect(strippedResult).toMatch(/get.?assignments/);
        expect(strippedResult).not.toMatch(/create.?calendar.?event/);

        expect(strippedResult).not.toMatch(/evidence-json/);
      });

      it('should generate natural language with only the next action (complex)', async () => {
        const routerProcess: RouterProcess = {
          question:
            'Get my last past assignment and create a calendar event for the date of the assignment and for 1.5hours. The Description of the calendar event should be the assignment intro.',
          maxIterations: 3,
          iterationHistory: [],
          contextId: 'test-context-id',
          agentTools: mockAgentToolsRoutingReal,
        };

        const result = await getNaturalLanguageThought(
          routerProcess,
          aiProvider,
          logger,
          `You are **RouterGPT**, the dispatcher in a multi-agent system.
    
    Always include the "prompt" and "reason" in the function calls.`,
        );

        const strippedResult = stripThoughts(result).toLowerCase();

        expect(strippedResult).toMatch(/moodle-agent/);
        expect(strippedResult).not.toMatch(/calendar-agent/);

        expect(strippedResult).not.toMatch(/evidence-json/);
      });
    });
  }
});
