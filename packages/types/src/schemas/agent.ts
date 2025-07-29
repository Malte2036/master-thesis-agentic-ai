import { z } from 'zod/v4';

// MCP Agent Call Types
export const FunctionCallSchema = z.object({
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

export type FunctionCall = z.infer<typeof FunctionCallSchema>;

export const FunctionCallsSchema = z.object({
  functionCalls: z
    .array(FunctionCallSchema)
    .describe('The function calls to make.'),
});

export type FunctionCalls = z.infer<typeof FunctionCallsSchema>;
