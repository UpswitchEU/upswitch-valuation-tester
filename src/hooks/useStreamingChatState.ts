/**
 * useStreamingChatState - Centralized state management for StreamingChat component
 * 
 * Extracted from StreamingChat.tsx to reduce component complexity and improve maintainability.
 * Consolidates all useState hooks and refs into a single, reusable custom hook.
 */

import { useState, useRef } from 'react';

// Re-export types for convenience
export interface Message {
  id: string;
  type: 'user' | 'ai' | 'system' | 'suggestion';
  role?: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isComplete?: boolean;
  metadata?: any;
}

export interface ConversationMetrics {
  session_id: string;
  user_id?: string;
  started_at: Date;
  total_turns: number;
  successful: boolean;
  ai_response_count: number;
  user_message_count: number;
  error_count: number;
  retry_count: number;
  avg_response_time_ms: number;
  valuation_generated: boolean;
  data_completeness_percent: number;
  collected_fields: string[];
  total_tokens_used: number;
  estimated_cost_usd: number;
  feedback_provided: boolean;
}

export interface StreamingChatState {
  // Core state
  messages: Message[];
  input: string;
  isStreaming: boolean;
  collectedData: Record<string, any>;
  valuationPreview: any;
  calculateOption: any;
  conversationMetrics: ConversationMetrics;
  
  // Refs
  refs: {
    messagesEndRef: React.RefObject<HTMLDivElement>;
    eventSourceRef: React.RefObject<EventSource | null>;
    currentStreamingMessageRef: React.RefObject<Message | null>;
    requestIdRef: React.RefObject<string | null>;
    hasInitializedRef: React.RefObject<boolean>;
    abortControllerRef: React.RefObject<AbortController | null>;
  };
  
  // Setters
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  setIsStreaming: React.Dispatch<React.SetStateAction<boolean>>;
  setCollectedData: React.Dispatch<React.SetStateAction<Record<string, any>>>;
  setValuationPreview: React.Dispatch<React.SetStateAction<any>>;
  setCalculateOption: React.Dispatch<React.SetStateAction<any>>;
  setConversationMetrics: React.Dispatch<React.SetStateAction<ConversationMetrics>>;
}

/**
 * Custom hook that manages all StreamingChat component state
 * 
 * @param sessionId - Unique session identifier
 * @param userId - Optional user identifier
 * @returns Complete state object with values, refs, and setters
 */
export const useStreamingChatState = (sessionId: string, userId?: string): StreamingChatState => {
  // Core state variables
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const [valuationPreview, setValuationPreview] = useState<any>(null);
  const [calculateOption, setCalculateOption] = useState<any>(null);
  
  // Conversation metrics with initial values
  const [conversationMetrics, setConversationMetrics] = useState<ConversationMetrics>({
    session_id: sessionId,
    user_id: userId,
    started_at: new Date(),
    total_turns: 0,
    successful: false,
    ai_response_count: 0,
    user_message_count: 0,
    error_count: 0,
    retry_count: 0,
    avg_response_time_ms: 0,
    valuation_generated: false,
    data_completeness_percent: 0,
    collected_fields: [],
    total_tokens_used: 0,
    estimated_cost_usd: 0,
    feedback_provided: false
  });
  
  // Refs for DOM elements and component state
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentStreamingMessageRef = useRef<Message | null>(null);
  const requestIdRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  return {
    // State values
    messages,
    input,
    isStreaming,
    collectedData,
    valuationPreview,
    calculateOption,
    conversationMetrics,
    
    // Refs grouped for easy access
    refs: {
      messagesEndRef,
      eventSourceRef,
      currentStreamingMessageRef,
      requestIdRef,
      hasInitializedRef,
      abortControllerRef
    },
    
    // State setters
    setMessages,
    setInput,
    setIsStreaming,
    setCollectedData,
    setValuationPreview,
    setCalculateOption,
    setConversationMetrics
  };
};
