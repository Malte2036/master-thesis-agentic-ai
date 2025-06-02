import { z } from 'zod/v4';
import { McpAgentCall, McpAgentCallSchema } from './agent';

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
  ai_model: z.string(),
});

export type RouterResponseFriendly = z.infer<
  typeof RouterResponseFriendlySchema
>;

export const addIterationToRouterProcess = (
  routerProcess: RouterProcess,
  iteration: number,
  thought: string,
  summary: string,
  agentCalls: McpAgentCall[],
  isFinished: boolean,
): RouterProcess => {
  return {
    ...routerProcess,
    iterationHistory: [
      ...(routerProcess.iterationHistory || []),
      {
        iteration,
        thought,
        summary,
        agentCalls: agentCalls,
        isFinished,
      },
    ],
  };
};
