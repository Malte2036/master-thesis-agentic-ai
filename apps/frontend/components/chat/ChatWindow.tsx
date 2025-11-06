import { askAgent } from '@/lib/api/agent';
import { ChatInput } from './ChatInput';
import { ChatParticipantBubble } from './ChatParticipantBubble';
import { ProcessViewer } from './ProcessViewer';
import { ProcessFlowDiagram } from './ProcessFlowDiagram';
import { StarterQuestions } from './StarterQuestions';
import { ChatHistory } from './ChatHistory';
import { useState } from 'react';
import { RouterProcess } from '@master-thesis-agentic-ai/types';
import { MessageCircle, Layers, History, X } from 'lucide-react';
import { useChatStore } from '@/store/chatStore';

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
  const [showHistory, setShowHistory] = useState(false);

  const {
    currentConversationId,
    createConversation,
    addMessage,
    getCurrentConversation,
  } = useChatStore();

  const currentConversation = getCurrentConversation();
  const messages = currentConversation?.messages || [];

  // Get the last agent message with a process from current conversation
  const lastAgentMessageWithProcess = currentConversation
    ? [...currentConversation.messages]
        .reverse()
        .find((msg) => msg.role === 'agent' && msg.process)
    : null;

  // Use loaded process if available, otherwise use live state
  const displayProcess = state.isLoading
    ? state.process
    : lastAgentMessageWithProcess?.process || state.process;
  const displayResponse = state.isLoading
    ? state.response
    : lastAgentMessageWithProcess?.content || state.response;

  const handleSubmit = async (message: string) => {
    setState({ ...initialState, isLoading: true });

    // Create new conversation or use existing
    const conversationId = currentConversationId || createConversation(message);

    // Add user message
    addMessage(conversationId, { role: 'user', content: message });

    // Auto-switch to diagram view
    setViewMode('diagram');

    await askAgent(message, {
      onFinalResponse: (response, process) => {
        setState({ response, process, isLoading: false });
        addMessage(conversationId, {
          role: 'agent',
          content: response,
          process,
        });
      },
      onUpdate: (update) => {
        setState((state) => ({ ...state, process: update }));
      },
      onError: (error) => {
        setState((state) => ({ ...state, isLoading: false }));
        addMessage(conversationId, {
          role: 'agent',
          content: `Error: ${error}`,
        });
      },
    });
  };

  const hasProcess = displayProcess || state.isLoading;

  return (
    <div className="flex h-screen w-full">
      {/* Chat History Sidebar */}
      {showHistory && (
        <div className="w-80 border-r border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 p-4">
            <h2 className="text-lg font-semibold text-zinc-900">
              Chat History
            </h2>
            <button
              onClick={() => setShowHistory(false)}
              className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <ChatHistory onClose={() => setShowHistory(false)} />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Top navigation tabs */}
        <div className="border-b border-zinc-200 bg-white">
          <div className="flex items-center gap-4 px-6 py-3">
            {/* History Button */}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                showHistory
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              <History className="h-4 w-4" />
              History
            </button>

            {hasProcess && (
              <>
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
              </>
            )}
          </div>
        </div>

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
                process={displayProcess}
                isLoading={state.isLoading}
                response={displayResponse}
              />
            ) : (
              <div className="h-full overflow-y-auto px-6 py-6">
                <ProcessViewer
                  process={displayProcess}
                  isLoading={state.isLoading}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
