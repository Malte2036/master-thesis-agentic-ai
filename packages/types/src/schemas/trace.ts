import z from 'zod/v4';

export const ToolCallSchema = z.object({
  tool: z.string(),
  args: z.record(z.string(), z.any()),
});

export type ToolCall = z.infer<typeof ToolCallSchema>;

export const ToolCallTraceSchema = ToolCallSchema.extend({
  obs: z.string(),
});

export type ToolCallTrace = z.infer<typeof ToolCallTraceSchema>;
