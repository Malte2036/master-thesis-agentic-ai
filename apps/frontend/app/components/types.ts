export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
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
    content: 'Hello! How can I help you with your university tasks today?',
  },
  {
    role: 'user',
    content: 'Show me my upcoming assignments.',
  },
  {
    role: 'assistant',
    content:
      'You have 2 assignments due this week:\n• Math Homework (due Thursday)\n• Design Project (due Friday)',
  },
];
