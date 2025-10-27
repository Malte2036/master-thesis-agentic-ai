import {
  createMCPServerFramework,
  getContextIdFromMcpServerRequestHandlerExtra,
  Logger,
  objectsToHumanReadableString,
} from '@master-thesis-agentic-ai/agent-framework';
import { createResponseError } from '@master-thesis-agentic-ai/types';
import dotenv from 'dotenv';
import { z } from 'zod/v3';
import { googleAuthRoutes } from './auth/google';
import { CalendarEvent, CalendarProvider } from './providers/calendarProvider';

dotenv.config();

const logger = new Logger({ agentName: 'calendar-mcp' });

const mcpServerFramework = createMCPServerFramework(
  logger,
  'calendar-mcp',
  googleAuthRoutes(logger),
);
const mcpServer = mcpServerFramework.getServer();

mcpServer.tool(
  'create_calendar_event',
  'Create a new calendar event (one-time or recurring).',
  {
    event_name: z.string().describe('Name (summary) of the calendar event'),
    event_description: z
      .string()
      .describe('Description of the calendar event')
      .nullish(),
    event_start_date: z
      .string()
      .describe(
        'Start date of the event in ISO format (e.g., 2025-10-22T13:00:00Z). If the event is recurring, this is the start date of the first occurrence.',
      ),
    event_end_date: z
      .string()
      .describe(
        'End date of the event in ISO format (e.g., 2025-10-22T14:00:00Z). If the event is recurring, this is the end date of the first occurrence.',
      ),
    location: z.string().describe('Location of the calendar event').nullish(),
    recurrence_rules: z
      .string()
      .describe(
        'Recurrence rule for the event in RFC5545 format (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR", "FREQ=DAILY;COUNT=10"). Leave empty for one-time events.',
      )
      .transform((val) =>
        val ? [`RRULE:${val.replace(/\s/g, '')}`] : undefined,
      )
      .nullish(),
  },
  async (
    {
      event_name,
      event_description,
      event_start_date,
      event_end_date,
      location,
      recurrence_rules,
    },
    extra,
  ) => {
    const contextId = getContextIdFromMcpServerRequestHandlerExtra(extra);
    const calendarProvider = new CalendarProvider(logger, contextId);

    let createdEvent: CalendarEvent;
    try {
      createdEvent = await calendarProvider.createCalendarEvent(
        event_name,
        event_description ?? undefined,
        event_start_date,
        event_end_date,
        location ?? undefined,
        recurrence_rules ?? undefined,
      );
    } catch (error) {
      logger.error('Failed to create calendar event:', error);
      throw createResponseError('Failed to create calendar event', 500);
    }

    const eventType = recurrence_rules
      ? 'recurring calendar event'
      : 'calendar event';
    const humanReadableResponse = `We successfully created the ${eventType}:  \n\n${objectsToHumanReadableString(
      [createdEvent],
      {
        serializeOptions: {
          observation: {
            source: 'google_calendar_api',
            total_items: 1,
            generated_at: new Date().toISOString(),
          },
        },
      },
    )}`;

    logger.log(`create_calendar_event: \n${humanReadableResponse}`);
    return {
      content: [
        {
          type: 'text',
          text: humanReadableResponse,
        },
      ],
    };
  },
);

mcpServer.tool(
  'update_calendar_event',
  'Update a calendar event.',
  {
    event_id: z
      .string()
      .describe(
        'ID of the calendar event to update. This is a identifier, not the name of the event.',
      ),
    data: z.object({
      summary: z.string().describe('Summary of the calendar event').nullish(),
      description: z
        .string()
        .describe('Description of the calendar event')
        .nullish(),
      start: z
        .string()
        .describe(
          'Start date of the event in ISO format (e.g., 2025-10-22T13:00:00Z)',
        )
        .nullish(),
      end: z
        .string()
        .describe(
          'End date of the event in ISO format (e.g., 2025-10-22T14:00:00Z)',
        )
        .nullish(),
      location: z.string().describe('Location of the calendar event').nullish(),
    }),
  },
  async ({ event_id, data }, extra) => {
    const contextId = getContextIdFromMcpServerRequestHandlerExtra(extra);
    const calendarProvider = new CalendarProvider(logger, contextId);

    const updatedEvent = await calendarProvider.patchCalendarEvent(event_id, {
      summary: data.summary ?? undefined,
      description: data.description ?? undefined,
      start: data.start ?? undefined,
      end: data.end ?? undefined,
      location: data.location ?? undefined,
    });

    const humanReadableResponse = `We successfully updated the calendar event:  \n\n${objectsToHumanReadableString(
      [updatedEvent],
      {
        serializeOptions: {
          observation: {
            source: 'google_calendar_api',
            total_items: 1,
            generated_at: new Date().toISOString(),
          },
        },
      },
    )}`;
    logger.log(`update_calendar_event: \n${humanReadableResponse}`);
    return { content: [{ type: 'text', text: humanReadableResponse }] };
  },
);

mcpServer.tool(
  'get_calendar_events',
  'Get all calendar events for the current user.',
  {
    start_date: z
      .string()
      .describe(
        'Start date of the events in RFC3339 timestamp format (e.g., 2025-10-22T13:00:00Z)',
      )
      .nullish(),
    end_date: z
      .string()
      .describe(
        'End date of the events in RFC3339 timestamp format (e.g., 2025-10-22T14:00:00Z)',
      )
      .nullish(),
  },
  async ({ start_date, end_date }, extra) => {
    const contextId = getContextIdFromMcpServerRequestHandlerExtra(extra);
    const calendarProvider = new CalendarProvider(logger, contextId);

    let calendarEvents: CalendarEvent[];
    try {
      calendarEvents = await calendarProvider.getCalendarEvents(
        start_date ?? undefined,
        end_date ?? undefined,
      );
    } catch (error) {
      logger.error('Failed to get calendar events:', error);
      throw createResponseError('Failed to get calendar events', 500);
    }

    const humanReadableResponse = `We found ${calendarEvents.length} calendar events.\n\n${objectsToHumanReadableString(
      calendarEvents,
      {
        serializeOptions: {
          observation: {
            source: 'google_calendar_api',
            total_items: calendarEvents.length,
            generated_at: new Date().toISOString(),
          },
        },
      },
    )}`;
    logger.log(`get_calendar_events: \n${humanReadableResponse}`);
    return { content: [{ type: 'text', text: humanReadableResponse }] };
  },
);

mcpServer.tool(
  'find_calendar_events_by_free_text_query',
  'Find calendar events by a free text query.',
  {
    query: z.string().describe('Query to find calendar events'),
  },
  async ({ query }, extra) => {
    const contextId = getContextIdFromMcpServerRequestHandlerExtra(extra);
    const calendarProvider = new CalendarProvider(logger, contextId);

    let calendarEvents: CalendarEvent[];
    try {
      calendarEvents =
        await calendarProvider.findCalendarEventsByFreeTextQuery(query);
    } catch (error) {
      logger.error('Failed to find calendar events by free text query:', error);
      throw createResponseError(
        'Failed to find calendar events by free text query',
        500,
      );
    }

    const humanReadableResponse = `We found ${calendarEvents.length} calendar events by the free text query: ${query}.\n\n${objectsToHumanReadableString(
      calendarEvents,
      {
        serializeOptions: {
          observation: {
            source: 'google_calendar_api',
            total_items: calendarEvents.length,
            generated_at: new Date().toISOString(),
          },
        },
      },
    )}`;
    logger.log(
      `find_calendar_events_by_free_text_query: \n${humanReadableResponse}`,
    );
    return { content: [{ type: 'text', text: humanReadableResponse }] };
  },
);

// Start the server and keep it running
mcpServerFramework.listen().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
