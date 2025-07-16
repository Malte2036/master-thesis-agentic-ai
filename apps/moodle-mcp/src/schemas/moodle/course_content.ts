import { z } from 'zod';

export const CourseContentSchema = z.object({
  id: z.number(),
  name: z.string(),
  summary: z.string(),
  section: z.number(),
  modules: z.array(
    z.object({
      id: z.number(),
      name: z.string(),
      description: z.string().optional(),
      modname: z.string(),
      contents: z
        .array(
          z.object({
            type: z.string(),
            filename: z.string(),
            fileurl: z.string(),
            mimetype: z.string().optional(),
            author: z.string().nullable(),
          }),
        )
        .optional(),
    }),
  ),
});

export const CourseContentsResponseSchema = z.array(CourseContentSchema);

export type CourseContent = z.infer<typeof CourseContentSchema>;
export type CourseContentsResponse = z.infer<
  typeof CourseContentsResponseSchema
>;
