import { McpAgentCall } from '@master-thesis-agentic-ai/types';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MCPClient } from './mcp_client';
import { MCPName, getMCPConfig } from '../../config';
import { Logger } from '../../logger';

export async function callMcpClientInParallel(
  logger: Logger,
  mcpClients: MCPClient[],
  agentCalls: McpAgentCall[],
  remainingCalls: number,
): Promise<CallToolResult[]> {
  if (remainingCalls < 0) {
    throw new Error(
      'Maximum number of LLM calls reached. Please try rephrasing your question.',
    );
  }

  return await Promise.all(
    agentCalls.map(async (agentCall) => {
      let client = mcpClients.find((client) => client.name === agentCall.agent);

      if (!client) {
        client = mcpClients.find((client) =>
          client
            .listTools()
            .then((res) =>
              res.tools.find(
                (tool: { name: string }) => tool.name === agentCall.function,
              ),
            ),
        );
        if (client) {
          logger.warn(
            `Found agent by reverse function lookup: ${agentCall.agent}. We do not want to do this in the future!`,
          );
        }
      }

      if (!client) {
        throw new Error(
          `Agent ${agentCall.agent} not found. So we cannot call tool ${agentCall.function}.`,
        );
      }
      try {
        logger.log(
          `Calling tool ${agentCall.function} on agent ${agentCall.agent} with args: ${JSON.stringify(
            agentCall.args,
            null,
            2,
          )}`,
        );

        return await client.callTool(agentCall.function, agentCall.args);
      } catch (error) {
        logger.error(
          `Error calling tool ${agentCall.function} on agent ${agentCall.agent}:`,
          error,
        );
        return {
          content: [
            {
              type: 'text',
              text: `Error while calling tool ${agentCall.function} on agent ${agentCall.agent}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
            },
          ],
        };
      }
    }),
  );
}

export const getMcpClient = async (
  logger: Logger,
  name: MCPName,
): Promise<MCPClient> => {
  const client = new MCPClient(logger, getMCPConfig(name));
  client.connect();
  return client;
};
