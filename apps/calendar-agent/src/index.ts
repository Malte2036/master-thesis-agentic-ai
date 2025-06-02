import { createAgentFramework } from '@master-thesis-agentic-rag/agent-framework';
import dotenv from 'dotenv';
import { CalendarProvider } from './providers/calendarProvider';
import { z } from 'zod/v3';
import { createResponseError } from '@master-thesis-agentic-rag/types';

dotenv.config();

const calendarProvider = new CalendarProvider();
const agentFramework = createAgentFramework('calendar-agent');
const mcpServer = agentFramework.getServer();

mcpServer.tool(
  'create_calendar_event',
  'Create a new calendar event with the specified details.',
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
    if (!event_name || !event_start_date || !event_end_date) {
      throw createResponseError('Required fields are missing', 400);
    }

    await calendarProvider.createCalendarEvent(
      event_name,
      event_description,
      event_start_date,
      event_end_date,
    );

    return {
      content: [{ type: 'text', text: JSON.stringify({ success: true }) }],
    };
  },
);

// Start the server and keep it running
agentFramework.listen().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
