import { z } from 'zod/v4';
import { ToolCallSchema, ToolCallWithResultSchema } from './agent';
import { AgentToolSchema } from './tool';

// Lazy import function to handle circular dependency
// Using require() to ensure the module is fully loaded before accessing the export
const getAgentToolCallWithResultSchema = (): z.ZodTypeAny => {
  const agentModule = require('./agent');
  const schema =
    agentModule.AgentToolCallWithResultSchema ||
    agentModule.default?.AgentToolCallWithResultSchema;
  if (!schema) {
    throw new Error(
      'AgentToolCallWithResultSchema is not available. Circular dependency may not be resolved.',
    );
  }
  return schema;
};

export const StructuredThoughtResponseSchema = z.object({
  functionCalls: z
    .array(ToolCallSchema)
    .describe('The tool calls to make.')
    .default([]),
  isFinished: z
    .boolean()
    .describe('Whether the agent has finished its task.')
    .default(false),
});

export type StructuredThoughtResponse = z.infer<
  typeof StructuredThoughtResponseSchema
>;

export const StructuredThoughtResponseWithResultsSchema =
  StructuredThoughtResponseSchema.extend({
    functionCalls: z
      .array(
        z.lazy(getAgentToolCallWithResultSchema).or(ToolCallWithResultSchema),
      )
      .describe('The tool calls with results.'),
  });

export type StructuredThoughtResponseWithResults = z.infer<
  typeof StructuredThoughtResponseWithResultsSchema
>;

export const RouterIterationSchema = z.object({
  iteration: z.number(),
  naturalLanguageThought: z.string(),
  structuredThought: StructuredThoughtResponseWithResultsSchema,
});

export type RouterIteration = z.infer<typeof RouterIterationSchema>;

export const RouterProcessSchema = z.object({
  contextId: z.string(),
  question: z.string(),
  maxIterations: z.number(),
  response: z.string().optional(),
  iterationHistory: z.array(RouterIterationSchema),
  error: z.string().optional(),
  agentTools: z.array(AgentToolSchema),
});

export type RouterProcess = z.infer<typeof RouterProcessSchema>;

export const addIterationToRouterProcess = (
  routerProcess: RouterProcess,
  iteration: number,
  naturalLanguageThought: string,
  structuredThought: StructuredThoughtResponseWithResults,
): RouterProcess => {
  return {
    ...routerProcess,
    iterationHistory: [
      ...(routerProcess.iterationHistory || []),
      {
        iteration,
        naturalLanguageThought,
        structuredThought,
      },
    ],
  };
};
