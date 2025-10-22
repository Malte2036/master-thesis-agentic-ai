import {
  createMCPServerFramework,
  Logger,
} from '@master-thesis-agentic-ai/agent-framework';
import { createResponseError } from '@master-thesis-agentic-ai/types';
import dotenv from 'dotenv';
import { z } from 'zod/v3';
import { CalendarProvider } from './providers/calendarProvider';
import { googleAuthRoutes } from './auth/google';

dotenv.config();

const logger = new Logger({ agentName: 'calendar-mcp' });

const calendarBaseUrl = process.env.CALENDAR_BASE_URL;
if (!calendarBaseUrl) {
  throw new Error('CALENDAR_BASE_URL is not set');
}

const calendarProvider = new CalendarProvider(logger, calendarBaseUrl);

const mcpServerFramework = createMCPServerFramework(
  logger,
  'calendar-mcp',
  googleAuthRoutes(logger),
);
const mcpServer = mcpServerFramework.getServer();

mcpServer.tool(
  'create_calendar_event',
  'Create a new calendar event.',
  {
    event_name: z.string().describe('Name of the calendar event'),
    event_description: z.string().describe('Description of the calendar event'),
    event_start_date: z
      .string()
      .describe(
        'Start date of the event in ISO format (e.g., 2025-10-22T13:00:00 or 2025-10-22T13:00:00Z)',
      ),
    event_end_date: z
      .string()
      .describe(
        'End date of the event in ISO format (e.g., 2025-10-22T14:00:00 or 2025-10-22T14:00:00Z)',
      ),
  },
  async ({
    event_name,
    event_description,
    event_start_date,
    event_end_date,
  }) => {
    if (
      !event_name ||
      !event_description ||
      !event_start_date ||
      !event_end_date
    ) {
      logger.error('Required fields are missing', {
        event_name,
        event_description,
        event_start_date,
        event_end_date,
      });
      throw createResponseError('Required fields are missing', 400);
    }

    try {
      await calendarProvider.createCalendarEvent(
        event_name,
        event_description,
        event_start_date,
        event_end_date,
      );
    } catch (error) {
      logger.error('Failed to create calendar event:', error);
      throw createResponseError('Failed to create calendar event', 500);
    }

    const humanReadableResponse = `We successfully created the calendar event: ${event_name} with description: ${event_description} from ${event_start_date} to ${event_end_date}.`;
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

// Start the server and keep it running
mcpServerFramework.listen().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});
