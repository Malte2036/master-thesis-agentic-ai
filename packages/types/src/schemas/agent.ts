import { z } from 'zod/v4';

// MCP Agent Call Types
export const ToolCallSchema = z.object({
  function: z.string().describe('The name of the function to call'),
  args: z
    .record(
      z.string().describe('The name of the parameter'),
      z
        .union([
          z.string(),
          z.number(),
          z.boolean(),
          z.record(
            z.string(),
            z.union([z.string(), z.number(), z.boolean(), z.any()]),
          ),
        ])
        .describe('The value of the parameter.'),
    )
    .describe(
      'The arguments to call the function with. The keys are the parameter names and the values are the parameter values.',
    ),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;

export const ToolCallWithResultSchema = ToolCallSchema.extend({
  type: z.literal('mcp').describe('The type of the tool call.'),
  result: z.string().describe('The result of the tool call.'),
});

export type ToolCallWithResult = z.infer<typeof ToolCallWithResultSchema>;

// Lazy import function to handle circular dependency
// Using require() to ensure the module is fully loaded before accessing the export
const getRouterProcessSchema = (): z.ZodTypeAny => {
  const routerModule = require('./router');
  const schema =
    routerModule.RouterProcessSchema ||
    routerModule.default?.RouterProcessSchema;
  if (!schema) {
    throw new Error(
      'RouterProcessSchema is not available. Circular dependency may not be resolved.',
    );
  }
  return schema;
};

export const AgentToolCallWithResultSchema = ToolCallSchema.extend({
  type: z.literal('agent').describe('The type of the tool call.'),
  result: z.string().describe('The result of the tool call.'),
  internalRouterProcess: z
    .lazy(getRouterProcessSchema)
    .describe(
      'The internal router process that was used inside the agent to call the tool.',
    )
    .nullable()
    .optional(),
});

export type AgentToolCallWithResult = z.infer<
  typeof AgentToolCallWithResultSchema
>;
