import { z } from "zod";
import { AssignmentSchema } from "./assignment";

// Schema for a course
export const CourseSchema = z.object({
  id: z.number(),
  fullname: z.string(),
  shortname: z.string(),
  summary: z.string().optional(),
  displayname: z.string().optional(),
  timemodified: z.number(),
  assignments: z.array(z.lazy(() => AssignmentSchema)).optional(),
});

// Schema for the complete Moodle API response
export const CoursesResponseSchema = z.array(CourseSchema);

// Type exports
export type Course = z.infer<typeof CourseSchema>;
export type CoursesResponse = z.infer<typeof CoursesResponseSchema>;
