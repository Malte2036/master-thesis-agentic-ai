import {
  AgentTool,
  ToolCall,
  ToolCallWithResult,
} from '@master-thesis-agentic-ai/types';
import { MCPClient } from '../../../adapters';
import { getMcpClient } from '../../../adapters/mcp/mcp_client_utils';
import { MCPName } from '../../../config';
import { Logger } from '../../../logger';
import { RouterAIOptions, RouterSystemPromptOptions } from '../../router';
import { listAgentsToolsToAgentTools } from '../../utils';
import { ReActRouter } from './router';

export class MCPReActRouterRouter extends ReActRouter {
  protected constructor(
    logger: Logger,
    aiOptions: RouterAIOptions,
    systemPromptOptions: RouterSystemPromptOptions,
    agentTools: AgentTool[],
    private readonly mcpClient: MCPClient,
  ) {
    super(logger, aiOptions, systemPromptOptions, agentTools);
  }

  static async create(
    logger: Logger,
    aiOptions: RouterAIOptions,
    systemPromptOptions: RouterSystemPromptOptions,
    mcpName: MCPName,
  ) {
    const mcpClient = await getMcpClient(logger, mcpName);
    const listAgentsTools = await mcpClient.listTools();
    const agentTools = listAgentsToolsToAgentTools(listAgentsTools);

    return new MCPReActRouterRouter(
      logger,
      aiOptions,
      systemPromptOptions,
      agentTools,
      mcpClient,
    );
  }

  protected override async callClientInParallel(
    functionCalls: ToolCall[],
    remainingCalls: number,
    contextId: string,
  ): Promise<ToolCallWithResult[]> {
    if (remainingCalls < 0) {
      throw new Error(
        'Maximum number of LLM calls reached. Please try rephrasing your question.',
      );
    }

    return await Promise.all(
      functionCalls.map(async (functionCall) => {
        try {
          this.logger.log(
            `Calling tool ${functionCall.function} with args: ${JSON.stringify(
              functionCall.args,
              null,
              2,
            )}`,
          );

          const result = await this.mcpClient.callTool(
            functionCall.function,
            functionCall.args,
            contextId,
          );

          if (result.content[0].type !== 'text') {
            throw new Error('Result is not a text');
          }
          const resultString = result.content[0].text;

          this.logger.debug(
            `Result from ${functionCall.function}: ${JSON.stringify(
              resultString,
              null,
              2,
            )}`,
          );

          return {
            ...functionCall,
            type: 'mcp',
            result: resultString,
          };
        } catch (error) {
          this.logger.error(
            `Error calling tool ${functionCall.function}:`,
            error,
          );
          return {
            ...functionCall,
            type: 'mcp',
            result: `Error while calling tool ${functionCall.function}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          };
        }
      }),
    );
  }

  override disconnectClient = () =>
    this.mcpClient.terminateSession().then(() => this.mcpClient.disconnect());
}
