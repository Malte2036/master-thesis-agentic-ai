import { McpServerAgentAdapter } from './adapters/mcp_server';
import { AgentName, AgentNameSchema, getAgentConfig } from './config';
import { Logger } from './logger';

export function createAgentFramework(logger: Logger, agentName: AgentName) {
  const parsedAgentName = AgentNameSchema.safeParse(agentName);
  if (!parsedAgentName.success) {
    throw new Error(`Invalid agent name: ${agentName}`);
  }

  return new McpServerAgentAdapter(
    logger,
    getAgentConfig(parsedAgentName.data),
  );
}

export * from './config';
export * from './services';
export * from './adapters';
export { Logger, LoggerConfig } from './logger';

export {
  CallToolResult,
  ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';
