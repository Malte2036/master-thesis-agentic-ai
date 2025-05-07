import { z } from 'zod';
import { AssignmentSchema } from './assignment';

export const MinimalCourseSchema = z.object({
  id: z.number(),
  fullname: z.string(),
  shortname: z.string(),
  timemodified: z.number(),
  assignments: z.array(z.lazy(() => AssignmentSchema)).optional(),
});

// Schema for a course
export const CourseSchema = MinimalCourseSchema.extend({
  displayname: z.string().nullable(),
  enrolledusercount: z.number(),
  visible: z.number(),
  summary: z.string().nullable(),
  courseimage: z.string().nullable(),
  completed: z.boolean(),
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
