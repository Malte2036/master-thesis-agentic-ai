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
export * from './services';
export * from './adapters';

export {
  CallToolResult,
  ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';
