import { Router } from '../index';
import { RouterResponse } from '@master-thesis-agentic-ai/types';

/**
 * Test utility for getting router responses in tests.
 * This utility helps test the router by running it to completion and returning the final response.
 *
 * @param agent - The router agent to test
 * @param question - The question to ask the router
 * @param maxIterations - Maximum number of iterations to run
 * @returns The final router response after completion
 */
export const getRouterTestResponse = async (
  agent: Router,
  question: string,
  maxIterations: number,
): Promise<RouterResponse | undefined> => {
  const routerIterator = agent.routeQuestion(
    question,
    maxIterations,
    'test-id',
  );
  let routerResponse: RouterResponse | undefined;
  while (true) {
    const { value, done } = await routerIterator.next();
    if (done) {
      routerResponse = value;
      break;
    }
  }
  return routerResponse;
};
