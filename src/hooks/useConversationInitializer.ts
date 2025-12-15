/**
 * useConversationInitializer - Handles conversation initialization with retry logic
 *
 * Extracted from StreamingChat.tsx to reduce component complexity and improve maintainability.
 * Centralizes all initialization logic including backend calls, retry mechanisms, and fallback handling.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { guestSessionService } from '../services/guestSessionService'
import { chatLogger } from '../utils/logger'
import type { Message } from '../types/message'

// Fallback questions for when backend is unavailable
const FALLBACK_QUESTIONS = [
  {
    question: 'Welcome! Let me help you value your business. What is the name of your company?',
    field: 'company_name',
    inputType: 'text',
    helpText: 'Enter your registered company name',
  },
  {
    question: 'What type of business do you run?',
    field: 'business_type',
    inputType: 'select',
    options: ['Technology', 'Manufacturing', 'Services', 'Retail', 'Other'],
  },
  {
    question: 'What was your annual revenue last year?',
    field: 'revenue',
    inputType: 'number',
    helpText: 'Enter your total annual revenue',
  },
  {
    question: 'How many employees do you have?',
    field: 'employee_count',
    inputType: 'number',
    helpText: 'Enter the number of full-time employees',
  },
]

export interface UserProfile {
  company_name?: string
  business_type?: string
  industry?: string
  founded_year?: number
  years_in_operation?: number
  employee_count_range?: string
  city?: string
  country?: string
  company_description?: string
}

export interface ConversationInitializerCallbacks {
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
    updatedMessages: Message[]
    newMessage: Message
  }
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  getCurrentMessages?: () => Message[] // CRITICAL: Function to get current messages state (for race condition prevention)
  user?: UserProfile
  onSessionIdUpdate?: (sessionId: string) => void
  initialData?: Partial<any> // Pre-filled data from session (for resuming conversations)
  initialMessages?: Message[] // CRITICAL: Restored conversation history - skip initialization if present
  isRestoring?: boolean // CRITICAL: Indicates if conversation restoration is in progress
  isSessionInitialized?: boolean // CRITICAL: Indicates if session initialization is complete
  pythonSessionId?: string | null // NEW: Current Python sessionId (for restoration coordination)
  isRestorationComplete?: boolean // NEW: Explicit restoration completion flag
  autoSend?: boolean // NEW: Skip initialization if auto-send is enabled
  initialMessage?: string | null // NEW: Initial message to send (used with autoSend)
}

/**
 * Custom hook that handles conversation initialization with comprehensive retry logic
 *
 * @param sessionId - Unique session identifier
 * @param userId - Optional user identifier
 * @param callbacks - Callback functions for message management
 * @param initialData - Pre-filled data from session (for resuming conversations)
 * @returns Initialization state and control functions
 */
export const useConversationInitializer = (
  sessionId: string,
  userId?: string,
  callbacks?: ConversationInitializerCallbacks
) => {
  const [isInitializing, setIsInitializing] = useState(true)
  const hasInitializedRef = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Track last pythonSessionId to detect changes
  const lastPythonSessionIdRef = useRef<string | null>(null)

  /**
   * Fallback mode when backend is unavailable
   */
  const useFallbackMode = useCallback(() => {
    if (!callbacks) return

    const firstQuestion = FALLBACK_QUESTIONS[0]

    // Add the fallback question as an AI message
    const fallbackMessage: Message = {
      id: `fallback-${Date.now()}`,
      type: 'ai',
      role: 'assistant',
      content: firstQuestion.question,
      timestamp: new Date(),
      metadata: {
        intent: 'question',
        topic: 'company_name',
        collected_field: firstQuestion.field,
        help_text: firstQuestion.helpText,
        fallback_mode: true,
      },
    }

    callbacks.setMessages([fallbackMessage])
    setIsInitializing(false)

    chatLogger.info('Using fallback mode - backend unavailable', {
      session_id: sessionId,
      question: firstQuestion.question,
    })
  }, [sessionId, callbacks])

  /**
   * Initialize conversation with retry logic and comprehensive error handling
   */
  const initializeWithRetry = useCallback(
    async (attempt = 1, maxAttempts = 3) => {
      if (!callbacks) return

      const startTime = Date.now()

      try {
        setIsInitializing(true)

        // Get API base URL from config
        // FIX: Fallback should be Node.js backend (proxy), not Python engine directly
        const API_BASE_URL =
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          process.env.NEXT_PUBLIC_API_URL ||
          'https://web-production-8d00b.up.railway.app'

        // Add timeout handling
        const timeoutId = setTimeout(() => {
          if (abortControllerRef.current) {
            abortControllerRef.current.abort()
          }
        }, 10000) // 10 second timeout

        try {
          // Get guest session ID if user is a guest
          let guestSessionId: string | null = null
          if (!userId) {
            try {
              guestSessionId = await guestSessionService.getOrCreateSession()
            } catch (error) {
              chatLogger.warn('Failed to get guest session ID', { error })
              // Continue without guest session ID - not critical
            }
          }

          // Call backend to get intelligent first question
          const response = await fetch(`${API_BASE_URL}/api/v1/intelligent-conversation/start`, {
            method: 'POST',
            signal: abortControllerRef.current?.signal, // Cancellable
            credentials: 'include', // Send cookies automatically for auth
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: userId || null,
              guest_session_id: guestSessionId, // Add guest session ID for guest users
              // Python backend generates session_id - don't send it
              business_context: userId
                ? {
                    company_name: callbacks.user?.company_name,
                    industry: callbacks.user?.industry,
                    business_type: callbacks.user?.business_type,
                    country_code: callbacks.user?.country,
                    founding_year: callbacks.user?.founded_year,
                  }
                : undefined,
              pre_filled_data: userId
                ? {
                    user_id: userId,
                    company_name: callbacks.user?.company_name,
                    business_type: callbacks.user?.business_type,
                    industry: callbacks.user?.industry,
                    founded_year: callbacks.user?.founded_year,
                    years_in_operation: callbacks.user?.years_in_operation,
                    employee_count_range: callbacks.user?.employee_count_range,
                    city: callbacks.user?.city,
                    country: callbacks.user?.country,
                    company_description: callbacks.user?.company_description,
                  }
                : undefined,
              user_preferences: {
                time_commitment: 'detailed',
                focus_area: 'all',
              },
            }),
          })

          clearTimeout(timeoutId) // Clear timeout on success

          // Check response status
          if (!response.ok) {
            const errorBody = await response.text()
            chatLogger.error('Conversation start failed', {
              status: response.status,
              statusText: response.statusText,
              errorBody: errorBody,
              requestBody: {
                user_id: userId || null,
                business_context: userId
                  ? {
                      company_name: callbacks.user?.company_name,
                      industry: callbacks.user?.industry,
                      business_type: callbacks.user?.business_type,
                      country_code: callbacks.user?.country,
                      founding_year: callbacks.user?.founded_year,
                    }
                  : undefined,
                pre_filled_data: userId
                  ? {
                      user_id: userId,
                      company_name: callbacks.user?.company_name,
                      business_type: callbacks.user?.business_type,
                      industry: callbacks.user?.industry,
                      founded_year: callbacks.user?.founded_year,
                      years_in_operation: callbacks.user?.years_in_operation,
                      employee_count_range: callbacks.user?.employee_count_range,
                      city: callbacks.user?.city,
                      country: callbacks.user?.country,
                      company_description: callbacks.user?.company_description,
                    }
                  : undefined,
                user_preferences: {
                  time_commitment: 'detailed',
                  focus_area: 'all',
                },
              },
            })
            throw new Error(`HTTP ${response.status}: ${errorBody}`)
          }

          const data = await response.json()

          // Python backend returns the session_id - use it
          const pythonSessionId = data.session_id

          // CRITICAL FIX: Validate session_id is present
          if (!pythonSessionId) {
            chatLogger.error('Missing session_id in /start response', {
              clientSessionId: sessionId,
              responseKeys: Object.keys(data),
            })
            throw new Error('Backend did not return session_id')
          }

          // Log session ID transition
          chatLogger.info('Received session ID from Python backend', {
            clientSessionId: sessionId,
            backendSessionId: pythonSessionId,
            isAuthenticated: !!userId,
          })

          // Update parent component with Python session ID
          callbacks.onSessionIdUpdate?.(pythonSessionId)

          // Validate response structure
          if (!data.ai_message || !data.field_name) {
            throw new Error('Invalid response structure from backend')
          }

          // CRITICAL FIX: Check if still mounted and not aborted before any state updates
          if (abortControllerRef.current?.signal.aborted) {
            chatLogger.debug('Initialization aborted - skipping state updates', { sessionId })
            return
          }

          const timeToFirstQuestion = Date.now() - startTime

          // Log successful initialization
          chatLogger.info('Conversation initialized successfully', {
            sessionId,
            userId,
            isAuthenticated: !!userId,
            firstField: data.field_name,
            backendDriven: true,
            attempt,
            timeToFirstQuestionMs: timeToFirstQuestion,
          })

          // Track success analytics
          chatLogger.info('conversation_initialized', {
            session_id: sessionId,
            user_id: userId,
            is_authenticated: !!userId,
            time_to_first_question_ms: timeToFirstQuestion,
            backend_driven: true,
            first_field: data.field_name,
            attempt,
            has_profile_data: !!(
              callbacks.user?.company_name ||
              callbacks.user?.business_type ||
              callbacks.user?.industry
            ),
          })

          // CRITICAL FIX: Check again before state updates (double-check pattern)
          if (abortControllerRef.current?.signal.aborted) {
            chatLogger.debug('Initialization aborted before state update - skipping', { sessionId })
            return
          }

          // CRITICAL FIX: Create initial message from /start endpoint
          // This displays the first question immediately when page loads
          // Backend handles message flow - frontend trusts backend completely
          // ALWAYS display the first question so user can see what they're answering
          const message: Omit<Message, 'id' | 'timestamp'> = {
            type: 'ai',
            content: data.ai_message,
            isComplete: true,
            isStreaming: false,
            metadata: {
              collected_field: data.field_name,
                help_text: data.help_text,
                session_phase: 'data_collection',
                conversation_turn: 1,
              },
            }
            
          // CRITICAL FIX: Final check before state update
          if (abortControllerRef.current?.signal.aborted) {
            chatLogger.debug('Initialization aborted before adding message - skipping', { sessionId })
            return
          }
          
          callbacks.addMessage(message)

          chatLogger.debug('Initial message created from /start', {
            field: data.field_name,
            questionPreview: data.ai_message?.substring(0, 50),
            autoSend: callbacks.autoSend,
          })
          
          // CRITICAL FIX: Set isInitializing to false only if not aborted
          if (!abortControllerRef.current?.signal.aborted) {
            setIsInitializing(false)
          }
        } catch (error) {
          clearTimeout(timeoutId) // Clear timeout on error

          if (error instanceof Error && error.name === 'AbortError') {
            chatLogger.info('Initialization cancelled', { sessionId, userId })
            return
          }

          // Handle timeout specifically
          if (
            error instanceof Error &&
            error.name === 'AbortError' &&
            abortControllerRef.current?.signal.aborted
          ) {
            chatLogger.warn('Initialization timed out', { sessionId, userId, timeoutMs: 10000 })

            // Show timeout message
            if (!abortControllerRef.current?.signal.aborted) {
              const timeoutMessage: Omit<Message, 'id' | 'timestamp'> = {
                type: 'ai',
                content:
                  'Sorry, the connection is taking too long. Let me start with a simple question: What is the name of your company?',
                isComplete: true,
                metadata: { collected_field: 'company_name' },
              }
              callbacks.addMessage(timeoutMessage)
            }
            return
          }

          // Retry logic with exponential backoff
          if (attempt < maxAttempts) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000)
            chatLogger.warn(`Initialization attempt ${attempt} failed, retrying in ${delay}ms`, {
              sessionId,
              userId,
              error: error instanceof Error ? error.message : 'Unknown error',
              nextAttempt: attempt + 1,
              maxAttempts,
            })

            await new Promise((resolve) => setTimeout(resolve, delay))
            return initializeWithRetry(attempt + 1, maxAttempts)
          }

          // All retries failed - use fallback mode
          const timeElapsed = Date.now() - startTime

          chatLogger.error('All initialization attempts failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            sessionId,
            userId,
            stack: error instanceof Error ? error.stack : undefined,
            errorType: error instanceof Error ? error.name : 'Unknown',
            totalAttempts: attempt,
            timeElapsedMs: timeElapsed,
          })

          // Track failure analytics
          chatLogger.error('conversation_initialization_failed', {
            session_id: sessionId,
            user_id: userId,
            error_type: error instanceof Error ? error.name : 'Unknown',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            time_elapsed_ms: timeElapsed,
            fallback_used: true,
            total_attempts: attempt,
            has_profile_data: !!(
              callbacks.user?.company_name ||
              callbacks.user?.business_type ||
              callbacks.user?.industry
            ),
          })

          // Use fallback mode instead of showing error
          useFallbackMode()

          // Check if still mounted before fallback
          if (!abortControllerRef.current?.signal.aborted) {
            const welcomeMessage: Omit<Message, 'id' | 'timestamp'> = {
              type: 'ai',
              content:
                'Welcome! Let me help you value your business. What is the name of your company?',
              isComplete: true,
              metadata: { collected_field: 'company_name' },
            }
            callbacks.addMessage(welcomeMessage)
          }
        } finally {
          clearTimeout(timeoutId) // Ensure timeout is always cleared
          if (!abortControllerRef.current?.signal.aborted) {
            setIsInitializing(false)
          }
        }
      } catch (error) {
        chatLogger.error('Unexpected error in initialization retry logic', {
          error: error instanceof Error ? error.message : 'Unknown error',
          sessionId,
          userId,
          stack: error instanceof Error ? error.stack : undefined,
        })

        // Final fallback
        if (!abortControllerRef.current?.signal.aborted && callbacks) {
          const finalFallbackMessage: Omit<Message, 'id' | 'timestamp'> = {
            type: 'ai',
            content:
              'Welcome! Let me help you value your business. What type of business do you run?',
            isComplete: true,
            metadata: { collected_field: 'business_type' },
          }
          callbacks.addMessage(finalFallbackMessage)
          setIsInitializing(false)
        }
      }
    },
    [sessionId, userId, callbacks, useFallbackMode]
  )

  /**
   * Initialize conversation with backend - Race condition prevention
   *
   * RULES (in priority order):
   * 1. If pythonSessionId changed → reset initialization state
   * 2. If messages exist → use existing conversation (skip initialization)
   * 3. If session not initialized → wait
   * 4. If restoration not complete → wait (prevents starting new before we know if messages exist)
   * 5. If already initialized → skip
   * 6. Otherwise → start new conversation
   */
  useEffect(() => {
    if (!callbacks) return

    const currentPythonSessionId = callbacks.pythonSessionId ?? null
    const pythonSessionIdChanged = lastPythonSessionIdRef.current !== currentPythonSessionId

    // RULE 1: Reset state if pythonSessionId changed (session transition)
    if (pythonSessionIdChanged) {
      chatLogger.info('🔄 Python sessionId changed - resetting initialization state', {
        previousSessionId: lastPythonSessionIdRef.current,
        newSessionId: currentPythonSessionId,
        sessionId,
      })
      hasInitializedRef.current = false
      setIsInitializing(true)
      lastPythonSessionIdRef.current = currentPythonSessionId

      // Abort any pending initialization
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = new AbortController()
      }
    }

    const currentMessages = callbacks.getCurrentMessages ? callbacks.getCurrentMessages() : []
    const hasMessages = currentMessages.length > 0

    chatLogger.debug('useConversationInitializer: state check', {
      sessionId,
      pythonSessionId: currentPythonSessionId,
      messageCount: currentMessages.length,
      hasMessages,
      isRestoring: callbacks.isRestoring,
      isSessionInitialized: callbacks.isSessionInitialized,
      isRestorationComplete: callbacks.isRestorationComplete,
      hasInitialized: hasInitializedRef.current,
      pythonSessionIdChanged,
    })

    // RULE 2: Messages exist → use existing conversation
    if (hasMessages) {
      chatLogger.info('✅ Messages found - using existing conversation', {
        sessionId,
        messageCount: currentMessages.length,
        pythonSessionId: currentPythonSessionId,
      })
      hasInitializedRef.current = true
      setIsInitializing(false)
      return
    }

    // RULE 3: Session not initialized → wait
    if (!callbacks.isSessionInitialized) {
      chatLogger.debug('Session not initialized - waiting', {
        sessionId,
        pythonSessionId: currentPythonSessionId,
      })
      return
    }

    // RULE 4: Restoration not complete → wait (critical for race condition prevention)
    if (!callbacks.isRestorationComplete) {
      chatLogger.debug('Restoration not complete - waiting', {
        sessionId,
        pythonSessionId: currentPythonSessionId,
      })
      return
    }

    // RULE 5: Already initialized → skip
    if (hasInitializedRef.current) {
      chatLogger.debug('Already initialized - skipping', {
        sessionId,
        pythonSessionId: currentPythonSessionId,
      })
      return
    }

    // RULE 6: Auto-send enabled → still initialize conversation, but skip displaying initial AI message
    // CRITICAL: We must call /start to initialize the conversation session on the backend,
    // even when autoSend=true, so the backend knows about the conversation before we send the first message
    if (callbacks.autoSend && callbacks.initialMessage && callbacks.initialMessage.trim()) {
      chatLogger.info('⏭️ Auto-send enabled - initializing conversation without displaying initial message', {
        sessionId,
        pythonSessionId: currentPythonSessionId,
        initialMessage: callbacks.initialMessage.substring(0, 50),
      })
      hasInitializedRef.current = true
      // Call initializeWithRetry but with a flag to skip adding the initial AI message
      // The initializeWithRetry function will handle calling /start to create the conversation
      initializeWithRetry()
      // Note: setIsInitializing(false) will be called by initializeWithRetry when it completes
      return
    }

    // RULE 7: Start new conversation (normal flow)
    chatLogger.info('🚀 Starting new conversation', {
      sessionId,
      pythonSessionId: currentPythonSessionId,
    })
    hasInitializedRef.current = true
    initializeWithRetry()

    // CRITICAL FIX: Return cleanup function properly
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [
    sessionId,
    initializeWithRetry,
    callbacks,
    callbacks?.isRestoring,
    callbacks?.isSessionInitialized,
    callbacks?.isRestorationComplete,
    callbacks?.pythonSessionId,
    callbacks?.getCurrentMessages,
  ])

  /**
   * Reset initialization state (useful for testing or manual re-initialization)
   */
  const resetInitialization = useCallback(() => {
    hasInitializedRef.current = false
    setIsInitializing(true)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
  }, [])

  return {
    isInitializing,
    initializeWithRetry,
    resetInitialization,
    useFallbackMode,
  }
}
