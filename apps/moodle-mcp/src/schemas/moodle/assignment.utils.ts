import { z } from 'zod';
import { Assignment } from './assignment';

export const includeAssignmentInResponseSchema = z.object({
  course: z
    .boolean()
    .nullish()
    .describe(
      'Whether to include the course id the assignment belongs to in the response.',
    ),
  nosubmissions: z
    .boolean()
    .nullish()
    .describe(
      'Whether to include the assignment no submissions in the response.',
    ),
  submissiondrafts: z
    .boolean()
    .nullish()
    .describe(
      'Whether to include the assignment submission drafts in the response.',
    ),
  duedate: z
    .boolean()
    .nullish()
    .describe('Whether to include the assignment due date in the response.'),
  allowsubmissionsfromdate: z
    .boolean()
    .nullish()
    .describe(
      'Whether to include the assignment allow submissions from date in the response.',
    ),
  grade: z
    .boolean()
    .nullish()
    .describe('Whether to include the assignment grade in the response.'),
  timemodified: z
    .boolean()
    .nullish()
    .describe(
      'Whether to include the assignment timemodified in the response.',
    ),
  completionsubmit: z
    .boolean()
    .nullish()
    .describe(
      'Whether to include the assignment completionsubmit in the response.',
    ),
  cutoffdate: z
    .boolean()
    .nullish()
    .describe('Whether to include the assignment cutoffdate in the response.'),
  gradingduedate: z
    .boolean()
    .nullish()
    .describe(
      'Whether to include the assignment gradingduedate in the response.',
    ),
  teamsubmission: z
    .boolean()
    .nullish()
    .describe(
      'Whether to include the assignment teamsubmission in the response.',
    ),
  requireallteammemberssubmit: z
    .boolean()
    .nullish()
    .describe(
      'Whether to include the assignment requireallteammemberssubmit in the response.',
    ),
  teamsubmissiongroupingid: z
    .boolean()
    .nullish()
    .describe(
      'Whether to include the assignment teamsubmissiongroupingid in the response.',
    ),
  maxattempts: z
    .boolean()
    .nullish()
    .describe('Whether to include the assignment maxattempts in the response.'),
  intro: z
    .boolean()
    .nullish()
    .describe('Whether to include the assignment intro in the response.'),
  timelimit: z
    .boolean()
    .nullish()
    .describe('Whether to include the assignment timelimit in the response.'),
});

export const filterAssignment = (
  data: Assignment,
  include_in_response?: z.infer<typeof includeAssignmentInResponseSchema>,
): Partial<Assignment> => {
  const filteredAssignment: Partial<Assignment> = {
    id: data.id,
    name: data.name,
  };

  Object.entries(include_in_response ?? {}).forEach(([key, value]) => {
    if (value) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (filteredAssignment as any)[key] = data[key as keyof typeof data];
    }
  });

  return filteredAssignment;
};
