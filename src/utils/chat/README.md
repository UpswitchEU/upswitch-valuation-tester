# Chat Utilities

This directory contains utility classes that handle chat-related operations extracted from the StreamingChat component.

## Utilities Overview

### `MessageManager.ts`
Centralized message management utility that handles all message CRUD operations for the streaming chat.

**Features:**
- Message creation with unique ID generation
- Streaming message updates
- Auto-scrolling functionality
- Message filtering and searching
- Message statistics and analytics
- Message cleanup operations

**Core Operations:**
- `addMessage()` - Add new messages to the conversation
- `updateStreamingMessage()` - Update messages during streaming
- `scrollToBottom()` - Auto-scroll to latest message
- `findMessageById()` - Find specific messages
- `getMessagesByType()` - Filter messages by type
- `removeMessage()` - Delete specific messages

**Usage:**
```typescript
const messageManager = new MessageManager();

// Add a new message
const newMessages = messageManager.addMessage(messages, {
  type: 'user',
  content: 'Hello!',
  isComplete: true
});

// Update streaming message
const updatedMessages = messageManager.updateStreamingMessage(
  messages,
  messageId,
  'New content',
  false
);

// Scroll to bottom
messageManager.scrollToBottom(messagesEndRef);
```

## Message Management Features

### Message Creation
- Automatic ID generation with timestamp and random component
- Type-safe message creation
- Metadata support for additional message properties

### Streaming Updates
- Real-time content updates during streaming
- Completion status tracking
- Streaming state management

### Auto-Scrolling
- Smooth scrolling to latest message
- Configurable scroll behavior
- Error handling for missing refs

### Message Filtering
- Filter by message type (user, ai, system, suggestion)
- Find messages by ID
- Get message statistics

### Message Statistics
- Count user messages
- Count AI messages
- Check for streaming messages
- Get incomplete messages

## Message ID Generation

Messages are assigned unique IDs using the format:
```
msg_{timestamp}_{randomString}
```

Example: `msg_1703123456789_abc123def`

## Error Handling

The MessageManager includes comprehensive error handling:
- Null/undefined ref validation
- Empty message array handling
- Invalid message ID detection
- Graceful degradation for missing elements

## Logging

All operations are logged with:
- Operation type and parameters
- Message IDs for tracking
- Success/failure status
- Performance metrics

## Performance Considerations

The MessageManager is optimized for performance:
- Immutable state updates
- Efficient array operations
- Minimal re-renders
- Memory-efficient message storage

## Type Safety

All methods are fully typed with:
- Message interface definitions
- Generic type parameters
- Return type annotations
- Parameter validation

## Testing

The MessageManager should be tested with:
- Message creation scenarios
- Streaming update scenarios
- Error conditions
- Edge cases (empty arrays, invalid IDs)
- Performance under load

## Future Enhancements

- Message persistence
- Message search functionality
- Message threading
- Message reactions
- Message encryption
- Message compression

## Dependencies

- Custom logger utility
- React refs for DOM manipulation
- Type definitions from hooks

## Usage Patterns

### Basic Message Flow
```typescript
// 1. Add user message
const userMessage = messageManager.addMessage(messages, {
  type: 'user',
  content: userInput,
  isComplete: true
});

// 2. Add AI message for streaming
const aiMessage = messageManager.addMessage(messages, {
  type: 'ai',
  content: '',
  isStreaming: true,
  isComplete: false
});

// 3. Update AI message during streaming
const updatedMessages = messageManager.updateStreamingMessage(
  messages,
  aiMessage.id,
  'Streaming content...',
  false
);

// 4. Complete AI message
const finalMessages = messageManager.updateStreamingMessage(
  updatedMessages,
  aiMessage.id,
  'Final content',
  true
);
```

### Message Analytics
```typescript
// Get conversation statistics
const userCount = messageManager.getUserMessageCount(messages);
const aiCount = messageManager.getAIMessageCount(messages);
const hasStreaming = messageManager.hasStreamingMessages(messages);

// Filter messages
const userMessages = messageManager.getMessagesByType(messages, 'user');
const systemMessages = messageManager.getMessagesByType(messages, 'system');
```

## Integration

The MessageManager integrates seamlessly with:
- React state management
- Streaming event handlers
- Typing animations
- Auto-scroll functionality
- Message rendering components

