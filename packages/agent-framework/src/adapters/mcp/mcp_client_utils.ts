import { FunctionCall } from '@master-thesis-agentic-ai/types';
import { MCPName, getMCPConfig } from '../../config';
import { Logger } from '../../logger';
import { MCPClient } from './mcp_client';

export async function callMcpClientInParallel(
  logger: Logger,
  mcpClient: MCPClient,
  functionCalls: FunctionCall[],
  remainingCalls: number,
  contextId: string,
): Promise<string[]> {
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

        const result = await mcpClient.callTool(
          functionCall.function,
          functionCall.args,
          contextId,
        );

        if (result.content[0].type !== 'text') {
          throw new Error('Result is not a text');
        }
        const resultString = result.content[0].text;

        logger.debug(
          `Result from ${functionCall.function}: ${JSON.stringify(
            resultString,
            null,
            2,
          )}`,
        );

        return resultString;
      } catch (error) {
        logger.error(`Error calling tool ${functionCall.function}:`, error);
        return `Error while calling tool ${functionCall.function}: ${error instanceof Error ? error.message : 'Unknown error occurred'}`;
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
