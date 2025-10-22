import { Logger } from '@master-thesis-agentic-ai/agent-framework';

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

    const response = await fetch(
      `${this.calendarBaseUrl}/create_calendar_event`,
      {
        method: 'POST',
        body: JSON.stringify({
          eventName,
          eventDescription,
          eventStartDate,
          eventEndDate,
        }),
      },
    );

    if (!response.ok) {
      this.logger.error(
        `Failed to create calendar event: ${response.statusText}`,
        {
          status: response.status,
          statusText: response.statusText,
          body: await response.text(),
        },
      );
      throw new Error(
        `Failed to create calendar event: ${response.statusText}`,
      );
    }

    const data = await response.json();

    return data;
  }
}
