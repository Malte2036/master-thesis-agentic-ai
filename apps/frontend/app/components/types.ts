// Simplified UI-only types without backend dependencies
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: {
    friendlyResponse: string;
    ai_model: string;
    process?: {
      question: string;
      maxIterations: number;
      response?: string;
      iterationHistory?: Array<{
        iteration: number;
        naturalLanguageThought: string;
        observation: string;
        structuredThought: {
          agentCalls: Array<{
            agentName: string;
            functionName: string;
            parameters: Record<string, unknown>;
          }>;
          isFinished: boolean;
        };
      }>;
    };
    error?: string;
  };
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
      ai_model: 'mixtral:8x7b',
    },
  },
  {
    role: 'assistant',
    content: {
      friendlyResponse:
        'Ich habe die nächste Abgabe in Digital Health gefunden:\n\n• Projektabgabe: "KI in der Gesundheitsversorgung"\n• Fällig am: 15. Juni 2024\n\nIch habe einen Kalendereintrag für dich erstellt. Du kannst die Details in deinem Kalender überprüfen.',
      ai_model: 'mixtral:8x7b',
    },
  },
];
