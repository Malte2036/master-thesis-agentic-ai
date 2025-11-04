import {
  AgentTool,
  AgentToolCallWithResult,
  ToolCall,
} from '@master-thesis-agentic-ai/types';
import { AgentClient } from '../../../adapters';
import { Logger } from '../../../logger';
import { RouterAIOptions, RouterSystemPromptOptions } from '../../router';
import { ReActRouter } from './router';

export class A2AReActRouter extends ReActRouter {
  protected constructor(
    logger: Logger,
    aiOptions: RouterAIOptions,
    systemPromptOptions: RouterSystemPromptOptions,
    agentTools: AgentTool[],
    private readonly agentClients: AgentClient[],
  ) {
    super(logger, aiOptions, systemPromptOptions, agentTools);
  }

  static async create(
    logger: Logger,
    aiOptions: RouterAIOptions,
    systemPromptOptions: RouterSystemPromptOptions,
    agentTools: AgentTool[],
    agentClients: AgentClient[],
  ) {
    return new A2AReActRouter(
      logger,
      aiOptions,
      systemPromptOptions,
      agentTools,
      agentClients,
    );
  }

  protected override disconnectClient(): Promise<void> {
    return Promise.resolve();
  }

  private getAgentClient(functionName: string): AgentClient | undefined {
    return this.agentClients.find((agent) => agent.name === functionName);
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

    functionCalls = functionCalls.map((call) => ({
      ...call,
      function: call.function.split('/')[0],
    }));

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
            result: `No agent found for function: ${parsedDecision.function}`,
          } satisfies AgentToolCallWithResult;
        }

        try {
          const result = await agentClient.call(
            `${parsedDecision.args['prompt']}; We want to call the agent because: ${parsedDecision.args['reason']}`,
            contextId,
          );

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
