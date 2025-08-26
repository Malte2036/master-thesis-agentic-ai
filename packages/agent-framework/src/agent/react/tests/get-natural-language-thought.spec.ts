import { RouterProcess } from '@master-thesis-agentic-ai/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../logger';
import { AIProvider, OllamaProvider } from '../../../services';
import { getNaturalLanguageThought } from '../get-natural-language-thought';
import mockAgentToolsComplex from './router.spec.config.complex';
import { TEST_OLLAMA_BASE_URL, TEST_AI_PROVIDERS } from './spec.config';
import { mockAgentTools } from './router.spec.config';

vi.setConfig({ testTimeout: 10000 });

describe('getNaturalLanguageThought', () => {
  for (const { provider, model, structuredModel } of TEST_AI_PROVIDERS) {
    describe(`with model ${model} and structured model ${
      structuredModel ?? model
    }`, () => {
      let aiProvider: AIProvider;
      let logger: Logger;

      beforeEach(() => {
        const testName = expect.getState().currentTestName || 'unknown-test';
        const sanitizedTestName = testName
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');

        logger = new Logger({
          agentName: sanitizedTestName,
          logsSubDir: `${model}-${structuredModel ?? model}`,
        });

        if (provider === 'ollama') {
          aiProvider = new OllamaProvider(logger, {
            baseUrl: TEST_OLLAMA_BASE_URL,
            model,
          });
        } else {
          throw new Error(`Unsupported provider: ${provider}`);
        }
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
