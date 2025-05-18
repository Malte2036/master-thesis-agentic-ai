import { z } from 'zod';

export const RequestDataSchema = z.object({
  moodle_token: z.string(),
  course_id: z.number().optional(),
  course_name: z.string().optional(),
  course_ids: z.array(z.number()).optional(),
});

export type RequestData = z.infer<typeof RequestDataSchema>;
