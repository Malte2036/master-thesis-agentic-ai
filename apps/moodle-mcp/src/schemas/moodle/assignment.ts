import { z } from 'zod';
import { MinimalCourseSchema } from './course';

// Schema for a single assignment
export const AssignmentSchema = z.object({
  id: z.number().describe('Assignment ID'),
  course: z.number().describe('Course ID'),
  name: z.string().describe('Assignment Name'),
  nosubmissions: z.number().describe('No Submissions').optional(),
  submissiondrafts: z.number().describe('Submission Drafts').optional(),
  duedate: z.number().describe('Due Date'),
  allowsubmissionsfromdate: z.number().describe('Open From Date').optional(),
  grade: z.number().describe('Max Grade').optional(),
  timemodified: z.number().describe('Time Modified').optional(),
  completionsubmit: z.number().describe('Submit to Complete').optional(),
  cutoffdate: z.number().describe('Cutoff Date').optional(),
  gradingduedate: z.number().describe('Grading Due Date').optional(),
  teamsubmission: z.number().describe('Team Submission').optional(),
  requireallteammemberssubmit: z
    .number()
    .describe('Require All Team Members Submit')
    .optional(),
  teamsubmissiongroupingid: z
    .number()
    .describe('Team Submission Grouping ID')
    .optional(),
  maxattempts: z.number().describe('Max Attempts').optional(),
  intro: z.string().describe('Introduction').optional(),
  timelimit: z.number().describe('Time Limit').optional(),
});

export const AssignmentsResponseSchema = z.object({
  courses: z.array(MinimalCourseSchema),
});

// Type exports
export type Assignment = z.infer<typeof AssignmentSchema>;
export type AssignmentsResponse = z.infer<typeof AssignmentsResponseSchema>;
