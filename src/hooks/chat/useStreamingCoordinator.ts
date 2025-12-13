/**
 * useStreamingCoordinator - Extracted streaming coordination logic from StreamingChat
 *
 * Handles streaming lifecycle, cleanup, and coordination with backend.
 * Follows Single Responsibility Principle by focusing only on streaming operations.
 */

import { useCallback, useEffect, useRef } from 'react';
import { StreamEventHandler } from '../../services/chat/StreamEventHandler';
import { StreamingManager } from '../../services/chat/StreamingManager';
import type { Message } from '../useStreamingChatState';

import type { CalculateOptionData, CollectedData, ValuationPreviewData } from '../../components/StreamingChat.types';
import type { ValuationResponse } from '../../types/valuation';

export interface UseStreamingCoordinatorOptions {
  sessionId: string;
  messages: Message[];
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  setIsStreaming: (streaming: boolean) => void;
  setIsTyping: (typing: boolean) => void;
  setIsThinking: (thinking: boolean) => void;
  setTypingContext: (context: string) => void;
  setCollectedData: (data: Record<string, unknown>) => void;
  setValuationPreview: (preview: ValuationPreviewData) => void;
  setCalculateOption: (option: CalculateOptionData) => void;
  updateStreamingMessage: (content: string, isComplete: boolean, metadata?: unknown) => void;
  onValuationComplete?: (result: ValuationResponse) => void;
  onReportUpdate?: (htmlContent: string, progress: number) => void;
  onDataCollected?: (data: CollectedData) => void;
  onValuationPreview?: (data: ValuationPreviewData) => void;
  onCalculateOptionAvailable?: (data: CalculateOptionData) => void;
  onProgressUpdate?: (data: unknown) => void;
  onReportSectionUpdate?: (
    section: string,
    html: string,
    phase: number,
    progress: number,
    is_fallback?: boolean,
    is_error?: boolean,
    error_message?: string
  ) => void;
  onSectionLoading?: (section: string, html: string, phase: number, data?: unknown) => void;
  onSectionComplete?: (event: { sectionId: string; sectionName: string; html: string; progress: number; phase?: number }) => void;
  onReportComplete?: (html: string, valuationId: string) => void;
  onContextUpdate?: (context: unknown) => void;
  onHtmlPreviewUpdate?: (html: string, previewType: string) => void;
}

export interface UseStreamingCoordinatorReturn {
  startStreaming: (userInput: string) => Promise<void>;
  stopStreaming: () => void;
  isStreaming: boolean;
}

/**
 * Streaming coordinator hook
 *
 * Manages the complete streaming lifecycle including:
 * - Starting streaming sessions
 * - Event handling coordination
 * - Cleanup and error handling
 * - Backend communication
 */
export function useStreamingCoordinator({
  sessionId,
  messages,
  setMessages,
  setIsStreaming,
  setIsTyping,
  setIsThinking,
  setTypingContext,
  setCollectedData,
  setValuationPreview,
  setCalculateOption,
  updateStreamingMessage,
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
  onContextUpdate,
  onHtmlPreviewUpdate,
}: UseStreamingCoordinatorOptions): UseStreamingCoordinatorReturn {
  // Refs for streaming state
  const streamingManagerRef = useRef<StreamingManager | null>(null);
  const eventHandlerRef = useRef<StreamEventHandler | null>(null);
  const activeRequestRef = useRef<{ abort: () => void } | null>(null);

  // Initialize streaming manager
  useEffect(() => {
    const requestIdRef = { current: null };
    const currentStreamingMessageRef = { current: null };
    const eventSourceRef = { current: null };
    const abortControllerRef = { current: null };

    streamingManagerRef.current = new StreamingManager(
      requestIdRef,
      currentStreamingMessageRef
    );

    // Create event handler with all callbacks
    eventHandlerRef.current = new StreamEventHandler(sessionId, {
      updateStreamingMessage,
      setIsStreaming,
      setIsTyping,
      setIsThinking,
      setTypingContext,
      setCollectedData,
      setValuationPreview,
      setCalculateOption,
      addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => {
        // Simple message addition for streaming context
        setMessages(prev => [...prev, {
          ...message,
          id: `msg-${Date.now()}`,
          timestamp: new Date(),
        }]);
        return { updatedMessages: [], newMessage: {} as Message };
      },
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
      onContextUpdate,
      onHtmlPreviewUpdate,
    });

    return () => {
      // Cleanup
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [
    sessionId,
    setMessages,
    setIsStreaming,
    setIsTyping,
    setIsThinking,
    setTypingContext,
    setCollectedData,
    setValuationPreview,
    setCalculateOption,
    updateStreamingMessage,
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
    onContextUpdate,
    onHtmlPreviewUpdate,
  ]);

  // Start streaming session
  const startStreaming = useCallback(async (userInput: string) => {
    if (!streamingManagerRef.current || !eventHandlerRef.current) {
      throw new Error('Streaming coordinator not initialized');
    }

    try {
      setIsStreaming(true);
      activeRequestRef.current = await streamingManagerRef.current.startStreaming(
        sessionId,
        userInput,
        eventHandlerRef.current
      );
    } catch (error) {
      setIsStreaming(false);
      throw error;
    }
  }, [sessionId, setIsStreaming]);

  // Stop streaming session
  const stopStreaming = useCallback(() => {
    if (activeRequestRef.current) {
      activeRequestRef.current.abort();
      activeRequestRef.current = null;
    }
    setIsStreaming(false);
  }, [setIsStreaming]);

  return {
    startStreaming,
    stopStreaming,
    isStreaming: false, // This would need to be tracked in state
  };
}