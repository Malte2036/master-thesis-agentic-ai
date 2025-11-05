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
  const [viewMode, setViewMode] = useState<'chat' | 'diagram'>('chat');
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
    // Auto-switch to diagram view when new process starts
    setViewMode('diagram');

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

  const hasProcess = state.process || state.isLoading;

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Top navigation tabs */}
      {hasProcess && (
        <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex items-center gap-4 px-6 py-3">
            <button
              onClick={() => setViewMode('chat')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'chat'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Chat
            </button>
            <button
              onClick={() => setViewMode('diagram')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'diagram'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
              }`}
            >
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
              Agent Process
            </button>
            {viewMode === 'diagram' && (
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setShowFlowView(true)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    showFlowView
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  Flow
                </button>
                <button
                  onClick={() => setShowFlowView(false)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    !showFlowView
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700'
                  }`}
                >
                  List
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat View */}
      {viewMode === 'chat' && (
        <>
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
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-zinc-200 bg-white px-4 py-6 dark:border-zinc-800 dark:bg-zinc-950">
            <div className="mx-auto flex max-w-3xl items-center justify-center">
              <ChatInput onSubmit={handleSubmit} chatWindowState={state} />
            </div>
          </div>
        </>
      )}

      {/* Full Page Diagram View */}
      {viewMode === 'diagram' && hasProcess && (
        <div className="flex-1 overflow-hidden bg-zinc-50 dark:bg-zinc-900">
          {showFlowView ? (
            <ProcessFlowDiagram
              process={state.process}
              isLoading={state.isLoading}
              response={state.response}
            />
          ) : (
            <div className="h-full overflow-y-auto px-6 py-6">
              <ProcessViewer
                process={state.process}
                isLoading={state.isLoading}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
