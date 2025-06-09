import { Bot } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { RouterResponseWithId } from '../lib/types';
import { AssistantMessage } from './messages/AssistantMessage';
import { UserMessage } from './messages/UserMessage';

interface ChatMessagesProps {
  data: RouterResponseWithId | undefined;
}

function ChatMessages({ data }: ChatMessagesProps) {
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [data]);

  if (!data) {
    return <div className="h-full"></div>;
  }
  const isFinished =
    data.process?.iterationHistory?.find(
      (iteration) => iteration.structuredThought.isFinished,
    ) || data.error;

  return (
    <main
      ref={chatRef}
      className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-gray-50"
    >
      <div className="flex flex-col gap-4">
        <UserMessage key={'user-message'} data={data} index={0} />
        <AssistantMessage key={'assistant-message'} data={data} index={1} />

        {!isFinished && (
          <div className="flex justify-start ml-16">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div className="bg-white rounded-2xl px-6 py-4 shadow-sm border border-gray-200 flex items-center space-x-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.1s' }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
                    style={{ animationDelay: '0.2s' }}
                  ></div>
                </div>
                <span className="text-gray-700 font-medium">
                  Verarbeite deine Anfrage...
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export { ChatMessages };
