/**
 * Conversation Context
 *
 * React Context for conversational valuation state management.
 * Provides unified state access throughout the conversational valuation feature.
 */

import React, { createContext, useContext, useReducer } from 'react';
import { ConversationContextValue, ConversationProviderProps, initialConversationState } from '../types/conversation';
import { conversationReducer } from './conversationReducer';

// Create the context
const ConversationContext = createContext<ConversationContextValue | undefined>(undefined);

/**
 * Conversation Provider Component
 *
 * Wraps the conversational valuation feature with unified state management.
 * Provides single source of truth for all conversational valuation state.
 */
export const ConversationProvider: React.FC<ConversationProviderProps> = ({
  children,
  initialState = {}
}) => {
  // Initialize state with any provided initial values
  const [state, dispatch] = useReducer(conversationReducer, {
    ...initialConversationState,
    ...initialState,
  });

  const contextValue: ConversationContextValue = {
    state,
    dispatch,
  };

  return (
    <ConversationContext.Provider value={contextValue}>
      {children}
    </ConversationContext.Provider>
  );
};

/**
 * Hook to access conversation context
 *
 * Must be used within ConversationProvider.
 * Provides access to unified conversational valuation state.
 */
export function useConversationContext(): ConversationContextValue {
  const context = useContext(ConversationContext);

  if (context === undefined) {
    throw new Error(
      'useConversationContext must be used within a ConversationProvider'
    );
  }

  return context;
}

/**
 * Hook for conversation state (convenience wrapper)
 *
 * Returns just the state portion of the context.
 */
export function useConversationState() {
  const { state } = useConversationContext();
  return state;
}

/**
 * Hook for conversation dispatch (convenience wrapper)
 *
 * Returns just the dispatch function of the context.
 */
export function useConversationDispatch() {
  const { dispatch } = useConversationContext();
  return dispatch;
}
