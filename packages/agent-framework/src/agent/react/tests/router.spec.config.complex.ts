import { ListToolsResult } from '@modelcontextprotocol/sdk/types.js';

export const getMockAgentToolsComplex = (): ListToolsResult => ({
  tools: [
    {
      name: 'search_flights',
      description: 'Search one-way or round-trip flights',
      inputSchema: {
        type: 'object',
        properties: {
          origin: {
            type: 'string',
            description: 'IATA code or city (e.g., BER, “Berlin”)',
          },
          destination: {
            type: 'string',
            description: 'IATA code or city (e.g., HND, “Tokyo”)',
          },
          date: { type: 'string', description: 'ISO date for outbound flight' },
          returnDate: {
            type: 'string',
            description: 'ISO date for return flight (optional)',
          },
          passengers: { type: 'integer', minimum: 1, default: 1 },
          cabin: {
            type: 'string',
            enum: ['economy', 'premium', 'business', 'first'],
            default: 'economy',
          },
        },
        required: ['origin', 'destination', 'date'],
        additionalProperties: false,
      },
    },
    {
      name: 'get_flight_status',
      description: 'Get real-time flight status by flight number and date',
      inputSchema: {
        type: 'object',
        properties: {
          flightNumber: { type: 'string', description: 'e.g., LH203 or JL44' },
          date: { type: 'string', description: 'ISO date of departure' },
        },
        required: ['flightNumber', 'date'],
        additionalProperties: false,
      },
    },
    {
      name: 'query_finance_price',
      description:
        'Fetch latest price for a ticker and optional currency conversion',
      inputSchema: {
        type: 'object',
        properties: {
          ticker: { type: 'string', description: 'e.g., AAPL, NVDA, BTC-USD' },
          convertTo: {
            type: 'string',
            description: 'Target currency code (e.g., EUR, JPY)',
          },
        },
        required: ['ticker'],
        additionalProperties: false,
      },
    },
    {
      name: 'get_exchange_rate',
      description: 'Get FX rate from one currency to another',
      inputSchema: {
        type: 'object',
        properties: {
          base: {
            type: 'string',
            description: 'Base currency code, e.g., USD',
          },
          quote: {
            type: 'string',
            description: 'Quote currency code, e.g., EUR',
          },
        },
        required: ['base', 'quote'],
        additionalProperties: false,
      },
    },
    {
      name: 'kb_vector_search',
      description:
        'Semantic search in internal knowledge base; returns doc IDs + snippets',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Natural language query' },
          topK: { type: 'integer', minimum: 1, maximum: 10, default: 5 },
          filters: {
            type: 'object',
            additionalProperties: { type: ['string', 'number', 'boolean'] },
            description: 'Optional metadata filters (e.g., {project:"alpha"})',
          },
        },
        required: ['query'],
        additionalProperties: false,
      },
    },
    {
      name: 'kb_fetch_document',
      description: 'Fetch full text for a document ID',
      inputSchema: {
        type: 'object',
        properties: {
          docId: {
            type: 'string',
            description: 'Document identifier returned by search',
          },
        },
        required: ['docId'],
        additionalProperties: false,
      },
    },
    {
      name: 'create_calendar_event',
      description: 'Create a calendar event',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          start: { type: 'string', description: 'ISO datetime' },
          end: { type: 'string', description: 'ISO datetime' },
          attendees: {
            type: 'array',
            items: { type: 'string', format: 'email' },
          },
          location: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['title', 'start', 'end'],
        additionalProperties: false,
      },
    },
    {
      name: 'run_sql_query',
      description: 'Execute a read-only SQL query against analytics DB',
      inputSchema: {
        type: 'object',
        properties: {
          sql: { type: 'string', description: 'SELECT-only SQL' },
          params: {
            type: 'array',
            items: { type: ['string', 'number', 'boolean', 'null'] },
          },
        },
        required: ['sql'],
        additionalProperties: false,
      },
    },
    {
      name: 'web_retrieve_and_summarize',
      description: 'Fetch a web page and return a short summary',
      inputSchema: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          focus: {
            type: 'string',
            description: 'Optional focus area, e.g., “pricing”',
          },
        },
        required: ['url'],
        additionalProperties: false,
      },
    },
    {
      name: 'translate_text',
      description: 'Translate text to a target language with glossary support',
      inputSchema: {
        type: 'object',
        properties: {
          text: { type: 'string' },
          targetLang: {
            type: 'string',
            description: 'ISO code, e.g., de, en, fr',
          },
          glossary: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                source: { type: 'string' },
                target: { type: 'string' },
              },
              required: ['source', 'target'],
              additionalProperties: false,
            },
          },
        },
        required: ['text', 'targetLang'],
        additionalProperties: false,
      },
    },
  ],
});
