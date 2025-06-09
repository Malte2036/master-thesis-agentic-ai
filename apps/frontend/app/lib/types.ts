import { z } from 'zod';

const RouterResponseFriendlySchema = z.object({
  friendlyResponse: z.string(),
  ai_model: z.string(),
  process: z
    .object({
      question: z.string(),
      maxIterations: z.number(),
      iterationHistory: z
        .array(
          z.object({
            iteration: z.number(),
            naturalLanguageThought: z.string(),
            observation: z.string(),
            structuredThought: z.object({
              agentCalls: z.array(
                z.object({
                  agent: z.string(),
                  function: z.string(),
                  args: z.record(z.unknown()),
                }),
              ),
              isFinished: z.boolean(),
            }),
          }),
        )
        .nullish(),
    })
    .nullish(),
  error: z.string().nullish(),
});

const RouterResponseWithIdSchema = RouterResponseFriendlySchema.extend({
  _id: z.string(),
});

// Export the main schemas
export { RouterResponseFriendlySchema, RouterResponseWithIdSchema };

// Export inferred types
export type RouterResponseFriendly = z.infer<
  typeof RouterResponseFriendlySchema
>;
export type RouterResponseWithId = z.infer<typeof RouterResponseWithIdSchema>;
