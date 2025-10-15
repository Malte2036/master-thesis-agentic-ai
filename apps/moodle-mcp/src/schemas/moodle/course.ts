import { z } from 'zod';
import { AssignmentSchema } from './assignment';

export const MinimalCourseSchema = z.object({
  id: z.number().describe('Course ID'),
  fullname: z.string().describe('Course Name'),
  // shortname: z.string(),
  // timemodified: z.number().optional(),
  assignments: z
    .array(z.lazy(() => AssignmentSchema))
    .optional()
    .describe('Assignments'),
});

export const SearchCourseSchema = MinimalCourseSchema.extend({
  categoryname: z.string().nullish(),
  contacts: z
    .array(
      z.object({
        id: z.number(),
        fullname: z.string(),
      }),
    )
    .nullish(),
  customfields: z
    .array(
      z.object({
        name: z.string(),
        shortname: z.string(),
        type: z.string(),
        value: z.string(),
      }),
    )
    .nullish(),
});

// Schema for a course
export const CourseSchema = MinimalCourseSchema.extend({
  displayname: z.string().nullish().describe('Display Name'),
  // enrolledusercount: z.number(),
  visible: z.number().describe('Visible'),
  summary: z
    .string()
    .nullable()
    .transform((val) => (val ? val.slice(0, 1000) : null))
    .describe('Summary'), // temp: limit summary to 1000 characters to prevent context window issues

  courseimage: z.string().nullish().describe('Course Image'),
  completed: z.boolean().nullish().describe('Completed'),
  startdate: z.number().describe('Start Date'),
  enddate: z.number().describe('End Date'),
  // lastaccess: z.number().nullable(),
  isfavourite: z.boolean().describe('Is Favourite'),
  hidden: z.boolean().describe('Hidden'),
});

// Schema for the complete Moodle API response
export const CoursesResponseSchema = z.array(CourseSchema);

// Type exports
export type MinimalCourse = z.infer<typeof MinimalCourseSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type CoursesResponse = z.infer<typeof CoursesResponseSchema>;
export type SearchCourse = z.infer<typeof SearchCourseSchema>;

export const SearchCoursesResponseSchema = z.object({
  total: z.number(),
  courses: z.array(SearchCourseSchema),
});

export type SearchCoursesResponse = z.infer<typeof SearchCoursesResponseSchema>;
