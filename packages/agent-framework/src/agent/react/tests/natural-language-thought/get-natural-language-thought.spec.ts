import { RouterProcess } from '@master-thesis-agentic-ai/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../../logger';
import { AIProvider } from '../../../../services';
import { getNaturalLanguageThought } from '../../get-natural-language-thought';
import { mockAgentTools } from '../router.spec.config';
import { TEST_AI_PROVIDERS, TEST_CONFIG, setupTest } from '../spec.config';

vi.setConfig(TEST_CONFIG);

describe('getNaturalLanguageThought', () => {
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

      it('should generate natural language thought containing relevant keywords', async () => {
        const routerProcess: RouterProcess = {
          question: 'What is the weather in Tokyo?',
          maxIterations: 3,
          iterationHistory: [],
        };

        const result = await getNaturalLanguageThought(
          mockAgentTools,
          routerProcess,
          aiProvider,
          logger,
          '',
        );

        expect(result).toBeDefined();
        expect(typeof result).toBe('string');
        expect(result.length).toBeGreaterThan(0);

        const lowerResult = result.toLowerCase();

        expect(lowerResult).toMatch(/get.?weather/);
        expect(lowerResult).toMatch(/tokyo/);
      });
    });
  }
});
