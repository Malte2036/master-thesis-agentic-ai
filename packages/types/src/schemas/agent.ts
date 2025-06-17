import { z } from 'zod/v4';

// MCP Agent Call Types
export const McpAgentCallSchema = z.object({
  agent: z.string().describe('The name of the agent to call'),
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

export type McpAgentCall = z.infer<typeof McpAgentCallSchema>;

export const McpAgentCallsSchema = z.object({
  agentCalls: z
    .array(McpAgentCallSchema)
    .describe(
      'The agent calls to make. The agentCalls array must contain only the immediate next function to call. Do not include future function calls.',
    ),
});

export type McpAgentCalls = z.infer<typeof McpAgentCallsSchema>;
