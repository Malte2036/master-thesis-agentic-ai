import {
  RouterResponse,
  RouterProcess,
} from '@master-thesis-agentic-rag/agent-framework';

export interface Router {
  routeQuestion(
    question: string,
    maxIterations: number,
  ): AsyncGenerator<RouterProcess, RouterResponse, unknown>;
}
