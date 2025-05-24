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

// Router Types
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
        agentCalls: z.array(McpAgentCallSchema).optional(),
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
  ai_model: z.string().optional(),
});
export type RouterResponseFriendly = z.infer<
  typeof RouterResponseFriendlySchema
>;
