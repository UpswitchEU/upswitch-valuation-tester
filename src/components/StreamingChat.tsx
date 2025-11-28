/**
 * StreamingChat - Lightweight orchestrator component
 * 
 * This component uses extracted modules to reduce complexity and improve maintainability.
 * The main component is now ~300 lines instead of 1,817 lines.
 */

import { Bot, CheckCircle } from 'lucide-react';
import React, { startTransition, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AI_CONFIG } from '../config';
import { useAuth } from '../hooks/useAuth';
import { useTypingAnimation } from '../hooks/useTypingAnimation';
import { debugLogger } from '../utils/debugLogger';
import { chatLogger } from '../utils/logger';
import { KBOSuggestionsList } from './KBOSuggestionsList';
import { hasKBOSuggestions, parseKBOSuggestions } from './utils/kboParsing';
import { SuggestionChips } from './SuggestionChips';
import { TypingIndicator } from './TypingIndicator';
// Note: Business extraction utilities available if needed
// import { 
//   extractBusinessModelFromInput, 
//   extractFoundingYearFromInput 
// } from '../utils/businessExtractionUtils';

// Import extracted modules
import { useConversationInitializer, UserProfile } from '../hooks/useConversationInitializer';
import { useConversationMetrics } from '../hooks/useConversationMetrics';
import { Message, useStreamingChatState } from '../hooks/useStreamingChatState';
import { StreamEventHandler } from '../services/chat/StreamEventHandler';
import { StreamingManager } from '../services/chat/StreamingManager';
import { MessageManager } from '../utils/chat/MessageManager';
import { InputValidator } from '../utils/validation/InputValidator';

// Re-export types for convenience
export interface StreamingChatProps {
  sessionId: string;
  userId?: string;
  onMessageComplete?: (message: Message) => void;
  onValuationComplete?: (result: any) => void;
  onReportUpdate?: (htmlContent: string, progress: number) => void;
  onDataCollected?: (data: any) => void;
  onValuationPreview?: (data: any) => void;
  onCalculateOptionAvailable?: (data: any) => void;
  onProgressUpdate?: (data: any) => void;
  onReportSectionUpdate?: (section: string, html: string, phase: number, progress: number, is_fallback?: boolean, is_error?: boolean, error_message?: string) => void;
  onSectionLoading?: (section: string, html: string, phase: number, data?: any) => void;
  onSectionComplete?: (event: { sectionId: string; sectionName: string; html: string; progress: number; phase?: number }) => void;
  onReportComplete?: (html: string, valuationId: string) => void;
  onContextUpdate?: (context: any) => void;
  onHtmlPreviewUpdate?: (html: string, previewType: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  initialMessage?: string | null;
  autoSend?: boolean;
  initialData?: Partial<any>; // Pre-filled data from session (for resuming conversations)
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
  className = '',
  disabled = false,
  initialMessage = null,
  autoSend = false,
  initialData
}) => {
  // Get user data from AuthContext
  const { user } = useAuth();
  
  // Track Python-generated session ID separately from client session ID
  const [pythonSessionId, setPythonSessionId] = useState<string | null>(null);
  
  // Use extracted state management hook
  const state = useStreamingChatState(sessionId, userId);
  
  // Initialize services (must be before hooks that use them)
  const inputValidator = useMemo(() => new InputValidator(), []);
  const messageManager = useMemo(() => new MessageManager(), []);
  
  // Use extracted conversation initializer
  useConversationInitializer(sessionId, userId, {
    addMessage: (message) => {
      const { updatedMessages, newMessage } = messageManager.addMessage(state.messages, message);
      state.setMessages(updatedMessages);
      return { updatedMessages, newMessage };
    },
    setMessages: state.setMessages,
    user: user as UserProfile | undefined,
    initialData: initialData, // Pass pre-filled session data for resuming
    onSessionIdUpdate: (newSessionId) => {
      chatLogger.info('Updating to Python session ID', {
        clientSessionId: sessionId,
        pythonSessionId: newSessionId
      });
      setPythonSessionId(newSessionId);
    }
  });

  // Handle "Resume" context message
  // If we have initial data, we want to inject a welcoming message about what we know
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      // Build summary of what data we have
      const fields = [];
      if (initialData.company_name) fields.push('company name');
      if (initialData.industry) fields.push('industry');
      // Access revenue/ebitda from nested object or top-level (fallback)
      if ((initialData.current_year_data as any)?.revenue || initialData.revenue) fields.push('revenue');
      if ((initialData.current_year_data as any)?.ebitda !== undefined || initialData.ebitda !== undefined) fields.push('EBITDA');
      
      if (fields.length > 0) {
        const summary = `Welcome back! I see you've already entered your ${fields.join(', ')}. I've loaded that context so we can continue where you left off.`;
        
        // Add as a system message (or AI message if preferred)
        // Using timeout to ensure it appears after initialization
        setTimeout(() => {
          // Only add if no messages exist yet (prevent duplicate on re-render)
          if (state.messages.length === 0) {
            const { updatedMessages } = messageManager.addMessage([], {
              type: 'ai',
              role: 'assistant',
              content: summary,
              metadata: {
                intent: 'greeting',
                topic: 'resume',
                is_resume_context: true
              }
            });
            state.setMessages(updatedMessages);
          }
        }, 500);
      }
    }
  }, [initialData, messageManager]);
  
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
  
  // Use ref for messages to avoid recreating eventHandler on every message update
  const messagesRef = useRef(state.messages);
  useEffect(() => {
    messagesRef.current = state.messages;
  }, [state.messages]);
  
  // Track active streaming requests for cleanup
  const activeRequestRef = useRef<{ abort: () => void } | null>(null);
  
  // CRITICAL FIX: Store event handler in ref so onStreamStart callback can access it
  const eventHandlerRef = useRef<StreamEventHandler | null>(null);
  
  // Track if initial message has been sent
  const initialMessageSentRef = useRef(false);
  
  // Create event handler with all callbacks
  // CRITICAL FIX: Removed state.messages from dependencies to prevent recreation on every update
  const eventHandler = useMemo(() => {
    const handler = new StreamEventHandler(sessionId, {
    updateStreamingMessage: (content: string, isComplete: boolean = false) => {
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
        isComplete
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
        const addResult = messageManager.addMessage(prevMessages, message);
        // Update ref immediately for eventHandler access
        messagesRef.current = addResult.updatedMessages;
        result = addResult;
        return addResult.updatedMessages;
      });
      
      // Fallback for cases where setMessages defers execution
      if (!result) {
        const fallbackResult = messageManager.addMessage(messagesRef.current, message);
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
    onMessageComplete
  ]);
  
  // Add message helper - Trust the backend completely
  const addMessage = useCallback((message: Omit<Message, 'id' | 'timestamp'>) => {
    // Trust the backend - add message as received
    let result: { updatedMessages: Message[]; newMessage: Message } | null = null;
    
    // Use functional update to ensure we always work with latest messages
    state.setMessages(prevMessages => {
      const addResult = messageManager.addMessage(prevMessages, message);
      // Update ref immediately for eventHandler access
      messagesRef.current = addResult.updatedMessages;
      result = addResult;
      return addResult.updatedMessages;
    });
    
    // Fallback for cases where setMessages defers execution (React 18 concurrent rendering)
    if (!result) {
      const fallbackResult = messageManager.addMessage(messagesRef.current, message);
      messagesRef.current = fallbackResult.updatedMessages;
      state.setMessages(fallbackResult.updatedMessages);
      result = fallbackResult;
    }
    
    // Always update ref for streaming messages so chunks can update them
    if (message.isStreaming && result?.newMessage) {
      state.refs.currentStreamingMessageRef.current = result.newMessage;
    }
    
    return result;
  }, [state.setMessages, messageManager]);
  
  // Update streaming message helper
  // SIMPLIFIED: Trust the backend - update message with chunks, find it if ref is missing
  const updateStreamingMessage = useCallback((content: string, isComplete: boolean = false) => {
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
      isComplete
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
  
  // Handle suggestion selection
  const handleSuggestionSelect = useCallback((suggestion: string) => {
    state.setInput(suggestion);
  }, [state.setInput]);
  
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
    if (!message?.metadata?.clarification_field || message.metadata.clarification_value === undefined) {
      chatLogger.warn('Cannot confirm clarification: missing metadata', { messageId });
      return;
    }
    
    const clarificationField = message.metadata.clarification_field;
    const clarificationValue = message.metadata.clarification_value;
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Messages */}
        {/* PERFORMANCE FIX: Memoized message component to prevent unnecessary re-renders */}
        <AnimatePresence initial={false} mode="popLayout">
        {state.messages.map((message) => (
          <MessageItem
            key={message.id}
            message={message}
            onSuggestionSelect={handleSuggestionSelect}
            onSuggestionDismiss={handleSuggestionDismiss}
            onClarificationConfirm={handleClarificationConfirm}
            onClarificationReject={handleClarificationReject}
            onKBOSuggestionSelect={handleKBOSuggestionSelect}
          />
        ))}
        </AnimatePresence>
        
        {/* Typing Indicator - Separate bubble */}
        <AnimatePresence>
        {state.isTyping && (
          <div className="flex justify-start" key="typing-indicator">
            <TypingIndicator />
          </div>
        )}
        </AnimatePresence>
        
        {/* Calculate Now Button */}
        {state.calculateOption && (
          <div className="flex justify-center">
            <button
              onClick={() => {
                // Handle calculate now
                chatLogger.info('Calculate now clicked', { sessionId });
              }}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Calculate Now
            </button>
          </div>
        )}
        
        {/* Valuation Preview */}
        {state.valuationPreview && (
          <div className="bg-primary-600/10 p-4 rounded-lg border border-primary-600/30">
            <h3 className="font-semibold text-primary-300 mb-2">Valuation Preview</h3>
            <div className="text-2xl font-bold text-primary-200">
              ${state.valuationPreview.value?.toLocaleString()}
            </div>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={state.refs.messagesEndRef} />
      </div>
      
      {/* Contextual Tip */}
      
      {/* Input Form */}
      <div className="p-4 border-t border-zinc-800">
        <form
          onSubmit={handleSubmit}
          className="focus-within:bg-zinc-900/60 group flex flex-col gap-3 p-4 duration-300 w-full rounded-3xl border border-white/10 bg-zinc-900/40 text-base shadow-xl transition-all ease-in-out focus-within:border-zinc-500/40 hover:border-zinc-600/30 backdrop-blur-md"
        >
          {/* Textarea container */}
          <div className="relative flex items-center">
            <textarea
              value={state.input}
              onChange={(e) => state.setInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Ask about your business valuation..."
              disabled={disabled || state.isStreaming}
              className="textarea-seamless flex w-full rounded-md px-3 py-3 ring-offset-background placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-base leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap md:text-base max-h-[200px] bg-transparent focus:bg-transparent flex-1 text-white border-0 border-none"
              style={{ minHeight: '80px', height: '80px' }}
              spellCheck="false"
            />
          </div>

          {/* Action buttons row */}
          <div className="flex gap-2 flex-wrap items-center">
            {smartFollowUps.filter(Boolean).map((suggestion, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => state.setInput(suggestion)}
                disabled={state.isStreaming}
                className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 rounded-full text-xs text-zinc-300 hover:text-white transition-all duration-200 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {suggestion}
              </button>
            ))}
            
            {/* Right side with send button */}
            <div className="flex flex-grow items-center justify-end gap-2">
              <button
                type="submit"
                disabled={!state.input.trim() || state.isStreaming || disabled}
                className={`submit-button-white flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ease-out shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none ${
                  state.isStreaming 
                    ? 'bg-zinc-800 scale-95 ring-2 ring-primary-500/20' 
                    : 'bg-white hover:bg-zinc-200 hover:shadow-white/20 active:scale-90'
                }`}
              >
                {state.isStreaming ? (
                  <div className="relative w-4 h-4">
                     <div className="absolute inset-0 border-2 border-zinc-600 rounded-full"></div>
                     <div className="absolute inset-0 border-2 border-t-primary-500 rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-900 ml-0.5">
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
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

// PERFORMANCE FIX: Memoized message item component to prevent unnecessary re-renders
interface MessageItemProps {
  message: Message;
  onSuggestionSelect: (suggestion: string) => void;
  onSuggestionDismiss: () => void;
  onClarificationConfirm: (messageId: string) => void;
  onClarificationReject: (messageId: string) => void;
  onKBOSuggestionSelect: (selection: string) => void;
}

const MessageItem = React.memo<MessageItemProps>(({
  message,
  onSuggestionSelect,
  onSuggestionDismiss,
  onClarificationConfirm,
  onClarificationReject,
  onKBOSuggestionSelect
}) => {
  // Detect KBO suggestions in the message
  // Check both message content and metadata clarification_message
  const kboSuggestions = React.useMemo(() => {
    // First check metadata clarification_message (if available)
    if (message.metadata?.clarification_message) {
      const clarificationMsg = message.metadata.clarification_message;
      if (hasKBOSuggestions(clarificationMsg)) {
        return parseKBOSuggestions(clarificationMsg);
      }
    }
    // Check message content directly (primary source)
    if (hasKBOSuggestions(message.content)) {
      return parseKBOSuggestions(message.content);
    }
    return null;
  }, [message.content, message.metadata?.clarification_message]);
  
  const hasKBOSuggestionsInMessage = kboSuggestions !== null && kboSuggestions.length > 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
    >
            <div className={`max-w-[85%] ${message.type === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              {message.type === 'user' ? (
                // User message - simple structure without avatar
                <div className="flex flex-col gap-1 items-end">
                  <div className="rounded-2xl rounded-tr-sm px-5 py-3.5 bg-primary-600 text-white shadow-md">
                    <div className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">
                      {message.content}
                    </div>
                  </div>
                  <div className="text-xs text-zinc-500 text-right pr-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ) : (
                // AI message - with bot avatar
                  <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/10 shadow-sm mt-1">
                    <Bot className="w-4 h-4 text-primary-400" />
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <div className="rounded-2xl rounded-tl-sm px-5 py-3.5 bg-white/5 text-white border border-white/10 shadow-sm backdrop-blur-sm">
                      <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-100">
                        {message.content}
                        {message.isStreaming && (
                          <span className="inline-block w-1.5 h-4 bg-primary-400 animate-pulse ml-1 align-middle rounded-full" />
                        )}
                      </div>
                    
                    {/* Suggestion chips */}
                    {message.type === 'suggestion' && message.metadata?.suggestions && (
                      <div className="mt-4">
                        <SuggestionChips
                          suggestions={message.metadata.suggestions}
                          originalValue={message.metadata.originalValue || ''}
                          onSelect={onSuggestionSelect}
                          onDismiss={onSuggestionDismiss}
                        />
                      </div>
                    )}
                    
                    {/* KBO Suggestions List */}
                    {/* Check if this message comes after "none" was clicked - hide suggestions if so */}
                    {(() => {
                      const isAfterNoneResponse = message.content?.includes("No problem!") && 
                                                   message.content?.includes("What's your company name?");
                      return hasKBOSuggestionsInMessage && kboSuggestions && !isAfterNoneResponse && (
                        <div className="mt-3">
                          <KBOSuggestionsList
                            suggestions={kboSuggestions}
                            onSelect={onKBOSuggestionSelect}
                          />
                        </div>
                      );
                    })()}
                    
                    {/* Generic Clarification confirmation buttons (only if not KBO suggestions) */}
                    {message.metadata?.needs_confirmation && !hasKBOSuggestionsInMessage && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col gap-2 mt-4 p-3 bg-white/5 rounded-xl border border-white/10"
                      >
                        <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Confirm Details</p>
                        <div className="flex gap-3">
                          <button
                            onClick={() => onClarificationConfirm(message.id)}
                            className="flex-1 py-2.5 px-4 bg-primary-600/20 hover:bg-primary-600/30 border border-primary-500/30 hover:border-primary-500/50 text-primary-300 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Yes, that's correct
                          </button>
                          <button
                            onClick={() => onClarificationReject(message.id)}
                            className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-300 rounded-lg text-sm font-medium transition-all active:scale-[0.98]"
                          >
                            No, edit
                          </button>
                        </div>
                      </motion.div>
                    )}
                    
                    {/* Help text */}
                    {AI_CONFIG.showHelpText && message.metadata?.help_text && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <p className="text-xs text-zinc-400 flex items-start gap-1.5">
                          <span className="mt-0.5">ℹ️</span>
                          <span className="leading-relaxed">{message.metadata.help_text}</span>
                        </p>
                      </div>
                    )}
                    
                    {/* Valuation narrative */}
                    {AI_CONFIG.showNarratives && message.metadata?.valuation_narrative && (
                      <div className="mt-3 p-3 bg-primary-600/10 rounded-xl border border-primary-600/20">
                        <h4 className="text-xs font-semibold text-primary-300 mb-1 uppercase tracking-wider">
                          Valuation Insight
                        </h4>
                        <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                          {message.metadata.valuation_narrative}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Timestamp for AI messages */}
                  <div className="text-xs text-zinc-500 ml-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
  );
});

// Display name for React DevTools
MessageItem.displayName = 'MessageItem';

export default StreamingChat;