'use client';

import { useState, useRef, useEffect } from 'react';
import { ChatWindowState } from './ChatWindow';

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
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
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
