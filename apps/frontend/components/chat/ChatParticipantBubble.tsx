import Markdown from 'react-markdown';

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
              : 'bg-white text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700'
          }`}
        >
          {isUser ? (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 22l-.394-1.433a2.25 2.25 0 00-1.423-1.423L13.25 19l1.433-.394a2.25 2.25 0 001.423-1.423L16.5 16l.394 1.433a2.25 2.25 0 001.423 1.423L19.75 19l-1.433.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
          )}
        </div>

        {/* Message bubble */}
        <div
          className={`rounded-2xl px-4 py-3 shadow-sm ${
            isUser
              ? 'bg-red-600 text-white rounded-br-sm'
              : 'bg-white text-zinc-800 border border-zinc-200 rounded-bl-sm dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700'
          }`}
        >
          <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            <Markdown>{content}</Markdown>
          </p>
        </div>
      </div>
    </div>
  );
};
