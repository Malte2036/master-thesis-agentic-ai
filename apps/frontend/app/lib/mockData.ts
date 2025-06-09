import { ChatMessage, Settings } from '../components/types';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export const MOCK_SETTINGS: Settings = {
  moodle_token: 'demo-token',
  router: 'react',
  max_iterations: 5,
  model: 'mixtral:8x7b',
};

export const MOCK_SESSIONS: ChatSession[] = [
  {
    id: '1',
    title: 'Digital Health Abgabe',
    messages: [
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
    ],
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:05:00Z',
  },
  {
    id: '2',
    title: 'KI Kursmaterialien',
    messages: [
      {
        role: 'user',
        content: {
          friendlyResponse:
            'Zeige mir alle verfügbaren Materialien für das Modul "Künstliche Intelligenz" in Moodle an.',
          ai_model: 'mixtral:8x7b',
        },
      },
      {
        role: 'assistant',
        content: {
          friendlyResponse:
            'Hier sind alle verfügbaren Materialien für das Modul "Künstliche Intelligenz":\n\n📄 Vorlesungsfolien:\n• KI-Grundlagen (PDF, 2.5 MB)\n• Machine Learning Basics (PDF, 3.1 MB)\n• Neural Networks (PDF, 4.2 MB)\n\n📚 Literatur:\n• "Artificial Intelligence: A Modern Approach" - Russell & Norvig\n• "Pattern Recognition and Machine Learning" - Bishop\n\n🎥 Videos:\n• Einführung in KI (45 Min)\n• Deep Learning Tutorial (1h 20 Min)',
          ai_model: 'mixtral:8x7b',
        },
      },
    ],
    createdAt: '2024-01-14T14:30:00Z',
    updatedAt: '2024-01-14T14:35:00Z',
  },
  {
    id: '3',
    title: 'Lernplan Datenbanken',
    messages: [
      {
        role: 'user',
        content: {
          friendlyResponse:
            'Erstelle einen Lernplan für die Prüfungsvorbereitung in "Datenbanken und Informationssysteme".',
          ai_model: 'mixtral:8x7b',
        },
      },
      {
        role: 'assistant',
        content: {
          friendlyResponse:
            'Hier ist ein strukturierter Lernplan für deine Prüfungsvorbereitung:\n\n📅 Woche 1-2: Grundlagen\n• SQL Basics und DDL/DML\n• Relationale Algebra\n• ER-Diagramme\n\n📅 Woche 3-4: Fortgeschrittene Themen\n• Normalisierung (1NF, 2NF, 3NF)\n• Transaktionen und ACID\n• Indexierung und Performance\n\n📅 Woche 5-6: Praxis und Wiederholung\n• Übungsaufgaben lösen\n• Altklausuren bearbeiten\n• Schwachstellen identifizieren und üben',
          ai_model: 'mixtral:8x7b',
        },
      },
    ],
    createdAt: '2024-01-13T16:00:00Z',
    updatedAt: '2024-01-13T16:10:00Z',
  },
];
