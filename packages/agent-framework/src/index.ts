import { A2AServer, MinimalAgentCard } from './adapters/a2a_server';
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

export function createA2AFramework(
  logger: Logger,
  port: number,
  card: MinimalAgentCard,
) {
  return new A2AServer(logger, port, card);
}

export * from './adapters';
export * from './config';
export { Logger, LoggerConfig } from './logger';
export * from './services';
export * from './agent';

export {
  CallToolResult,
  ListToolsResult,
} from '@modelcontextprotocol/sdk/types.js';
