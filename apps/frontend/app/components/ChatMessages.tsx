import { useRef, useEffect } from 'react';
import { ChatMessage } from './types';

interface ChatMessagesProps {
  messages: ChatMessage[];
  loading: boolean;
}

export function ChatMessages({ messages, loading }: ChatMessagesProps) {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, loading]);

  return (
    <main
      ref={chatRef}
      className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50"
    >
      <div className="flex flex-col gap-2">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={
              msg.role === 'user'
                ? 'self-end bg-primary text-white px-4 py-2 rounded-2xl rounded-br-none max-w-[80%] whitespace-pre-line'
                : 'self-start bg-gray-200 text-gray-900 px-4 py-2 rounded-2xl rounded-bl-none max-w-[80%] whitespace-pre-line'
            }
          >
            {msg.content}
          </div>
        ))}
        {loading && (
          <div className="self-start bg-gray-200 text-gray-400 px-4 py-2 rounded-2xl rounded-bl-none max-w-[80%]">
            ...
          </div>
        )}
      </div>
    </main>
  );
}
