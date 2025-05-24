import { z } from 'zod';

// MCP Agent Call Types
export const McpAgentCallSchema = z.object({
  agent: z.string().describe('The name of the agent to call'),
  function: z.string().describe('The name of the function to call'),
  args: z.record(z.string(), z.unknown()),
});

export type McpAgentCall = z.infer<typeof McpAgentCallSchema>;

export const McpAgentCallsSchema = z.object({
  agentCalls: z.array(McpAgentCallSchema).optional(),
});
