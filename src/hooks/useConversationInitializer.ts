/**
 * useConversationInitializer - Handles conversation initialization with retry logic
 * 
 * Extracted from StreamingChat.tsx to reduce component complexity and improve maintainability.
 * Centralizes all initialization logic including backend calls, retry mechanisms, and fallback handling.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { chatLogger } from '../utils/logger';
import { Message } from './useStreamingChatState';

// Fallback questions for when backend is unavailable
const FALLBACK_QUESTIONS = [
  {
    question: "Welcome! Let me help you value your business. What type of business do you run?",
    field: "business_type",
    inputType: "select",
    options: ["Technology", "Manufacturing", "Services", "Retail", "Other"]
  },
  {
    question: "What was your annual revenue last year?",
    field: "revenue",
    inputType: "number",
    helpText: "Enter your total annual revenue"
  },
  {
    question: "How many employees do you have?",
    field: "employee_count",
    inputType: "number",
    helpText: "Enter the number of full-time employees"
  }
];

export interface UserProfile {
  company_name?: string;
  business_type?: string;
  industry?: string;
  founded_year?: number;
  years_in_operation?: number;
  employee_count_range?: string;
  city?: string;
  country?: string;
  company_description?: string;
}

export interface ConversationInitializerCallbacks {
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => { updatedMessages: Message[], newMessage: Message };
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  user?: UserProfile;
}

/**
 * Custom hook that handles conversation initialization with comprehensive retry logic
 * 
 * @param sessionId - Unique session identifier
 * @param userId - Optional user identifier
 * @param callbacks - Callback functions for message management
 * @returns Initialization state and control functions
 */
export const useConversationInitializer = (
  sessionId: string,
  userId?: string,
  callbacks?: ConversationInitializerCallbacks
) => {
  const [isInitializing, setIsInitializing] = useState(true);
  const hasInitializedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Fallback mode when backend is unavailable
   */
  const useFallbackMode = useCallback(() => {
    if (!callbacks) return;
    
    const firstQuestion = FALLBACK_QUESTIONS[0];
    
    // Add the fallback question as an AI message
    const fallbackMessage: Message = {
      id: `fallback-${Date.now()}`,
      type: 'ai',
      role: 'assistant',
      content: firstQuestion.question,
      timestamp: new Date(),
      metadata: {
        intent: 'question',
        topic: 'business_type',
        collected_field: firstQuestion.field,
        help_text: firstQuestion.helpText,
        fallback_mode: true
      }
    };
    
    callbacks.setMessages([fallbackMessage]);
    setIsInitializing(false);
    
    chatLogger.info('Using fallback mode - backend unavailable', {
      session_id: sessionId,
      question: firstQuestion.question
    });
  }, [sessionId, callbacks]);

  /**
   * Initialize conversation with retry logic and comprehensive error handling
   */
  const initializeWithRetry = useCallback(async (attempt = 1, maxAttempts = 3) => {
    if (!callbacks) return;
    
    const startTime = Date.now();
    
    try {
      setIsInitializing(true);
      
      // Get API base URL from config
      const API_BASE_URL = import.meta.env.VITE_VALUATION_ENGINE_URL || 
                          import.meta.env.VITE_VALUATION_API_URL || 
                          'https://upswitch-valuation-engine-production.up.railway.app';
      
      // Add timeout handling
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 10000); // 10 second timeout
      
      try {
        // Call backend to get intelligent first question
        const response = await fetch(`${API_BASE_URL}/api/v1/intelligent-conversation/start`, {
          method: 'POST',
          signal: abortControllerRef.current?.signal, // Cancellable
          headers: {
            'Content-Type': 'application/json',
            ...(userId ? { 'Authorization': `Bearer ${userId}` } : {})
          },
          body: JSON.stringify({
            session_id: sessionId,
            user_id: userId || null,
            pre_filled_data: userId ? {
              user_id: userId,
              company_name: callbacks.user?.company_name,
              business_type: callbacks.user?.business_type,
              industry: callbacks.user?.industry,
              founded_year: callbacks.user?.founded_year,
              years_in_operation: callbacks.user?.years_in_operation,
              employee_count_range: callbacks.user?.employee_count_range,
              city: callbacks.user?.city,
              country: callbacks.user?.country,
              company_description: callbacks.user?.company_description
            } : null
          })
        });
        
        clearTimeout(timeoutId); // Clear timeout on success
        
        // Check response status
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(`Backend initialization failed: ${response.status} - ${errorData.error || errorData.detail || 'Unknown error'}`);
        }
        
        const data = await response.json();
        
        // Validate response structure
        if (!data.ai_message || !data.field_name) {
          throw new Error('Invalid response structure from backend');
        }
        
        // Check if still mounted
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
          
          // Track success analytics
          chatLogger.info('conversation_initialized', {
            session_id: sessionId,
            user_id: userId,
            is_authenticated: !!userId,
            time_to_first_question_ms: timeToFirstQuestion,
            backend_driven: true,
            first_field: data.field_name,
            attempt,
            has_profile_data: !!(callbacks.user?.company_name || callbacks.user?.business_type || callbacks.user?.industry)
          });
          
          const message: Omit<Message, 'id' | 'timestamp'> = {
            type: 'ai',
            content: data.ai_message,
            isComplete: true,
            metadata: {
              collected_field: data.field_name,
              help_text: data.help_text,
              session_phase: 'data_collection',
              conversation_turn: 1
            }
          };
          callbacks.addMessage(message);
        }
        
      } catch (error) {
        clearTimeout(timeoutId); // Clear timeout on error
        
        if (error instanceof Error && error.name === 'AbortError') {
          chatLogger.info('Initialization cancelled', { sessionId, userId });
          return;
        }
        
        // Handle timeout specifically
        if (error instanceof Error && error.name === 'AbortError' && abortControllerRef.current?.signal.aborted) {
          chatLogger.warn('Initialization timed out', { sessionId, userId, timeoutMs: 10000 });
          
          // Show timeout message
          if (!abortControllerRef.current?.signal.aborted) {
            const timeoutMessage: Omit<Message, 'id' | 'timestamp'> = {
              type: 'ai',
              content: 'Sorry, the connection is taking too long. Let me start with a simple question: What type of business do you run?',
              isComplete: true,
              metadata: { collected_field: 'business_type' }
            };
            callbacks.addMessage(timeoutMessage);
          }
          return;
        }
        
        // Retry logic with exponential backoff
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
        
        // All retries failed - use fallback mode
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
        
        // Track failure analytics
        chatLogger.error('conversation_initialization_failed', {
          session_id: sessionId,
          user_id: userId,
          error_type: error instanceof Error ? error.name : 'Unknown',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          time_elapsed_ms: timeElapsed,
          fallback_used: true,
          total_attempts: attempt,
          has_profile_data: !!(callbacks.user?.company_name || callbacks.user?.business_type || callbacks.user?.industry)
        });
        
        // Use fallback mode instead of showing error
        useFallbackMode();
        
        // Check if still mounted before fallback
        if (!abortControllerRef.current?.signal.aborted) {
          const welcomeMessage: Omit<Message, 'id' | 'timestamp'> = {
            type: 'ai',
            content: 'Welcome! Let me help you value your business. What type of business do you run?',
            isComplete: true,
            metadata: { collected_field: 'business_type' }
          };
          callbacks.addMessage(welcomeMessage);
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
      if (!abortControllerRef.current?.signal.aborted && callbacks) {
        const finalFallbackMessage: Omit<Message, 'id' | 'timestamp'> = {
          type: 'ai',
          content: 'Welcome! Let me help you value your business. What type of business do you run?',
          isComplete: true,
          metadata: { collected_field: 'business_type' }
        };
        callbacks.addMessage(finalFallbackMessage);
        setIsInitializing(false);
      }
    }
  }, [sessionId, userId, callbacks, useFallbackMode]);

  /**
   * Initialize conversation with backend - Fixed to prevent infinite loop
   */
  useEffect(() => {
    // Prevent double initialization
    if (hasInitializedRef.current || !callbacks) return;
    
    hasInitializedRef.current = true;
    initializeWithRetry();
    
    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [sessionId, initializeWithRetry, callbacks]);

  /**
   * Reset initialization state (useful for testing or manual re-initialization)
   */
  const resetInitialization = useCallback(() => {
    hasInitializedRef.current = false;
    setIsInitializing(true);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
  }, []);

  return {
    isInitializing,
    initializeWithRetry,
    resetInitialization,
    useFallbackMode
  };
};
