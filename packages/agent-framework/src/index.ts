import { IAgentFramework } from './schemas/agent';
import { ExpressAgentAdapter } from './adapters/express';

const getPort = (agentName: string): number => {
  switch (agentName) {
    case 'moodle-agent':
      return 3000;
    default:
      console.error(`Unknown agent name: ${agentName}`);
      return 3001;
  }
};

export function createAgentFramework(agentName: string): IAgentFramework {
  return new ExpressAgentAdapter(getPort(agentName));
}

export * from './schemas/agent';
export * from './schemas/request';
