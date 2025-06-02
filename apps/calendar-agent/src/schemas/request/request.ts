import { z } from 'zod/v4';

export const CreateCalendarEventRequestDataSchema = z.object({
  event_name: z.string(),
  event_description: z.string(),
  event_start_date: z.string(),
  event_end_date: z.string(),
});

export type CreateCalendarEventRequestData = z.infer<
  typeof CreateCalendarEventRequestDataSchema
>;
