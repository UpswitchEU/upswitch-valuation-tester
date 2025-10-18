/**
 * StreamingChat Component - Real-time AI conversation with streaming responses
 * Inspired by IlaraAI Mercury MCPChatUI architecture
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Bot, User } from 'lucide-react';
import { AI_CONFIG } from '../config';
import { ContextualTip } from './ContextualTip';
import { ValuationProgressTracker } from './ValuationProgressTracker';
import { useStreamingChat } from '../hooks/useStreamingChat';
import { useProgressTracking } from '../hooks/useProgressTracking';
import { createWelcomeMessage, filterValidMessages, type Message } from '../utils/messageUtils';
import { chatLogger } from '../utils/logger';

interface ProgressItem {
  id: string;
  label: string;
  status: 'completed' | 'in_progress' | 'pending';
}

interface StreamingChatProps {
  sessionId: string;
  userId?: string;
  onMessageComplete?: (message: Message) => void;
  onValuationComplete?: (result: any) => void;
  onReportUpdate?: (htmlContent: string, progress: number) => void;
  onProgressUpdate?: (items: ProgressItem[]) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export const StreamingChat: React.FC<StreamingChatProps> = ({
  sessionId,
  userId,
  onMessageComplete,
  onValuationComplete,
  onReportUpdate,
  onProgressUpdate,
  className = '',
  placeholder = "Ask about your business valuation...",
  disabled = false
}) => {
  const [input, setInput] = useState('');
  
  // Use extracted hooks
  const {
    messages,
    isStreaming,
    addMessage,
    startStreaming,
    stopStreaming
  } = useStreamingChat(
    sessionId,
    userId,
    onMessageComplete,
    onValuationComplete,
    onReportUpdate,
    onProgressUpdate
  );
  
  const {
    items: progressItems
  } = useProgressTracking();
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage = createWelcomeMessage(AI_CONFIG);
      addMessage(welcomeMessage);
    }
  }, [messages.length, addMessage]);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);


  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || disabled) return;

    const userInput = input.trim();
    setInput('');
    
    try {
      await startStreaming(userInput);
    } catch (error) {
      chatLogger.error('Failed to start streaming', { error });
    }
  }, [input, isStreaming, disabled, startStreaming]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  const getSmartFollowUps = useCallback(() => {
    const messageCount = messages.length;
    const lastAiMessage = messages.filter(m => m.type === 'ai').slice(-1)[0];
    const lastAiContent = lastAiMessage?.content.toLowerCase() || '';
    
    // Smart responses based on AI's last question
    if (lastAiContent.includes('revenue') || lastAiContent.includes('turnover')) {
      return [
        "€100K - €500K",
        "€500K - €1M",
        "€1M - €5M",
        "€5M+"
      ];
    }
    
    if (lastAiContent.includes('profit') || lastAiContent.includes('ebitda')) {
      return [
        "10-20% margin",
        "20-30% margin",
        "30%+ margin",
        "Not profitable yet"
      ];
    }
    
    if (lastAiContent.includes('industry') || lastAiContent.includes('sector')) {
      return [
        "Technology/SaaS",
        "E-commerce/Retail",
        "Professional Services",
        "Manufacturing"
      ];
    }
    
    if (lastAiContent.includes('growth') || lastAiContent.includes('growing')) {
      return [
        "Growing 20%+ YoY",
        "Growing 10-20% YoY",
        "Stable (0-10%)",
        "Declining"
      ];
    }
    
    if (lastAiContent.includes('employees') || lastAiContent.includes('team')) {
      return [
        "1-10 employees",
        "11-50 employees",
        "51-200 employees",
        "200+ employees"
      ];
    }
    
    // Default contextual suggestions based on stage
    if (messageCount <= 2) {
      return [
        "What is my business worth?",
        "How do you calculate valuation?",
        "What information do you need?"
      ];
    } else if (messageCount <= 5) {
      return [
        "Can you explain the methodology?",
        "What are industry benchmarks?",
        "How accurate is this valuation?"
      ];
    } else {
      return [
        "Generate full report",
        "Compare to similar businesses",
        "What affects my valuation?"
      ];
    }
  }, [messages]);

  const getContextualTip = useCallback(() => {
    const messageCount = messages.length;
    const lastAiMessage = messages.filter(m => m.type === 'ai').slice(-1)[0];
    
    // Skip tips at the very start - only show when contextually relevant
    if (messageCount < 2) {
      return null;
    }
    
    // Mid-conversation tips based on AI questions
    if (lastAiMessage?.content.toLowerCase().includes('revenue')) {
      return {
        type: 'info' as const,
        message: 'Tip: Include 3 years of revenue for better trend analysis'
      };
    }
    
    if (lastAiMessage?.content.toLowerCase().includes('industry') || 
        lastAiMessage?.content.toLowerCase().includes('sector')) {
      return {
        type: 'insight' as const,
        message: 'Industry benchmarks will be applied automatically'
      };
    }
    
    // Progress-based tips
    if (messageCount > 5 && messageCount <= 8) {
      return {
        type: 'success' as const,
        message: 'Great progress! Enough info to start building your report'
      };
    }
    
    if (messageCount > 8) {
      return {
        type: 'insight' as const,
        message: 'You can request the full report anytime'
      };
    }
    
    return null;
  }, [messages]);

  return (
    <div className={`flex flex-col h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 rounded-lg shadow-lg ${className}`}>

      {/* Progress header */}
      <div className="border-b border-zinc-800 p-4">
        <ValuationProgressTracker items={progressItems} compact={true} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filterValidMessages(messages).map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.type === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              <div className="flex items-start gap-3">
                {message.type !== 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary-400" />
                  </div>
                )}
                
                <div className={`rounded-lg px-4 py-2 ${
                  message.type === 'user' 
                    ? 'bg-zinc-800 text-white' 
                    : 'bg-zinc-700/50 text-white'
                }`}>
                  <div className="whitespace-pre-wrap text-sm">
                    {message.content}
                    {message.isStreaming && (
                      <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                    )}
                  </div>
                  
                  {/* NEW: Display reasoning if available */}
                  {AI_CONFIG.showReasoning && message.metadata?.reasoning && (
                    <div className="mt-2 pt-2 border-t border-zinc-600/30">
                      <p className="text-xs text-zinc-400 italic">
                        💡 {message.metadata.reasoning}
                      </p>
                    </div>
                  )}
                  
                  {/* NEW: Display help text if available */}
                  {AI_CONFIG.showHelpText && message.metadata?.help_text && (
                    <div className="mt-1">
                      <p className="text-xs text-primary-400">
                        ℹ️ {message.metadata.help_text}
                      </p>
                    </div>
                  )}
                  
                  {/* NEW: Display valuation narrative if available */}
                  {AI_CONFIG.showNarratives && message.metadata?.valuation_narrative && (
                    <div className="mt-3 p-3 bg-primary-600/10 rounded-lg">
                      <h4 className="text-sm font-semibold text-primary-300 mb-2">
                        Why this valuation?
                      </h4>
                      <div className="text-sm text-primary-200 whitespace-pre-wrap">
                        {message.metadata.valuation_narrative}
                      </div>
                    </div>
                  )}
                  
                  {message.type !== 'user' && message.isStreaming && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-zinc-400">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>AI is typing...</span>
                    </div>
                  )}
                </div>
                
                {message.type === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-zinc-700 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
              </div>
              
              <div className={`text-xs text-zinc-500 mt-1 ${
                message.type === 'user' ? 'text-right' : 'text-left'
              }`}>
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Contextual tip */}
      {getContextualTip() && (
        <div className="px-4 pb-2">
          <ContextualTip {...getContextualTip()!} />
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-zinc-800">
        <form
          onSubmit={handleSubmit}
          className="focus-within:bg-zinc-900/30 group flex flex-col gap-3 p-4 duration-150 w-full rounded-3xl border border-zinc-700/50 bg-zinc-900/20 text-base shadow-xl transition-all ease-in-out focus-within:border-zinc-500/40 hover:border-zinc-600/30 focus-within:hover:border-zinc-500/40 backdrop-blur-sm"
        >
          {/* Textarea container */}
          <div className="relative flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              disabled={disabled || isStreaming}
              className="flex w-full rounded-md px-3 py-3 ring-offset-background placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-sm leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap max-h-[200px] bg-transparent focus:bg-transparent flex-1 text-white"
              style={{ minHeight: '60px', height: '60px' }}
              spellCheck="false"
            />
          </div>

          {/* Action buttons row */}
          <div className="flex gap-2 flex-wrap items-center">
            {getSmartFollowUps().filter(Boolean).map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInput(suggestion)}
                disabled={isStreaming}
                className="px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-zinc-600/60 rounded-full text-xs text-zinc-300 hover:text-white transition-all duration-200 hover:shadow-md hover:shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestion}
              </button>
            ))}
            
            {/* Right side with send button */}
            <div className="flex flex-grow items-center justify-end gap-2">
              <button
                type="submit"
                disabled={!input.trim() || isStreaming || disabled}
                className="submit-button-white flex h-8 w-8 items-center justify-center rounded-full bg-white hover:bg-zinc-100 transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-600"
              >
                {isStreaming ? (
                  <Loader2 className="w-4 h-4 text-zinc-900 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 text-zinc-900" />
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
