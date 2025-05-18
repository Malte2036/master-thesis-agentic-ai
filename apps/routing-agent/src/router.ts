export interface Router {
  routeQuestion(question: string, moodle_token: string): Promise<any>;
}
