/**
 * useConversationStateManager - Centralized conversation state management
 *
 * Solves race conditions between restoration and initialization by providing
 * a single source of truth for conversation state transitions.
 *
 * @module features/conversation/hooks/useConversationStateManager
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { chatLogger } from '../../../utils/logger';
import { Message } from '../../../hooks/useStreamingChatState';

export type ConversationState =
  | 'LOADING_SESSION'      // Loading session from Supabase
  | 'RESTORING'           // Restoring messages from Redis
  | 'INITIALIZING'        // Starting new conversation
  | 'ACTIVE_CONVERSATION' // Conversation is active with messages
  | 'ERROR';              // Error state

export type ConversationEvent =
  | 'SESSION_LOADED'
  | 'RESTORATION_STARTED'
  | 'RESTORATION_COMPLETE'
  | 'INITIALIZATION_STARTED'
  | 'INITIALIZATION_COMPLETE'
  | 'MESSAGES_AVAILABLE'
  | 'SESSION_CHANGED'
  | 'ERROR_OCCURRED';

interface ConversationStateManagerOptions {
  reportId: string;
  sessionId: string;
  initialPythonSessionId?: string | null;
  initialMessages?: Message[];
  onStateChange?: (state: ConversationState, event: ConversationEvent) => void;
  onMessagesRestored?: (messages: Message[]) => void;
  onSessionIdUpdate?: (sessionId: string) => void;
}

interface ConversationStateManagerReturn {
  // Current state
  state: ConversationState;
  messages: Message[];
  pythonSessionId: string | null;
  isRestoring: boolean;
  isInitializing: boolean;
  isSessionInitialized: boolean;
  restorationComplete: boolean;
  error: string | null;

  // Actions
  handleSessionLoaded: (pythonSessionId: string | null, isRestored: boolean) => void;
  handleRestorationStarted: () => void;
  handleRestorationComplete: (messages: Message[]) => void;
  handleRestorationFailed: (error: string) => void;
  handleInitializationStarted: () => void;
  handleInitializationComplete: () => void;
  handleSessionIdChanged: (newSessionId: string) => void;
  handleMessagesAvailable: (messages: Message[]) => void;
  handleErrorRecovery: () => void;
}

/**
 * State transition table - defines valid state changes
 */
const STATE_TRANSITIONS: Record<ConversationState, Record<ConversationEvent, ConversationState>> = {
  LOADING_SESSION: {
    SESSION_LOADED: 'RESTORING',
    ERROR_OCCURRED: 'ERROR',
    SESSION_CHANGED: 'LOADING_SESSION', // Stay in loading while session changes
    RESTORATION_STARTED: 'LOADING_SESSION', // Invalid - wait for session first
    RESTORATION_COMPLETE: 'LOADING_SESSION', // Invalid - wait for session first
    INITIALIZATION_STARTED: 'LOADING_SESSION', // Invalid - wait for session first
    INITIALIZATION_COMPLETE: 'LOADING_SESSION', // Invalid - wait for session first
    MESSAGES_AVAILABLE: 'LOADING_SESSION', // Invalid - wait for session first
  },
  RESTORING: {
    RESTORATION_COMPLETE: 'ACTIVE_CONVERSATION',
    ERROR_OCCURRED: 'ERROR',
    SESSION_CHANGED: 'LOADING_SESSION', // Reset on session change
    SESSION_LOADED: 'RESTORING', // Already loading session
    RESTORATION_STARTED: 'RESTORING', // Already restoring
    INITIALIZATION_STARTED: 'RESTORING', // Invalid - finish restoration first
    INITIALIZATION_COMPLETE: 'RESTORING', // Invalid - finish restoration first
    MESSAGES_AVAILABLE: 'ACTIVE_CONVERSATION', // Restoration successful
  },
  INITIALIZING: {
    INITIALIZATION_COMPLETE: 'ACTIVE_CONVERSATION',
    ERROR_OCCURRED: 'ERROR',
    SESSION_CHANGED: 'LOADING_SESSION', // Reset on session change
    SESSION_LOADED: 'INITIALIZING', // Already have session
    RESTORATION_STARTED: 'INITIALIZING', // Invalid - already initializing
    RESTORATION_COMPLETE: 'INITIALIZING', // Invalid - already initializing
    INITIALIZATION_STARTED: 'INITIALIZING', // Already initializing
    MESSAGES_AVAILABLE: 'ACTIVE_CONVERSATION', // Messages appeared during init
  },
  ACTIVE_CONVERSATION: {
    SESSION_CHANGED: 'LOADING_SESSION', // Reset for new session
    ERROR_OCCURRED: 'ERROR',
    SESSION_LOADED: 'ACTIVE_CONVERSATION', // Already active
    RESTORATION_STARTED: 'ACTIVE_CONVERSATION', // Already have messages
    RESTORATION_COMPLETE: 'ACTIVE_CONVERSATION', // Already have messages
    INITIALIZATION_STARTED: 'ACTIVE_CONVERSATION', // Already have messages
    INITIALIZATION_COMPLETE: 'ACTIVE_CONVERSATION', // Already initialized
    MESSAGES_AVAILABLE: 'ACTIVE_CONVERSATION', // Already active
  },
  ERROR: {
    SESSION_CHANGED: 'LOADING_SESSION', // Reset on session change
    SESSION_LOADED: 'ERROR', // Stay in error until reset
    RESTORATION_STARTED: 'ERROR', // Stay in error
    RESTORATION_COMPLETE: 'ERROR', // Stay in error
    INITIALIZATION_STARTED: 'ERROR', // Stay in error
    INITIALIZATION_COMPLETE: 'ERROR', // Stay in error
    MESSAGES_AVAILABLE: 'ERROR', // Stay in error
    ERROR_OCCURRED: 'ERROR', // Already in error
  },
};

/**
 * Centralized conversation state manager
 *
 * Provides a single source of truth for conversation lifecycle state,
 * preventing race conditions between restoration and initialization.
 */
export function useConversationStateManager({
  reportId,
  sessionId,
  initialPythonSessionId = null,
  initialMessages = [],
  onStateChange,
  onMessagesRestored,
  onSessionIdUpdate,
}: ConversationStateManagerOptions): ConversationStateManagerReturn {

  // Core state
  const [state, setState] = useState<ConversationState>('LOADING_SESSION');
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [pythonSessionId, setPythonSessionId] = useState<string | null>(initialPythonSessionId);
  const [error, setError] = useState<string | null>(null);

  // Retry and timeout state
  const retryCountRef = useRef<Record<string, number>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Derived state for backward compatibility
  const isRestoring = state === 'RESTORING';
  const isInitializing = state === 'INITIALIZING';
  const isSessionInitialized = ['RESTORING', 'INITIALIZING', 'ACTIVE_CONVERSATION'].includes(state);
  const restorationComplete = ['INITIALIZING', 'ACTIVE_CONVERSATION'].includes(state);

  // Error recovery mechanism
  const handleErrorRecovery = useCallback(() => {
    chatLogger.info('Attempting error recovery', {
      currentState: state,
      reportId,
      sessionId,
      pythonSessionId,
    });

    // Reset to loading state to allow retry
    setState('LOADING_SESSION');
    setError(null);
    setMessages([]);
  }, [state, reportId, sessionId, pythonSessionId]);

  // State transition function with validation
  const transitionState = useCallback((event: ConversationEvent, payload?: any) => {
    setState(currentState => {
      const nextState = STATE_TRANSITIONS[currentState]?.[event];

      if (!nextState) {
        chatLogger.error('Invalid state transition attempted', {
          currentState,
          event,
          payload,
          reportId,
          sessionId,
        });
        // Stay in current state on invalid transition
        return currentState;
      }

      if (nextState !== currentState) {
        chatLogger.info('🔄 Conversation state transition', {
          from: currentState,
          to: nextState,
          event,
          payload,
          reportId,
          sessionId,
          pythonSessionId,
        });

        // Notify parent component
        onStateChange?.(nextState, event);
      }

      return nextState;
    });
  }, [reportId, sessionId, pythonSessionId, onStateChange]);

  // Cleanup on unmount and clear timeouts
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      chatLogger.debug('ConversationStateManager unmounting', {
        finalState: state,
        reportId,
        sessionId,
        pythonSessionId,
      });
    };
  }, [state, reportId, sessionId, pythonSessionId]);

  // Timeout handling for stuck operations
  useEffect(() => {
    const handleTimeout = () => {
      if (state === 'RESTORING' || state === 'INITIALIZING') {
        chatLogger.warn('Operation timed out, attempting recovery', {
          state,
          reportId,
          sessionId,
          pythonSessionId,
        });

        // Try recovery
        handleErrorRecovery();
      }
    };

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set timeout for operations that might hang
    if (state === 'RESTORING' || state === 'INITIALIZING') {
      timeoutRef.current = setTimeout(handleTimeout, 30000); // 30 second timeout
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [state, reportId, sessionId, pythonSessionId, handleErrorRecovery]);

  // Event handlers
  const handleSessionLoaded = useCallback((newPythonSessionId: string | null, isRestored: boolean) => {
    chatLogger.info('Session loaded', {
      pythonSessionId: newPythonSessionId,
      isRestored,
      reportId,
      sessionId,
    });

    setPythonSessionId(newPythonSessionId);

    // If we have a restored sessionId, attempt restoration
    // If it's new, go directly to initialization
    if (newPythonSessionId && isRestored) {
      transitionState('RESTORATION_STARTED');
    } else {
      transitionState('SESSION_LOADED');
    }
  }, [reportId, sessionId, transitionState]);

  const handleRestorationStarted = useCallback(() => {
    transitionState('RESTORATION_STARTED');
  }, [transitionState]);

  const handleRestorationComplete = useCallback((restoredMessages: Message[]) => {
    chatLogger.info('Restoration completed successfully', {
      messageCount: restoredMessages.length,
      reportId,
      sessionId,
      pythonSessionId,
    });

    setMessages(restoredMessages);
    setError(null);
    onMessagesRestored?.(restoredMessages);

    if (restoredMessages.length > 0) {
      transitionState('MESSAGES_AVAILABLE');
    } else {
      // No messages restored, need to initialize
      transitionState('RESTORATION_COMPLETE');
    }
  }, [reportId, sessionId, pythonSessionId, onMessagesRestored, transitionState]);

  const handleRestorationFailed = useCallback((errorMessage: string) => {
    const key = `restoration-${pythonSessionId}`;
    const currentRetries = retryCountRef.current[key] || 0;

    chatLogger.error('Restoration failed', {
      error: errorMessage,
      reportId,
      sessionId,
      pythonSessionId,
      retryCount: currentRetries,
    });

    // Retry logic for restoration failures (up to 2 retries)
    if (currentRetries < 2 && !errorMessage.includes('404') && !errorMessage.includes('expired')) {
      retryCountRef.current[key] = currentRetries + 1;

      chatLogger.info('Retrying restoration', {
        retryCount: currentRetries + 1,
        reportId,
        sessionId,
        pythonSessionId,
      });

      // Reset to restoring state to retry
      setTimeout(() => {
        transitionState('RESTORATION_STARTED');
      }, 1000 * (currentRetries + 1)); // Exponential backoff

      return;
    }

    // Max retries reached or permanent error
    setError(errorMessage);
    retryCountRef.current[key] = 0; // Reset for future attempts
    transitionState('ERROR_OCCURRED');
  }, [reportId, sessionId, pythonSessionId, transitionState]);

  const handleInitializationStarted = useCallback(() => {
    transitionState('INITIALIZATION_STARTED');
  }, [transitionState]);

  const handleInitializationComplete = useCallback(() => {
    chatLogger.info('Initialization completed successfully', {
      reportId,
      sessionId,
      pythonSessionId,
    });

    setError(null);
    transitionState('INITIALIZATION_COMPLETE');
  }, [reportId, sessionId, pythonSessionId, transitionState]);

  const handleSessionIdChanged = useCallback((newSessionId: string) => {
    chatLogger.info('Session ID changed - resetting state', {
      oldSessionId: pythonSessionId,
      newSessionId,
      reportId,
      sessionId,
    });

    // Reset state for new session
    setPythonSessionId(newSessionId);
    setMessages([]);
    setError(null);
    onSessionIdUpdate?.(newSessionId);

    transitionState('SESSION_CHANGED');
  }, [pythonSessionId, reportId, sessionId, onSessionIdUpdate, transitionState]);

  const handleMessagesAvailable = useCallback((newMessages: Message[]) => {
    chatLogger.info('Messages became available', {
      messageCount: newMessages.length,
      reportId,
      sessionId,
      pythonSessionId,
    });

    setMessages(newMessages);
    transitionState('MESSAGES_AVAILABLE');
  }, [reportId, sessionId, pythonSessionId, transitionState]);

  return {
    // Current state
    state,
    messages,
    pythonSessionId,
    isRestoring,
    isInitializing,
    isSessionInitialized,
    restorationComplete,
    error,

    // Actions
    handleSessionLoaded,
    handleRestorationStarted,
    handleRestorationComplete,
    handleRestorationFailed,
    handleInitializationStarted,
    handleInitializationComplete,
    handleSessionIdChanged,
    handleMessagesAvailable,
    handleErrorRecovery,
  };
}
