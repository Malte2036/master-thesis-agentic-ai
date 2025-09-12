import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../../logger';
import { AIProvider } from '../../../../services';
import { getStructuredThought } from '../../get-structured-thought';
import { mockAgentTools } from '../router.spec.config';
import { setupTest, TEST_AI_PROVIDERS, TEST_TIMEOUT } from '../spec.config';

vi.setConfig({ testTimeout: TEST_TIMEOUT });

describe('getStructuredThought', () => {
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
