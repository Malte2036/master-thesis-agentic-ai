import { z } from 'zod';

export const RequestDataSchema = z.object({
  moodle_token: z.string(),
  course_id: z.number().optional(),
});

export type RequestData = z.infer<typeof RequestDataSchema>;
