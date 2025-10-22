import { Logger } from '@master-thesis-agentic-ai/agent-framework';
import { google } from 'googleapis';
import { oauth2Client } from '../auth/google';

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
}
