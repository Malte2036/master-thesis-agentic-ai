'use client';

import {
  MessageSquare,
  User,
  BookOpen,
  Calendar,
  Plus,
  RefreshCw,
  Info,
  FileText,
} from 'lucide-react';

type StarterQuestion = {
  label: string;
  message: string;
  icon: React.ReactNode;
};

const starterQuestions: StarterQuestion[] = [
  {
    label: 'What are your capabilities?',
    message: 'Tell me what you can do. Which functions do you have?',
    icon: <Info className="h-5 w-5" />,
  },
  {
    label: 'Get my user information',
    message: 'Can you help me get my user information?',
    icon: <User className="h-5 w-5" />,
  },
  {
    label: 'Get all my modules',
    message: 'Can you get me all my modules?',
    icon: <BookOpen className="h-5 w-5" />,
  },
  {
    label: 'Get Information about a specific module',
    message: "Can you get me information about the module 'Digital Health'?",
    icon: <FileText className="h-5 w-5" />,
  },
  {
    label: 'Get Assignments for all courses',
    message:
      'Finde alle meine abgaben und stellle die in einer tabelle dar? Schreibe mir eine kurze zusammenfassung der Abgaben.',
    icon: <MessageSquare className="h-5 w-5" />,
  },
  {
    label: 'Get Calendar Events',
    message: 'Can you get me all my calendar events?',
    icon: <Calendar className="h-5 w-5" />,
  },
  {
    label: 'Create a calendar event',
    message:
      "Can you create a calendar event in 10 minutes with the name 'Meeting with the team'?",
    icon: <Plus className="h-5 w-5" />,
  },
  {
    label: 'Create a recurring calendar event',
    message:
      'Erstelle einen Kalendereintarg für die Mittagspause alle zwei Tage (Wochentags) um 13:30 Uhr für 1.5h. Der erste eintrag sollte in zwei wochen sein, und montags starten.',
    icon: <RefreshCw className="h-5 w-5" />,
  },
];

type Props = {
  onSelectQuestion: (message: string) => void;
  disabled?: boolean;
};

export const StarterQuestions = ({ onSelectQuestion, disabled }: Props) => {
  return (
    <div className="mx-auto w-full max-w-4xl px-4">
      <div className="mb-8 text-center">
        <h2 className="mb-2 text-3xl font-bold text-zinc-900">
          Welcome to Your AI Assistant
        </h2>
        <p className="text-lg text-zinc-600">
          Choose a question to get started or ask your own
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {starterQuestions.map((question, index) => (
          <button
            key={index}
            onClick={() => onSelectQuestion(question.message)}
            disabled={disabled}
            className="group flex items-start gap-4 rounded-xl border border-zinc-200 bg-white p-4 text-left transition-all hover:border-red-500 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 transition-colors group-hover:bg-red-600 group-hover:text-white">
              {question.icon}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-zinc-900 group-hover:text-red-600">
                {question.label}
              </h3>
              <p className="mt-1 text-sm text-zinc-600 line-clamp-2">
                {question.message}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
