import { z } from 'zod';
import { AssignmentSchema } from './assignment';

export const MinimalCourseSchema = z.object({
  id: z.number(),
  fullname: z.string(),
  shortname: z.string(),
  timemodified: z.number().optional(),
  assignments: z.array(z.lazy(() => AssignmentSchema)).optional(),
});

// Schema for a course
export const CourseSchema = MinimalCourseSchema.extend({
  displayname: z.string().nullable(),
  // enrolledusercount: z.number(),
  visible: z.number(),
  summary: z
    .string()
    .nullable()
    .transform((val) => (val ? val.slice(0, 1000) : null)), // temp: limit summary to 1000 characters to prevent context window issues
  courseimage: z.string().nullable(),
  completed: z.boolean().nullable(),
  startdate: z.number(),
  enddate: z.number(),
  lastaccess: z.number().nullable(),
  isfavourite: z.boolean(),
  hidden: z.boolean(),
});

// Schema for the complete Moodle API response
export const CoursesResponseSchema = z.array(CourseSchema);

// Type exports
export type MinimalCourse = z.infer<typeof MinimalCourseSchema>;
export type Course = z.infer<typeof CourseSchema>;
export type CoursesResponse = z.infer<typeof CoursesResponseSchema>;

export const SearchCoursesResponseSchema = z.object({
  total: z.number(),
  courses: z.array(MinimalCourseSchema),
});

export type SearchCoursesResponse = z.infer<typeof SearchCoursesResponseSchema>;
