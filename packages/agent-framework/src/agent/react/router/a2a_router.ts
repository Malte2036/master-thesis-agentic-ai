import { FunctionCall } from '@master-thesis-agentic-ai/types';
import { AgentClient } from '../../../adapters';
import { Logger } from '../../../logger';
import { RouterAIOptions, RouterSystemPromptOptions } from '../../router';
import { AgentTool } from '../types';
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

  private getAgentClient(functionName: string): AgentClient {
    const agentClient = this.agentClients.find(
      (agent) => agent.name === functionName,
    );
    if (!agentClient) {
      throw new Error(`No agent found for function: ${functionName}`);
    }
    return agentClient;
  }

  protected override async callClientInParallel(
    functionCalls: FunctionCall[],
    remainingCalls: number,
    contextId: string,
  ): Promise<string[]> {
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
    const agentPromises = functionCalls.map(async (parsedDecision) => {
      const agentClient = this.getAgentClient(parsedDecision.function);

      try {
        return await agentClient.call(
          `${parsedDecision.args['prompt']}; We want to call the agent because: ${parsedDecision.args['reason']}`,
          contextId,
        );
      } catch (error) {
        this.logger.log(
          `Error calling agent ${parsedDecision.function}:`,
          error,
        );
        return { message: `Error calling agent: ${error}`, process: undefined };
      }
    });

    // Wait for all agent calls to complete
    const results = await Promise.all(agentPromises);

    this.logger.log('All agent calls completed:', results);

    return results.map((result) => result.message);
  }
}
