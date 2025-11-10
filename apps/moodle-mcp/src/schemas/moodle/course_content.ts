import { z } from 'zod';

export const CourseContentSchema = z.object({
  // id: z.number().describe('Content ID'),
  name: z.string().describe('Content Name'),
  summary: z.string().describe('Summary'),
  section: z.number().describe('Section'),
  modules: z
    .array(
      z.object({
        id: z.number().describe('Module ID'),
        instance: z.number().describe('Module instance ID'),
        name: z.string().describe('Module Name'),
        description: z.string().optional().describe('Description'),
        modname: z.string().describe('Module Type'),
        contents: z
          .array(
            z.object({
              type: z.string().describe('Content Type'),
              filename: z.string().describe('Filename'),
              fileurl: z.string().describe('File URL'),
              // mimetype: z.string().optional().describe('MIME Type'),
              author: z.string().nullable().describe('Author'),
            }),
          )
          .optional()
          .describe('Contents'),
        // Enrichment fields for Page modules
        inlineContent: z.string().optional().describe('Page HTML content'),
        inlineContentFormat: z
          .number()
          .optional()
          .describe('Content format (1 = HTML)'),
        // Enrichment fields for Assignment modules
        intro: z.string().optional().describe('Assignment intro HTML'),
        introformat: z.number().optional().describe('Intro format (1 = HTML)'),
        duedate: z.number().optional().describe('Due date (epoch seconds)'),
      }),
    )
    .describe('Modules'),
});

export const CourseContentsResponseSchema = z.array(CourseContentSchema);

export type CourseContent = z.infer<typeof CourseContentSchema>;
export type CourseContentsResponse = z.infer<
  typeof CourseContentsResponseSchema
>;
