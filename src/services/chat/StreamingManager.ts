/**
 * StreamingManager - Handles streaming conversation logic
 * 
 * Extracted from StreamingChat.tsx to reduce component complexity and improve maintainability.
 * Centralizes all streaming logic including async generators, EventSource fallback, and retry mechanisms.
 */

import { streamingChatService } from './streamingChatService';
import { chatLogger } from '../../utils/logger';
import { Message } from '../../hooks/useStreamingChatState';

export interface StreamingManagerCallbacks {
  setIsStreaming: (streaming: boolean) => void;
  addMessage: (message: Message) => Message;
  updateStreamingMessage: (content: string, isComplete?: boolean) => void;
  onContextUpdate?: (context: any) => void;
  extractBusinessModelFromInput: (input: string) => string | null;
  extractFoundingYearFromInput: (input: string) => number | null;
}

/**
 * Centralized streaming manager for conversation handling
 * 
 * Handles all streaming operations including:
 * - Async generator streaming
 * - EventSource fallback
 * - Retry logic with exponential backoff
 * - Request deduplication
 * - Timeout handling
 */
export class StreamingManager {
  private requestIdRef: React.RefObject<string | null>;
  private currentStreamingMessageRef: React.RefObject<Message | null>;

  constructor(
    requestIdRef: React.RefObject<string | null>,
    currentStreamingMessageRef: React.RefObject<Message | null>
  ) {
    this.requestIdRef = requestIdRef;
    this.currentStreamingMessageRef = currentStreamingMessageRef;
  }

  /**
   * Start streaming conversation with comprehensive retry logic
   * 
   * @param sessionId - Unique session identifier
   * @param userInput - User input message
   * @param userId - Optional user identifier
   * @param callbacks - Callback functions for state management
   * @param onEvent - Event handler function
   * @param onError - Error handler function
   * @param attempt - Current retry attempt (internal)
   */
  async startStreaming(
    sessionId: string,
    userInput: string,
    userId: string | undefined,
    callbacks: StreamingManagerCallbacks,
    onEvent: (event: any) => void,
    onError: (error: Error) => void,
    attempt: number = 0
  ): Promise<void> {
    if (!userInput.trim() || this.requestIdRef.current) {
      if (this.requestIdRef.current) {
        chatLogger.warn('Request already in progress', { 
          currentRequestId: this.requestIdRef.current,
          sessionId 
        });
      }
      return;
    }

    // Request deduplication
    const requestId = `${sessionId}_${Date.now()}`;
    this.requestIdRef.current = requestId;

    // Log session tracking
    console.log('[SESSION] Sending message with session:', sessionId);
    
    // Extract business information from user input
    const extractedBusinessModel = callbacks.extractBusinessModelFromInput(userInput);
    const extractedFoundingYear = callbacks.extractFoundingYearFromInput(userInput);
    
    // Update conversation context if extraction found something
    if (extractedBusinessModel || extractedFoundingYear) {
      const contextUpdate = {
        extracted_business_model: extractedBusinessModel,
        extracted_founding_year: extractedFoundingYear,
        extraction_confidence: {
          business_model: extractedBusinessModel ? 0.8 : 0,
          founding_year: extractedFoundingYear ? 0.8 : 0
        }
      };
      callbacks.onContextUpdate?.(contextUpdate);
    }
    
    chatLogger.info('Starting streaming conversation', { 
      userInput: userInput.substring(0, 50) + '...', 
      sessionId, 
      userId,
      attempt,
      maxRetries: 3,
      extractedBusinessModel,
      extractedFoundingYear
    });
    
    callbacks.setIsStreaming(true);

    // Add user message
    const userMessage = callbacks.addMessage({
      type: 'user',
      content: userInput,
      isComplete: true
    });
    chatLogger.debug('User message added', { messageId: userMessage.id });

    // Create streaming AI message
    const aiMessage = callbacks.addMessage({
      type: 'ai',
      content: '',
      isStreaming: true,
      isComplete: false
    });
    
    if (!aiMessage) {
      chatLogger.error('Failed to create AI message - this should not happen');
      callbacks.setIsStreaming(false);
      return;
    }
    
    chatLogger.debug('AI message created for streaming', { messageId: aiMessage.id });
    this.currentStreamingMessageRef.current = aiMessage;

    try {
      await this.streamWithAsyncGenerator(
        sessionId,
        userInput,
        userId,
        onEvent,
        aiMessage
      );
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
          this.startStreaming(sessionId, userInput, userId, callbacks, onEvent, onError, attempt + 1);
        }, delay);
        return;
      }
      
      // Max retries exceeded - show error message
      callbacks.setIsStreaming(false);
      if (this.currentStreamingMessageRef.current) {
        callbacks.updateStreamingMessage(
          'I apologize, but I\'m having trouble connecting. Please try again.',
          true
        );
      }
      
      onError(error instanceof Error ? error : new Error('Unknown streaming error'));
    } finally {
      // Clear request ID to allow new requests
      this.requestIdRef.current = null;
    }
  }

  /**
   * Stream using async generator (primary method)
   */
  private async streamWithAsyncGenerator(
    sessionId: string,
    userInput: string,
    userId: string | undefined,
    onEvent: (event: any) => void,
    aiMessage: Message
  ): Promise<void> {
    chatLogger.info('Starting async generator consumption', { 
      sessionId, 
      userInput: userInput.substring(0, 50) + '...' 
    });
    
    let eventCount = 0;
    let generatorTimeout: NodeJS.Timeout;
    
    // Set timeout to detect if generator hangs
    generatorTimeout = setTimeout(() => {
      chatLogger.warn('Async generator timeout - no events received in 10 seconds', { sessionId });
      throw new Error('Streaming timeout');
    }, 10000);
    
    try {
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
        onEvent(event);
      }
      
      clearTimeout(generatorTimeout);
      chatLogger.info('Async generator completed', { 
        totalEvents: eventCount, 
        sessionId,
        messageId: aiMessage.id 
      });
      
      // If no events were received, throw error to trigger fallback
      if (eventCount === 0) {
        chatLogger.warn('No events received from async generator', { sessionId });
        throw new Error('No events received from async generator');
      }
    } catch (error) {
      clearTimeout(generatorTimeout);
      throw error;
    }
  }

  /**
   * Stream using EventSource (fallback method)
   */
  streamWithEventSource(
    sessionId: string,
    userInput: string,
    userId: string | undefined,
    onEvent: (event: any) => void,
    onError: (error: Error) => void,
    onComplete: () => void
  ): EventSource {
    chatLogger.info('Starting EventSource fallback', { sessionId });
    
    const eventSource = streamingChatService.streamConversationEventSource(
      sessionId,
      userInput,
      userId,
      (event) => {
        chatLogger.info('EventSource event received', { 
          type: event.type, 
          hasContent: !!event.content 
        });
        onEvent(event);
      },
      (error) => {
        chatLogger.error('EventSource error', { error: error.message });
        onError(error);
      },
      () => {
        chatLogger.info('EventSource completed', { sessionId });
        onComplete();
      }
    );
    
    return eventSource;
  }

  /**
   * Check if a request is currently in progress
   */
  isRequestInProgress(): boolean {
    return this.requestIdRef.current !== null;
  }

  /**
   * Get current request ID
   */
  getCurrentRequestId(): string | null {
    return this.requestIdRef.current;
  }

  /**
   * Clear current request (useful for cleanup)
   */
  clearCurrentRequest(): void {
    this.requestIdRef.current = null;
  }

  /**
   * Get current streaming message
   */
  getCurrentStreamingMessage(): Message | null {
    return this.currentStreamingMessageRef.current;
  }

  /**
   * Set current streaming message
   */
  setCurrentStreamingMessage(message: Message | null): void {
    this.currentStreamingMessageRef.current = message;
  }
}
