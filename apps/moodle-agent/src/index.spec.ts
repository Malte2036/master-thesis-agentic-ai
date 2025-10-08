import { describe, it, expect } from 'vitest';
import { RouterResponse } from '@master-thesis-agentic-ai/types';
import { getRouter } from './index';

const MODEL = 'qwen3:4b';

describe('Moodle Agent Tests', () => {
  it('should be able to get the user info', async () => {
    const agent = await getRouter(MODEL);

    const routerIterator = agent.routeQuestion(
      'Can you help me get my user information?',
      5,
    );

    let routerResponse: RouterResponse | undefined;
    while (true) {
      const { value, done } = await routerIterator.next();
      if (done) {
        routerResponse = value;
        break;
      }
    }

    expect(routerResponse?.error).toBeUndefined();
    expect(routerResponse?.process?.iterationHistory).toBeDefined();
    expect(routerResponse?.process?.iterationHistory?.[0]?.response).toContain(
      'Sabrina Studentin',
    );

    expect(routerResponse?.process?.iterationHistory?.length).toBe(2);
    expect(
      routerResponse?.process?.iterationHistory?.[1]?.structuredThought
        .isFinished,
    ).toBe(true);

    // Test completed successfully
  }, 60_000);
});
