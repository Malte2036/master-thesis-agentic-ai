import { RouterResponse } from '@master-thesis-agentic-rag/agent-framework';

export interface Router {
  routeQuestion(
    question: string,
    moodle_token: string,
    maxIterations: number,
  ): Promise<RouterResponse>;
}
