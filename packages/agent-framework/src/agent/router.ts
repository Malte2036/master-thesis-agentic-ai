import {
  FunctionCall,
  RouterProcess,
  RouterResponse,
} from '@master-thesis-agentic-ai/types';
import { AIProvider } from '../services';

export type RouterAIOptions = {
  aiProvider: AIProvider;
  structuredAiProvider: AIProvider;
};

export type RouterSystemPromptOptions = {
  extendedNaturalLanguageThoughtSystemPrompt: string;
};

export abstract class Router {
  abstract routeQuestion(
    question: string,
    maxIterations: number,
    contextId: string,
  ): AsyncGenerator<RouterProcess, RouterResponse, unknown>;

  protected abstract disconnectClient(): Promise<void>;

  protected abstract callClientInParallel(
    functionCalls: FunctionCall[],
    remainingCalls: number,
    contextId: string,
  ): Promise<string[]>;
}
