import { Router } from '@master-thesis-agentic-ai/agent-framework';
import { RouterResponse } from '@master-thesis-agentic-ai/types';

export const getRouterResponse = async (
  agent: Router,
  question: string,
  maxIterations: number,
) => {
  const routerIterator = agent.routeQuestion(question, maxIterations);
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
