/**
 * useSessionRestoration Hook
 * 
 * Manages conversation session restoration from backend persistence.
 * Handles loading conversation history from Redis via Python backend.
 * 
 * @module features/conversation/hooks/useSessionRestoration
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { backendAPI } from '../../../services/backendApi';
import { chatLogger } from '../../../utils/logger';
import type { ValuationSession } from '../../../types/valuation';

interface Message {
  id: string;
  type: 'user' | 'ai';
  role: string;
  content: string;
  timestamp: Date;
  isStreaming: boolean;
  isComplete: boolean;
  field_name?: string;
  confidence?: number;
  metadata?: any;
}

interface UseSessionRestorationOptions {
  pythonSessionId: string | null;
  isRestoredSessionId: boolean;
  session: ValuationSession | null;
  onMessagesRestored?: (messages: Message[]) => void;
}

interface UseSessionRestorationReturn {
  restoredMessages: Message[];
  isRestoring: boolean;
  isRestorationComplete: boolean;
  restorationError: string | null;
  retryRestoration: () => void;
}

/**
 * Hook for restoring conversation sessions from backend persistence
 * 
 * Architecture:
 * 1. FIRST VISIT: Python backend generates UUID sessionId, stored in Supabase
 * 2. PAGE REFRESH: Session loaded from Supabase, history fetched from Redis
 * 3. RESTORATION: Messages restored and displayed in UI
 * 
 * @param options Configuration options
 * @returns Restoration state and control functions
 */
export function useSessionRestoration({
  pythonSessionId,
  isRestoredSessionId,
  session,
  onMessagesRestored,
}: UseSessionRestorationOptions): UseSessionRestorationReturn {
  const [restoredMessages, setRestoredMessages] = useState<Message[]>([]);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isRestorationComplete, setIsRestorationComplete] = useState(false);
  const [restorationError, setRestorationError] = useState<string | null>(null);
  const [restorationAttempted, setRestorationAttempted] = useState<Set<string>>(new Set());

  // Ref to track restoration state and prevent race conditions
  const restorationStateRef = useRef<{
    currentSessionId: string | null;
    abortController: AbortController | null;
    restorationComplete: boolean;
  }>({
    currentSessionId: null,
    abortController: null,
    restorationComplete: false,
  });

  /**
   * Attempt to restore conversation history
   */
  const restoreConversation = useCallback(async () => {
    // Skip if not in conversational view
    if (!session || session.currentView !== 'conversational') {
      chatLogger.debug('Not in conversational view, skipping restoration');
      return;
    }

    // Wait for Python sessionId
    const targetSessionId = pythonSessionId;
    if (!targetSessionId) {
      // If sessionData is empty and we're not waiting for restoration, mark as complete
      if (session.sessionData && Object.keys(session.sessionData).length === 0 && !isRestoredSessionId) {
        setIsRestorationComplete(true);
        restorationStateRef.current.restorationComplete = true;
      }
      return;
    }

    // Only restore if sessionId was loaded from Supabase (not newly created)
    if (!isRestoredSessionId) {
      chatLogger.debug('Python sessionId is newly created, skipping restoration');
      // CRITICAL: Mark restoration complete immediately for new sessions
      // This allows initialization to proceed without waiting
      setIsRestorationComplete(true);
      restorationStateRef.current.restorationComplete = true;
      restorationStateRef.current.currentSessionId = targetSessionId;
      return;
    }

    // Skip if already attempted restoration for this sessionId
    if (restorationAttempted.has(targetSessionId)) {
      return;
    }

    // Skip if already restored messages for this session
    const hasRestoredMessagesForThisSession = restoredMessages.length > 0 && 
      restorationStateRef.current.currentSessionId === targetSessionId;
    
    if (hasRestoredMessagesForThisSession || 
        (restorationStateRef.current.restorationComplete && 
         restorationStateRef.current.currentSessionId === targetSessionId)) {
      if (hasRestoredMessagesForThisSession) {
        setIsRestorationComplete(true);
      }
      return;
    }

    // Clear restored messages if for a different sessionId
    // BUT: Only clear if restoration is complete for the new sessionId
    // This prevents clearing messages before we know if new sessionId has messages
    if (restoredMessages.length > 0 && 
        restorationStateRef.current.currentSessionId !== targetSessionId &&
        restorationStateRef.current.restorationComplete) {
      chatLogger.info('Clearing restored messages from previous sessionId', {
        previousSessionId: restorationStateRef.current.currentSessionId,
        newSessionId: targetSessionId,
      });
      setRestoredMessages([]);
    }

    // Prevent concurrent restoration attempts
    if (restorationStateRef.current.currentSessionId === targetSessionId && 
        !restorationStateRef.current.restorationComplete) {
      return;
    }

    // Abort any previous restoration attempt
    if (restorationStateRef.current.abortController) {
      restorationStateRef.current.abortController.abort();
    }

    // Create new abort controller
    const abortController = new AbortController();
    setIsRestorationComplete(false);
    setIsRestoring(true);
    setRestorationError(null);
    restorationStateRef.current = {
      currentSessionId: targetSessionId,
      abortController,
      restorationComplete: false,
    };

    // Mark attempt
    setRestorationAttempted(prev => new Set(prev).add(targetSessionId));

    try {
      chatLogger.info('🔄 Attempting to restore conversation', { 
        pythonSessionId: targetSessionId,
        reportId: session.reportId,
      });

      // Check if aborted before making API call
      if (abortController.signal.aborted) {
        return;
      }

      let history;
      try {
        history = await backendAPI.getConversationHistory(targetSessionId, abortController.signal);
      } catch (error: any) {
        // Handle abort errors gracefully
        if (error.name === 'AbortError' || error.name === 'CanceledError' || abortController.signal.aborted) {
          restorationStateRef.current.restorationComplete = true;
          setIsRestorationComplete(true);
          setIsRestoring(false);
          return;
        }
        throw error;
      }

      // Check if aborted after API call
      if (abortController.signal.aborted) {
        restorationStateRef.current.restorationComplete = true;
        setIsRestorationComplete(true);
        setIsRestoring(false);
        return;
      }

      // Verify we're still restoring the same sessionId
      if (restorationStateRef.current.currentSessionId !== targetSessionId) {
        chatLogger.warn('SessionId changed during restoration, aborting');
        return;
      }

      if (history.exists && history.messages && history.messages.length > 0) {
        chatLogger.info('✅ Conversation restored successfully', {
          pythonSessionId: targetSessionId,
          messagesCount: history.messages.length,
        });

        // Convert backend messages to frontend format
        const messages: Message[] = history.messages.map((msg: any) => ({
          id: msg.id,
          type: msg.role === 'user' ? 'user' : 'ai',
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.timestamp),
          isStreaming: false,
          isComplete: true,
          field_name: msg.field_name,
          confidence: msg.confidence,
          metadata: msg.metadata,
        }));

        setRestoredMessages(messages);
        restorationStateRef.current.restorationComplete = true;
        setIsRestorationComplete(true);
        setIsRestoring(false);

        if (onMessagesRestored) {
          onMessagesRestored(messages);
        }

        chatLogger.info('✅ Restored messages set', { count: messages.length });
      } else if (history.exists && (!history.messages || history.messages.length === 0)) {
        // Session exists but is empty
        chatLogger.info('ℹ️ Session exists but is empty (new conversation)');
        restorationStateRef.current.restorationComplete = true;
        setIsRestorationComplete(true);
        setIsRestoring(false);
      } else {
        // Conversation doesn't exist
        chatLogger.warn('⚠️ Conversation not found in Redis (expired or cleared)');
        restorationStateRef.current.restorationComplete = true;
        setIsRestorationComplete(true);
        setIsRestoring(false);
        setRestorationError('Conversation history not found (may have expired)');
      }
    } catch (error) {
      // Check if aborted
      if (abortController.signal.aborted) {
        restorationStateRef.current.restorationComplete = true;
        setIsRestorationComplete(true);
        setIsRestoring(false);
        return;
      }

      const errorStatus = (error as any).response?.status;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const is404 = errorStatus === 404 || errorMessage.includes('404');

      restorationStateRef.current.restorationComplete = true;
      setIsRestorationComplete(true);
      setIsRestoring(false);

      if (is404 && isRestoredSessionId) {
        chatLogger.warn('⚠️ Conversation not found (404)');
        setRestorationError('Conversation history expired');
      } else if (!is404) {
        chatLogger.error('❌ Failed to restore conversation', { error: errorMessage });
        setRestorationError('Failed to restore conversation history');
      }
    }
  }, [pythonSessionId, isRestoredSessionId, session, restoredMessages.length, onMessagesRestored, restorationAttempted]);

  /**
   * Restore conversation when conditions are met
   */
  useEffect(() => {
    restoreConversation();
  }, [restoreConversation]);

  /**
   * Cleanup: abort any ongoing restoration when component unmounts
   */
  useEffect(() => {
    return () => {
      if (restorationStateRef.current.abortController) {
        restorationStateRef.current.abortController.abort();
        restorationStateRef.current.abortController = null;
      }
      restorationStateRef.current.restorationComplete = true;
    };
  }, [pythonSessionId]);

  /**
   * Retry restoration (useful for error recovery)
   */
  const retryRestoration = useCallback(() => {
    if (pythonSessionId) {
      setRestorationAttempted(prev => {
        const next = new Set(prev);
        next.delete(pythonSessionId);
        return next;
      });
      setIsRestorationComplete(false);
      restorationStateRef.current.restorationComplete = false;
      restoreConversation();
    }
  }, [pythonSessionId, restoreConversation]);

  return {
    restoredMessages,
    isRestoring: isRestoring && !isRestorationComplete,
    isRestorationComplete,
    restorationError,
    retryRestoration,
  };
}

