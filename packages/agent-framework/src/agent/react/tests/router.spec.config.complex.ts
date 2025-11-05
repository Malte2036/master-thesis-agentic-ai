import { AgentTool } from '@master-thesis-agentic-ai/types';

export const mockAgentToolsComplex: AgentTool[] = [
  {
    name: 'get_user_info',
    description:
      'Get personal information about the user who asked the question. This function cannot get information about other users.',
    args: {},
  },
  {
    name: 'get_course_contents',
    description: 'Get the contents of a course',
    args: {
      course_id: {
        type: 'string',
        description: 'The ID of the course to get the contents of',
        required: true,
      },
      course_name: {
        type: 'string',
        description: 'The name of the course to get the contents of',
        required: false,
      },
    },
  },
  {
    name: 'search_flights',
    description: 'Search one-way or round-trip flights',
    args: {
      origin: {
        type: 'string',
        description: 'IATA code or city (e.g., BER, “Berlin”)',
        required: true,
      },
      destination: {
        type: 'string',
        description: 'IATA code or city (e.g., HND, “Tokyo”)',
        required: true,
      },
      date: {
        type: 'string',
        description: 'ISO date for outbound flight',
        required: true,
      },
      returnDate: {
        type: 'string',
        description: 'ISO date for return flight (optional)',
        required: false,
      },
      passengers: {
        type: 'integer',
        description: 'Number of passengers',
        required: false,
      },
      cabin: {
        type: 'string',
        description: 'Cabin class (economy | premium | business | first)',
        required: false,
      },
    },
  },
  {
    name: 'get_flight_status',
    description: 'Get real-time flight status by flight number and date',
    args: {
      flightNumber: {
        type: 'string',
        description: 'e.g., LH203 or JL44',
        required: true,
      },
      date: {
        type: 'string',
        description: 'ISO date of departure',
        required: true,
      },
    },
  },
  {
    name: 'query_finance_price',
    description:
      'Fetch latest price for a ticker and optional currency conversion',
    args: {
      ticker: {
        type: 'string',
        description: 'e.g., AAPL, NVDA, BTC-USD',
        required: true,
      },
      convertTo: {
        type: 'string',
        description: 'Target currency code (e.g., EUR, JPY)',
        required: false,
      },
    },
  },
  {
    name: 'get_exchange_rate',
    description: 'Get FX rate from one currency to another',
    args: {
      base: {
        type: 'string',
        description: 'Base currency code, e.g., USD',
        required: true,
      },
      quote: {
        type: 'string',
        description: 'Quote currency code, e.g., EUR',
        required: true,
      },
    },
  },
  {
    name: 'kb_vector_search',
    description:
      'Semantic search in internal knowledge base; returns doc IDs + snippets with full document content',
    args: {
      query: {
        type: 'string',
        description: 'Natural language query',
        required: true,
      },
      topK: {
        type: 'integer',
        description: 'Number of results to return (1-10)',
        required: false,
      },
      filters: {
        type: 'object',
        description: 'Optional metadata filters (e.g., {project:"alpha"})',
        required: false,
      },
    },
  },
  {
    name: 'create_calendar_event',
    description: 'Create a calendar event',
    args: {
      title: {
        type: 'string',
        description: 'Event title',
        required: true,
      },
      start: {
        type: 'string',
        description: 'ISO datetime (start)',
        required: true,
      },
      end: {
        type: 'string',
        description: 'ISO datetime (end)',
        required: true,
      },
      attendees: {
        type: 'array',
        description: 'Email addresses of attendees',
        required: false,
      },
      location: {
        type: 'string',
        description: 'Event location',
        required: false,
      },
      description: {
        type: 'string',
        description: 'Event description',
        required: false,
      },
    },
  },
  {
    name: 'run_sql_query',
    description: 'Execute a read-only SQL query against analytics DB',
    args: {
      sql: {
        type: 'string',
        description: 'SELECT-only SQL',
        required: true,
      },
      params: {
        type: 'array',
        description: 'Prepared statement parameters',
        required: false,
      },
    },
  },
  {
    name: 'web_retrieve_and_summarize',
    description: 'Fetch a web page and return a short summary',
    args: {
      url: {
        type: 'string',
        description: 'URL of the page to fetch',
        required: true,
      },
      focus: {
        type: 'string',
        description: 'Optional focus area, e.g., "pricing"',
        required: false,
      },
    },
  },
];

export default mockAgentToolsComplex;
