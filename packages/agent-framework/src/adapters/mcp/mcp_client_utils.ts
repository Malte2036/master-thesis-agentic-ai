import { FunctionCall } from '@master-thesis-agentic-ai/types';
import { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { MCPClient } from './mcp_client';
import { MCPName, getMCPConfig } from '../../config';
import { Logger } from '../../logger';

export async function callMcpClientInParallel(
  logger: Logger,
  mcpClient: MCPClient,
  functionCalls: FunctionCall[],
  remainingCalls: number,
): Promise<CallToolResult[]> {
  if (remainingCalls < 0) {
    throw new Error(
      'Maximum number of LLM calls reached. Please try rephrasing your question.',
    );
  }

  return await Promise.all(
    functionCalls.map(async (functionCall) => {
      try {
        logger.log(
          `Calling tool ${functionCall.function} with args: ${JSON.stringify(
            functionCall.args,
            null,
            2,
          )}`,
        );

        return await mcpClient.callTool(
          functionCall.function,
          functionCall.args,
        );
      } catch (error) {
        logger.error(`Error calling tool ${functionCall.function}:`, error);
        return {
          content: [
            {
              type: 'text',
              text: `Error while calling tool ${functionCall.function}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
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
