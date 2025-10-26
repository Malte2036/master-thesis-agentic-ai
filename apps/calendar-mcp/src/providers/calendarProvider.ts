import { Logger } from '@master-thesis-agentic-ai/agent-framework';
import { google } from 'googleapis';
import z from 'zod';
import { oauth2Client } from '../auth/google';
import { createResponseError } from '@master-thesis-agentic-ai/types';

const GOOGLE_API_SETTINGS =
  process.env.NODE_ENV === 'test'
    ? {
        http2: false,
        rootUrl: 'http://wiremock:8080/',
      }
    : undefined;

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
  recurrence: z.array(z.string()).nullish(),
});

export type CalendarEvent = z.infer<typeof CalendarEventSchema>;

export const PatchCalendarEventSchema = z.object({
  summary: z.string().nullish(),
  description: z.string().nullish(),
});

export type PatchCalendarEvent = z.infer<typeof PatchCalendarEventSchema>;

// Utility function to check if error is a 404
const errorHasStatusCode = (error: unknown, statusCode: number): boolean => {
  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    (error as { code: number }).code === statusCode
  ) {
    return true;
  }
  return false;
};

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

export class CalendarProvider {
  constructor(private readonly logger: Logger) {
    this.logger.debug(
      `Using ${GOOGLE_API_SETTINGS ? 'Wiremock' : 'Google'} API`,
    );
  }

  public async createCalendarEvent(
    eventName: string,
    eventDescription: string | undefined,
    eventStartDate: string,
    eventEndDate: string,
    location: string | undefined,
    recurrenceRules: string[] | undefined,
  ): Promise<CalendarEvent> {
    this.logger.debug('Creating calendar event', {
      eventName,
      eventDescription,
      eventStartDate,
      eventEndDate,
      recurrenceRules,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = await calendar.events.insert(
      {
        calendarId: 'primary',
        requestBody: {
          summary: eventName,
          description: eventDescription,
          start: {
            dateTime: formatDateTime(eventStartDate),
            timeZone: 'UTC',
          },
          end: {
            dateTime: formatDateTime(eventEndDate),
            timeZone: 'UTC',
          },
          location: location,
          recurrence: recurrenceRules ?? undefined,
        },
      },
      GOOGLE_API_SETTINGS,
    );

    const validatedEvent = CalendarEventSchema.safeParse(event.data);
    if (!validatedEvent.success) {
      this.logger.error('Failed to validate created calendar event', {
        error: validatedEvent.error,
      });
      throw Error('Failed to validate created calendar event');
    }

    return validatedEvent.data;
  }

  public async getCalendarEvents(
    startDate: string | undefined,
    endDate: string | undefined,
  ): Promise<CalendarEvent[]> {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const events = await calendar.events.list(
      {
        calendarId: 'primary',
        timeMin: startDate,
        timeMax: endDate,
      },
      GOOGLE_API_SETTINGS,
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

  public async findCalendarEventsByFreeTextQuery(
    query: string,
  ): Promise<CalendarEvent[]> {
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
    const events = await calendar.events.list(
      {
        calendarId: 'primary',
        q: query,
      },
      GOOGLE_API_SETTINGS,
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

  public async patchCalendarEvent(
    eventId: string,
    data: {
      summary: string | undefined;
      description: string | undefined;
      start: string | undefined;
      end: string | undefined;
      location: string | undefined;
    },
  ): Promise<CalendarEvent> {
    this.logger.debug('Patching calendar event', {
      eventId,
      data,
    });

    let events;
    try {
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      events = await calendar.events.patch(
        {
          calendarId: 'primary',
          eventId: eventId,
          requestBody: {
            summary: data.summary,
            description: data.description,
            start: {
              dateTime: data.start ? formatDateTime(data.start) : undefined,
            },
            end: { dateTime: data.end ? formatDateTime(data.end) : undefined },
            location: data.location,
          },
        },
        GOOGLE_API_SETTINGS,
      );
    } catch (error: unknown) {
      if (errorHasStatusCode(error, 404)) {
        this.logger.error(
          `Calendar event with eventId "${eventId}" could not be found:`,
          error,
        );
        throw createResponseError(
          `Calendar event with eventId "${eventId}" could not be found`,
          404,
        );
      }
      throw createResponseError('Failed to update calendar event', 500);
    }

    const validatedUpdatedEvent = CalendarEventSchema.safeParse(events.data);
    if (!validatedUpdatedEvent.success) {
      this.logger.error('Failed to validate updated calendar event', {
        error: validatedUpdatedEvent.error,
      });
      throw Error('Failed to validate updated calendar event');
    }

    return validatedUpdatedEvent.data;
  }
}
