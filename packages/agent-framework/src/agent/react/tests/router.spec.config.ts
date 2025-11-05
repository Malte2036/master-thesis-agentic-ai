import { AgentTool } from '@master-thesis-agentic-ai/types';

export const mockAgentTools: AgentTool[] = [
  {
    name: 'get_weather',
    description: 'Get the weather for a location',
    args: {
      location: {
        type: 'string',
        description: 'The location to get the weather for',
        required: true,
      },
    },
  },
];

export const mockAgentToolsSequentiel: AgentTool[] = [
  {
    name: 'get_assignments',
    description: 'Get the assignments for the user',
    args: {},
  },
  {
    name: 'create_calendar_event',
    description: 'Create a calendar event',
    args: {
      title: {
        type: 'string',
        description: 'The title of the calendar event',
        required: true,
      },
      start: {
        type: 'string',
        description: 'The start date of the calendar event',
        required: true,
      },
      end: {
        type: 'string',
        description: 'The end date of the calendar event',
        required: true,
      },
    },
  },
];

export const mockAgentToolsSequentialComplex: AgentTool[] = [
  {
    name: 'moodle-agent',
    description:
      'The Moodle Agent is a specialized AI assistant for Moodle Learning Management System (LMS) operations. It can help you view your enrolled courses, search for courses, see course details, check assignments across all courses or filter by specific courses and dates, and access your personal user information. It is an essential tool for students and educators navigating their Moodle environment.',
    args: {
      prompt: {
        type: 'string',
        description:
          '\n    A clear and specific instruction describing what you want this agent to accomplish.\n    This should include the *goal*, *context*, and *expected output type* (e.g., summary, list, calendar event, etc.).\n    Example: "List all assignments due next week for my course \'Digital Health\'."',
        required: true,
      },
      parameters: {
        type: 'string',
        description:
          '\n    Structured or natural language parameters that provide additional context or control input for the agent.\n    Prefer structured data (e.g., JSON) when possible — e.g.:\n    {\n      "courseId": "CS-401",\n      "includePastAssignments": false\n    }\n    If you don\'t know all exact parameters, describe them naturally in text (the agent will infer them).',
        required: false,
      },
    },
  },
  {
    name: 'calendar-agent',
    description:
      'The Calendar Agent is a specialized AI assistant for calendar management and event scheduling. It can create new events, update existing events, view your calendar schedule, and search for events. It is an essential tool for personal and professional schedule management, meeting coordination, and time planning.',
    args: {
      prompt: {
        type: 'string',
        description:
          '\n    A clear and specific instruction describing what you want this agent to accomplish.\n    This should include the *goal*, *context*, and *expected output type* (e.g., summary, list, calendar event, etc.).\n    Example: "List all assignments due next week for my course \'Digital Health\'."',
        required: true,
      },
      parameters: {
        type: 'string',
        description:
          '\n    Structured or natural language parameters that provide additional context or control input for the agent.\n    Prefer structured data (e.g., JSON) when possible — e.g.:\n    {\n      "courseId": "CS-401",\n      "includePastAssignments": false\n    }\n    If you don\'t know all exact parameters, describe them naturally in text (the agent will infer them).',
        required: false,
      },
    },
  },
];
