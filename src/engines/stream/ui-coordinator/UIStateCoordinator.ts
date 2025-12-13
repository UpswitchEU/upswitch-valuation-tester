/**
 * UIStateCoordinator Engine - UI State Coordination & Updates
 *
 * Single Responsibility: Coordinate UI state updates across streaming conversation components
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/stream/ui-coordinator/UIStateCoordinator
 */

import { useCallback, useMemo } from 'react';
import { chatLogger } from '../../../utils/logger';
import type { ParsedEvent } from '../event-parser/EventParser';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UIState {
  isStreaming: boolean;
  isTyping: boolean;
  isThinking: boolean;
  typingContext?: string;
  streamingMessage: {
    content: string;
    isComplete: boolean;
    metadata?: any;
  };
  collectedData: Record<string, any>;
  valuationPreview: any;
  calculateOption: any;
  progressData: any;
}

export interface UIUpdateAction {
  type: 'start_streaming' | 'update_streaming_message' | 'complete_streaming_message' |
        'set_typing' | 'set_thinking' | 'update_collected_data' | 'set_valuation_preview' |
        'set_calculate_option' | 'update_progress' | 'reset_state';
  payload?: any;
  timestamp: number;
  source: string;
}

export interface UIStateCoordinator {
  // State management
  getState(): UIState;

  // State updates
  dispatch(action: UIUpdateAction): void;
  batchUpdate(updates: UIUpdateAction[]): void;

  // Streaming message management
  startStreaming(): void;
  updateStreamingMessage(content: string, isComplete?: boolean, metadata?: any): void;
  completeStreamingMessage(): void;

  // UI state management
  setTypingIndicator(typing: boolean, context?: string): void;
  setThinkingIndicator(thinking: boolean): void;

  // Data management
  updateCollectedData(data: Record<string, any>): void;
  setValuationPreview(preview: any): void;
  setCalculateOption(option: any): void;
  updateProgress(data: any): void;

  // State queries
  isStreaming(): boolean;
  hasCollectedData(): boolean;
  getStreamingMessage(): UIState['streamingMessage'];

  // Event handling
  handleParsedEvent(event: ParsedEvent): UIUpdateAction[];
  handleStreamingEvent(rawEvent: any): UIUpdateAction[];

  // Reset
  resetState(): void;

  // State observers
  subscribe(callback: (state: UIState) => void): () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const INITIAL_UI_STATE: UIState = {
  isStreaming: false,
  isTyping: false,
  isThinking: false,
  streamingMessage: {
    content: '',
    isComplete: false,
  },
  collectedData: {},
  valuationPreview: null,
  calculateOption: null,
  progressData: null,
};

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class UIStateCoordinatorImpl implements UIStateCoordinator {
  private state: UIState;
  private observers: Set<(state: UIState) => void> = new Set();
  private actionHistory: UIUpdateAction[] = [];
  private maxHistorySize = 100;

  constructor(initialState?: Partial<UIState>) {
    this.state = { ...INITIAL_UI_STATE, ...initialState };
  }

  // State management
  getState(): UIState {
    return { ...this.state };
  }

  private updateState(updates: Partial<UIState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyObservers();

    chatLogger.debug('[UIStateCoordinator] State updated', {
      updates: Object.keys(updates),
      isStreaming: this.state.isStreaming,
      hasData: Object.keys(this.state.collectedData).length > 0,
    });
  }

  private notifyObservers(): void {
    this.observers.forEach(observer => {
      try {
        observer(this.getState());
      } catch (error) {
        chatLogger.error('[UIStateCoordinator] Observer error', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });
  }

  subscribe(callback: (state: UIState) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  // Action dispatch
  dispatch(action: UIUpdateAction): void {
    this.actionHistory.push(action);

    // Maintain history size
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory = this.actionHistory.slice(-this.maxHistorySize);
    }

    chatLogger.debug('[UIStateCoordinator] Action dispatched', {
      type: action.type,
      source: action.source,
      hasPayload: !!action.payload,
    });

    this.handleAction(action);
  }

  batchUpdate(updates: UIUpdateAction[]): void {
    updates.forEach(update => this.dispatch(update));
  }

  private handleAction(action: UIUpdateAction): void {
    switch (action.type) {
      case 'start_streaming':
        this.updateState({
          isStreaming: true,
          streamingMessage: { content: '', isComplete: false },
        });
        break;

      case 'update_streaming_message':
        this.updateState({
          streamingMessage: {
            content: action.payload.content,
            isComplete: action.payload.isComplete || false,
            metadata: action.payload.metadata,
          },
        });
        break;

      case 'complete_streaming_message':
        this.updateState({
          isStreaming: false,
          streamingMessage: {
            ...this.state.streamingMessage,
            isComplete: true,
          },
        });
        break;

      case 'set_typing':
        this.updateState({
          isTyping: action.payload.typing,
          typingContext: action.payload.context,
        });
        break;

      case 'set_thinking':
        this.updateState({
          isThinking: action.payload.thinking,
        });
        break;

      case 'update_collected_data':
        this.updateState({
          collectedData: {
            ...this.state.collectedData,
            ...action.payload,
          },
        });
        break;

      case 'set_valuation_preview':
        this.updateState({
          valuationPreview: action.payload,
        });
        break;

      case 'set_calculate_option':
        this.updateState({
          calculateOption: action.payload,
        });
        break;

      case 'update_progress':
        this.updateState({
          progressData: action.payload,
        });
        break;

      case 'reset_state':
        this.resetState();
        break;

      default:
        chatLogger.warn('[UIStateCoordinator] Unknown action type', {
          type: action.type,
        });
    }
  }

  // Streaming message management
  startStreaming(): void {
    this.dispatch({
      type: 'start_streaming',
      timestamp: Date.now(),
      source: 'coordinator',
    });
  }

  updateStreamingMessage(content: string, isComplete: boolean = false, metadata?: any): void {
    this.dispatch({
      type: 'update_streaming_message',
      payload: { content, isComplete, metadata },
      timestamp: Date.now(),
      source: 'coordinator',
    });
  }

  completeStreamingMessage(): void {
    this.dispatch({
      type: 'complete_streaming_message',
      timestamp: Date.now(),
      source: 'coordinator',
    });
  }

  // UI state management
  setTypingIndicator(typing: boolean, context?: string): void {
    this.dispatch({
      type: 'set_typing',
      payload: { typing, context },
      timestamp: Date.now(),
      source: 'coordinator',
    });
  }

  setThinkingIndicator(thinking: boolean): void {
    this.dispatch({
      type: 'set_thinking',
      payload: { thinking },
      timestamp: Date.now(),
      source: 'coordinator',
    });
  }

  // Data management
  updateCollectedData(data: Record<string, any>): void {
    this.dispatch({
      type: 'update_collected_data',
      payload: data,
      timestamp: Date.now(),
      source: 'coordinator',
    });
  }

  setValuationPreview(preview: any): void {
    this.dispatch({
      type: 'set_valuation_preview',
      payload: preview,
      timestamp: Date.now(),
      source: 'coordinator',
    });
  }

  setCalculateOption(option: any): void {
    this.dispatch({
      type: 'set_calculate_option',
      payload: option,
      timestamp: Date.now(),
      source: 'coordinator',
    });
  }

  updateProgress(data: any): void {
    this.dispatch({
      type: 'update_progress',
      payload: data,
      timestamp: Date.now(),
      source: 'coordinator',
    });
  }

  // State queries
  isStreaming(): boolean {
    return this.state.isStreaming;
  }

  hasCollectedData(): boolean {
    return Object.keys(this.state.collectedData).length > 0;
  }

  getStreamingMessage(): UIState['streamingMessage'] {
    return { ...this.state.streamingMessage };
  }

  // Event handling
  handleParsedEvent(event: ParsedEvent): UIUpdateAction[] {
    const actions: UIUpdateAction[] = [];

    if (!event.isValid) {
      chatLogger.warn('[UIStateCoordinator] Invalid parsed event', {
        eventType: event.eventType,
        errors: event.validationErrors,
      });
      return actions;
    }

    switch (event.eventType) {
      case 'message':
        if (event.requiresUIUpdate) {
          actions.push({
            type: 'update_streaming_message',
            payload: {
              content: event.normalizedData?.content || '',
              isComplete: false,
              metadata: event.normalizedData,
            },
            timestamp: event.event.timestamp,
            source: 'parsed_event',
          });
        }
        break;

      case 'data':
        if (event.requiresDataCollection && event.normalizedData?.extracted_data) {
          actions.push({
            type: 'update_collected_data',
            payload: this.transformExtractedData(event.normalizedData.extracted_data),
            timestamp: event.event.timestamp,
            source: 'parsed_event',
          });
        }
        break;

      case 'valuation':
        if (event.normalizedData) {
          actions.push({
            type: 'set_valuation_preview',
            payload: event.normalizedData,
            timestamp: event.event.timestamp,
            source: 'parsed_event',
          });
        }
        break;

      case 'progress':
        if (event.normalizedData) {
          actions.push({
            type: 'update_progress',
            payload: event.normalizedData,
            timestamp: event.event.timestamp,
            source: 'parsed_event',
          });
        }
        break;

      case 'complete':
        actions.push({
          type: 'complete_streaming_message',
          timestamp: event.event.timestamp,
          source: 'parsed_event',
        });
        break;

      case 'error':
        // Error handling could be added here
        chatLogger.error('[UIStateCoordinator] Error event received', {
          error: event.normalizedData?.error,
        });
        break;
    }

    return actions;
  }

  handleStreamingEvent(rawEvent: any): UIUpdateAction[] {
    // This would integrate with EventParser to parse and then handle
    // For now, return empty array - would be implemented with full integration
    chatLogger.debug('[UIStateCoordinator] Raw streaming event received', {
      eventType: typeof rawEvent,
    });

    return [];
  }

  // Reset
  resetState(): void {
    this.state = { ...INITIAL_UI_STATE };
    this.actionHistory = [];
    this.notifyObservers();

    chatLogger.info('[UIStateCoordinator] State reset');
  }

  // Private helper methods
  private transformExtractedData(extractedData: any[]): Record<string, any> {
    const transformed: Record<string, any> = {};

    extractedData.forEach(item => {
      if (item.field && item.value !== undefined) {
        transformed[item.field] = {
          value: item.value,
          confidence: item.confidence || 0.5,
          source: item.source || 'ai_extraction',
          timestamp: item.timestamp || Date.now(),
        };
      }
    });

    return transformed;
  }

  // Get action history for debugging
  getActionHistory(): UIUpdateAction[] {
    return [...this.actionHistory];
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseUIStateCoordinatorResult {
  coordinator: UIStateCoordinator;
  state: UIState;
  actions: {
    dispatch: (action: UIUpdateAction) => void;
    batchUpdate: (updates: UIUpdateAction[]) => void;
    startStreaming: () => void;
    updateStreamingMessage: (content: string, isComplete?: boolean, metadata?: any) => void;
    completeStreamingMessage: () => void;
    setTypingIndicator: (typing: boolean, context?: string) => void;
    setThinkingIndicator: (thinking: boolean) => void;
    updateCollectedData: (data: Record<string, any>) => void;
    setValuationPreview: (preview: any) => void;
    setCalculateOption: (option: any) => void;
    updateProgress: (data: any) => void;
    resetState: () => void;
    handleParsedEvent: (event: ParsedEvent) => UIUpdateAction[];
    handleStreamingEvent: (rawEvent: any) => UIUpdateAction[];
  };
  helpers: {
    isStreaming: boolean;
    hasCollectedData: boolean;
    streamingMessage: UIState['streamingMessage'];
    actionHistory: UIUpdateAction[];
  };
}

/**
 * useUIStateCoordinator Hook
 *
 * React hook interface for UIStateCoordinator engine
 * Provides reactive UI state coordination for streaming conversations
 */
export const useUIStateCoordinator = (
  initialState?: Partial<UIState>
): UseUIStateCoordinatorResult => {
  const coordinator = useMemo(() => new UIStateCoordinatorImpl(initialState), [initialState]);
  const [state, setState] = useMemo(() => {
    let currentState = coordinator.getState();
    const unsubscribe = coordinator.subscribe(setState);
    return [currentState, setState, unsubscribe] as const;
  }, [coordinator]);

  const actions = {
    dispatch: useCallback((action: UIUpdateAction) => coordinator.dispatch(action), [coordinator]),
    batchUpdate: useCallback((updates: UIUpdateAction[]) => coordinator.batchUpdate(updates), [coordinator]),
    startStreaming: useCallback(() => coordinator.startStreaming(), [coordinator]),
    updateStreamingMessage: useCallback(
      (content: string, isComplete?: boolean, metadata?: any) =>
        coordinator.updateStreamingMessage(content, isComplete, metadata),
      [coordinator]
    ),
    completeStreamingMessage: useCallback(() => coordinator.completeStreamingMessage(), [coordinator]),
    setTypingIndicator: useCallback(
      (typing: boolean, context?: string) => coordinator.setTypingIndicator(typing, context),
      [coordinator]
    ),
    setThinkingIndicator: useCallback((thinking: boolean) => coordinator.setThinkingIndicator(thinking), [coordinator]),
    updateCollectedData: useCallback((data: Record<string, any>) => coordinator.updateCollectedData(data), [coordinator]),
    setValuationPreview: useCallback((preview: any) => coordinator.setValuationPreview(preview), [coordinator]),
    setCalculateOption: useCallback((option: any) => coordinator.setCalculateOption(option), [coordinator]),
    updateProgress: useCallback((data: any) => coordinator.updateProgress(data), [coordinator]),
    resetState: useCallback(() => coordinator.resetState(), [coordinator]),
    handleParsedEvent: useCallback((event: ParsedEvent) => coordinator.handleParsedEvent(event), [coordinator]),
    handleStreamingEvent: useCallback((rawEvent: any) => coordinator.handleStreamingEvent(rawEvent), [coordinator]),
  };

  const helpers = {
    isStreaming: coordinator.isStreaming(),
    hasCollectedData: coordinator.hasCollectedData(),
    streamingMessage: coordinator.getStreamingMessage(),
    actionHistory: (coordinator as any).getActionHistory?.() || [],
  };

  return {
    coordinator,
    state,
    actions,
    helpers,
  };
};
