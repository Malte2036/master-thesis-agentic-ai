import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../logger';
import { AIProvider, OllamaProvider } from '../../../services';
import { getStructuredThought } from '../get-structured-thought';
import { mockAgentTools } from './router.spec.config';
import { TEST_AI_PROVIDERS, TEST_OLLAMA_BASE_URL } from './spec.config';

vi.setConfig({ testTimeout: 10000 });

describe('getStructuredThought', () => {
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

      it('should generate structured thought containing relevant keywords', async () => {
        const result = await getStructuredThought(
          'I need to find get the weather in Tokyo. For this, I will use the `get_weather` function with the location "Tokyo".',
          mockAgentTools,
          aiProvider,
          logger,
        );

        expect(result).toBeDefined();
        expect(result.functionCalls.length).toBeGreaterThan(0);
        expect(result.functionCalls[0].function).toBe('get_weather');
        expect(result.functionCalls[0].args['location']).toBe('Tokyo');
      });
    });
  }
});
