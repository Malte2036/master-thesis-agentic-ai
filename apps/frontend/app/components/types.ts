import { RouterResponseFriendly } from '../../lib/agent-types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: RouterResponseFriendly;
}

export interface Settings {
  moodle_token: string;
  router: 'legacy' | 'react';
  max_iterations: number;
}

export const DEFAULT_SETTINGS: Settings = {
  moodle_token: 'demo-token',
  router: 'react',
  max_iterations: 5,
};

export const EXAMPLE_MESSAGES: ChatMessage[] = [
  {
    role: 'assistant',
    content: {
      friendlyResponse:
        'Hello! How can I help you with your university tasks today?',
    },
  },
  {
    role: 'user',
    content: {
      friendlyResponse: 'Show me my upcoming assignments.',
    },
  },
  {
    role: 'assistant',
    content: {
      friendlyResponse:
        'You have 2 assignments due this week:\n• Math Homework (due Thursday)\n• Design Project (due Friday)',
    },
  },
];
