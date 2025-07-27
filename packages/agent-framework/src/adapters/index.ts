// import { ListToolsResult } from '@modelcontextprotocol/sdk/types';
import { MCPClient } from './mcp/mcp_client';

// TODO: Fix this
type ListToolsResult = any;

export type AgentTools = Record<string, ListToolsResult>;

export const getAgentTools = async (
  agents: MCPClient[],
): Promise<AgentTools> => {
  const agentTools: AgentTools = {};
  for (const agent of agents) {
    const tools = await agent.listTools();
    agentTools[agent.name] = tools;
  }
  return agentTools;
};

export * from './a2a/index';
export * from './mcp/index';
