interface StreamEvent {
  type: 'message_start' | 'message_chunk' | 'message_complete' | 'report_update' | 'error';
  content?: string;
  html?: string;
  progress?: number;
  metadata?: any;
}

export class StreamingChatService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_VALUATION_ENGINE_URL || 
                   'https://upswitch-valuation-engine-production.up.railway.app';
  }

  async *streamConversation(
    sessionId: string,
    userInput: string,
    userId?: string
  ): AsyncGenerator<StreamEvent> {
    try {
      const response = await fetch(`${this.baseURL}/api/v1/intelligent-conversation/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          user_input: userInput,
          user_id: userId
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ') && line.trim().length > 6) {
            try {
              const jsonStr = line.slice(6).trim();
              if (jsonStr) {
                const data = JSON.parse(jsonStr);
                yield data;
              }
            } catch (parseError) {
              chatLogger.warn('Failed to parse SSE data', { line, parseError });
              // Skip malformed chunks - they'll be completed in next iteration
              continue;
            }
          }
        }
      }
    } catch (error) {
      // Yield error event instead of throwing
      yield {
        type: 'error',
        content: error instanceof Error ? error.message : 'Connection failed'
      };
      return;
    }
  }
}

export const streamingChatService = new StreamingChatService();
