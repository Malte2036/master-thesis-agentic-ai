import { AgentTool } from '@master-thesis-agentic-ai/types';

export const calendarAgentToolsMock: AgentTool[] = [
  {
    name: 'calendar-agent',
    description: 'Calendar agent for creating and managing calendar events',
    args: {
      prompt: {
        type: 'string',
        description: 'The prompt to call the agent with',
        required: true,
      },
      reason: {
        type: 'string',
        description: 'The reason for calling the agent',
        required: true,
      },
    },
  },
];

export default calendarAgentToolsMock;
