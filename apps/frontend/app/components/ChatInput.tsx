import { Send, BookOpen, Calendar, Brain } from 'lucide-react';

interface ChatInputProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

export function ChatInput({
  input,
  onInputChange,
  onSubmit,
  loading,
}: ChatInputProps) {
  const quickActions = [
    {
      icon: BookOpen,
      text: 'Kursmaterialien',
      query:
        'Zeige mir alle verfügbaren Materialien für das Modul "Künstliche Intelligenz" in Moodle an.',
      color: 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200',
    },
    {
      icon: Calendar,
      text: 'Abgaben',
      query:
        'Finde die nächste Abgabe in Digital Health und erstelle einen Kalendereintrag für die nächste Abgabe.',
      color: 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200',
    },
    {
      icon: Brain,
      text: 'Lernplan',
      query:
        'Erstelle einen Lernplan für die Prüfungsvorbereitung in "Datenbanken und Informationssysteme".',
      color:
        'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200',
    },
  ];

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className="bg-white border-t border-gray-200 shadow-lg">
      <div className="max-w-5xl mx-auto p-6">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3 mb-4">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={() => onInputChange(action.query)}
              disabled={loading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
            >
              <action.icon className="w-4 h-4" />
              <span>{action.text}</span>
            </button>
          ))}
        </div>

        {/* Input Field */}
        <form onSubmit={onSubmit} className="flex space-x-4 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Frage mich nach Kursen, Abgaben, Materialien oder anderen universitären Angelegenheiten..."
              className="w-full p-4 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none bg-white text-gray-800 placeholder-gray-500 transition-all duration-200"
              rows={2}
              disabled={loading}
              style={{ minHeight: '60px', maxHeight: '120px' }}
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2 shadow-md hover:shadow-lg font-medium"
          >
            <Send className="w-5 h-5" />
            <span>Senden</span>
          </button>
        </form>
      </div>
    </div>
  );
}
