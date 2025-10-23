import { Logger } from '@master-thesis-agentic-ai/agent-framework';
import { calendar_v3, google } from 'googleapis';
import { oauth2Client } from '../auth/google';
import z from 'zod';
import { createResponseError } from '@master-thesis-agentic-ai/types';

const CalendarEventSchema = z.object({
  id: z.string().nullish(),
  summary: z.string().nullish(),
  start: z
    .object({
      dateTime: z.string(),
      timeZone: z.string(),
    })
    .nullish()
    .transform((val) => (val ? val.dateTime : undefined)),
  end: z
    .object({
      dateTime: z.string(),
      timeZone: z.string(),
    })
    .nullish()
    .transform((val) => (val ? val.dateTime : undefined)),
  description: z.string().nullish(),
  attendees: z
    .array(
      z.object({
        email: z.string().nullish(),
        displayName: z.string().nullish(),
      }),
    )
    .nullish(),
  location: z.string().nullish(),
  htmlLink: z.string().nullish(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export class CalendarProvider {
  constructor(
    private readonly logger: Logger,
    private readonly calendarBaseUrl: string,
  ) {}

  public async createCalendarEvent(
    eventName: string,
    eventDescription: string,
    eventStartDate: string,
    eventEndDate: string,
  ): Promise<string> {
    this.logger.debug('Creating calendar event', {
      eventName,
      eventDescription,
      eventStartDate,
      eventEndDate,
    });

    // Ensure dateTime includes timezone information
    const formatDateTime = (dateString: string): string => {
      // If the date string doesn't include timezone info, add UTC timezone
      if (
        !dateString.includes('Z') &&
        !dateString.includes('+') &&
        !dateString.includes('-', 10)
      ) {
        return dateString.endsWith('Z') ? dateString : `${dateString}Z`;
      }
      return dateString;
    };

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const event = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary: eventName,
        description: eventDescription,
        start: { dateTime: formatDateTime(eventStartDate) },
        end: { dateTime: formatDateTime(eventEndDate) },
      },
    });

    this.logger.debug('Calendar event created', { event });

    return 'Calendar event created';
  }

  public async getCalendarEvents(): Promise<CalendarEvent[] | undefined> {
    this.logger.debug('Getting calendar events');

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const events = await calendar.events.list({ calendarId: 'primary' });

    this.logger.debug(
      'Calendar events',
      JSON.stringify(events.data.items, null, 2),
    );

    const validatedEvents = CalendarEventSchema.array().safeParse(
      events.data.items,
    );
    if (!validatedEvents.success) {
      this.logger.error('Failed to validate calendar events', {
        error: validatedEvents.error,
      });
      throw Error('Failed to validate calendar events');
    }

    return validatedEvents.data;
  }

  public async updateCalendarEvent(
    eventId: string,
    event: CalendarEvent,
  ): Promise<string> {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const events = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.start },
        end: { dateTime: event.end },
        attendees: event.attendees?.map((attendee) => ({
          email: attendee.email,
          displayName: attendee.displayName,
        })),
        location: event.location,
        htmlLink: event.htmlLink,
      },
    });

    const validatedUpdatedEvent = CalendarEventSchema.safeParse(events.data);
    if (!validatedUpdatedEvent.success) {
      this.logger.error('Failed to validate updated calendar event', {
        error: validatedUpdatedEvent.error,
      });
      throw Error('Failed to validate updated calendar event');
    }

    this.logger.debug(
      'Calendar event updated',
      JSON.stringify(validatedUpdatedEvent.data, null, 2),
    );

    return `Successfully updated calendar event with id ${validatedUpdatedEvent.data.id}. Updated event: ${JSON.stringify(validatedUpdatedEvent.data)}`;
  }
}
