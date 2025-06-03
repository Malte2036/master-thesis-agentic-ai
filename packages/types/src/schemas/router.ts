import { z } from 'zod/v4';
import { McpAgentCallSchema } from './agent';

export const StructuredThoughtResponseSchema = z.object({
  agentCalls: z
    .array(McpAgentCallSchema)
    .describe(
      'The agent calls to make. The agentCalls array must contain only the immediate next function to call. Do not include future function calls.',
    ),
  isFinished: z
    .boolean()
    .describe('Whether the agent has finished its task.')
    .default(false),
});

export type StructuredThoughtResponse = z.infer<
  typeof StructuredThoughtResponseSchema
>;

export const RouterProcessSchema = z.object({
  question: z.string(),
  maxIterations: z.number(),
  response: z.string().optional(),
  iterationHistory: z
    .array(
      z.object({
        iteration: z.number(),
        naturalLanguageThought: z.string(),
        observation: z.string(),
        structuredThought: StructuredThoughtResponseSchema,
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
  naturalLanguageThought: string,
  structuredThought: StructuredThoughtResponse,
  observation: string,
): RouterProcess => {
  return {
    ...routerProcess,
    iterationHistory: [
      ...(routerProcess.iterationHistory || []),
      {
        iteration,
        naturalLanguageThought,
        structuredThought,
        observation,
      },
    ],
  };
};
