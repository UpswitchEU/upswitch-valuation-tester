# Chat Utilities

This directory contains utility classes that handle chat-related operations.

## Current Architecture

**Note**: Message management is now handled by the Zustand store (`useConversationStore`). See `apps/upswitch-valuation-tester/src/store/useConversationStore.ts` for the current implementation.

### Key Principles

- **Single Source of Truth**: Zustand store manages all message state
- **Atomic Updates**: Zustand ensures race-condition-free updates
- **Linear Flow**: Simple, predictable message operations
- **Performance**: Optimized selectors and shallow comparisons

### Message Operations (via useConversationStore)

All message operations are now handled through the Zustand store:

```typescript
import { useConversationStore } from '../../store/useConversationStore'

// Get store actions
const { addMessage, updateMessage, appendToMessage, clearMessages } = useConversationStore()

// Add a new message
const messageId = addMessage({
  type: 'user',
  content: 'Hello!',
  isComplete: true
})

// Append content to streaming message
appendToMessage(messageId, 'New content')

// Update message
updateMessage(messageId, {
  isComplete: true,
  isStreaming: false
})

// Clear all messages
clearMessages()
```

### Migration from MessageManager

The previous `MessageManager` class has been removed in favor of the Zustand store for the following reasons:

1. **Race Condition Prevention**: Zustand provides atomic state updates
2. **Better Performance**: Optimized selectors reduce unnecessary re-renders
3. **Simpler Architecture**: Single source of truth eliminates confusion
4. **Built-in Features**: Message pruning, streaming message tracking, etc.

### Message ID Generation

Messages are assigned unique IDs using the format:
```
msg_{timestamp}_{randomString}
```

Example: `msg_1703123456789_abc123def`

### Message Pruning

The store automatically prunes messages when the conversation exceeds 100 messages:
- Keeps first 10 messages (initial context)
- Keeps most recent 50 messages
- Prevents unbounded memory growth

### Streaming Message Tracking

The store explicitly tracks the current streaming message ID (`currentStreamingMessageId`), preventing race conditions when chunks arrive rapidly.

### Error Handling

All operations include comprehensive error handling:
- Null/undefined validation
- Empty content skipping
- Message not found warnings
- Graceful degradation

### Logging

All operations are logged with:
- Operation type and parameters
- Message IDs for tracking
- Success/failure status
- Performance metrics

### Type Safety

All methods are fully typed with:
- Message interface definitions
- Generic type parameters
- Return type annotations
- Parameter validation

### Testing

The store should be tested with:
- Message creation scenarios
- Streaming update scenarios
- Race condition scenarios
- Error conditions
- Edge cases (empty arrays, invalid IDs)
- Performance under load

### Future Enhancements

- Message persistence
- Message search functionality
- Message threading
- Message reactions
- Message encryption
- Message compression

### Dependencies

- Zustand for state management
- Custom logger utility
- Type definitions from `types/message.ts`

### Integration

The store integrates seamlessly with:
- React components via hooks
- Streaming event handlers (`StreamEventHandler`)
- Typing animations
- Auto-scroll functionality
- Message rendering components (`MessagesList`, `MessageItem`)
