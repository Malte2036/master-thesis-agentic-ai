import { z } from 'zod';

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
  args: z.record(z.string(), AgentToolArgSchema).and(
    z.object({
      include_in_response: z.object({
        type: z.literal('object'),
        description: z
          .string()
          .default(
            'This option is mandatory and used to specify which fields should be included in the response.',
          )
          .optional(),
        properties: z.record(
          z.string(),
          z.object({
            type: z.literal('boolean'),
            required: z.literal(true),
          }),
        ),
        required: z.literal(true),
      }),
    }),
  ),
});

export type AgentTool = z.infer<typeof AgentToolSchema>;
