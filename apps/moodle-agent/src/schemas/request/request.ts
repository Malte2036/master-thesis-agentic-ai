import { z } from "zod";

export const RequestDataSchema = z.object({
  moodle_token: z.string(),
});

export type RequestData = z.infer<typeof RequestDataSchema>;
