import { z } from 'zod/v4';

const AgentToolArgSchema: z.ZodType = z.lazy(() =>
  z.object({
    type: z.string(),
    description: z.string().optional(),
    required: z.boolean(),
    properties: z.record(z.string(), AgentToolArgSchema).optional(),
  }),
);

export const AgentToolSchema = z.object({
  name: z.string(),
  description: z.string(),
  args: z.record(z.string(), AgentToolArgSchema),
});

export type AgentTool = z.infer<typeof AgentToolSchema>;
