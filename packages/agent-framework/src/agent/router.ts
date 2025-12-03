import {
  AgentToolCallWithResult,
  RouterProcess,
  StructuredThoughtResponse,
  ToolCall,
  ToolCallWithResult,
} from '@master-thesis-agentic-ai/types';
import { AIProvider } from '../services';

export type AgentName = `${string}-agent`;

export type RouterAIOptions = {
  aiProvider: AIProvider;
  structuredAiProvider: AIProvider;
};

export type RouterSystemPromptOptions = {
  extendedNaturalLanguageThoughtSystemPrompt: string;
};

export type GeneratedThoughtsResponse = {
  naturalLanguageThought: string;
  todoThought: string | undefined;
  structuredThought: StructuredThoughtResponse;
};

export abstract class Router {
  abstract routeQuestion(
    question: string,
    maxIterations: number,
    contextId: string,
  ): AsyncGenerator<RouterProcess, RouterProcess, unknown>;

  protected abstract disconnectClient(): Promise<void>;

  protected abstract callClientInParallel(
    functionCalls: ToolCall[],
    remainingCalls: number,
    contextId: string,
  ): Promise<ToolCallWithResult[] | AgentToolCallWithResult[]>;

  protected abstract generateThoughts(
    routerProcess: RouterProcess,
  ): Promise<GeneratedThoughtsResponse>;
}
