import {
  createMCPServerFramework,
  Logger,
} from '@master-thesis-agentic-ai/agent-framework';
import { createResponseError } from '@master-thesis-agentic-ai/types';
import dotenv from 'dotenv';
import { z } from 'zod/v3';

dotenv.config();

const logger = new Logger({ agentName: 'calendar-mcp' });

// const calendarProvider = new CalendarProvider(logger);
const mcpServerFramework = createMCPServerFramework(logger, 'calendar-mcp');
const mcpServer = mcpServerFramework.getServer();

mcpServer.tool(
  'create_calendar_event',
  'Create a new calendar event.',
  {
    event_name: z.string().describe('Name of the calendar event'),
    event_description: z.string().describe('Description of the calendar event'),
    event_start_date: z
      .string()
      .describe('Start date of the event in ISO format'),
    event_end_date: z.string().describe('End date of the event in ISO format'),
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

    return {
      content: [
        {
          type: 'text',
          text: `Successfully created calendar event: ${event_name} with description: ${event_description} from ${event_start_date} to ${event_end_date}`,
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
