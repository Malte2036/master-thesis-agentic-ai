import { askAgent } from '@/lib/api/agent';
import { ChatInput } from './ChatInput';
import { ChatParticipantBubble } from './ChatParticipantBubble';
import { ProcessViewer } from './ProcessViewer';
import { ProcessFlowDiagram } from './ProcessFlowDiagram';
import { useState } from 'react';
import { RouterProcess } from '@master-thesis-agentic-ai/types';

type ChatMessage = {
  role: 'user' | 'agent';
  content: string;
};

export type ChatWindowState = {
  response: string | undefined;
  process: RouterProcess | undefined;
  isLoading: boolean;
};

const initialState: ChatWindowState = {
  response: undefined,
  process: undefined,
  isLoading: false,
};

export const ChatWindow = () => {
  const [state, setState] = useState<ChatWindowState>(initialState);
  const [showFlowView, setShowFlowView] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'agent',
      content: 'Hello, how can I help you today?',
    },
    {
      role: 'user',
      content:
        'What are my assignments for the course "Introduction to Computer Science"?',
    },
    {
      role: 'agent',
      content:
        'You have 2 assignments due next week: "Hello World" and "Linear Algebra Assignment".',
    },
  ]);

  const handleSubmit = async (message: string) => {
    setState({ ...initialState, isLoading: true });
    setMessages([{ role: 'user', content: message }]);

    await askAgent(message, {
      onFinalResponse: (response, process) => {
        console.log('Final response:', response, process);
        setState({
          response,
          process,
          isLoading: false,
        });
        setMessages((messages) => [
          ...messages,
          { role: 'agent', content: response },
        ]);
      },
      onUpdate: (update) => {
        console.log('Update:', update);
        setState((state) => ({ ...state, process: update }));
      },
      onError: (error) => {
        console.error('Error:', error);
        setState((state) => ({ ...state, isLoading: false }));
      },
    });
  };

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto">
          {messages.map((message, index) => (
            <ChatParticipantBubble
              key={index}
              role={message.role}
              content={message.content}
            />
          ))}

          {/* Show process viewer when there's a process or while loading */}
          {(state.process || state.isLoading) && (
            <div className="mt-6 space-y-4">
              {/* Toggle between views */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                  Agent Process
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFlowView(true)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      showFlowView
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    Flow Diagram
                  </button>
                  <button
                    onClick={() => setShowFlowView(false)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      !showFlowView
                        ? 'bg-red-600 text-white'
                        : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                    }`}
                  >
                    List View
                  </button>
                </div>
              </div>

              {showFlowView ? (
                <ProcessFlowDiagram
                  process={state.process}
                  isLoading={state.isLoading}
                />
              ) : (
                <ProcessViewer
                  process={state.process}
                  isLoading={state.isLoading}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Input area */}
      <div className="border-t border-zinc-200 bg-white px-4 py-6 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-3xl items-center justify-center">
          <ChatInput onSubmit={handleSubmit} chatWindowState={state} />
        </div>
      </div>
    </div>
  );
};
