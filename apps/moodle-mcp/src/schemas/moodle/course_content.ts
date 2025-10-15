import { z } from 'zod';

export const CourseContentSchema = z.object({
  id: z.number().describe('Content ID'),
  name: z.string().describe('Content Name'),
  summary: z.string().describe('Summary'),
  section: z.number().describe('Section'),
  modules: z
    .array(
      z.object({
        id: z.number().describe('Module ID'),
        name: z.string().describe('Module Name'),
        description: z.string().optional().describe('Description'),
        modname: z.string().describe('Module Type'),
        contents: z
          .array(
            z.object({
              type: z.string().describe('Content Type'),
              filename: z.string().describe('Filename'),
              fileurl: z.string().describe('File URL'),
              mimetype: z.string().optional().describe('MIME Type'),
              author: z.string().nullable().describe('Author'),
            }),
          )
          .optional()
          .describe('Contents'),
      }),
    )
    .describe('Modules'),
});

export const CourseContentsResponseSchema = z.array(CourseContentSchema);

export type CourseContent = z.infer<typeof CourseContentSchema>;
export type CourseContentsResponse = z.infer<
  typeof CourseContentsResponseSchema
>;
