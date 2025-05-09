export class CalendarProvider {
  async createCalendarEvent(
    event_name: string,
    event_description: string,
    event_start_date: string,
    event_end_date: string,
  ) {
    console.log('Creating calendar event', {
      event_name,
      event_description,
      event_start_date,
      event_end_date,
    });
  }
}
