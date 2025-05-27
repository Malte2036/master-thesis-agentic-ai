import {
  RouterResponse,
  RouterProcess,
} from '@master-thesis-agentic-rag/types';

export interface Router {
  routeQuestion(
    question: string,
    maxIterations: number,
  ): AsyncGenerator<RouterProcess, RouterResponse, unknown>;
}
