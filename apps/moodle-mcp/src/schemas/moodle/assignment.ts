import { z } from 'zod';
import { MinimalCourseSchema } from './course';

// Schema for a single assignment
export const AssignmentSchema = z.object({
  id: z.number().describe('Assignment ID'),
  course: z.number().describe('Course ID'),
  name: z.string().describe('Assignment Name'),
  nosubmissions: z.number().describe('No Submissions'),
  submissiondrafts: z.number().describe('Submission Drafts'),
  duedate: z.number().describe('Due Date'),
  allowsubmissionsfromdate: z.number().describe('Open From Date'),
  grade: z.number().describe('Max Grade'),
  timemodified: z.number().describe('Time Modified'),
  completionsubmit: z.number().describe('Submit to Complete'),
  cutoffdate: z.number().describe('Cutoff Date'),
  gradingduedate: z.number().describe('Grading Due Date'),
  teamsubmission: z.number().describe('Team Submission'),
  requireallteammemberssubmit: z
    .number()
    .describe('Require All Team Members Submit'),
  teamsubmissiongroupingid: z.number().describe('Team Submission Grouping ID'),
  maxattempts: z.number().describe('Max Attempts'),
  intro: z.string().describe('Introduction'),
  timelimit: z.number().describe('Time Limit'),
});

export const AssignmentsResponseSchema = z.object({
  courses: z.array(MinimalCourseSchema),
});

// Type exports
export type Assignment = z.infer<typeof AssignmentSchema>;
export type AssignmentsResponse = z.infer<typeof AssignmentsResponseSchema>;
