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
  return (
    <form
      className="px-4 py-3 bg-white border-t border-gray-100 flex items-center gap-2"
      onSubmit={onSubmit}
    >
      <input
        type="text"
        className="flex-1 rounded-full border border-gray-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary text-gray-900 bg-gray-50"
        placeholder="Type your message..."
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        disabled={loading}
        autoFocus
      />
      <button
        type="submit"
        className="bg-primary text-white px-5 py-2 rounded-full font-semibold shadow-sm hover:bg-hsd-red transition-colors disabled:opacity-50"
        disabled={loading || !input.trim()}
      >
        {loading ? '...' : 'Send'}
      </button>
    </form>
  );
}
