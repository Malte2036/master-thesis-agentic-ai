import { z } from 'zod/v4';
import { FunctionCallSchema as FunctionCallSchema } from './agent';
import { ToolCallTraceSchema } from './trace';

export const StructuredThoughtResponseSchema = z.object({
  functionCalls: z
    .array(FunctionCallSchema)
    .describe('The function calls to make.'),
  isFinished: z
    .boolean()
    .describe('Whether the agent has finished its task.')
    .default(false),
});

export type StructuredThoughtResponse = z.infer<
  typeof StructuredThoughtResponseSchema
>;

export const RouterProcessSchema = z.object({
  contextId: z.string(),
  question: z.string(),
  maxIterations: z.number(),
  response: z.string().optional(),
  iterationHistory: z
    .array(
      z.object({
        iteration: z.number(),
        naturalLanguageThought: z.string(),
        structuredThought: StructuredThoughtResponseSchema,
        response: z.string(),
      }),
    )
    .optional(),
  trace: z.array(ToolCallTraceSchema),
});

export type RouterProcess = z.infer<typeof RouterProcessSchema>;

export const RouterResponseSchema = z.object({
  process: RouterProcessSchema.optional(),
  error: z.string().optional(),
});

export type RouterResponse = z.infer<typeof RouterResponseSchema>;

export const addIterationToRouterProcess = (
  routerProcess: RouterProcess,
  iteration: number,
  naturalLanguageThought: string,
  structuredThought: StructuredThoughtResponse,
  response: string,
): RouterProcess => {
  return {
    ...routerProcess,
    iterationHistory: [
      ...(routerProcess.iterationHistory || []),
      {
        iteration,
        naturalLanguageThought,
        structuredThought,
        response,
      },
    ],
  };
};
