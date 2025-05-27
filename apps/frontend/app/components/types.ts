import { RouterResponseFriendly } from '@master-thesis-agentic-rag/types';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: RouterResponseFriendly;
}

export interface Settings {
  moodle_token: string;
  router: 'legacy' | 'react';
  max_iterations: number;
  model: string;
}

export const DEFAULT_SETTINGS: Settings = {
  moodle_token: 'demo-token',
  router: 'react',
  max_iterations: 5,
  model: 'mixtral:8x7b',
};

export const EXAMPLE_MESSAGES: ChatMessage[] = [
  {
    role: 'user',
    content: {
      friendlyResponse:
        'Finde die nächste Abgabe in Digital Health und erstelle einen Kalendereintrag für die nächste Abgabe.',
    },
  },
  {
    role: 'assistant',
    content: {
      friendlyResponse:
        'Ich habe die nächste Abgabe in Digital Health gefunden:\n\n• Projektabgabe: "KI in der Gesundheitsversorgung"\n• Fällig am: 15. Juni 2024\n\nIch habe einen Kalendereintrag für dich erstellt. Du kannst die Details in deinem Kalender überprüfen.',
    },
  },
];
