/**
 * Message Utilities
 * 
 * Reusable utilities for message validation, creation, and manipulation.
 * Extracted from StreamingChat to improve maintainability and testability.
 */

export interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
  isComplete?: boolean;
  metadata?: any;
}

/**
 * Type guard to ensure message is valid
 */
export const isValidMessage = (msg: any): msg is Message => {
  return msg !== null && 
         msg !== undefined && 
         typeof msg === 'object' &&
         'id' in msg &&
         'type' in msg &&
         'content' in msg;
};

/**
 * Create a new message with proper defaults
 */
export const createMessage = (
  type: 'user' | 'ai' | 'system',
  content: string,
  metadata?: any
): Message => ({
  id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  content,
  timestamp: new Date(),
  isComplete: true,
  isStreaming: false,
  metadata
});

/**
 * Create a streaming message (incomplete)
 */
export const createStreamingMessage = (
  type: 'user' | 'ai' | 'system',
  content: string = '',
  metadata?: any
): Message => ({
  id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  type,
  content,
  timestamp: new Date(),
  isComplete: false,
  isStreaming: true,
  metadata
});

/**
 * Complete a streaming message
 */
export const completeMessage = (message: Message): Message => ({
  ...message,
  isComplete: true,
  isStreaming: false
});

/**
 * Update message content (for streaming)
 */
export const updateMessageContent = (message: Message, content: string): Message => ({
  ...message,
  content
});

/**
 * Filter valid messages from an array
 */
export const filterValidMessages = (messages: any[]): Message[] => {
  return messages.filter(isValidMessage);
};

/**
 * Create welcome message with AI branding
 */
export const createWelcomeMessage = (aiConfig?: any): Message => {
  const expertTitle = aiConfig?.branding?.expertTitle?.toLowerCase() || 'ai valuation expert';
  const levelIndicator = aiConfig?.branding?.levelIndicator?.toLowerCase() || 'big 4 level';
  
  return createMessage(
    'ai',
    `Hello! I'm your ${expertTitle} with ${levelIndicator} expertise. I'll help you get a professional business valuation through our intelligent conversation. What's the name of your business?`,
    {
      reasoning: "Starting with company identification to establish context for valuation",
      help_text: "Please provide your company's legal name as it appears on official documents"
    }
  );
};
