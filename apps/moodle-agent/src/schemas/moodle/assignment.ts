import { z } from 'zod';
import { MinimalCourseSchema } from './course';

// Schema for a single assignment
export const AssignmentSchema = z.object({
  id: z.number(),
  course: z.number(),
  name: z.string(),
  nosubmissions: z.number(),
  submissiondrafts: z.number(),
  duedate: z.number(),
  allowsubmissionsfromdate: z.number(),
  grade: z.number(),
  timemodified: z.number(),
  completionsubmit: z.number(),
  cutoffdate: z.number(),
  gradingduedate: z.number(),
  teamsubmission: z.number(),
  requireallteammemberssubmit: z.number(),
  teamsubmissiongroupingid: z.number(),
  maxattempts: z.number(),
  intro: z.string(),
  timelimit: z.number(),
});

export const AssignmentsResponseSchema = z.object({
  courses: z.array(MinimalCourseSchema),
});

// Type exports
export type Assignment = z.infer<typeof AssignmentSchema>;
export type AssignmentsResponse = z.infer<typeof AssignmentsResponseSchema>;
