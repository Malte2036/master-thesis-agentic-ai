import {
  AgentTool,
  AgentToolCallWithResult,
  ToolCall,
} from '@master-thesis-agentic-ai/types';
import { AgentClient } from '../../../adapters';
import { Logger } from '../../../logger';
import {
  AgentName,
  RouterAIOptions,
  RouterSystemPromptOptions,
} from '../../router';
import { ReActRouter } from './router';

export class A2AReActRouter extends ReActRouter {
  protected constructor(
    logger: Logger,
    aiOptions: RouterAIOptions,
    systemPromptOptions: RouterSystemPromptOptions,
    agentTools: AgentTool[],
    agentName: AgentName,
    private readonly agentClients: AgentClient[],
  ) {
    super(logger, aiOptions, systemPromptOptions, agentTools, agentName);
  }

  static async create(
    logger: Logger,
    aiOptions: RouterAIOptions,
    systemPromptOptions: RouterSystemPromptOptions,
    agentTools: AgentTool[],
    agentName: AgentName,
    agentClients: AgentClient[],
  ) {
    return new A2AReActRouter(
      logger,
      aiOptions,
      systemPromptOptions,
      agentTools,
      agentName,
      agentClients,
    );
  }

  protected override disconnectClient(): Promise<void> {
    return Promise.resolve();
  }

  private getAgentClient(functionName: string): AgentClient | undefined {
    return this.agentClients.find((agent) => agent.name === functionName);
  }

  private getAgentNames(): string[] {
    return this.agentClients.map((agent) => agent.name);
  }

  protected override async callClientInParallel(
    functionCalls: ToolCall[],
    remainingCalls: number,
    contextId: string,
  ): Promise<AgentToolCallWithResult[]> {
    if (remainingCalls < 0) {
      throw new Error(
        'Maximum number of LLM calls reached. Please try rephrasing your question.',
      );
    }

    this.logger.log(
      'Calling tools in parallel:',
      functionCalls.map((call) => call.function),
    );

    // Process all function calls in parallel
    const results: AgentToolCallWithResult[] = await Promise.all(
      functionCalls.map(async (parsedDecision) => {
        const agentClient = this.getAgentClient(parsedDecision.function);

        if (!agentClient) {
          return {
            ...parsedDecision,
            type: 'agent',
            result: `No agent found for function: ${parsedDecision.function}. Maybe you have selected a to specific tool that is not available. Please try again with a different tool ${this.getAgentNames().join(', ')}.`,
          } satisfies AgentToolCallWithResult;
        }

        try {
          const prompt = parsedDecision.args['prompt'] as string;
          if (!prompt) {
            throw new Error('Prompt is required');
          }

          let message = prompt;
          const parameters = parsedDecision.args['parameters'] as
            | string
            | undefined;
          if (parameters) {
            message += `\n\nAdditional parameters:\n${parameters}`;
          }

          const result = await agentClient.call(message, contextId);

          return {
            ...parsedDecision,
            type: 'agent',
            result: result.message,
            internalRouterProcess: result.process ?? null,
          } satisfies AgentToolCallWithResult;
        } catch (error) {
          this.logger.log(
            `Error calling agent ${parsedDecision.function}:`,
            error,
          );
          return {
            ...parsedDecision,
            type: 'agent',
            result: `Error calling agent: ${error}`,
            internalRouterProcess: null,
          } satisfies AgentToolCallWithResult;
        }
      }),
    );

    this.logger.log('All agent calls completed:', results);

    return results;
  }
}
