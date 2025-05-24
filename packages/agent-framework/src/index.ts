import { McpServerAgentAdapter } from './adapters/mcp_server';
import { AgentName, AgentNameSchema, getAgentConfig } from './config';

export function createAgentFramework(agentName: AgentName) {
  const parsedAgentName = AgentNameSchema.safeParse(agentName);
  if (!parsedAgentName.success) {
    throw new Error(`Invalid agent name: ${agentName}`);
  }

  return new McpServerAgentAdapter(getAgentConfig(parsedAgentName.data));
}

export * from './config';
export * from './schemas/agent';
export * from './schemas/request';
export * from './services';
export * from './utils/schema';
export * from './schemas/router';
export * from './adapters/mcp_client';
export * from './adapters/mcp_server';

export {
  CallToolResult,
  ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';
