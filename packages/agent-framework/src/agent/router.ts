import { RouterResponse, RouterProcess } from '@master-thesis-agentic-ai/types';

export interface Router {
  routeQuestion(
    question: string,
    maxIterations: number,
  ): AsyncGenerator<RouterProcess, RouterResponse, unknown>;
}
