import {
  CallToolResult,
  getAgentConfigs,
  McpAgentCall,
  MCPClient,
} from '@master-thesis-agentic-rag/agent-framework';

export async function callMcpAgentsInParallel(
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
      const client = mcpClients.find(
        (client) => client.name === agentCall.agent,
      );
      if (!client) {
        throw new Error(
          `Agent ${agentCall.agent} not found. So we cannot call tool ${agentCall.function}.`,
        );
      }
      try {
        return await client.callTool(agentCall.function, agentCall.args ?? {});
      } catch (error) {
        console.error(
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

export const getAllAgentsMcpClients = async (): Promise<MCPClient[]> => {
  const allAgents = getAgentConfigs(false);

  return Object.entries(allAgents).map(([, agent]) => {
    const client = new MCPClient(agent);
    client.connect();
    return client;
  });
};
