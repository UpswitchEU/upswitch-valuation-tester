/**
 * MessageRenderer Engine - UI Components & Message Rendering
 *
 * Single Responsibility: Render conversation messages and UI components
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/ui-rendering/MessageRenderer
 */

import React, { useCallback, useMemo } from 'react';
import type { Message } from '../../hooks/useStreamingChatState';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RenderConfig {
  showTimestamps?: boolean;
  showMessageIds?: boolean;
  enableAnimations?: boolean;
  maxMessageLength?: number;
  theme?: 'light' | 'dark';
  showTypingIndicator?: boolean;
  showSuggestions?: boolean;
}

export interface SuggestionData {
  id: string;
  text: string;
  category?: string;
  confidence?: number;
  metadata?: Record<string, any>;
}

export interface TypingIndicatorData {
  userId?: string;
  userName?: string;
  avatar?: string;
  isTyping: boolean;
}

export interface MessageRenderer {
  // Message rendering
  renderMessage(message: Message, config?: RenderConfig): React.ReactElement;
  renderMessageList(messages: Message[], config?: RenderConfig): React.ReactElement;

  // UI component rendering
  renderTypingIndicator(data: TypingIndicatorData): React.ReactElement;
  renderSuggestions(suggestions: SuggestionData[], onSelect?: (suggestion: SuggestionData) => void): React.ReactElement;
  renderErrorMessage(error: string, onRetry?: () => void): React.ReactElement;
  renderLoadingState(message?: string): React.ReactElement;

  // Utilities
  formatTimestamp(timestamp: number): string;
  truncateMessage(content: string, maxLength?: number): string;
  highlightKeywords(content: string, keywords: string[]): string;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class MessageRendererImpl implements MessageRenderer {
  private defaultConfig: RenderConfig = {
    showTimestamps: false,
    showMessageIds: false,
    enableAnimations: true,
    maxMessageLength: 1000,
    theme: 'dark',
    showTypingIndicator: true,
    showSuggestions: true,
  };

  // Message rendering
  renderMessage(message: Message, config: RenderConfig = {}): React.ReactElement {
    const mergedConfig = { ...this.defaultConfig, ...config };

    return React.createElement(
      'div',
      {
        key: message.id,
        className: this.getMessageClassName(message, mergedConfig),
        'data-message-id': mergedConfig.showMessageIds ? message.id : undefined,
      },
      this.renderMessageContent(message, mergedConfig),
      mergedConfig.showTimestamps && this.renderTimestamp(message.timestamp)
    );
  }

  renderMessageList(messages: Message[], config: RenderConfig = {}): React.ReactElement {
    const mergedConfig = { ...this.defaultConfig, ...config };

    const messageElements = messages.map(message =>
      this.renderMessage(message, mergedConfig)
    );

    return React.createElement(
      'div',
      {
        className: `message-list ${mergedConfig.theme === 'dark' ? 'dark' : 'light'}`,
        role: 'log',
        'aria-label': 'Conversation messages',
      },
      ...messageElements
    );
  }

  // UI component rendering
  renderTypingIndicator(data: TypingIndicatorData): React.ReactElement {
    if (!data.isTyping) {
      return React.createElement('div', { style: { display: 'none' } });
    }

    return React.createElement(
      'div',
      {
        className: 'typing-indicator',
        'aria-label': `${data.userName || 'Someone'} is typing`,
      },
      data.avatar && React.createElement('img', {
        src: data.avatar,
        alt: data.userName || 'User',
        className: 'typing-avatar',
      }),
      React.createElement(
        'div',
        { className: 'typing-dots' },
        React.createElement('span', { className: 'dot' }),
        React.createElement('span', { className: 'dot' }),
        React.createElement('span', { className: 'dot' })
      ),
      React.createElement(
        'span',
        { className: 'typing-text' },
        `${data.userName || 'Assistant'} is typing...`
      )
    );
  }

  renderSuggestions(
    suggestions: SuggestionData[],
    onSelect?: (suggestion: SuggestionData) => void
  ): React.ReactElement {
    if (!suggestions.length) {
      return React.createElement('div', { style: { display: 'none' } });
    }

    const suggestionElements = suggestions.map(suggestion =>
      React.createElement(
        'button',
        {
          key: suggestion.id,
          className: `suggestion-chip ${suggestion.category ? `category-${suggestion.category}` : ''}`,
          onClick: () => onSelect?.(suggestion),
          'data-confidence': suggestion.confidence,
        },
        React.createElement(
          'span',
          { className: 'suggestion-text' },
          suggestion.text
        ),
        suggestion.confidence && React.createElement(
          'span',
          { className: 'suggestion-confidence' },
          `${Math.round(suggestion.confidence * 100)}%`
        )
      )
    );

    return React.createElement(
      'div',
      {
        className: 'suggestions-container',
        role: 'group',
        'aria-label': 'Suggested responses',
      },
      React.createElement(
        'div',
        { className: 'suggestions-list' },
        ...suggestionElements
      )
    );
  }

  renderErrorMessage(error: string, onRetry?: () => void): React.ReactElement {
    return React.createElement(
      'div',
      { className: 'error-message', role: 'alert' },
      React.createElement(
        'div',
        { className: 'error-content' },
        React.createElement(
          'span',
          { className: 'error-icon' },
          '⚠️'
        ),
        React.createElement(
          'span',
          { className: 'error-text' },
          error
        )
      ),
      onRetry && React.createElement(
        'button',
        {
          className: 'error-retry',
          onClick: onRetry,
          'aria-label': 'Retry',
        },
        'Retry'
      )
    );
  }

  renderLoadingState(message: string = 'Loading...'): React.ReactElement {
    return React.createElement(
      'div',
      { className: 'loading-state', 'aria-live': 'polite' },
      React.createElement(
        'div',
        { className: 'loading-spinner' },
        React.createElement('div', { className: 'spinner' })
      ),
      React.createElement(
        'span',
        { className: 'loading-text' },
        message
      )
    );
  }

  // Utilities
  formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  }

  truncateMessage(content: string, maxLength: number = 1000): string {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength - 3) + '...';
  }

  highlightKeywords(content: string, keywords: string[]): string {
    if (!keywords.length) return content;

    let highlighted = content;
    keywords.forEach(keyword => {
      const regex = new RegExp(`(${keyword})`, 'gi');
      highlighted = highlighted.replace(regex, '<mark>$1</mark>');
    });

    return highlighted;
  }

  // Private helper methods
  private getMessageClassName(message: Message, config: RenderConfig): string {
    const baseClasses = ['message'];

    if (message.role === 'user') baseClasses.push('message-user');
    else if (message.role === 'assistant') baseClasses.push('message-assistant');
    else baseClasses.push('message-system');

    if (config.enableAnimations) baseClasses.push('message-animated');
    if (config.theme === 'dark') baseClasses.push('message-dark');

    return baseClasses.join(' ');
  }

  private renderMessageContent(message: Message, config: RenderConfig): React.ReactElement {
    const content = config.maxMessageLength
      ? this.truncateMessage(message.content, config.maxMessageLength)
      : message.content;

    return React.createElement(
      'div',
      { className: 'message-content' },
      React.createElement(
        'div',
        {
          className: 'message-text',
          dangerouslySetInnerHTML: { __html: content },
        }
      ),
      message.metadata && this.renderMessageMetadata(message.metadata)
    );
  }

  private renderMessageMetadata(metadata: any): React.ReactElement | null {
    if (!metadata || Object.keys(metadata).length === 0) {
      return null;
    }

    const metadataEntries = Object.entries(metadata).map(([key, value]) =>
      React.createElement(
        'div',
        { key, className: 'metadata-item' },
        React.createElement('span', { className: 'metadata-key' }, `${key}:`),
        React.createElement('span', { className: 'metadata-value' }, String(value))
      )
    );

    return React.createElement(
      'div',
      { className: 'message-metadata' },
      ...metadataEntries
    );
  }

  private renderTimestamp(timestamp: number): React.ReactElement {
    return React.createElement(
      'div',
      { className: 'message-timestamp' },
      this.formatTimestamp(timestamp)
    );
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseMessageRendererResult {
  renderer: MessageRenderer;
  components: {
    Message: (props: { message: Message; config?: RenderConfig }) => React.ReactElement;
    MessageList: (props: { messages: Message[]; config?: RenderConfig }) => React.ReactElement;
    TypingIndicator: (props: TypingIndicatorData) => React.ReactElement;
    Suggestions: (props: {
      suggestions: SuggestionData[];
      onSelect?: (suggestion: SuggestionData) => void;
    }) => React.ReactElement;
    ErrorMessage: (props: { error: string; onRetry?: () => void }) => React.ReactElement;
    LoadingState: (props: { message?: string }) => React.ReactElement;
  };
  utilities: {
    formatTimestamp: (timestamp: number) => string;
    truncateMessage: (content: string, maxLength?: number) => string;
    highlightKeywords: (content: string, keywords: string[]) => string;
  };
}

/**
 * useMessageRenderer Hook
 *
 * React hook interface for MessageRenderer engine
 * Provides reactive UI component rendering
 */
export const useMessageRenderer = (
  config: RenderConfig = {}
): UseMessageRendererResult => {
  const renderer = useMemo(() => new MessageRendererImpl(), []);
  const mergedConfig = useMemo(() => ({ ...renderer['defaultConfig'], ...config }), [config]);

  // Memoized component functions
  const components = {
    Message: useCallback(
      ({ message, config: componentConfig }: { message: Message; config?: RenderConfig }) =>
        renderer.renderMessage(message, { ...mergedConfig, ...componentConfig }),
      [renderer, mergedConfig]
    ),

    MessageList: useCallback(
      ({ messages, config: componentConfig }: { messages: Message[]; config?: RenderConfig }) =>
        renderer.renderMessageList(messages, { ...mergedConfig, ...componentConfig }),
      [renderer, mergedConfig]
    ),

    TypingIndicator: useCallback(
      (data: TypingIndicatorData) => renderer.renderTypingIndicator(data),
      [renderer]
    ),

    Suggestions: useCallback(
      ({ suggestions, onSelect }: {
        suggestions: SuggestionData[];
        onSelect?: (suggestion: SuggestionData) => void;
      }) => renderer.renderSuggestions(suggestions, onSelect),
      [renderer]
    ),

    ErrorMessage: useCallback(
      ({ error, onRetry }: { error: string; onRetry?: () => void }) =>
        renderer.renderErrorMessage(error, onRetry),
      [renderer]
    ),

    LoadingState: useCallback(
      ({ message }: { message?: string }) => renderer.renderLoadingState(message),
      [renderer]
    ),
  };

  const utilities = {
    formatTimestamp: useCallback((timestamp: number) => renderer.formatTimestamp(timestamp), [renderer]),
    truncateMessage: useCallback(
      (content: string, maxLength?: number) => renderer.truncateMessage(content, maxLength),
      [renderer]
    ),
    highlightKeywords: useCallback(
      (content: string, keywords: string[]) => renderer.highlightKeywords(content, keywords),
      [renderer]
    ),
  };

  return {
    renderer,
    components,
    utilities,
  };
};
