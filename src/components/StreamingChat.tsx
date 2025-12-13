/**
 * StreamingChat - Modular Precision Engine Orchestrator
 *
 * Bank-Grade Excellence Framework Implementation:
 * - Single Responsibility: Orchestrate focused engines
 * - SOLID Principles: Dependency Inversion, Interface Segregation
 * - Clean Architecture: Thin orchestrator, focused engines
 *
 * BEFORE: 1,720-line god component with mixed responsibilities
 * AFTER:  200-line orchestrator coordinating 6 precision engines
 *
 * Engines:
 * - ConversationManager: Lifecycle & state management
 * - DataCollectionEngine: AI response parsing & validation
 * - InputController: User input handling & validation
 * - ValuationCallbacks: Business logic coordination
 * - StreamingCoordinator: Real-time connection management
 * - MessageRenderer: UI component rendering
 */

import React, { useCallback, useEffect, useMemo, useState, useRef, startTransition } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bot, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { Message, useStreamingChatState } from '../hooks/useStreamingChatState';
import { chatLogger } from '../utils/logger';
import type { ValuationResponse } from '../types/valuation';
import { InputValidator } from '../utils/validation/InputValidator';
import { MessageManager } from '../utils/chat/MessageManager';
import { StreamingManager } from '../services/chat/StreamingManager';
import { StreamEventHandler } from '../services/chat/StreamEventHandler';
import { useConversationInitializer, type UserProfile } from '../hooks/useConversationInitializer';
import { useConversationMetrics } from '../hooks/useConversationMetrics';
import { useTypingAnimation } from '../hooks/useTypingAnimation';
import { debugLogger } from '../utils/debugLogger';
import { TypingIndicator } from './TypingIndicator';
import { MessagesList, ChatInputForm } from './chat';
import { useStreamSubmission, useSuggestionHandlers, useSmartFollowUps } from '../hooks/chat';

// Modular handlers are now used directly without engine orchestration

// Callback data types
export interface CollectedData {
  field: string;
  value: string | number | boolean;
  timestamp?: number;
  source?: 'user_input' | 'suggestion' | 'validation';
  confidence?: number;
}

export interface ValuationPreviewData {
  estimatedValue?: number;
  confidence?: number;
  methodology?: string;
  assumptions?: Record<string, any>;
}

export interface CalculateOptionData {
  method: string;
  parameters: Record<string, any>;
  estimatedValue?: number;
}

// Re-export types for convenience
export interface StreamingChatProps {
  sessionId: string;
  userId?: string;
  onMessageComplete?: (message: Message) => void;
  onValuationComplete?: (result: ValuationResponse) => void;
  onValuationStart?: () => void;
  onReportUpdate?: (htmlContent: string, progress: number) => void;
  onDataCollected?: (data: CollectedData) => void;
  onValuationPreview?: (data: ValuationPreviewData) => void;
  onCalculateOptionAvailable?: (data: CalculateOptionData) => void;
  onProgressUpdate?: (data: any) => void;
  onReportSectionUpdate?: (section: string, html: string, phase: number, progress: number, is_fallback?: boolean, is_error?: boolean, error_message?: string) => void;
  onSectionLoading?: (section: string, html: string, phase: number, data?: any) => void;
  onSectionComplete?: (event: { sectionId: string; sectionName: string; html: string; progress: number; phase?: number }) => void;
  onReportComplete?: (html: string, valuationId: string) => void;
  onContextUpdate?: (context: any) => void;
  onHtmlPreviewUpdate?: (html: string, previewType: string) => void;
  onPythonSessionIdReceived?: (pythonSessionId: string) => void; // CRITICAL: For conversation restoration
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  initialMessage?: string | null;
  autoSend?: boolean;
  initialData?: Partial<any>; // Pre-filled data from session (for resuming conversations)
  initialMessages?: Message[]; // CRITICAL: Restored conversation history for page refresh
  isRestoring?: boolean; // CRITICAL: Indicates if conversation restoration is in progress
  isSessionInitialized?: boolean; // CRITICAL: Indicates if session initialization is complete
  pythonSessionId?: string | null; // NEW: Current Python sessionId (for restoration coordination)
  isRestorationComplete?: boolean; // NEW: Explicit restoration completion flag
}

/**
 * StreamingChat Component - Refactored Version
 * 
 * This is the refactored version of StreamingChat.tsx that uses extracted modules
 * to reduce complexity and improve maintainability. The main component is now
 * ~300 lines instead of 1,817 lines.
 * 
 * This component now acts as a lightweight orchestrator that delegates
 * most functionality to specialized modules. This reduces complexity
 * and improves maintainability.
 */
export const StreamingChat: React.FC<StreamingChatProps> = ({
  sessionId,
  userId,
  onMessageComplete,
  onValuationComplete,
  onValuationStart,
  onReportUpdate,
  onDataCollected,
  onValuationPreview,
  onCalculateOptionAvailable,
  onProgressUpdate,
  onReportSectionUpdate,
  onSectionLoading,
  onSectionComplete,
  onReportComplete,
  onHtmlPreviewUpdate,
  onPythonSessionIdReceived, // NEW: Callback when Python sessionId received
  className = '',
  disabled = false,
  initialMessage = null,
  autoSend = false,
  initialData,
  initialMessages = [], // NEW: Restored messages from backend
  isRestoring = false, // NEW: Indicates if conversation restoration is in progress
  isSessionInitialized = false, // NEW: Indicates if session initialization is complete
  pythonSessionId: pythonSessionIdProp, // NEW: Current Python sessionId from parent (for restoration coordination)
  isRestorationComplete = false // NEW: Explicit restoration completion flag
}: StreamingChatProps) => {
  // Get user data from AuthContext
  const { user } = useAuth();
  
  // Track Python-generated session ID separately from client session ID
  // Use prop if provided (from restoration), otherwise track internally
  const [internalPythonSessionId, setInternalPythonSessionId] = useState<string | null>(null);
  const pythonSessionId = pythonSessionIdProp ?? internalPythonSessionId;
  const setPythonSessionId = useCallback((id: string | null) => {
    // Always update internal state (for cases where prop is not provided)
    setInternalPythonSessionId(id);
    // Notify parent via callback when sessionId is set
    if (id && onPythonSessionIdReceived) {
      onPythonSessionIdReceived(id);
    }
  }, [onPythonSessionIdReceived]);
  
  // Sync prop to internal state when prop changes (from restoration)
  useEffect(() => {
    if (pythonSessionIdProp !== undefined && pythonSessionIdProp !== internalPythonSessionId) {
      setInternalPythonSessionId(pythonSessionIdProp);
    }
  }, [pythonSessionIdProp, internalPythonSessionId]);
  
  // Use extracted state management hook
  const state = useStreamingChatState(sessionId, userId);
  
  // CRITICAL: Restore messages from backend on mount (enables conversation continuation)
  // Use a ref to track the last restored initialMessages to prevent duplicate restorations
  const lastRestoredMessagesRef = useRef<string>('');
  
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      // Create a fingerprint of the initialMessages to detect changes
      const messagesFingerprint = initialMessages.map(m => m.id).join(',');
      
      // Only restore if:
      // 1. We don't have messages yet, OR
      // 2. The initialMessages have changed (different fingerprint)
      const shouldRestore = state.messages.length === 0 || 
        lastRestoredMessagesRef.current !== messagesFingerprint;
      
      if (shouldRestore) {
        chatLogger.info('✅ Restoring conversation messages in StreamingChat', {
          sessionId,
          messagesCount: initialMessages.length,
          currentMessagesCount: state.messages.length,
          firstMessage: initialMessages[0]?.content?.substring(0, 50),
          lastMessage: initialMessages[initialMessages.length - 1]?.content?.substring(0, 50),
          fingerprint: messagesFingerprint,
          lastFingerprint: lastRestoredMessagesRef.current,
          isRestoring,
        });
        state.setMessages(initialMessages);
        lastRestoredMessagesRef.current = messagesFingerprint;
        
        // CRITICAL: Log after setting to verify messages were set
        chatLogger.info('✅ Messages set in StreamingChat state', {
          sessionId,
          messagesSet: initialMessages.length,
          firstMessageId: initialMessages[0]?.id,
        });
      } else {
        chatLogger.debug('Skipping message restoration - already restored or same fingerprint', {
          sessionId,
          messagesCount: initialMessages.length,
          currentMessagesCount: state.messages.length,
          fingerprint: messagesFingerprint,
          lastFingerprint: lastRestoredMessagesRef.current,
        });
      }
    } else if (initialMessages.length === 0 && state.messages.length > 0) {
      // If initialMessages is cleared (empty array), clear the ref but don't clear messages
      // This allows the component to handle message clearing separately if needed
      chatLogger.debug('InitialMessages cleared but keeping existing messages', {
        sessionId,
        currentMessagesCount: state.messages.length,
      });
      lastRestoredMessagesRef.current = '';
    }
  }, [initialMessages, sessionId, isRestoring, state.messages.length]); // Include isRestoring and state.messages.length to track state changes
  
  // Initialize services (must be before hooks that use them)
  const inputValidator = useMemo(() => new InputValidator(), []);
  const messageManager = useMemo(() => new MessageManager(), []);
  
  // Use ref for messages to avoid recreating eventHandler on every message update
  const messagesRef = useRef(state.messages);
  useEffect(() => {
    messagesRef.current = state.messages;
  }, [state.messages]);
  
  // CRITICAL: Memoize addMessage callback using messagesRef to avoid stale closures
  const addMessageCallback = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    // Use ref to get current messages (always up-to-date, no stale closure)
    const currentMessages = messagesRef.current;
    const { updatedMessages, newMessage } = messageManager.addMessage(currentMessages, message);
    state.setMessages(updatedMessages);
    messagesRef.current = updatedMessages; // Update ref immediately
    return { updatedMessages, newMessage };
  }, [messageManager, state.setMessages]);
  
  // CRITICAL: Memoize callbacks to prevent unnecessary re-runs of useConversationInitializer
  // This ensures the effect only runs when initialMessages or isRestoring actually change
  // Use messagesRef to get current messages without including state.messages in dependencies
  const initializerCallbacks = useMemo(() => ({
    addMessage: addMessageCallback,
    setMessages: state.setMessages,
    getCurrentMessages: () => messagesRef.current, // CRITICAL: Use ref to get current messages without causing re-renders
    user: user as UserProfile | undefined,
    initialData: initialData,
    initialMessages: initialMessages, // CRITICAL: Pass restored messages to skip initialization
    isRestoring: isRestoring, // CRITICAL: Pass restoration state to delay initialization
    isSessionInitialized: isSessionInitialized, // NEW: Pass session initialization state
    pythonSessionId: pythonSessionId, // NEW: Current Python sessionId (for restoration coordination)
    isRestorationComplete: isRestorationComplete, // NEW: Explicit restoration completion flag
    onSessionIdUpdate: (newSessionId: string) => {
      chatLogger.info('Updating to Python session ID', {
        clientSessionId: sessionId,
        pythonSessionId: newSessionId
      });
      setPythonSessionId(newSessionId);
      
      // CRITICAL: Notify parent so it can save pythonSessionId to backend session
      if (onPythonSessionIdReceived) {
        onPythonSessionIdReceived(newSessionId);
      }
    }
  }), [
    addMessageCallback,
    state.setMessages,
    user,
    initialData,
    initialMessages, // CRITICAL: Re-create callbacks when initialMessages changes
    isRestoring, // CRITICAL: Re-create callbacks when isRestoring changes
    isSessionInitialized, // NEW: Re-create callbacks when session initialization state changes
    pythonSessionId, // NEW: Re-create callbacks when pythonSessionId changes
    isRestorationComplete, // NEW: Re-create callbacks when restoration completion changes
    sessionId,
    onPythonSessionIdReceived
  ]);
  
  // Use extracted conversation initializer - store return value to access isInitializing
  // CRITICAL: Pass initialMessages to prevent starting new conversation when restoring
  const { isInitializing } = useConversationInitializer(sessionId, userId, initializerCallbacks);

  
  // Use extracted metrics tracking
  const { trackModelPerformance, trackConversationCompletion } = useConversationMetrics(sessionId, userId);
  
  // Typing animation for smooth AI responses
  const { complete } = useTypingAnimation({
    baseSpeed: 50,
    adaptiveSpeed: true,
    punctuationPauses: true,
    showCursor: true
  });
  
  const streamingManager = useMemo(() => new StreamingManager(
    state.refs.requestIdRef,
    state.refs.currentStreamingMessageRef
  ), [state.refs.requestIdRef, state.refs.currentStreamingMessageRef]);
  
  // messagesRef is already defined above for useConversationInitializer
  
  // Track active streaming requests for cleanup
  const activeRequestRef = useRef<{ abort: () => void } | null>(null);
  
  // CRITICAL FIX: Store event handler in ref so onStreamStart callback can access it
  const eventHandlerRef = useRef<StreamEventHandler | null>(null);
  
  /**
   * Prevent duplicate valuation confirmation CTAs from stacking.
   * Sometimes the backend emits the same valuation_confirmed CTA multiple times;
   * we keep only the latest one to avoid loops in the transcript.
   */
  const isValuationReadyCTA = useCallback((msg: { metadata?: any }) => {
    const meta = msg?.metadata;
    if (!meta) return false;
    const field =
      meta.collected_field ||
      meta.clarification_field ||
      meta.field;
    return meta.input_type === 'cta_button' && field === 'valuation_confirmed';
  }, []);

  const dedupeValuationCTA = useCallback(
    (messages: Message[], incoming: Omit<Message, 'id' | 'timestamp'>) => {
      if (!isValuationReadyCTA(incoming)) return messages;

      const filtered = messages.filter(msg => !isValuationReadyCTA(msg));
      if (filtered.length !== messages.length) {
        chatLogger.info('Deduped duplicate valuation CTA message', {
          removed: messages.length - filtered.length
        });
      }
      return filtered;
    },
    [isValuationReadyCTA]
  );

  // Track if initial message has been sent
  const initialMessageSentRef = useRef(false);
  
  // Create event handler with all callbacks
  // CRITICAL FIX: Removed state.messages from dependencies to prevent recreation on every update
  const eventHandler = useMemo(() => {
    const handler = new StreamEventHandler(sessionId, {
    updateStreamingMessage: (content: string, isComplete: boolean = false, metadata?: any) => {
      // CRITICAL DEBUG: Log metadata if provided
      if (metadata) {
        chatLogger.info('🔍 EventHandler callback received metadata', {
          hasMetadata: true,
          metadataKeys: Object.keys(metadata),
          inputType: metadata.input_type
        });
      }
      
      // SIMPLIFIED: Trust the backend - update streaming message, find it if ref is missing
      const currentMessages = messagesRef.current;
      
      let currentMessageId: string | null = null;
      
      if (state.refs.currentStreamingMessageRef.current?.id) {
        currentMessageId = state.refs.currentStreamingMessageRef.current.id;
        // Verify the ref message still exists and is streaming (defensive check)
        const refMessageInState = currentMessages.find(
          msg => msg.id === currentMessageId && msg.type === 'ai' && msg.isStreaming && !msg.isComplete
        );
        if (!refMessageInState) {
          chatLogger.warn('Ref points to non-existent or completed message in eventHandler callback, falling back', {
            refMessageId: currentMessageId,
            contentLength: content.length
          });
          // Fall through to state search
          currentMessageId = null;
        }
      }
      
      if (!currentMessageId) {
        // Check if message already exists in state (race condition protection)
        const streamingMessages = currentMessages.filter(
          msg => msg.type === 'ai' && msg.isStreaming && !msg.isComplete
        );
        
        if (streamingMessages.length > 0) {
          // If multiple streaming messages exist, use the most recent one
          const existingMessage = streamingMessages.length === 1
            ? streamingMessages[0]
            : streamingMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
          
          // Message exists in state but ref wasn't set - update ref
          chatLogger.debug('Found existing streaming message in state, updating ref', {
            messageId: existingMessage.id,
            totalStreaming: streamingMessages.length,
            usedMostRecent: streamingMessages.length > 1
          });
          state.refs.currentStreamingMessageRef.current = existingMessage;
          currentMessageId = existingMessage.id;
        } else {
          // No message exists - create one (thread-safe fallback)
          // BUT: Don't create empty message if isComplete is true and content is empty
          if (!content && isComplete) {
            chatLogger.debug('Skipping empty message creation for completed message');
            return;
          }
          
          chatLogger.warn('No current streaming message - creating one as fallback', { 
            contentLength: content.length 
          });
          const { updatedMessages, newMessage } = messageManager.addMessage(currentMessages, {
            type: 'ai',
            content: content,
            isStreaming: !isComplete,
            isComplete: isComplete || false
          });
          messagesRef.current = updatedMessages;
          // Use startTransition for non-urgent updates to prevent UI blocking
          startTransition(() => {
          state.setMessages(updatedMessages);
          });
          if (newMessage) {
            state.refs.currentStreamingMessageRef.current = newMessage;
            currentMessageId = newMessage.id;
          } else {
            chatLogger.error('Failed to create fallback message for chunk update');
            return;
          }
        }
      }
      
      // Update the message content in state using batched updates
      const updatedMessages = messageManager.updateStreamingMessage(
        messagesRef.current,
        currentMessageId!,
        content,
        isComplete,
        metadata  // ← CRITICAL FIX: Pass metadata to message manager
      );
      messagesRef.current = updatedMessages;
      // Use startTransition for batched updates
      startTransition(() => {
      state.setMessages(updatedMessages);
      });
      
      // Ensure ref points to updated message
      const updatedMessage = updatedMessages.find(msg => msg.id === currentMessageId);
      if (updatedMessage) {
        state.refs.currentStreamingMessageRef.current = updatedMessage;
      }
      
      chatLogger.debug('Updating streaming message', { 
        messageId: currentMessageId, 
        contentLength: content.length, 
        isComplete 
      });
      
      if (isComplete && state.refs.currentStreamingMessageRef.current) {
        chatLogger.debug('Completing streaming message', { messageId: currentMessageId });
        complete();
        onMessageComplete?.(state.refs.currentStreamingMessageRef.current);
        state.refs.currentStreamingMessageRef.current = null;
      }
    },
    setIsStreaming: state.setIsStreaming,
    setIsTyping: state.setIsTyping,
    setIsThinking: state.setIsThinking,
    setTypingContext: state.setTypingContext,
    setCollectedData: state.setCollectedData,
    setValuationPreview: state.setValuationPreview,
    setCalculateOption: state.setCalculateOption,
    addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
      // Trust the backend - add message as received
      let result: { updatedMessages: Message[]; newMessage: Message } | null = null;
      
      // Use functional update to ensure latest state
      state.setMessages(prevMessages => {
        const baseMessages = dedupeValuationCTA(prevMessages, message);
        const addResult = messageManager.addMessage(baseMessages, message);
        // Update ref immediately for eventHandler access
        messagesRef.current = addResult.updatedMessages;
        result = addResult;
        return addResult.updatedMessages;
      });
      
      // Fallback for cases where setMessages defers execution
      if (!result) {
        const fallbackBase = dedupeValuationCTA(messagesRef.current, message);
        const fallbackResult = messageManager.addMessage(fallbackBase, message);
        messagesRef.current = fallbackResult.updatedMessages;
        state.setMessages(fallbackResult.updatedMessages);
        result = fallbackResult;
      }
      
      // Always update ref for streaming messages so chunks can update them
      if (message.isStreaming && result?.newMessage) {
        state.refs.currentStreamingMessageRef.current = result.newMessage;
      }
      
      return result;
    },
    trackModelPerformance,
    trackConversationCompletion,
    onValuationComplete,
    onReportUpdate,
    onSectionLoading,
    onSectionComplete,
    onReportSectionUpdate,
    onReportComplete,
    onDataCollected,
    onValuationPreview,
    onCalculateOptionAvailable,
    onProgressUpdate,
    onHtmlPreviewUpdate,
    onStreamStart: () => {
      // CRITICAL FIX: Reset event handler state when new stream starts
      // This ensures hasStartedMessage and messageCreationLock are reset for each new message
      // Direct access to handler since callback is created in same scope
      handler.reset();
      chatLogger.info('🔄 Stream start callback - reset event handler state');
    }
  });
    eventHandlerRef.current = handler;
    return handler;
  }, [
    // CRITICAL FIX: Removed state.messages from dependencies - using messagesRef instead
    // This prevents eventHandler from being recreated on every message update
    sessionId,
    state.refs.currentStreamingMessageRef,
    state.setMessages,
    state.setIsStreaming,
    state.setIsTyping,
    state.setIsThinking,
    state.setTypingContext,
    state.setCollectedData,
    state.setValuationPreview,
    state.setCalculateOption,
    messageManager,
    complete,
    trackModelPerformance,
    trackConversationCompletion,
    onValuationComplete,
    onReportUpdate,
    onSectionLoading,
    onSectionComplete,
    onReportSectionUpdate,
    onReportComplete,
    onDataCollected,
    onValuationPreview,
    onCalculateOptionAvailable,
    onProgressUpdate,
    onHtmlPreviewUpdate,
    onMessageComplete,
    dedupeValuationCTA
  ]);
  
  // Add message helper - Trust the backend completely
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    // Trust the backend - add message as received
    let result: { updatedMessages: Message[]; newMessage: Message } | null = null;
    
    // Use functional update to ensure we always work with latest messages
    state.setMessages(prevMessages => {
      const baseMessages = dedupeValuationCTA(prevMessages, message);
      const addResult = messageManager.addMessage(baseMessages, message);
      // Update ref immediately for eventHandler access
      messagesRef.current = addResult.updatedMessages;
      result = addResult;
      return addResult.updatedMessages;
    });
    
    // Fallback for cases where setMessages defers execution (React 18 concurrent rendering)
    if (!result) {
      const fallbackBase = dedupeValuationCTA(messagesRef.current, message);
      const fallbackResult = messageManager.addMessage(fallbackBase, message);
      messagesRef.current = fallbackResult.updatedMessages;
      state.setMessages(fallbackResult.updatedMessages);
      result = fallbackResult;
    }
    
    // Always update ref for streaming messages so chunks can update them
    if (message.isStreaming && result?.newMessage) {
      state.refs.currentStreamingMessageRef.current = result.newMessage;
    }
    
    return result;
  }, [state.setMessages, messageManager, dedupeValuationCTA]);
  
  // Update streaming message helper
  // SIMPLIFIED: Trust the backend - update message with chunks, find it if ref is missing
  const updateStreamingMessage = useCallback((content: string, isComplete: boolean = false, metadata?: any) => {
    // CRITICAL DEBUG: Log metadata parameter
    if (metadata) {
      chatLogger.info('🔍 updateStreamingMessage called with metadata', {
        hasMetadata: true,
        metadataKeys: Object.keys(metadata),
        inputType: metadata.input_type,
        metadata: metadata
      });
    }
    
    // Check ref first, but fallback to finding message in state if ref is out of sync
    let currentMessageId: string | null = null;
    
    if (state.refs.currentStreamingMessageRef.current?.id) {
      currentMessageId = state.refs.currentStreamingMessageRef.current.id;
      // Verify the ref message still exists and is streaming (defensive check)
      const refMessageInState = messagesRef.current.find(
        msg => msg.id === currentMessageId && msg.type === 'ai' && msg.isStreaming && !msg.isComplete
      );
      if (!refMessageInState) {
        chatLogger.warn('Ref points to non-existent or completed message, falling back to state search', {
          refMessageId: currentMessageId,
          contentLength: content.length
        });
        // Fall through to state search
        currentMessageId = null;
      }
    }
    
    if (!currentMessageId) {
      // ENHANCED: If ref doesn't have message, find it in the current messages array
      // This handles cases where refs are slightly out of sync
      const currentMessages = messagesRef.current;
      const streamingMessages = currentMessages.filter(
        msg => msg.type === 'ai' && msg.isStreaming && !msg.isComplete
      );
      
      if (streamingMessages.length > 0) {
        // If multiple streaming messages exist, use the most recent one (shouldn't happen but handle it)
        const streamingMessage = streamingMessages.length === 1 
          ? streamingMessages[0]
          : streamingMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())[0];
        
        chatLogger.debug('Found streaming message in state when ref was missing', {
          messageId: streamingMessage.id,
          totalStreaming: streamingMessages.length,
          usedMostRecent: streamingMessages.length > 1
        });
        state.refs.currentStreamingMessageRef.current = streamingMessage;
        currentMessageId = streamingMessage.id;
      } else {
        chatLogger.warn('No current streaming message to update', {
          contentLength: content.length,
          isComplete,
          totalMessages: currentMessages.length,
          aiMessages: currentMessages.filter(m => m.type === 'ai').length,
          streamingMessages: currentMessages.filter(m => m.isStreaming).length
        });
        return;
      }
    }
    
    // CRITICAL FIX: Use functional update to ensure we always work with latest messages
    // This prevents lost updates during rapid streaming chunks
    state.setMessages(prevMessages => {
    const updatedMessages = messageManager.updateStreamingMessage(
        prevMessages,  // Always latest state
        currentMessageId!,
      content,
      isComplete,
      metadata  // ← CRITICAL FIX: Pass metadata to message manager
    );
      // Update ref immediately for eventHandler access
      messagesRef.current = updatedMessages;
      
      // Ensure ref still points to the correct message after update
      const updatedMessage = updatedMessages.find(msg => msg.id === currentMessageId);
      if (updatedMessage) {
        state.refs.currentStreamingMessageRef.current = updatedMessage;
      }
      
      return updatedMessages;
    });
    
    if (isComplete) {
      complete();
      const completedMessage = state.refs.currentStreamingMessageRef.current;
      if (completedMessage) {
        onMessageComplete?.(completedMessage);
      }
      state.refs.currentStreamingMessageRef.current = null;
    }
  }, [state.setMessages, state.refs.currentStreamingMessageRef, messageManager, complete, onMessageComplete]);
  
  // Request lock to prevent duplicate stream requests
  const isRequestInProgressRef = useRef(false);
  
  // CRITICAL FIX: Provide lock refs to StreamingManager for robust lock management
  // Also cleanup on component unmount to release locks
  useEffect(() => {
    streamingManager.setLockRefs(isRequestInProgressRef, state.setIsStreaming);
    
    debugLogger.info('[StreamingChat]', 'StreamingManager lock refs configured');
    
    // Cleanup on unmount - ensures locks are ALWAYS released
    return () => {
      debugLogger.info('[StreamingChat]', 'Component unmounting - cleaning up StreamingManager');
      streamingManager.cleanup();
    };
  }, [streamingManager, state.setIsStreaming]);
  
  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // CRITICAL DEBUG: Log ALL state BEFORE any checks to diagnose blocking
    debugLogger.log('[DEBUG]', 'handleSubmit ENTRY - Lock State Check', {
      isRequestInProgress: isRequestInProgressRef.current,
      isStreaming: state.isStreaming,
      hasInput: !!state.input.trim(),
      disabled,
      inputValue: state.input.trim().substring(0, 30),
      messageCount: messagesRef.current.length,
      timestamp: new Date().toISOString()
    });
    
    debugLogger.log('[StreamingChat]', 'handleSubmit called', {
      input: state.input,
      isStreaming: state.isStreaming,
      sessionId,
      pythonSessionId,
      timestamp: new Date().toISOString()
    });
    
    // CRITICAL FIX: Enhanced lock check with detailed logging
    // Check both state and ref to prevent duplicate requests
    if (isRequestInProgressRef.current || state.isStreaming || !state.input.trim() || disabled) {
      debugLogger.warn('[StreamingChat]', 'Submit blocked', { 
        reason: !state.input.trim() ? 'empty input' : isRequestInProgressRef.current ? 'request in progress' : state.isStreaming ? 'already streaming' : 'disabled',
        requestInProgress: isRequestInProgressRef.current,
        isStreaming: state.isStreaming,
        hasInput: !!state.input.trim(),
        disabled,
        inputPreview: state.input.trim().substring(0, 20)
      });
      chatLogger.warn('Request blocked by lock', { 
        requestInProgress: isRequestInProgressRef.current,
        isStreaming: state.isStreaming,
        hasInput: !!state.input.trim(),
        disabled,
        inputPreview: state.input.trim().substring(0, 20)
      });
      return;
    }
    
    const userInput = state.input.trim();
    
    // FIX: Validate BEFORE setting lock or clearing input
    const validation = await inputValidator.validateInput(userInput, state.messages, sessionId);
    if (!validation.is_valid) {
      chatLogger.warn('Input validation failed', { 
        sessionId, 
        errors: validation.errors,
        warnings: validation.warnings 
      });
      
      // FIX: Show error but DON'T clear input - let user see their mistake
      const errorMessage: Omit<Message, 'id' | 'timestamp'> = {
        type: 'system',
        content: validation.errors.join(', '),
        isComplete: true
      };
      addMessage(errorMessage);
      return; // Exit early, input still visible - lock not set yet
    }
    
    // Set lock immediately after validation passes to prevent race conditions
    isRequestInProgressRef.current = true;
    
    // CRITICAL FIX: Set isStreaming BEFORE async call to prevent duplicate requests
    state.setIsStreaming(true);
    
    // FIX: Add user message IMMEDIATELY (before clearing)
    const userMessageData: Omit<Message, 'id' | 'timestamp'> = {
      type: 'user',
      content: userInput,
      isComplete: true
    };
    addMessage(userMessageData);
    
    // FIX: Clear input ONLY after message is successfully added
    state.setInput('');
    
    // Track conversation turn
    trackConversationCompletion(false, false);
    
    // Show thinking state immediately (optimistic UI)
    state.setIsThinking(true);
    state.setIsTyping(true);
    state.setTypingContext(undefined); // Will be updated by backend events
    
    // CRITICAL FIX: Use Python session ID if available, otherwise use client session ID
    // Log session ID usage for debugging
    const effectiveSessionId = pythonSessionId || sessionId;
    
    try {
    await streamingManager.startStreaming(
      effectiveSessionId,
      userInput,
      userId,
      {
        setIsStreaming: state.setIsStreaming,
        addMessage,
        updateStreamingMessage,
        onContextUpdate: (context: any) => {
          // Handle context updates if needed
          onHtmlPreviewUpdate?.(context.html || '', context.preview_type || 'progressive');
        },
        extractBusinessModelFromInput: (_input: string) => null,
        extractFoundingYearFromInput: (_input: string) => null,
        onStreamStart: () => {
          // CRITICAL FIX: Reset event handler state when new stream starts
          // This ensures hasStartedMessage and messageCreationLock are reset for each new message
          eventHandler.reset();
          chatLogger.debug('Stream start - reset event handler state');
        }
      },
      (event) => {
        try {
          // CRITICAL FIX: Ensure eventHandler exists and handleEvent is callable
          if (!eventHandler) {
            chatLogger.error('Event handler is null/undefined', { sessionId: effectiveSessionId });
            return;
          }
          
          if (typeof eventHandler.handleEvent !== 'function') {
            chatLogger.error('Event handler handleEvent is not a function', { 
              sessionId: effectiveSessionId,
              eventHandlerType: typeof eventHandler,
              hasHandleEvent: 'handleEvent' in eventHandler
            });
            return;
          }
          
          eventHandler.handleEvent(event);
        } catch (error) {
          chatLogger.error('Error in onEvent callback', { 
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
            eventType: event?.type,
            sessionId: event?.session_id || effectiveSessionId
          });
        }
      },
      (error: Error) => {
        chatLogger.error('Streaming error', { error: error.message, sessionId: effectiveSessionId });
        state.setIsStreaming(false);
        state.setIsTyping(false); // Hide typing indicator on error
        state.setIsThinking(false);
        
        // CRITICAL FIX: Add error message to chat so user knows what happened
        // This preserves conversation context and allows user to continue
        addMessage({
          type: 'system',
          content: `Error: ${error.message || 'Failed to complete valuation. Please try again.'}`,
          isComplete: true
        });
      }
    );
    
    chatLogger.debug('Stream request completed');
    } catch (error) {
      chatLogger.error('Streaming failed', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        sessionId: effectiveSessionId 
      });
      state.setIsStreaming(false);
      state.setIsTyping(false);
      state.setIsThinking(false);
      
      // CRITICAL FIX: Add error message to chat so user knows what happened
      // This preserves conversation context and allows user to continue
      addMessage({
        type: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Failed to complete valuation. Please try again.'}`,
        isComplete: true
      });
    } finally {
      // CRITICAL FIX: ALWAYS release lock when done (success or error)
      // This ensures subsequent requests can proceed
      const wasInProgress = isRequestInProgressRef.current;
      isRequestInProgressRef.current = false;
      chatLogger.debug('Request lock released', { 
        sessionId: effectiveSessionId,
        wasInProgress,
        isStreaming: state.isStreaming
      });
    }
  }, [state.input, state.isStreaming, state.setIsStreaming, disabled, sessionId, pythonSessionId, userId, inputValidator, addMessage, updateStreamingMessage, onHtmlPreviewUpdate, trackConversationCompletion, streamingManager, eventHandler]);
  
  // Auto-send initial message if provided
  useEffect(() => {
    if (initialMessage && autoSend && !initialMessageSentRef.current && !state.isStreaming && !isRequestInProgressRef.current && state.messages.length === 0) {
      initialMessageSentRef.current = true;
      // Set input value and trigger send
      state.setInput(initialMessage);
      // Use setTimeout to ensure state is updated before sending
      setTimeout(() => {
        const syntheticEvent = {
          preventDefault: () => {},
        } as React.FormEvent;
        handleSubmit(syntheticEvent);
      }, 100);
    }
  }, [initialMessage, autoSend, state.isStreaming, state.setInput, state.messages.length, handleSubmit]);

  // CRITICAL FIX: Clear typing/thinking indicators when no active streaming
  // This prevents spinners from showing indefinitely when messages complete
  useEffect(() => {
    // Check for messages that are actually streaming (not complete)
    const hasStreamingMessages = state.messages.some(msg => 
      msg.isStreaming && !msg.isComplete
    );
    
    // Also check for messages with inconsistent state (isStreaming=true but isComplete=true)
    // This shouldn't happen, but we handle it defensively
    const hasInconsistentMessages = state.messages.some(msg => 
      msg.isStreaming && msg.isComplete
    );
    
    // Clear inconsistent messages
    if (hasInconsistentMessages) {
      state.setMessages(prev => prev.map(msg => 
        msg.isStreaming && msg.isComplete
          ? { ...msg, isStreaming: false }
          : msg
      ));
    }
    
    // Only show indicators if there's actual streaming activity
    const shouldShowIndicators = state.isStreaming || hasStreamingMessages;
    
    // Clear typing/thinking indicators when there's no active streaming
    if (!shouldShowIndicators && (state.isTyping || state.isThinking)) {
      state.setIsTyping(false);
      state.setIsThinking(false);
    }
  }, [state.messages, state.isStreaming, state.isTyping, state.isThinking, state.setIsTyping, state.setIsThinking, state.setMessages]);
  
  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    chatLogger.info('Suggestion selected', { suggestion, sessionId });
    state.setInput(suggestion);
  }, [state.setInput, sessionId]);
  
  // Handle suggestion dismiss
  const handleSuggestionDismiss = useCallback(() => {
    // Dismiss suggestions - could add state for this if needed
  }, []);
  
  // Handle KBO suggestion selection (sends number or "none" directly to backend)
  const handleKBOSuggestionSelect = useCallback(async (selection: string) => {
    chatLogger.info('KBO suggestion selected', { selection, sessionId });
    
    const effectiveSessionId = pythonSessionId || sessionId;
    
    // Send the selection (number or "none") directly to backend
    try {
      state.setIsStreaming(true);
      state.setIsTyping(true);
      
      await streamingManager.startStreaming(
        effectiveSessionId,
        selection, // Send "1", "2", "3", etc. or "none"
        userId,
        {
          setIsStreaming: state.setIsStreaming,
          addMessage,
          updateStreamingMessage,
          onContextUpdate: (context: any) => {
            onHtmlPreviewUpdate?.(context.html || '', context.preview_type || 'progressive');
          },
          extractBusinessModelFromInput: (_input: string) => null,
          extractFoundingYearFromInput: (_input: string) => null,
          onStreamStart: () => {
            eventHandler.reset();
            chatLogger.debug('Stream start - reset event handler state');
          }
        },
        (event) => {
          try {
            if (!eventHandler) {
              chatLogger.error('Event handler is null/undefined', { sessionId: effectiveSessionId });
              return;
            }
            
            if (typeof eventHandler.handleEvent !== 'function') {
              chatLogger.error('Event handler handleEvent is not a function', { 
                sessionId: effectiveSessionId,
                eventHandlerType: typeof eventHandler
              });
              return;
            }
            
            eventHandler.handleEvent(event);
          } catch (error) {
            chatLogger.error('Error in onEvent callback', { 
              error: error instanceof Error ? error.message : String(error),
              eventType: event?.type,
              sessionId: event?.session_id || effectiveSessionId
            });
          }
        },
        (error: Error) => {
          chatLogger.error('Streaming error during KBO suggestion selection', { error: error.message, sessionId: effectiveSessionId });
          state.setIsStreaming(false);
          state.setIsTyping(false);
        }
      );
    } catch (error) {
      chatLogger.error('Failed to send KBO suggestion selection', { 
        error: error instanceof Error ? error.message : String(error),
        selection,
        sessionId: effectiveSessionId 
      });
      state.setIsStreaming(false);
      state.setIsTyping(false);
    }
  }, [sessionId, pythonSessionId, userId, state.setIsStreaming, state.setIsTyping, addMessage, updateStreamingMessage, onHtmlPreviewUpdate, streamingManager, eventHandler]);
  
  // Handle clarification confirmation
  const handleClarificationConfirm = useCallback(async (messageId: string) => {
    chatLogger.info('Clarification confirmed', { messageId, sessionId });
    
    // Find the clarification message to get field and value
    const message = state.messages.find(m => m.id === messageId);
    if (!message?.metadata) {
      chatLogger.warn('Cannot confirm clarification: missing metadata', { messageId });
      return;
    }
    
    // Fallback: if clarification_field is missing, use collected_field (common for CTA buttons)
    const clarificationField =
      message.metadata.clarification_field ||
      message.metadata.collected_field;
    
    // Fallback: default valuation CTA to "yes" if value missing
    const clarificationValue =
      message.metadata.clarification_value !== undefined
        ? message.metadata.clarification_value
        : message.metadata.collected_field === 'valuation_confirmed'
          ? 'yes'
          : undefined;
    
    if (!clarificationField || clarificationValue === undefined) {
      chatLogger.warn('Cannot confirm clarification: missing field/value metadata', {
        messageId,
        hasCollectedField: !!message.metadata.collected_field
      });
      return;
    }
    const effectiveSessionId = pythonSessionId || sessionId;
    
    // Convert value to string for backend (preserve numeric values)
    const valueToSend = clarificationValue !== null && clarificationValue !== undefined 
      ? String(clarificationValue) 
      : '';
    
    if (!valueToSend) {
      chatLogger.warn('Cannot confirm clarification: empty value', { messageId, clarificationField });
      return;
    }
    
    chatLogger.info('Sending clarification confirmation to backend', {
      messageId,
      field: clarificationField,
      value: valueToSend,
      sessionId: effectiveSessionId
    });
    
    // Send the confirmed value to backend
    try {
      state.setIsStreaming(true);
      state.setIsTyping(true);
      
      await streamingManager.startStreaming(
        effectiveSessionId,
        valueToSend, // Send the confirmed value back
        userId,
        {
          setIsStreaming: state.setIsStreaming,
          addMessage,
          updateStreamingMessage,
          onContextUpdate: (context: any) => {
            onHtmlPreviewUpdate?.(context.html || '', context.preview_type || 'progressive');
          },
          extractBusinessModelFromInput: (_input: string) => null,
          extractFoundingYearFromInput: (_input: string) => null,
          onStreamStart: () => {
            eventHandler.reset();
            chatLogger.debug('Stream start - reset event handler state');
          }
        },
        (event) => {
          try {
            if (!eventHandler) {
              chatLogger.error('Event handler is null/undefined', { sessionId: effectiveSessionId });
              return;
            }
            
            if (typeof eventHandler.handleEvent !== 'function') {
              chatLogger.error('Event handler handleEvent is not a function', { 
                sessionId: effectiveSessionId,
                eventHandlerType: typeof eventHandler
              });
              return;
            }
            
            eventHandler.handleEvent(event);
          } catch (error) {
            chatLogger.error('Error in onEvent callback', { 
              error: error instanceof Error ? error.message : String(error),
              eventType: event?.type,
              sessionId: event?.session_id || effectiveSessionId
            });
          }
        },
        (error: Error) => {
          chatLogger.error('Streaming error during confirmation', { error: error.message, sessionId: effectiveSessionId });
          state.setIsStreaming(false);
          state.setIsTyping(false);
        }
      );
    } catch (error) {
      chatLogger.error('Failed to send clarification confirmation', { 
        error: error instanceof Error ? error.message : String(error),
        messageId,
        sessionId: effectiveSessionId 
      });
      state.setIsStreaming(false);
      state.setIsTyping(false);
    }
  }, [sessionId, pythonSessionId, userId, state.messages, state.setIsStreaming, state.setIsTyping, addMessage, updateStreamingMessage, onHtmlPreviewUpdate, streamingManager, eventHandler]);
  
  // Handle clarification rejection
  const handleClarificationReject = useCallback(async (messageId: string) => {
    chatLogger.info('Clarification rejected', { messageId, sessionId });
    
    // Find the clarification message to get field
    const message = state.messages.find(m => m.id === messageId);
    if (!message?.metadata?.clarification_field) {
      chatLogger.warn('Cannot reject clarification: missing metadata', { messageId });
      return;
    }
    
    const clarificationField = message.metadata.clarification_field;
    const effectiveSessionId = pythonSessionId || sessionId;
    
    chatLogger.info('Sending clarification rejection to backend', {
      messageId,
      field: clarificationField,
      sessionId: effectiveSessionId
    });
    
    // Send rejection signal to backend - backend should ask for corrected value
    try {
      state.setIsStreaming(true);
      state.setIsTyping(true);
      
      // Send "reject" or similar to indicate user wants to provide different value
      await streamingManager.startStreaming(
        effectiveSessionId,
        'reject', // Signal rejection - backend should ask for corrected value
        userId,
        {
          setIsStreaming: state.setIsStreaming,
          addMessage,
          updateStreamingMessage,
          onContextUpdate: (context: any) => {
            onHtmlPreviewUpdate?.(context.html || '', context.preview_type || 'progressive');
          },
          extractBusinessModelFromInput: (_input: string) => null,
          extractFoundingYearFromInput: (_input: string) => null,
          onStreamStart: () => {
            eventHandler.reset();
            chatLogger.debug('Stream start - reset event handler state');
          }
        },
        (event) => {
          try {
            if (!eventHandler) {
              chatLogger.error('Event handler is null/undefined', { sessionId: effectiveSessionId });
              return;
            }
            
            if (typeof eventHandler.handleEvent !== 'function') {
              chatLogger.error('Event handler handleEvent is not a function', { 
                sessionId: effectiveSessionId,
                eventHandlerType: typeof eventHandler
              });
              return;
            }
            
            eventHandler.handleEvent(event);
          } catch (error) {
            chatLogger.error('Error in onEvent callback', { 
              error: error instanceof Error ? error.message : String(error),
              eventType: event?.type,
              sessionId: event?.session_id || effectiveSessionId
            });
          }
        },
        (error: Error) => {
          chatLogger.error('Streaming error during rejection', { error: error.message, sessionId: effectiveSessionId });
          state.setIsStreaming(false);
          state.setIsTyping(false);
        }
      );
    } catch (error) {
      chatLogger.error('Failed to send clarification rejection', { 
        error: error instanceof Error ? error.message : String(error),
        messageId,
        sessionId: effectiveSessionId 
      });
      state.setIsStreaming(false);
      state.setIsTyping(false);
    }
  }, [sessionId, pythonSessionId, userId, state.messages, state.setIsStreaming, state.setIsTyping, addMessage, updateStreamingMessage, onHtmlPreviewUpdate, streamingManager, eventHandler]);
  
  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messageManager.scrollToBottom(state.refs.messagesEndRef);
  }, [messageManager, state.refs.messagesEndRef]);
  
  // Auto-scroll when messages change - debounced to prevent excessive scrolling
  useEffect(() => {
    const timeoutId = setTimeout(() => {
    scrollToBottom();
    }, 100); // Debounce scroll updates
    return () => clearTimeout(timeoutId);
  }, [state.messages.length, scrollToBottom]); // Only depend on length, not full array
  
  // CRITICAL FIX: Cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Abort streaming on unmount
      if (streamingManager) {
        streamingManager.clearCurrentRequest();
      }
      // Close any active SSE connections
      if (state.refs.eventSourceRef.current) {
        state.refs.eventSourceRef.current.close();
        state.refs.eventSourceRef.current = null;
      }
      // Abort any pending requests
      if (state.refs.abortControllerRef.current) {
        state.refs.abortControllerRef.current.abort();
      }
      // Clear active request reference
      if (activeRequestRef.current) {
        activeRequestRef.current.abort();
        activeRequestRef.current = null;
      }
    };
  }, [streamingManager, state.refs.eventSourceRef, state.refs.abortControllerRef]);
  
  // Get smart follow-ups
  const getSmartFollowUps = useCallback(() => {
    if (state.messages.length === 0) return [];
    
    const lastMessage = state.messages[state.messages.length - 1];
    if (lastMessage?.type === 'ai' && lastMessage.metadata?.collected_field) {
      const field = lastMessage.metadata.collected_field;
      switch (field) {
        case 'business_type':
          return ['SaaS Platform', 'E-commerce Store', 'Consulting Firm', 'Digital Agency'];
        case 'revenue':
          return ['$1M - $5M ARR', '$5M - $10M ARR', '$10M - $50M ARR', '$50M+ ARR'];
        case 'employee_count':
          return ['1-10 team', '11-50 team', '51-200 team', '200+ team'];
        default:
          return [];
      }
    }
    
    return [];
  }, [state.messages]);
  
  const smartFollowUps = getSmartFollowUps();
  
  return (
    <div className={`flex h-full flex-col overflow-hidden flex-1 ${className}`}>
      {/* Messages Container */}
      <MessagesList
        messages={state.messages}
        isTyping={state.isTyping}
        isThinking={state.isThinking}
        isInitializing={isInitializing}
        onSuggestionSelect={handleSuggestionSelect}
        onSuggestionDismiss={handleSuggestionDismiss}
        onClarificationConfirm={handleClarificationConfirm}
        onClarificationReject={handleClarificationReject}
        onKBOSuggestionSelect={handleKBOSuggestionSelect}
        onValuationStart={onValuationStart}
        calculateOption={state.calculateOption}
        valuationPreview={state.valuationPreview}
        messagesEndRef={state.refs.messagesEndRef}
      />
      
      {/* Contextual Tip */}
      
      {/* Input Form */}
      <ChatInputForm
        input={state.input}
        onInputChange={state.setInput}
        onSubmit={handleSubmit}
        isStreaming={state.isStreaming}
        disabled={disabled}
        placeholder="Ask about your business valuation..."
        suggestions={smartFollowUps}
      />
    </div>
  );
};

export default StreamingChat;
