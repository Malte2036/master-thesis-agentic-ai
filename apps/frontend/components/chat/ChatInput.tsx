'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatWindowState } from './ChatWindow';
import { Send, Loader2 } from 'lucide-react';

type Props = {
  onSubmit: (message: string) => Promise<void>;
  chatWindowState: ChatWindowState;
};

export const ChatInput = ({ onSubmit, chatWindowState }: Props) => {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea as user types
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [message]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || chatWindowState.isLoading) return;

    console.log('Sending message:', message);

    await onSubmit(message);
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="w-full max-w-3xl">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg transition-all focus-within:border-red-500">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            rows={1}
            disabled={chatWindowState.isLoading}
            className="flex-1 resize-none bg-transparent px-3 py-3 text-base text-zinc-900 placeholder-zinc-400 outline-none"
            style={{ maxHeight: '200px' }}
          />

          <button
            type="submit"
            disabled={!message.trim() || chatWindowState.isLoading}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white transition-all hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {chatWindowState.isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </button>
        </div>

        <p className="mt-2 text-center text-xs text-zinc-500">
          Press{' '}
          <kbd className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs">
            Enter
          </kbd>{' '}
          to send,
          <kbd className="ml-1 rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-xs">
            Shift + Enter
          </kbd>{' '}
          for new line
        </p>
      </form>
    </div>
  );
};
