import { RouterProcess } from '@master-thesis-agentic-ai/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../logger';
import { AIProvider, OllamaProvider } from '../../services';
import { ReActRouter } from './router';
import { getMockAgentTools, TEST_AI_PROVIDERS } from './router.spec.config';
import { MCPName } from '../../config';

const OllamaBaseUrl = 'http://10.50.60.153:11434';

vi.setConfig({ testTimeout: 10000 });

describe('ReActRouter', () => {
  for (const { provider, model, structuredModel } of TEST_AI_PROVIDERS) {
    describe(`with model ${model} and structured model ${structuredModel ?? model}`, () => {
      let aiProvider: AIProvider;
      let structuredAiProvider: AIProvider;
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
            baseUrl: OllamaBaseUrl,
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
      });

      describe('getNaturalLanguageThought', () => {
        it('should generate natural language thought containing relevant keywords', async () => {
          const routerProcess: RouterProcess = {
            question: 'What is the weather in Tokyo?',
            maxIterations: 3,
            iterationHistory: [],
          };

          const router = new ReActRouter(
            aiProvider,
            structuredAiProvider,
            logger,
            'weather-mcp' as MCPName,
            '',
          );

          const agentTools = getMockAgentTools();

          const result = await router.getNaturalLanguageThought(
            agentTools,
            routerProcess,
          );

          expect(result).toBeDefined();
          expect(typeof result).toBe('string');
          expect(result.length).toBeGreaterThan(0);

          const lowerResult = result.toLowerCase();

          expect(lowerResult).toMatch(/get.?weather/);
          expect(lowerResult).toMatch(/tokyo/);
        });
      });
    });
  }
});
