import { z } from 'zod';
import { RequestPayload } from './request';

export interface IAgentCallback {
  (error?: Error | null, result?: unknown): void;
}

export interface IAgentRequestHandler {
  (payload: RequestPayload, callback: IAgentCallback): Promise<void> | void;
}

export interface IAgentFramework {
  registerEndpoint(endpointName: string, handler: IAgentRequestHandler): void;
  listen(): Promise<void>;
}

export interface AgentResponse {
  agent: string;
  function: AgentCallFunction | undefined;
  response: unknown;
}

export const AgentCallFunctionSchema = z.object({
  functionName: z.string(),
  description: z.string(),
  parameters: z.record(z.string(), z.unknown()).optional(),
});

export type AgentCallFunction = z.infer<typeof AgentCallFunctionSchema>;

export const AgentCallSchema = z.object({
  agentName: z.string(),
  functionsToCall: z.array(AgentCallFunctionSchema).optional(),
});

export type AgentCall = z.infer<typeof AgentCallSchema>;
export const AgentCallsSchema = z.object({
  agentCalls: z.array(AgentCallSchema).optional(),
  answer: z.string().nullish(),
});

export type AgentCalls = z.infer<typeof AgentCallsSchema>;
