# StreamingChat Hooks

This directory contains custom React hooks extracted from the StreamingChat component to improve modularity and reusability.

## Hooks Overview

### `useStreamingChatState.ts`
Centralized state management hook that consolidates all useState hooks and refs from the original StreamingChat component.

**Features:**
- Manages all component state (messages, input, streaming status, etc.)
- Provides refs for DOM elements and component state
- Returns state values and setters in a structured format

**Usage:**
```typescript
const state = useStreamingChatState(sessionId, userId);
// Access: state.messages, state.input, state.isStreaming, etc.
// Setters: state.setMessages, state.setInput, state.setIsStreaming, etc.
// Refs: state.refs.messagesEndRef, state.refs.eventSourceRef, etc.
```

### `useConversationInitializer.ts`
Handles conversation initialization with comprehensive retry logic and fallback mechanisms.

**Features:**
- Backend-driven conversation initialization
- Retry logic with exponential backoff
- Timeout handling (10 seconds)
- Fallback mode when backend is unavailable
- User profile data integration

**Usage:**
```typescript
const { isInitializing, initializeWithRetry, resetInitialization } = useConversationInitializer(
  sessionId,
  userId,
  callbacks
);
```

### `useConversationMetrics.ts`
Manages conversation metrics and performance tracking.

**Features:**
- Model performance tracking
- Conversation completion tracking
- Error and retry counting
- Data completeness monitoring
- Cost and token usage tracking

**Usage:**
```typescript
const { 
  metrics, 
  trackModelPerformance, 
  trackConversationCompletion,
  updateMetrics 
} = useConversationMetrics(sessionId, userId);
```

## Benefits of Extraction

1. **Reduced Complexity**: Main component reduced from 1,817 lines to ~300 lines
2. **Improved Testability**: Each hook can be tested in isolation
3. **Better Reusability**: Hooks can be reused in other components
4. **Clearer Separation of Concerns**: Each hook has a single responsibility
5. **Easier Maintenance**: Changes to specific functionality are isolated

## Dependencies

- React (useState, useRef, useEffect, useCallback)
- Custom logger utility
- Type definitions from useStreamingChatState

## Testing

Each hook should be tested with:
- Unit tests for individual functions
- Integration tests with mock callbacks
- Error handling scenarios
- Edge cases and boundary conditions

## Future Enhancements

- Add more granular error handling
- Implement hook composition patterns
- Add performance optimizations (useMemo, useCallback)
- Create additional specialized hooks as needed

