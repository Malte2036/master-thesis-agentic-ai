import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { User, Sparkles } from 'lucide-react';

type ChatParticipantBubbleProps = {
  role: 'user' | 'agent';
  content: string;
};

export const ChatParticipantBubble = ({
  role,
  content,
}: ChatParticipantBubbleProps) => {
  const isUser = role === 'user';

  return (
    <div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
    >
      <div
        className={`flex max-w-[75%] gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}
      >
        {/* Avatar */}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full shadow-sm ${
            isUser
              ? 'bg-red-600 text-white'
              : 'bg-white text-zinc-600 border border-zinc-200'
          }`}
        >
          {isUser ? (
            <User className="h-5 w-5" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
        </div>

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-red-600 text-white rounded-br-sm'
              : 'bg-white text-zinc-800 border border-zinc-200 rounded-bl-sm'
          }`}
        >
          <div className="text-[15px] leading-relaxed markdown-content">
            <Markdown
              remarkPlugins={[remarkGfm]}
              components={{
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full border-collapse border border-zinc-300 rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-zinc-100">{children}</thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-zinc-200">{children}</tbody>
                ),
                th: ({ children }) => (
                  <th className="border border-zinc-300 px-4 py-2 text-left text-sm font-semibold">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-zinc-300 px-4 py-2 text-sm">
                    {children}
                  </td>
                ),
                tr: ({ children }) => (
                  <tr className="hover:bg-zinc-50">{children}</tr>
                ),
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0">{children}</p>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-3">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-3">{children}</ol>
                ),
                code: ({ children }) => (
                  <code className="block bg-zinc-100 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                    {children}
                  </code>
                ),
              }}
            >
              {content}
            </Markdown>
          </div>
        </div>
      </div>
    </div>
  );
};
