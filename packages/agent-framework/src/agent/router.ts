import { RouterResponse, RouterProcess } from '@master-thesis-agentic-ai/types';

export interface Router {
  routeQuestion(
    question: string,
    maxIterations: number,
    contextId: string,
  ): AsyncGenerator<RouterProcess, RouterResponse, unknown>;
}
