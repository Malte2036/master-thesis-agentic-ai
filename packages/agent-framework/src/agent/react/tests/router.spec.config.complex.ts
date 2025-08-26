import { AgentTool } from '../types';

export const mockAgentToolsComplex: AgentTool[] = [
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
      include_in_response: {
        type: 'object',
        properties: {
          summary: {
            type: 'boolean',
            required: true,
          },
          prices: {
            type: 'boolean',
            required: true,
          },
          schedules: {
            type: 'boolean',
            required: true,
          },
        },
        required: true,
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
      include_in_response: {
        type: 'object',
        properties: {
          summary: {
            type: 'boolean',
            required: true,
          },
          gateInfo: {
            type: 'boolean',
            required: true,
          },
          delays: {
            type: 'boolean',
            required: true,
          },
        },
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
      include_in_response: {
        type: 'object',
        properties: {
          summary: {
            type: 'boolean',
            required: true,
          },
          historical: {
            type: 'boolean',
            required: true,
          },
        },
        required: true,
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
      include_in_response: {
        type: 'object',
        properties: {
          summary: {
            type: 'boolean',
            required: true,
          },
          timestamp: {
            type: 'boolean',
            required: true,
          },
        },
        required: true,
      },
    },
  },
  {
    name: 'kb_vector_search',
    description:
      'Semantic search in internal knowledge base; returns doc IDs + snippets',
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
      include_in_response: {
        type: 'object',
        properties: {
          summary: {
            type: 'boolean',
            required: true,
          },
          snippets: {
            type: 'boolean',
            required: true,
          },
          metadata: {
            type: 'boolean',
            required: true,
          },
        },
        required: true,
      },
    },
  },
  {
    name: 'kb_fetch_document',
    description: 'Fetch full text for a document ID',
    args: {
      docId: {
        type: 'string',
        description: 'Document identifier returned by search',
        required: true,
      },
      include_in_response: {
        type: 'object',
        properties: {
          fullText: {
            type: 'boolean',
            required: true,
          },
          metadata: {
            type: 'boolean',
            required: true,
          },
        },
        required: true,
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
      include_in_response: {
        type: 'object',
        properties: {
          summary: {
            type: 'boolean',
            required: true,
          },
          attendees: {
            type: 'boolean',
            required: true,
          },
          link: {
            type: 'boolean',
            required: true,
          },
        },
        required: true,
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
      include_in_response: {
        type: 'object',
        properties: {
          summary: {
            type: 'boolean',
            required: true,
          },
          rows: {
            type: 'boolean',
            required: true,
          },
          schema: {
            type: 'boolean',
            required: true,
          },
        },
        required: true,
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
        description: 'Optional focus area, e.g., “pricing”',
        required: false,
      },
      include_in_response: {
        type: 'object',
        properties: {
          summary: {
            type: 'boolean',
            required: true,
          },
          fullText: {
            type: 'boolean',
            required: true,
          },
        },
        required: true,
      },
    },
  },
  {
    name: 'translate_text',
    description: 'Translate text to a target language with glossary support',
    args: {
      text: {
        type: 'string',
        description: 'Input text',
        required: true,
      },
      targetLang: {
        type: 'string',
        description: 'ISO code, e.g., de, en, fr',
        required: true,
      },
      glossary: {
        type: 'array',
        description: 'Term mappings: [{source, target}]',
        required: false,
      },
      include_in_response: {
        type: 'object',
        properties: {
          summary: {
            type: 'boolean',
            required: true,
          },
          glossaryApplied: {
            type: 'boolean',
            required: true,
          },
        },
        required: true,
      },
    },
  },
];

export default mockAgentToolsComplex;
