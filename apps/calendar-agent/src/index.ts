import {
  createAgentFramework,
  createResponseError,
  IAgentRequestHandler,
} from '@master-thesis-agentic-rag/agent-framework';
import dotenv from 'dotenv';
import { CreateCalendarEventRequestDataSchema } from './schemas/request/request';
import { CalendarProvider } from './providers/moodleProvider';

dotenv.config();

const calendarProvider = new CalendarProvider();

const agentFramework = createAgentFramework('calendar-agent');

const createCalendarEventHandler: IAgentRequestHandler = async (
  payload,
  callback,
) => {
  const parsed = CreateCalendarEventRequestDataSchema.safeParse(payload.body);
  if (!parsed.success) {
    callback(createResponseError('Invalid request data', 400));
    return;
  }

  const { event_name, event_description, event_start_date, event_end_date } =
    parsed.data;

  await calendarProvider.createCalendarEvent(
    event_name,
    event_description,
    event_start_date,
    event_end_date,
  );

  // TODO: Implement this in an calendar agent
  callback(null, {
    success: true,
  });
};

agentFramework.registerEndpoint(
  'create_calendar_event',
  createCalendarEventHandler,
);

// Start the server and keep it running
agentFramework.listen().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
