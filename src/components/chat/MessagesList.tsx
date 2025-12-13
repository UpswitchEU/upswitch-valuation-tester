/**
 * MessagesList Component
 * 
 * Single Responsibility: Render list of chat messages
 * Extracted from StreamingChat.tsx to follow SRP
 * 
 * @module components/chat/MessagesList
 */

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { Message } from '../../hooks/useStreamingChatState';
import { TypingIndicator } from '../TypingIndicator';
import { MessageItem } from './MessageItem';

export interface MessagesListProps {
  messages: Message[];
  isTyping: boolean;
  isThinking: boolean;
  isInitializing: boolean;
  onSuggestionSelect: (suggestion: string) => void;
  onSuggestionDismiss: () => void;
  onClarificationConfirm: (messageId: string) => void;
  onClarificationReject: (messageId: string) => void;
  onKBOSuggestionSelect: (selection: string) => void;
  onValuationStart?: () => void;
  calculateOption?: any;
  valuationPreview?: any;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

/**
 * MessagesList Component
 * 
 * Renders:
 * - List of messages
 * - Typing indicator
 * - Calculate button (if applicable)
 * - Valuation preview (if applicable)
 */
export const MessagesList: React.FC<MessagesListProps> = ({
  messages,
  isTyping,
  isThinking,
  isInitializing,
  onSuggestionSelect,
  onSuggestionDismiss,
  onClarificationConfirm,
  onClarificationReject,
  onKBOSuggestionSelect,
  onValuationStart,
  calculateOption,
  valuationPreview,
  messagesEndRef,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Messages */}
      <AnimatePresence initial={false} mode="popLayout">
        {messages
          .filter(message => {
            // CRITICAL FIX: Filter out empty messages to prevent empty bubbles
            // BUT: Allow messages with special metadata (e.g., confirmation cards)
            // that intentionally have empty content but should still be displayed
            if (message.metadata?.is_business_type_confirmation === true) {
              return true; // Always show business type confirmation cards even with empty content
            }
            if (message.metadata?.is_company_name_confirmation === true) {
              return true; // Always show company name confirmation cards even with empty content
            }
            // Only show messages that have actual content (not just whitespace)
            return message.content && message.content.trim().length > 0;
          })
          .map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              onSuggestionSelect={onSuggestionSelect}
              onSuggestionDismiss={onSuggestionDismiss}
              onClarificationConfirm={onClarificationConfirm}
              onClarificationReject={onClarificationReject}
              onKBOSuggestionSelect={onKBOSuggestionSelect}
              onValuationStart={onValuationStart}
              isTyping={isTyping}
              isThinking={isThinking}
            />
          ))}
      </AnimatePresence>
      
      {/* Typing Indicator - Show during initialization or when typing */}
      <AnimatePresence>
        {(isTyping || (isInitializing && messages.length === 0)) && (
          <div className="flex justify-start" key="typing-indicator">
            <TypingIndicator />
          </div>
        )}
      </AnimatePresence>
      
      {/* Calculate Now Button */}
      {calculateOption && (
        <div className="flex justify-center">
          <button
            onClick={() => {
              // Handle calculate now
            }}
            className="px-6 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-500 transition-colors"
          >
            Calculate Now
          </button>
        </div>
      )}
      
      {/* Valuation Preview */}
      {valuationPreview && (
        <div className="bg-primary-600/10 p-4 rounded-lg border border-primary-600/30">
          <h3 className="font-semibold text-primary-300 mb-2">Valuation Preview</h3>
          <div className="text-2xl font-bold text-primary-200">
            ${valuationPreview.value?.toLocaleString()}
          </div>
        </div>
      )}
      
      {/* Scroll anchor */}
      <div ref={messagesEndRef} />
    </div>
  );
};

