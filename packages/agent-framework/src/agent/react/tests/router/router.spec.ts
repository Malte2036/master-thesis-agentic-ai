import {
  FunctionCall,
  RouterProcess,
  RouterResponse,
} from '@master-thesis-agentic-ai/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Logger } from '../../../../logger';
import { AIProvider } from '../../../../services';
import { ReActRouter } from '../../router';
import { mockAgentTools } from '../router.spec.config';
import { TEST_AI_PROVIDERS, TEST_CONFIG, setupTest } from '../spec.config';

vi.setConfig(TEST_CONFIG);

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
      const callClientInParallel = vi.fn(
        (
          logger: Logger,
          functionCalls: FunctionCall[],
          remainingCalls: number,
        ) => {
          logger.log(
            'Calling functions in parallel:',
            functionCalls.map((call) => call.function),
          );
          switch (functionCalls[0].function) {
            case 'get_weather':
              return Promise.resolve([
                'In Tokyo, the weather is sunny',
              ] satisfies string[]);
            default:
              throw new Error(`Unknown function: ${functionCalls[0].function}`);
          }
        },
      );

      const router = new ReActRouter(
        aiProvider,
        aiProvider,
        logger,
        mockAgentTools,
        '',
        '',
        callClientInParallel,
        () => Promise.resolve(),
      );

      const routerProcess: RouterProcess = {
        question: 'What is the weather in Tokyo?',
        maxIterations: 3,
        iterationHistory: [],
        contextId: 'test-context-id',
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
      expect(routerResponse?.process?.iterationHistory?.length).toBe(2);
      expect(routerResponse.error).toBeUndefined();
    });
  }
});
