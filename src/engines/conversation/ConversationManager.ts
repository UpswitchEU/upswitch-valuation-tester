/**
 * ConversationManager Engine - Core Conversation Lifecycle
 *
 * Single Responsibility: Manage conversation lifecycle, state, and coordination
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/conversation/ConversationManager
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import type { Message } from '../../hooks/useStreamingChatState';
import { chatLogger } from '../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ConversationConfig {
  sessionId: string;
  userId?: string;
  initialMessages?: Message[];
  initialData?: any;
  pythonSessionId?: string | null;
  isRestoring?: boolean;
  isSessionInitialized?: boolean;
  isRestorationComplete?: boolean;
}

export interface ConversationState {
  sessionId: string;
  pythonSessionId: string | null;
  messages: Message[];
  isActive: boolean;
  isRestoring: boolean;
  isSessionInitialized: boolean;
  isRestorationComplete: boolean;
  lastActivity: Date;
}

export interface ConversationManager {
  // State
  getState(): ConversationState;

  // Lifecycle
  initialize(config: ConversationConfig): Promise<void>;
  startConversation(): Promise<void>;
  endConversation(): Promise<void>;
  resetConversation(): void;

  // Message Management
  addMessage(message: Message): void;
  updateMessage(messageId: string, updates: Partial<Message>): void;
  getMessages(): Message[];

  // Session Management
  setPythonSessionId(sessionId: string | null): void;
  getPythonSessionId(): string | null;

  // Restoration
  markRestorationComplete(): void;
  isRestored(): boolean;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class ConversationManagerImpl implements ConversationManager {
  private state: ConversationState;
  private config: ConversationConfig;
  private listeners: Set<(state: ConversationState) => void> = new Set();

  constructor(initialConfig: ConversationConfig) {
    this.config = initialConfig;
    this.state = {
      sessionId: initialConfig.sessionId,
      pythonSessionId: initialConfig.pythonSessionId || null,
      messages: initialConfig.initialMessages || [],
      isActive: false,
      isRestoring: initialConfig.isRestoring || false,
      isSessionInitialized: initialConfig.isSessionInitialized || false,
      isRestorationComplete: initialConfig.isRestorationComplete || false,
      lastActivity: new Date(),
    };
  }

  // State Management
  getState(): ConversationState {
    return { ...this.state };
  }

  private updateState(updates: Partial<ConversationState>): void {
    this.state = { ...this.state, ...updates, lastActivity: new Date() };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  onStateChange(listener: (state: ConversationState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Lifecycle Management
  async initialize(config: ConversationConfig): Promise<void> {
    chatLogger.info('[ConversationManager] Initializing conversation', {
      sessionId: config.sessionId,
      hasInitialMessages: config.initialMessages?.length || 0,
      isRestoring: config.isRestoring,
    });

    this.config = config;
    this.updateState({
      sessionId: config.sessionId,
      pythonSessionId: config.pythonSessionId || null,
      messages: config.initialMessages || [],
      isRestoring: config.isRestoring || false,
      isSessionInitialized: config.isSessionInitialized || false,
      isRestorationComplete: config.isRestorationComplete || false,
    });
  }

  async startConversation(): Promise<void> {
    chatLogger.info('[ConversationManager] Starting conversation', {
      sessionId: this.state.sessionId,
    });

    this.updateState({ isActive: true });
  }

  async endConversation(): Promise<void> {
    chatLogger.info('[ConversationManager] Ending conversation', {
      sessionId: this.state.sessionId,
      messageCount: this.state.messages.length,
    });

    this.updateState({ isActive: false });
  }

  resetConversation(): void {
    chatLogger.info('[ConversationManager] Resetting conversation', {
      sessionId: this.state.sessionId,
    });

    this.updateState({
      messages: [],
      pythonSessionId: null,
      isActive: false,
      isRestoring: false,
      isSessionInitialized: false,
      isRestorationComplete: false,
    });
  }

  // Message Management
  addMessage(message: Message): void {
    this.updateState({
      messages: [...this.state.messages, message],
    });

    chatLogger.debug('[ConversationManager] Added message', {
      sessionId: this.state.sessionId,
      messageType: message.role,
      messageLength: message.content.length,
    });
  }

  updateMessage(messageId: string, updates: Partial<Message>): void {
    const updatedMessages = this.state.messages.map(msg =>
      msg.id === messageId ? { ...msg, ...updates } : msg
    );

    this.updateState({ messages: updatedMessages });
  }

  getMessages(): Message[] {
    return [...this.state.messages];
  }

  // Session Management
  setPythonSessionId(sessionId: string | null): void {
    chatLogger.info('[ConversationManager] Python session ID updated', {
      sessionId: this.state.sessionId,
      pythonSessionId: sessionId,
    });

    this.updateState({ pythonSessionId: sessionId });
  }

  getPythonSessionId(): string | null {
    return this.state.pythonSessionId;
  }

  // Restoration Management
  markRestorationComplete(): void {
    chatLogger.info('[ConversationManager] Restoration completed', {
      sessionId: this.state.sessionId,
      messageCount: this.state.messages.length,
    });

    this.updateState({
      isRestoring: false,
      isRestorationComplete: true,
    });
  }

  isRestored(): boolean {
    return this.state.isRestorationComplete;
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseConversationManagerResult {
  manager: ConversationManager;
  state: ConversationState;
  actions: {
    initialize: (config: ConversationConfig) => Promise<void>;
    startConversation: () => Promise<void>;
    endConversation: () => Promise<void>;
    resetConversation: () => void;
    addMessage: (message: Message) => void;
    setPythonSessionId: (sessionId: string | null) => void;
  };
}

/**
 * useConversationManager Hook
 *
 * React hook interface for ConversationManager engine
 * Provides reactive state and actions for conversation management
 */
export const useConversationManager = (
  initialConfig: ConversationConfig
): UseConversationManagerResult => {
  const [manager] = useState(() => new ConversationManagerImpl(initialConfig));
  const [state, setState] = useState<ConversationState>(manager.getState());

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = manager.onStateChange(setState);
    return unsubscribe;
  }, [manager]);

  // Actions
  const actions = {
    initialize: useCallback((config: ConversationConfig) => manager.initialize(config), [manager]),
    startConversation: useCallback(() => manager.startConversation(), [manager]),
    endConversation: useCallback(() => manager.endConversation(), [manager]),
    resetConversation: useCallback(() => manager.resetConversation(), [manager]),
    addMessage: useCallback((message: Message) => manager.addMessage(message), [manager]),
    setPythonSessionId: useCallback((sessionId: string | null) => manager.setPythonSessionId(sessionId), [manager]),
  };

  return {
    manager,
    state,
    actions,
  };
};
