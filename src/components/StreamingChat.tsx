/**
 * StreamingChat Component - Real-time AI conversation with streaming responses
 * Inspired by IlaraAI Mercury MCPChatUI architecture
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, Bot, User, CheckCircle } from 'lucide-react';
import { AI_CONFIG } from '../config';
import { streamingChatService } from '../services/chat/streamingChatService';
import { ContextualTip } from './ContextualTip';
import { LoadingDots } from './LoadingDots';
import { SuggestionChips } from './SuggestionChips';
import { useLoadingMessage } from '../hooks/useLoadingMessage';
// Removed complex validation imports - using simple approach like IlaraAI
import { chatLogger } from '../utils/logger';
import { useAuth } from '../hooks/useAuth';

// Input validation constants
const MAX_MESSAGE_LENGTH = 1000;
const MIN_MESSAGE_LENGTH = 1;

interface InputValidation {
  is_valid: boolean;
  errors: string[];
  warnings: string[];
  sanitized_input: string;
  detected_pii: boolean;
  confidence: number;
}

interface ModelPerformanceMetrics {
  model_name: string;
  model_version: string;
  
  // Latency
  time_to_first_token_ms: number;
  total_response_time_ms: number;
  tokens_per_second: number;
  
  // Quality
  response_coherence_score?: number;
  response_relevance_score?: number;
  hallucination_detected: boolean;
  
  // Cost
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  
  // Errors
  error_occurred: boolean;
  error_type?: string;
  retry_count: number;
}


interface MessageMetadata {
  // AI Response Metadata
  model?: string;  // e.g., "gpt-4o-mini"
  tokens_used?: number;
  response_time_ms?: number;
  confidence_score?: number;
  
  // Conversation Context
  intent?: 'question' | 'answer' | 'clarification' | 'error' | 'warning';
  topic?: string;  // e.g., "revenue", "industry", "valuation"
  
  // Data Collection
  collected_field?: string;  // Which field was collected
  field_value?: string | number;
  validation_status?: 'valid' | 'invalid' | 'needs_clarification';
  
  // Quality Metrics
  user_satisfaction?: 1 | 2 | 3 | 4 | 5;
  was_helpful?: boolean;
  needs_human_review?: boolean;
  
  // Business Context
  valuation_result?: any;  // TODO: Type this properly
  help_text?: string;
  valuation_narrative?: string;
  
  // Tracking
  session_phase?: 'onboarding' | 'data_collection' | 'valuation' | 'complete';
  conversation_turn?: number;
  
  // Error Handling
  error_type?: string;
  retry_count?: number;
  
  // A/B Testing
  ab_test?: {
    test_name: string;
    variant: 'A' | 'B' | 'C';
  };
  
  // Suggestion System
  field?: string;
  originalValue?: string;
  suggestions?: Array<{
    text: string;
    confidence: number;
    reason: string;
  }>;
}

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system' | 'suggestion';
  role?: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isComplete?: boolean;
  metadata?: MessageMetadata;  // ✅ TYPED
}


interface ConversationMetrics {
  session_id: string;
  user_id?: string;
  
  // Completion Metrics
  started_at: Date;
  completed_at?: Date;
  duration_seconds?: number;
  total_turns: number;
  successful: boolean;
  drop_off_point?: string;
  
  // Quality Metrics
  ai_response_count: number;
  user_message_count: number;
  error_count: number;
  retry_count: number;
  avg_response_time_ms: number;
  
  // Business Metrics
  valuation_generated: boolean;
  data_completeness_percent: number;
  collected_fields: string[];
  
  // Cost Metrics
  total_tokens_used: number;
  estimated_cost_usd: number;
  
  // User Experience
  user_satisfaction_score?: number;
  feedback_provided: boolean;
}

interface StreamingChatProps {
  sessionId: string;
  userId?: string;
  onMessageComplete?: (message: Message) => void;
  onValuationComplete?: (result: any) => void;
  onReportUpdate?: (htmlContent: string, progress: number) => void;
  onDataCollected?: (data: any) => void;  // NEW
  onValuationPreview?: (data: any) => void;  // NEW
  onCalculateOptionAvailable?: (data: any) => void;  // NEW
  onProgressUpdate?: (data: any) => void;  // NEW
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
  onDataCollected,
  onValuationPreview,
  onCalculateOptionAvailable,
  onProgressUpdate,
  className = '',
  placeholder = "Ask about your business valuation...",
  disabled = false
}) => {
  // Get user data from AuthContext for profile integration
  const { user } = useAuth();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  const [valuationPreview, setValuationPreview] = useState<any>(null);
  const [calculateOption, setCalculateOption] = useState<any>(null);
  // const [progressSummary, setProgressSummary] = useState<any>(null);
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
  const loadingMessage: string = useLoadingMessage();
  
  // Input validation functions (memoized for performance)
  const containsPII = useCallback((input: string): boolean => {
    // Simple PII detection patterns
    const piiPatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/, // SSN
      /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email
      /\b\d{3}-\d{3}-\d{4}\b/, // Phone
    ];
    return piiPatterns.some(pattern => pattern.test(input));
  }, []);

  const containsProfanity = useCallback((input: string): boolean => {
    // Simple profanity detection (in production, use a proper library)
    const profanityWords = ['damn', 'hell', 'shit', 'fuck', 'bitch', 'ass'];
    const lowerInput = input.toLowerCase();
    return profanityWords.some(word => lowerInput.includes(word));
  }, []);

  const isValidNumber = useCallback((input: string): boolean => {
    const num = parseFloat(input);
    return !isNaN(num) && isFinite(num) && num >= 0;
  }, []);

  const validateInput = useCallback(async (input: string): Promise<InputValidation> => {
    const validation: InputValidation = {
      is_valid: true,
      errors: [],
      warnings: [],
      sanitized_input: input.trim(),
      detected_pii: false,
      confidence: 1.0
    };
    
    // Length check
    if (input.length > MAX_MESSAGE_LENGTH) {
      validation.is_valid = false;
      validation.errors.push(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`);
    }
    
    if (input.length < MIN_MESSAGE_LENGTH) {
      validation.is_valid = false;
      validation.errors.push('Message cannot be empty');
    }
    
    // PII detection
    if (containsPII(input)) {
      validation.detected_pii = true;
      validation.warnings.push('Detected potential sensitive information');
      validation.confidence = 0.7; // Lower confidence due to PII
    }
    
    // Content safety
    if (containsProfanity(input)) {
      validation.is_valid = false;
      validation.errors.push('Please keep conversation professional');
    }
    
    // Business logic validation (if we know we're expecting a number)
    const isNumericField = messages.length > 0 && (
      messages[messages.length - 1]?.content?.toLowerCase().includes('revenue') ||
      messages[messages.length - 1]?.content?.toLowerCase().includes('profit') ||
      messages[messages.length - 1]?.content?.toLowerCase().includes('ebitda')
    );
    
    if (isNumericField && !isValidNumber(input)) {
      validation.is_valid = false;
      validation.errors.push('Please enter a valid number');
    }
    
    // Log validation results
    chatLogger.debug('Input validation completed', {
      sessionId,
      isValid: validation.is_valid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      detectedPII: validation.detected_pii,
      confidence: validation.confidence
    });
    
    return validation;
  }, [messages, sessionId]);

  // Model performance tracking
  const trackModelPerformance = useCallback((metrics: ModelPerformanceMetrics) => {
    // Log model performance
    chatLogger.info('Model performance tracked', {
      sessionId,
      modelName: metrics.model_name,
      responseTime: metrics.total_response_time_ms,
      tokensUsed: metrics.output_tokens,
      cost: metrics.estimated_cost_usd,
      errorOccurred: metrics.error_occurred
    });
    
    // Alert if performance is poor
    if (metrics.total_response_time_ms > 5000) {
      chatLogger.warn('Slow model response detected', {
        sessionId,
        responseTime: metrics.total_response_time_ms,
        threshold: 5000
      });
    }
    
    if (metrics.estimated_cost_usd > 0.10) { // Alert if cost > $0.10
      chatLogger.warn('High cost response detected', {
        sessionId,
        cost: metrics.estimated_cost_usd,
        tokens: metrics.output_tokens
      });
    }
    
    // Update conversation metrics with model performance
    setConversationMetrics(prev => ({
      ...prev,
      total_tokens_used: prev.total_tokens_used + metrics.output_tokens,
      estimated_cost_usd: prev.estimated_cost_usd + metrics.estimated_cost_usd,
      avg_response_time_ms: prev.avg_response_time_ms === 0 
        ? metrics.total_response_time_ms 
        : (prev.avg_response_time_ms + metrics.total_response_time_ms) / 2
    }));
  }, [sessionId]);

  // A/B Testing functionality

  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const currentStreamingMessageRef = useRef<Message | null>(null);
  const requestIdRef = useRef<string | null>(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Analytics tracking
  const trackConversationTurn = useCallback((message: Message) => {
    setConversationMetrics(prev => ({
      ...prev,
      total_turns: prev.total_turns + 1,
      [message.type === 'ai' ? 'ai_response_count' : 'user_message_count']: 
        prev[message.type === 'ai' ? 'ai_response_count' : 'user_message_count'] + 1,
      avg_response_time_ms: message.metadata?.response_time_ms 
        ? (prev.avg_response_time_ms + message.metadata.response_time_ms) / 2 
        : prev.avg_response_time_ms,
      total_tokens_used: prev.total_tokens_used + (message.metadata?.tokens_used || 0),
      estimated_cost_usd: prev.estimated_cost_usd + (message.metadata?.tokens_used || 0) * 0.00015, // GPT-4o-mini pricing
      collected_fields: message.metadata?.collected_field 
        ? [...prev.collected_fields, message.metadata.collected_field]
        : prev.collected_fields
    }));
    
    chatLogger.info('Conversation turn tracked', {
      sessionId,
      messageType: message.type,
      turnNumber: conversationMetrics.total_turns + 1,
      hasMetadata: !!message.metadata
    });
  }, [sessionId, conversationMetrics.total_turns]);

  // Track conversation completion
  const trackConversationCompletion = useCallback((successful: boolean, valuationGenerated: boolean) => {
    setConversationMetrics(prev => ({
      ...prev,
      completed_at: new Date(),
      duration_seconds: Math.floor((new Date().getTime() - prev.started_at.getTime()) / 1000),
      successful,
      valuation_generated: valuationGenerated,
      data_completeness_percent: Math.min(100, (prev.collected_fields.length / 10) * 100) // Assuming 10 fields max
    }));
    
    chatLogger.info('Conversation completion tracked', {
      sessionId,
      successful,
      valuationGenerated,
      totalTurns: conversationMetrics.total_turns,
      duration: Math.floor((new Date().getTime() - conversationMetrics.started_at.getTime()) / 1000)
    });
  }, [sessionId, conversationMetrics.total_turns, conversationMetrics.started_at]);

  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    // Simple, direct approach like IlaraAI - trust TypeScript types
    const newMessage: Message = {
      ...message,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      isComplete: message.isComplete ?? false,
      isStreaming: message.isStreaming ?? false,
      content: message.content ?? ''
    };
    
    chatLogger.debug('Adding message', { messageId: newMessage.id, type: newMessage.type });
    
    // Simple state update like IlaraAI - no complex validation
    setMessages(prev => [...prev, newMessage]);
    
    // Track analytics for this message
    trackConversationTurn(newMessage);
    
    return newMessage;
  }, [trackConversationTurn]);

  // Simple monitoring - just log message count changes
  useEffect(() => {
    chatLogger.debug('Messages state updated', { count: messages.length });
  }, [messages]);

  // Backend-driven conversation initialization
  const [isInitializing, setIsInitializing] = useState(true);
  const hasInitializedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ✅ Initialize with retry logic
  const initializeWithRetry = useCallback(async (attempt = 1, maxAttempts = 3) => {
    const startTime = Date.now();
    
    try {
      setIsInitializing(true);
      
      // Get API base URL from config
      const API_BASE_URL = import.meta.env.VITE_VALUATION_ENGINE_URL || 
                          import.meta.env.VITE_VALUATION_API_URL || 
                          'https://upswitch-valuation-engine-production.up.railway.app';
      
      // ✅ Add timeout handling
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 10000); // 10 second timeout
      
      try {
        // Call backend to get intelligent first question
        const response = await fetch(`${API_BASE_URL}/api/v1/intelligent-conversation/start`, {
          method: 'POST',
          signal: abortControllerRef.current?.signal, // ✅ Cancellable
          headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'Authorization': `Bearer ${userId}` } : {})
          },
          body: JSON.stringify({
            session_id: sessionId,
            user_id: userId || null,
            pre_filled_data: userId ? {
              user_id: userId,
              company_name: user?.company_name,
              business_type: user?.business_type,
              industry: user?.industry,
              founded_year: user?.founded_year,
              years_in_operation: user?.years_in_operation,
              employee_count_range: user?.employee_count_range,
              city: user?.city,
              country: user?.country,
              company_description: user?.company_description
            } : null
          })
        });
        
        clearTimeout(timeoutId); // Clear timeout on success
        
        // ✅ MUST CHECK STATUS
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(`Backend initialization failed: ${response.status} - ${errorData.error || errorData.detail || 'Unknown error'}`);
        }
        
        const data = await response.json();
        
        // ✅ VALIDATE RESPONSE STRUCTURE
        if (!data.ai_message || !data.field_name) {
          throw new Error('Invalid response structure from backend');
        }
        
        // ✅ Check if still mounted
        if (!abortControllerRef.current?.signal.aborted) {
          const timeToFirstQuestion = Date.now() - startTime;
          
          // Log successful initialization
          chatLogger.info('Conversation initialized successfully', {
            sessionId,
            userId,
            isAuthenticated: !!userId,
            firstField: data.field_name,
            backendDriven: true,
            attempt,
            timeToFirstQuestionMs: timeToFirstQuestion
          });
          
          // ✅ Track success analytics
          chatLogger.info('conversation_initialized', {
            session_id: sessionId,
            user_id: userId,
            is_authenticated: !!userId,
            time_to_first_question_ms: timeToFirstQuestion,
            backend_driven: true,
            first_field: data.field_name,
            attempt,
            has_profile_data: !!(user?.company_name || user?.business_type || user?.industry)
          });
          
          addMessage({
            type: 'ai',
            content: data.ai_message,
            isComplete: true,
            metadata: {
              collected_field: data.field_name,
              help_text: data.help_text,
              session_phase: 'data_collection',
              conversation_turn: 1
            }
          });
        }
        
      } catch (error) {
        clearTimeout(timeoutId); // Clear timeout on error
        
        if (error instanceof Error && error.name === 'AbortError') {
          chatLogger.info('Initialization cancelled', { sessionId, userId });
          return;
        }
        
        // ✅ Handle timeout specifically
        if (error instanceof Error && error.name === 'AbortError' && abortControllerRef.current?.signal.aborted) {
          chatLogger.warn('Initialization timed out', { sessionId, userId, timeoutMs: 10000 });
          
          // Show timeout message
          if (!abortControllerRef.current?.signal.aborted) {
            addMessage({
              type: 'ai',
              content: 'Sorry, the connection is taking too long. Let me start with a simple question: What type of business do you run?',
              isComplete: true,
              metadata: { collected_field: 'business_type' }
            });
          }
          return;
        }
        
        // ✅ Retry logic with exponential backoff
        if (attempt < maxAttempts) {
          const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          chatLogger.warn(`Initialization attempt ${attempt} failed, retrying in ${delay}ms`, {
            sessionId,
            userId,
            error: error instanceof Error ? error.message : 'Unknown error',
            nextAttempt: attempt + 1,
            maxAttempts
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
          return initializeWithRetry(attempt + 1, maxAttempts);
        }
        
        // ✅ All retries failed - show fallback
        const timeElapsed = Date.now() - startTime;
        
        chatLogger.error('All initialization attempts failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
          sessionId,
          userId,
          stack: error instanceof Error ? error.stack : undefined,
          errorType: error instanceof Error ? error.name : 'Unknown',
          totalAttempts: attempt,
          timeElapsedMs: timeElapsed
        });
        
        // ✅ Track failure analytics
        chatLogger.error('conversation_initialization_failed', {
          session_id: sessionId,
          user_id: userId,
          error_type: error instanceof Error ? error.name : 'Unknown',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          time_elapsed_ms: timeElapsed,
          fallback_used: true,
          total_attempts: attempt,
          has_profile_data: !!(user?.company_name || user?.business_type || user?.industry)
        });
        
        // ✅ Check if still mounted before fallback
        if (!abortControllerRef.current?.signal.aborted) {
          addMessage({
            type: 'ai',
            content: 'Welcome! Let me help you value your business. What type of business do you run?',
            isComplete: true,
            metadata: { collected_field: 'business_type' }
          });
        }
      } finally {
        clearTimeout(timeoutId); // Ensure timeout is always cleared
        if (!abortControllerRef.current?.signal.aborted) {
          setIsInitializing(false);
        }
      }
    } catch (error) {
      chatLogger.error('Unexpected error in initialization retry logic', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId,
        userId,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Final fallback
      if (!abortControllerRef.current?.signal.aborted) {
        addMessage({
          type: 'ai',
          content: 'Welcome! Let me help you value your business. What type of business do you run?',
          isComplete: true,
          metadata: { collected_field: 'business_type' }
        });
        setIsInitializing(false);
      }
    }
  }, [sessionId, userId, addMessage]);

  // Initialize conversation with backend - Fixed to prevent infinite loop
  useEffect(() => {
    // Prevent double initialization
    if (hasInitializedRef.current) return;
    if (messages.length > 0) return;
    
    hasInitializedRef.current = true;
    
    // Create abort controller for cleanup
    abortControllerRef.current = new AbortController();
    
    initializeWithRetry();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [sessionId, initializeWithRetry]); // ✅ Only sessionId - stable dependency

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const updateStreamingMessage = useCallback((content: string, isComplete: boolean = false) => {
    if (!currentStreamingMessageRef.current?.id) {
      chatLogger.warn('No current streaming message to update');
      return;
    }
    
    const currentMessageId = currentStreamingMessageRef.current.id;
    chatLogger.debug('Updating streaming message', { messageId: currentMessageId, contentLength: content.length, isComplete });
    
    // Simple state update like IlaraAI - no complex validation
    setMessages(prev => prev.map(msg => 
      msg.id === currentMessageId
        ? { ...msg, content: msg.content + content, isComplete, isStreaming: !isComplete }
        : msg
    ));
    
    if (isComplete && currentStreamingMessageRef.current) {
      chatLogger.debug('Completing streaming message', { messageId: currentMessageId });
      onMessageComplete?.(currentStreamingMessageRef.current);
      currentStreamingMessageRef.current = null;
    }
  }, [onMessageComplete]);

  // EventSource fallback function
  const tryEventSourceFallback = useCallback((sessionId: string, userInput: string, userId: string | undefined, _aiMessage: Message) => {
    chatLogger.info('Attempting EventSource fallback', { sessionId });
    
    const eventSource = streamingChatService.streamConversationEventSource(
      sessionId,
      userInput,
      userId,
      (event) => {
        chatLogger.info('EventSource event received', { type: event.type, hasContent: !!event.content });
        handleStreamEvent(event);
      },
      (error) => {
        chatLogger.error('EventSource error', { error: error.message });
        setIsStreaming(false);
        addMessage({
          type: 'system',
          content: 'EventSource connection failed. Please try again.',
          isComplete: true
        });
      },
      () => {
        chatLogger.info('EventSource completed', { sessionId });
        setIsStreaming(false);
      }
    );
    
    // Store reference for cleanup
    eventSourceRef.current = eventSource as any;
  }, [addMessage]);

  const handleStreamEvent = useCallback((data: any) => {
    chatLogger.debug('Received stream event', { type: data.type, hasContent: !!data.content, contentLength: data.content?.length });
    
    switch (data.type) {
      case 'typing':
        // AI is typing
        chatLogger.debug('AI typing indicator received');
        break;
        
      case 'message_start':
        // Start of AI response
        chatLogger.debug('AI message start received');
        break;
        
      case 'message_chunk':
        // Stream content
        chatLogger.debug('Message chunk received', { contentLength: data.content?.length });
        updateStreamingMessage(data.content);
        break;
        
      case 'report_update':
        chatLogger.info('Report update received', {
          sessionId,
          progress: data.progress,
          htmlLength: data.html?.length || 0,
          hasHtml: !!data.html,
          timestamp: new Date().toISOString()
        });
        
        // NEW: Update live report as sections are generated
        onReportUpdate?.(data.html, data.progress);
        
        chatLogger.debug('Report update processed', {
          sessionId,
          progress: data.progress,
          htmlPreview: data.html?.substring(0, 100) + '...'
        });
        break;
        
        
      case 'message_complete':
        // Complete response
        chatLogger.debug('Message complete received', { hasMetadata: !!data.metadata, hasValuationResult: !!data.metadata?.valuation_result });
        updateStreamingMessage('', true);
        setIsStreaming(false);
        
        // Track model performance if metadata is available
        if (data.metadata) {
          const performanceMetrics: ModelPerformanceMetrics = {
            model_name: data.metadata.model || 'gpt-4o-mini',
            model_version: '1.0',
            time_to_first_token_ms: data.metadata.response_time_ms || 0,
            total_response_time_ms: data.metadata.response_time_ms || 0,
            tokens_per_second: data.metadata.tokens_used ? (data.metadata.tokens_used / ((data.metadata.response_time_ms || 1) / 1000)) : 0,
            response_coherence_score: data.metadata.confidence_score,
            response_relevance_score: data.metadata.confidence_score,
            hallucination_detected: false, // Would need ML model to detect
            input_tokens: 0, // Not provided by backend
            output_tokens: data.metadata.tokens_used || 0,
            estimated_cost_usd: (data.metadata.tokens_used || 0) * 0.00015, // GPT-4o-mini pricing
            error_occurred: false,
            retry_count: 0
          };
          trackModelPerformance(performanceMetrics);
        }
        
        // Check for valuation result
        if (data.metadata?.valuation_result) {
          chatLogger.info('Valuation result received', { valuationResult: data.metadata.valuation_result });
          onValuationComplete?.(data.metadata.valuation_result);
          // Track successful completion with valuation
          trackConversationCompletion(true, true);
        }
        break;
        
      case 'valuation_complete':
        // NEW: Direct valuation result from streaming endpoint
        chatLogger.info('Valuation complete event received', { 
          hasResult: !!data.result,
          sessionId: data.session_id 
        });
        updateStreamingMessage('', true);
        setIsStreaming(false);
        
        if (data.result) {
          chatLogger.info('Processing valuation result', { 
            valuationId: data.result.valuation_id,
            enterpriseValue: data.result.enterprise_value 
          });
          onValuationComplete?.(data.result);
          // Track successful completion with valuation
          trackConversationCompletion(true, true);
        }
        break;
        
      case 'error': {
        chatLogger.error('Stream error received', { 
          error: data.content,
          sessionId,
          timestamp: new Date().toISOString()
        });
        
        // Show user-friendly error message
        const errorMessage = data.message || data.content || 'Unknown error';
        const userFriendlyError = errorMessage.includes('rate limit') 
          ? 'I\'m receiving too many requests right now. Please wait a moment and try again.'
          : errorMessage.includes('timeout')
          ? 'The request took too long. Please try again with a shorter message.'
          : errorMessage.includes('Context retrieval failed')
          ? 'I\'m having trouble accessing your conversation history. Please try again.'
          : errorMessage.includes('Valuation failed')
          ? 'I encountered an issue calculating your valuation. Please try again.'
          : errorMessage.includes('Processing failed')
          ? 'I\'m having trouble processing your request. Please try again.'
          : errorMessage;
        
        updateStreamingMessage(
          `I apologize, but ${userFriendlyError}`,
          true
        );
        setIsStreaming(false);
        break;
      }
        
      case 'data_collected':
        chatLogger.info('Data collected event received', {
          field: data.field,
          value: data.value,
          completeness: data.completeness
        });
        
        // Enhanced logging for debugging
        console.log('Data collected:', {
          field: data.field,
          value: data.value,
          display_name: data.display_name,
          completeness: data.completeness
        });
        
        // Update local state
        setCollectedData(prev => ({
          ...prev,
          [data.field]: data
        }));
        
        // Notify parent component
        onDataCollected?.(data);
        break;
        
      case 'suggestion_offered': {
        chatLogger.info('Suggestion offered event received', {
          field: data.field,
          original_value: data.original_value,
          suggestions_count: data.suggestions?.length || 0
        });
        
        // Create suggestion message
        const suggestionMessage: Message = {
          id: `suggestion-${Date.now()}`,
          role: 'assistant',
          content: data.message || 'Did you mean one of these?',
          timestamp: new Date(),
          type: 'suggestion',
          metadata: {
            field: data.field,
            originalValue: data.original_value,
            suggestions: data.suggestions
          }
        };
        
        // Add suggestion message to chat
        addMessage(suggestionMessage);
        break;
      }
        
      case 'valuation_preview':
        chatLogger.info('Valuation preview received', {
          range_mid: data.range_mid,
          confidence: data.confidence,
          tier: data.tier
        });
        
        // Update local state
        setValuationPreview(data);
        
        // Notify parent component
        onValuationPreview?.(data);
        break;
        
      case 'calculate_option':
        chatLogger.info('Calculate option available', {
          tier: data.tier,
          confidence: data.confidence
        });
        
        // Update local state
        setCalculateOption(data);
        
        // Notify parent component
        onCalculateOptionAvailable?.(data);
        break;
        
      case 'progress_summary':
        chatLogger.info('Progress summary received', {
          completeness: data.completeness,
          next_milestone: data.next_milestone,
          sections: data.sections
        });
        
        // Log collected fields
        console.log('Collected fields:', data.completeness.collected_count);
        console.log('Sections:', data.sections);
        
        // Update local state
        // setProgressSummary(data);
        
        // Notify parent component
        onProgressUpdate?.(data);
        break;
        
      case 'clarification_needed':
        chatLogger.warn('Clarification needed', {
          field: data.field,
          concern: data.concern
        });
        
        // Show clarification message
        addMessage({
          type: 'ai',
          content: data.message,
          isComplete: true,
          metadata: {
            intent: 'clarification',
            collected_field: data.field,
            validation_status: 'needs_clarification'
          }
        });
        break;
    }
  }, [updateStreamingMessage, onValuationComplete, onReportUpdate, onDataCollected, onValuationPreview, onCalculateOptionAvailable, onProgressUpdate, addMessage]);

  const startStreamingWithRetry = useCallback(async (userInput: string, attempt = 0) => {
    if (!userInput.trim() || isStreaming) return;

    // Request deduplication
    const requestId = `${sessionId}_${Date.now()}`;
    if (requestIdRef.current) {
      chatLogger.warn('Request already in progress', { 
        currentRequestId: requestIdRef.current,
        newRequestId: requestId 
      });
      return;
    }
    requestIdRef.current = requestId;

    
    chatLogger.info('Starting streaming conversation', { 
      userInput: userInput.substring(0, 50) + '...', 
      sessionId, 
      userId,
      attempt,
      maxRetries: 3
    });
    setIsStreaming(true);

    // Add user message
    const userMessage = addMessage({
      type: 'user',
      content: userInput,
      isComplete: true
    });
    chatLogger.debug('User message added', { messageId: userMessage.id });

    // Create streaming AI message
    const aiMessage = addMessage({
      type: 'ai',
      content: '',
      isStreaming: true,
      isComplete: false
    });
    
    if (!aiMessage) {
      chatLogger.error('Failed to create AI message - this should not happen');
      setIsStreaming(false);
      return;
    }
    
    chatLogger.debug('AI message created for streaming', { messageId: aiMessage.id });
    currentStreamingMessageRef.current = aiMessage;

    try {
      chatLogger.info('Starting async generator consumption', { sessionId, userInput: userInput.substring(0, 50) + '...' });
      let eventCount = 0;
      let generatorTimeout: NodeJS.Timeout;
      
      // Set timeout to detect if generator hangs
      generatorTimeout = setTimeout(() => {
        chatLogger.warn('Async generator timeout - no events received in 10 seconds', { sessionId });
        setIsStreaming(false);
        addMessage({
          type: 'system',
          content: 'Streaming timeout. Please try again.',
          isComplete: true
        });
      }, 10000);
      
      // Use streaming service
      for await (const event of streamingChatService.streamConversation(
        sessionId,
        userInput,
        userId
      )) {
        clearTimeout(generatorTimeout);
        eventCount++;
        chatLogger.info('Event received from generator', { 
          eventCount, 
          type: event.type, 
          hasContent: !!event.content,
          contentLength: event.content?.length,
          sessionId: event.session_id 
        });
        handleStreamEvent(event);
      }
      
      clearTimeout(generatorTimeout);
      chatLogger.info('Async generator completed', { 
        totalEvents: eventCount, 
        sessionId,
        messageId: aiMessage.id 
      });
      
      // If no events were received, try EventSource fallback
      if (eventCount === 0) {
        chatLogger.warn('No events received from async generator, trying EventSource fallback', { sessionId });
        tryEventSourceFallback(sessionId, userInput, userId, aiMessage);
        return;
      }

    } catch (error) {
      chatLogger.error('Async generator error', { 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        sessionId,
        messageId: aiMessage.id,
        userInput: userInput.substring(0, 50) + '...',
        attempt,
        maxRetries: 3
      });
      
      // Retry logic with exponential backoff
      if (attempt < 3) {
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        chatLogger.info('Retrying streaming conversation', { 
          attempt: attempt + 1, 
          delay,
          sessionId 
        });
        
        setTimeout(() => {
          startStreamingWithRetry(userInput, attempt + 1);
        }, delay);
        return;
      }
      
      // Max retries exceeded - show retry button
      setIsStreaming(false);
      if (currentStreamingMessageRef.current) {
        updateStreamingMessage(
          'I apologize, but I\'m having trouble connecting. Please try again.',
          true
        );
      }
    } finally {
      // Clear request ID to allow new requests
      requestIdRef.current = null;
    }
  }, [sessionId, userId, isStreaming, addMessage, handleStreamEvent]);


  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isStreaming || disabled) return;
    
    const userInput = input.trim();
    
    // Validate input before processing
    const validation = await validateInput(userInput);
    
    if (!validation.is_valid) {
      // Show validation errors to user
      addMessage({
        type: 'system',
        content: `Please correct the following issues:\n${validation.errors.join('\n')}`,
        isComplete: true,
        metadata: {
          intent: 'error',
          validation_status: 'invalid',
          error_type: 'validation_failed'
        }
      });
      return;
    }
    
    // Show warnings if any
    if (validation.warnings.length > 0) {
      addMessage({
        type: 'system',
        content: `Note: ${validation.warnings.join(', ')}`,
        isComplete: true,
        metadata: {
          intent: 'warning',
          validation_status: 'needs_clarification'
        }
      });
    }
    
    setInput('');
    startStreamingWithRetry(validation.sanitized_input);
  }, [input, isStreaming, disabled, startStreamingWithRetry, validateInput, addMessage]);

  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  }, [handleSubmit]);

  // Handle suggestion selection
  const handleSuggestionSelect = useCallback(async (field: string, value: string) => {
    chatLogger.info('Suggestion selected', { field, value });
    
    // Add user message showing selection
    addMessage({
      id: `user-${Date.now()}`,
      type: 'user',
      content: value,
      timestamp: new Date(),
      metadata: { 
        field, 
        selected_from_suggestions: true,
        original_suggestion: value
      }
    });
    
    // Submit directly to backend
    await startStreamingWithRetry(value);
  }, [addMessage, startStreamingWithRetry]);

  // Handle suggestion dismissal
  const handleSuggestionDismiss = useCallback(async (field: string, originalValue: string) => {
    chatLogger.info('Suggestion dismissed', { field, originalValue });
    
    // Add user message showing they kept original
    addMessage({
      id: `user-${Date.now()}`,
      type: 'user',
      content: originalValue,
      timestamp: new Date(),
      metadata: { 
        field, 
        dismissed_suggestions: true,
        original_value: originalValue
      }
    });
    
    // Submit directly to backend
    await startStreamingWithRetry(originalValue);
  }, [addMessage, startStreamingWithRetry]);

  const getSmartFollowUps = useCallback(() => {
    const messageCount = messages.length;
    const lastAiMessage = messages.filter(m => m.type === 'ai').slice(-1)[0];
    const lastAiContent = lastAiMessage?.content.toLowerCase() || '';
    
    chatLogger.debug('Getting smart follow-ups', { 
      messageCount,
      lastAiMessageId: lastAiMessage?.id 
    });
    
    // Smart responses based on AI's last question
    if (lastAiContent.includes('revenue') || lastAiContent.includes('turnover')) {
      return [
        "€100K - €500K",
        "€500K - €1M"
      ];
    }
    
    if (lastAiContent.includes('profit') || lastAiContent.includes('ebitda')) {
      return [
        "10-20% margin",
        "20-30% margin"
      ];
    }
    
    if (lastAiContent.includes('industry') || lastAiContent.includes('sector')) {
      return [
        "Technology/SaaS",
        "E-commerce/Retail"
      ];
    }
    
    if (lastAiContent.includes('growth') || lastAiContent.includes('growing')) {
      return [
        "Growing 20%+ YoY",
        "Growing 10-20% YoY"
      ];
    }
    
    if (lastAiContent.includes('employees') || lastAiContent.includes('team')) {
      return [
        "1-10 employees",
        "11-50 employees"
      ];
    }
    
    // Default contextual suggestions based on stage
    if (messageCount <= 2) {
      return [
        "What is my business worth?",
        "How do you calculate valuation?"
      ];
    } else if (messageCount <= 5) {
      return [
        "Can you explain the methodology?",
        "What are industry benchmarks?"
      ];
    } else {
      return [
        "Generate full report",
        "Compare to similar businesses"
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
    <div className={`flex flex-col h-full bg-zinc-900 ${className}`}>


      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Loading state while backend initializes */}
        {isInitializing && messages.length === 0 && (
          <div className="flex justify-start">
            <div className="max-w-[80%] mr-auto">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center animate-pulse">
                  <Bot className="w-4 h-4 text-primary-400" />
                </div>
                <div className="rounded-lg px-4 py-2 bg-zinc-700/50 text-white">
                  <div className="whitespace-pre-wrap text-sm text-zinc-400">
                    Preparing your personalized valuation experience...
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {messages.map((message) => (
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
                  </div>
                  
                  {/* NEW: Display suggestion chips if available */}
                  {message.type === 'suggestion' && message.metadata?.suggestions && (
                    <div className="mt-3">
                      <SuggestionChips
                        suggestions={message.metadata.suggestions}
                        originalValue={message.metadata.originalValue || ''}
                        field={message.metadata.field || ''}
                        onSelect={(selected) => handleSuggestionSelect(message.metadata?.field || '', selected)}
                        onDismiss={() => handleSuggestionDismiss(message.metadata?.field || '', message.metadata?.originalValue || '')}
                      />
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
                    <div className="flex items-center gap-2 animate-fade-in">
                      <LoadingDots size="sm" color="text-white" />
                      <span className="text-sm text-zinc-300 animate-pulse">{loadingMessage}</span>
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

      {/* Data Collection Panel */}
      {Object.keys(collectedData).length > 0 && (
        <div className="px-4 pb-2">
          <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700/50">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Collected Data
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(collectedData).map(([field, data]: [string, any]) => (
                <div key={field} className="flex items-center gap-2 text-xs data-collected-item">
                  <span className="text-zinc-400">{data.icon}</span>
                  <span className="text-zinc-300">{data.display_name}:</span>
                  <span className="text-white font-medium">{data.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Calculate Now Button */}
      {calculateOption && (
        <div className="px-4 pb-2">
          <div className="bg-primary-600/20 rounded-lg p-4 border border-primary-500/50">
            <p className="text-sm text-white mb-3">{calculateOption.message}</p>
            <button
              onClick={() => {
                // Handle calculate now action
                chatLogger.info('Calculate now clicked', { tier: calculateOption.tier });
                // TODO: Implement calculate now functionality
              }}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              {calculateOption.cta}
            </button>
            <p className="text-xs text-zinc-400 mt-2 text-center">
              {calculateOption.continue_message}
            </p>
          </div>
        </div>
      )}


      {/* Valuation Preview */}
      {valuationPreview && (
        <div className="px-4 pb-2">
          <div className="bg-green-600/20 rounded-lg p-4 border border-green-500/50">
            <h4 className="text-sm font-semibold text-white mb-3">Valuation Preview</h4>
            <div className="text-xs text-zinc-300">
              <p>Range: ${valuationPreview.range_low?.toLocaleString()} - ${valuationPreview.range_high?.toLocaleString()}</p>
              <p>Confidence: {valuationPreview.confidence_label}</p>
            </div>
          </div>
        </div>
      )}

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
              className="flex w-full rounded-md px-3 py-3 ring-offset-background placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-sm leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap max-h-[200px] bg-transparent focus:bg-transparent flex-1 text-white border-none"
              style={{ minHeight: '60px', height: '60px' }}
              spellCheck="false"
            />
          </div>

          {/* Action buttons row */}
          <div className="flex gap-2 flex-wrap items-center">
            {getSmartFollowUps().map((suggestion, idx) => (
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
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="100%" 
                    height="100%" 
                    viewBox="0 -960 960 960" 
                    className="shrink-0 h-5 w-5 text-black" 
                    fill="currentColor"
                  >
                    <path d="M452-644 303-498q-9 9-21 8.5t-21-9.5-9-21 9-21l199-199q9-9 21-9t21 9l199 199q9 9 9 21t-9 21-21 9-21-9L512-646v372q0 13-8.5 21.5T482-244t-21.5-8.5T452-274z"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
