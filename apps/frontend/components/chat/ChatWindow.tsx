import { askAgent } from '@/lib/api/agent';
import { ChatInput } from './ChatInput';
import { ChatParticipantBubble } from './ChatParticipantBubble';
import { ProcessViewer } from './ProcessViewer';
import { ProcessFlowDiagram } from './ProcessFlowDiagram';
import { StarterQuestions } from './StarterQuestions';
import { useState } from 'react';
import { RouterProcess } from '@master-thesis-agentic-ai/types';
import { MessageCircle, Layers } from 'lucide-react';

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);

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
        <div className="border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-4 px-6 py-3">
            <button
              onClick={() => setViewMode('chat')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'chat'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <MessageCircle className="h-4 w-4" />
              Chat
            </button>
            <button
              onClick={() => setViewMode('diagram')}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                viewMode === 'diagram'
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <Layers className="h-4 w-4" />
              Agent Process
            </button>
            {viewMode === 'diagram' && (
              <div className="ml-auto flex gap-2">
                <button
                  onClick={() => setShowFlowView(true)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    showFlowView
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
                  }`}
                >
                  Flow
                </button>
                <button
                  onClick={() => setShowFlowView(false)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    !showFlowView
                      ? 'bg-red-600 text-white'
                      : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
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
              {messages.length === 0 ? (
                <div className="flex h-full items-center justify-center">
                  <StarterQuestions
                    onSelectQuestion={handleSubmit}
                    disabled={state.isLoading}
                  />
                </div>
              ) : (
                messages.map((message, index) => (
                  <ChatParticipantBubble
                    key={index}
                    role={message.role}
                    content={message.content}
                  />
                ))
              )}
            </div>
          </div>

          {/* Input area */}
          <div className="border-t border-zinc-200 bg-white px-4 py-6">
            <div className="mx-auto flex max-w-3xl items-center justify-center">
              <ChatInput onSubmit={handleSubmit} chatWindowState={state} />
            </div>
          </div>
        </>
      )}

      {/* Full Page Diagram View */}
      {viewMode === 'diagram' && hasProcess && (
        <div className="flex-1 overflow-hidden bg-zinc-50">
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
