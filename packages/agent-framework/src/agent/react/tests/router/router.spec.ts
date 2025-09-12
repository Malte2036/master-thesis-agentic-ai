import { RouterProcess, RouterResponse } from '@master-thesis-agentic-ai/types';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../../logger';
import { AIProvider } from '../../../../services';
import { ReActRouter } from '../../router';
import { mockAgentTools } from '../router.spec.config';
import { TEST_AI_PROVIDERS, TEST_TIMEOUT, setupTest } from '../spec.config';

vi.setConfig({ testTimeout: TEST_TIMEOUT });

describe('ReActRouter', () => {
  for (const { provider, model, structuredModel } of TEST_AI_PROVIDERS) {
    let aiProvider: AIProvider;
    let logger: Logger;

    beforeEach(() => {
      const setup = setupTest(provider, model, structuredModel);

      aiProvider = setup.aiProvider;
      logger = setup.logger;
    });

    it('should call functions in parallel', async () => {
      const callClientInParallel = vi.fn().mockResolvedValue([
        {
          content: [
            { type: 'text', text: '{location: Tokyo, weather: sunny}' },
          ],
        },
      ] satisfies CallToolResult[]);

      const router = new ReActRouter(
        aiProvider,
        aiProvider,
        logger,
        mockAgentTools,
        '',
        callClientInParallel,
        () => Promise.resolve(),
      );

      const routerProcess: RouterProcess = {
        question: 'What is the weather in Tokyo?',
        maxIterations: 3,
        iterationHistory: [],
      };

      const routerIterator = router.iterate(routerProcess);

      let routerResponse: RouterResponse | undefined;
      while (true) {
        const { value, done } = await routerIterator.next();
        if (done) {
          routerResponse = value as RouterResponse;
          break;
        }
      }

      expect(routerResponse).toBeDefined();
      expect(routerResponse?.process?.iterationHistory?.length).toBe(1);
      expect(routerResponse.error).toBeUndefined();
    });
  }
});
