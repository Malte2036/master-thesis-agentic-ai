import { Logger } from '@master-thesis-agentic-rag/agent-framework';

export class CalendarProvider {
  constructor(private readonly logger: Logger) {}

  async createCalendarEvent(
    event_name: string,
    event_description: string,
    event_start_date: string,
    event_end_date: string,
  ) {
    this.logger.log('Creating calendar event', {
      event_name,
      event_description,
      event_start_date,
      event_end_date,
    });
  }
}
