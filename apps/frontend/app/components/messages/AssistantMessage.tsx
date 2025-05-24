import { AlertCircle, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChatMessage } from '../types';
import { safeValidateApiResponse } from '../../lib/validation';
import { MessageHeader } from './MessageHeader';
import { ProcessDisplay } from './ProcessDisplay';

interface AssistantMessageProps {
  message: ChatMessage;
  index: number;
  showProcess: boolean;
  onToggleProcess: () => void;
}

export function AssistantMessage({
  message,
  index,
  showProcess,
  onToggleProcess,
}: AssistantMessageProps) {
  const validatedContent = safeValidateApiResponse(message.content);
  if (!validatedContent) {
    console.error('Invalid message content:', message.content);
    return null;
  }

  return (
    <div key={index} className="flex justify-start ml-16">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0 mb-1">
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <MessageHeader aiModel={validatedContent.ai_model} />
          <div className="prose prose-sm max-w-none px-5 py-3 shadow-sm bg-white border border-gray-200 text-gray-800 rounded-2xl rounded-bl-md">
            <div className="text-sm leading-5 font-medium">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {validatedContent.friendlyResponse}
              </ReactMarkdown>
            </div>
          </div>

          {validatedContent.error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-red-800 mb-1">
                    Es gab ein Problem
                  </h4>
                  <p className="text-sm text-red-700">
                    {validatedContent.error}
                  </p>
                  <div className="mt-2 text-xs text-red-600">
                    Bitte versuche es erneut oder kontaktiere den Support, wenn
                    das Problem weiterhin besteht.
                  </div>
                </div>
              </div>
            </div>
          )}

          {validatedContent.process?.iterationHistory && (
            <ProcessDisplay
              process={validatedContent.process}
              showProcess={showProcess}
              onToggleProcess={onToggleProcess}
            />
          )}
        </div>
      </div>
    </div>
  );
}
