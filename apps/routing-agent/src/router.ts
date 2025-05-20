export interface Router {
  routeQuestion(
    question: string,
    moodle_token: string,
    maxIterations: number,
  ): Promise<any>;
}
