import { ExpressAgentAdapter } from './adapters/express';
import { AgentName, getAgentConfig } from './config';
import { IAgentFramework } from './schemas/agent';

export function createAgentFramework(agentName: AgentName): IAgentFramework {
  return new ExpressAgentAdapter(getAgentConfig(agentName).port);
}

export * from './config';
export * from './schemas/agent';
export * from './schemas/request';
export * from './services';
export * from './utils/schema';
