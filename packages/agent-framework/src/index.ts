import { ExpressAgentAdapter } from './adapters/express';
import { AgentName, AgentNameSchema, getAgentConfig } from './config';
import { IAgentFramework } from './schemas/agent';

export function createAgentFramework(agentName: AgentName): IAgentFramework {
  const parsedAgentName = AgentNameSchema.safeParse(agentName);
  if (!parsedAgentName.success) {
    throw new Error(`Invalid agent name: ${agentName}`);
  }

  return new ExpressAgentAdapter(getAgentConfig(parsedAgentName.data).port);
}

export * from './config';
export * from './schemas/agent';
export * from './schemas/request';
export * from './services';
export * from './utils/schema';
export * from './schemas/router';
