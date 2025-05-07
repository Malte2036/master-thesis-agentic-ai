import { IAgentFramework } from './schemas/agent';
import { ExpressAgentAdapter } from './adapters/express';
import { getAgentPort, AgentName } from './config';

export function createAgentFramework(agentName: AgentName): IAgentFramework {
  return new ExpressAgentAdapter(getAgentPort(agentName));
}

export * from './schemas/agent';
export * from './schemas/request';
export * from './config';
export * from './services';
