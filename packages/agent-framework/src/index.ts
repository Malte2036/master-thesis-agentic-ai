import { A2AServer, MinimalAgentCard } from './adapters/a2a/a2a_server';
import { McpServerAgentAdapter } from './adapters/mcp/mcp_server';
import { Router } from './agent';
import { MCPName, MCPNameSchema, getMCPConfig } from './config';
import { Logger } from './logger';
import { AIProvider } from './services';

export function createMCPServerFramework(logger: Logger, agentName: MCPName) {
  const parsedAgentName = MCPNameSchema.safeParse(agentName);
  if (!parsedAgentName.success) {
    throw new Error(`Invalid agent name: ${agentName}`);
  }

  return new McpServerAgentAdapter(logger, getMCPConfig(parsedAgentName.data));
}

export function createA2AFramework(
  logger: Logger,
  port: number,
  card: MinimalAgentCard,
  router: Router,
  aiProvider: AIProvider,
) {
  return new A2AServer(logger, port, card, router, aiProvider);
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
