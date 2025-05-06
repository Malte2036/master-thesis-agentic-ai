export const AGENT_PORTS = {
  'moodle-agent': 3003,
  'frontdoor-agent': 3000,
} as const;

export type AgentName = keyof typeof AGENT_PORTS;

export function getAgentPort(agentName: AgentName): number {
  return AGENT_PORTS[agentName];
}

export function getAgentUrl(agentName: AgentName, path?: string): string {
  const port = getAgentPort(agentName);

  return `http://localhost:${port}${path}`;
}
