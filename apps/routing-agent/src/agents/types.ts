import { z } from 'zod';

export interface AgentResponse {
  agent: string;
  function: AgentCallFunction | undefined;
  response: unknown;
}

export const AgentCallFunctionSchema = z.object({
  functionName: z.string(),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export type AgentCallFunction = z.infer<typeof AgentCallFunctionSchema>;

export const AgentCallSchema = z.object({
  agentName: z.string(),
  functionsToCall: z.array(AgentCallFunctionSchema).optional(),
});

export const AgentCallsSchema = z.object({
  agentCalls: z.array(AgentCallSchema).optional(),
  answer: z.string().nullish(),
});

export type AgentCalls = z.infer<typeof AgentCallsSchema>;
