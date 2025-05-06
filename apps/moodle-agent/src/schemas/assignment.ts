import { z } from "zod";
import { CourseSchema } from "./course";

// Schema for a single assignment
export const AssignmentSchema = z.object({
  id: z.number(),
  course: z.number(),
  name: z.string(),
  intro: z.string().optional(),
  duedate: z.number(),
  allowsubmissionsfromdate: z.number(),
  cutoffdate: z.number(),
});

export const AssignmentsResponseSchema = z.object({
  courses: z.array(CourseSchema),
});

// Type exports
export type Assignment = z.infer<typeof AssignmentSchema>;
export type AssignmentsResponse = z.infer<typeof AssignmentsResponseSchema>;
