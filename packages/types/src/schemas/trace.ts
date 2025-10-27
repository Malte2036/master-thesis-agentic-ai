import z from 'zod/v4';

export const ToolCallTraceSchema = z.object({
  tool: z.string(),
  args: z.record(z.string(), z.any()),
  obs: z.string(),
});

export type ToolCallTrace = z.infer<typeof ToolCallTraceSchema>;
