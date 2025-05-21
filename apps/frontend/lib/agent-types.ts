import { z } from 'zod';

// Copied from packages/agent-framework/src/schemas/agent.ts
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

// Copied from packages/agent-framework/src/schemas/router.ts
export const RouterProcessSchema = z.object({
  question: z.string(),
  maxIterations: z.number(),
  response: z.string().optional(),
  iterationHistory: z
    .array(
      z.object({
        iteration: z.number(),
        thought: z.string(),
        summary: z.string(),
        agentCalls: z.array(AgentCallSchema).optional(),
        isFinished: z.boolean(),
      }),
    )
    .optional(),
});
export type RouterProcess = z.infer<typeof RouterProcessSchema>;

export const RouterResponseSchema = z.object({
  process: RouterProcessSchema.optional(),
  error: z.string().optional(),
});
export type RouterResponse = z.infer<typeof RouterResponseSchema>;

export const RouterResponseFriendlySchema = RouterResponseSchema.extend({
  friendlyResponse: z.string(),
});
export type RouterResponseFriendly = z.infer<
  typeof RouterResponseFriendlySchema
>;
