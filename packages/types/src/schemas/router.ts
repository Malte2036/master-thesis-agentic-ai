import { z } from 'zod/v4';
import { ToolCallWithResultSchema } from './agent';

export const StructuredThoughtResponseSchema = z.object({
  functionCalls: z
    .array(ToolCallWithResultSchema)
    .describe('The tool calls to make.'),
  isFinished: z
    .boolean()
    .describe('Whether the agent has finished its task.')
    .default(false),
});

export type StructuredThoughtResponse = z.infer<
  typeof StructuredThoughtResponseSchema
>;

export const RouterIterationSchema = z.object({
  iteration: z.number(),
  naturalLanguageThought: z.string(),
  structuredThought: StructuredThoughtResponseSchema,
  response: z.string(),
});

export type RouterIteration = z.infer<typeof RouterIterationSchema>;

export const RouterProcessSchema = z.object({
  contextId: z.string(),
  question: z.string(),
  maxIterations: z.number(),
  response: z.string().optional(),
  iterationHistory: z.array(RouterIterationSchema),
  error: z.string().optional(),
});

export type RouterProcess = z.infer<typeof RouterProcessSchema>;

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
