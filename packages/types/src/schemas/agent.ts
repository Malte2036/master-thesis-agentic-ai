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
  result: z.string().describe('The result of the tool call.'),
});

export type ToolCallWithResult = z.infer<typeof ToolCallWithResultSchema>;
