import { chatLogger } from '../../utils/logger';

interface StreamEvent {
  type: 'message_start' | 'message_chunk' | 'message_complete' | 'report_update' | 'error';
  content?: string;
  html?: string;
  progress?: number;
  metadata?: any;
  session_id?: string;
}

export class StreamingChatService {
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_BACKEND_URL || 
                   'https://api.upswitch.biz';
  }

  async *streamConversation(
    sessionId: string,
    userInput: string,
    userId?: string,
    abortSignal?: AbortSignal
  ): AsyncGenerator<StreamEvent> {
    try {
      chatLogger.info('Starting streaming conversation', { 
        sessionId, 
        userInput: userInput.substring(0, 50) + '...', 
        userId,
        baseURL: this.baseURL 
      });
      
      const requestBody = {
        session_id: sessionId,
        user_input: userInput,
        user_id: userId
      };
      
      chatLogger.debug('SSE request details', { 
        url: `${this.baseURL}/api/v1/intelligent-conversation/stream`,
        body: requestBody 
      });
      
      const response = await fetch(`${this.baseURL}/api/v1/intelligent-conversation/stream`, {
        method: 'POST',
        credentials: 'include', // Send cookies automatically for auth
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: abortSignal // CRITICAL FIX: Support abort signal for cleanup
      });

      chatLogger.info('SSE response received', { 
        status: response.status, 
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        chatLogger.error('SSE request failed', { status: response.status, errorText });
        throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        // CRITICAL FIX: Check if aborted before reading
        if (abortSignal?.aborted) {
          chatLogger.info('SSE stream aborted', { sessionId });
          reader.cancel();
          break;
        }
        
        const { done, value } = await reader.read();
        if (done) {
          chatLogger.info('SSE stream completed - reader done');
          break;
        }

        const chunk = decoder.decode(value, { stream: true });
        chatLogger.debug('SSE chunk received', { chunkLength: chunk.length, chunk: chunk.substring(0, 200) + '...' });
        
        buffer += chunk;
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        chatLogger.debug('SSE lines to process', { lineCount: lines.length, lines: lines.map(l => l.substring(0, 100)) });

        for (const line of lines) {
          chatLogger.debug('SSE LINE:', { line, lineLength: line.length, startsWithData: line.startsWith('data: '), startsWithComment: line.startsWith(': ') });
          
          // Handle SSE comment lines (keepalive pings)
          if (line.startsWith(': ')) {
            chatLogger.debug('SSE keepalive ping received', { line });
            continue;
          }
          
          // Handle data lines
          if (line.startsWith('data: ') && line.trim().length > 6) {
            const jsonStr = line.slice(6).trim();
            chatLogger.debug('SSE DATA:', { jsonStr, jsonLength: jsonStr.length });
            
            if (jsonStr) {
              try {
                const data = JSON.parse(jsonStr);
                chatLogger.info('SSE event parsed successfully', { type: data.type, hasContent: !!data.content, contentLength: data.content?.length });
                
                // Handle error events
                if (data.type === 'error') {
                  chatLogger.error('SSE Error received', { message: data.message, sessionId: data.session_id });
                  yield data;
                  return; // Stop processing on error
                }
                
                // Handle ping events (ignore)
                if (data.type === 'ping') {
                  chatLogger.debug('SSE ping received', { sessionId: data.session_id });
                  continue;
                }
                
                chatLogger.info('Yielding SSE event', { type: data.type, content: data.content?.substring(0, 50) + '...' });
                yield data;
              } catch (parseError) {
                chatLogger.error('Failed to parse SSE data', { line, jsonStr, parseError: parseError instanceof Error ? parseError.message : String(parseError) });
                // Skip malformed chunks - they'll be completed in next iteration
                continue;
              }
            } else {
              chatLogger.debug('Empty SSE data line, skipping');
            }
          } else {
            chatLogger.debug('SSE line not data or comment, skipping', { line: line.substring(0, 50) });
          }
        }
      }
    } catch (error) {
      // CRITICAL FIX: Don't yield error if aborted (expected behavior)
      if (error instanceof Error && error.name === 'AbortError') {
        chatLogger.info('SSE stream aborted (expected)', { sessionId });
        return;
      }
      // Yield error event instead of throwing for other errors
      yield {
        type: 'error',
        content: error instanceof Error ? error.message : 'Connection failed'
      };
      return;
    }
  }

  /**
   * Alternative EventSource-based streaming (fallback method)
   * Uses standard EventSource API instead of async generator
   */
  streamConversationEventSource(
    sessionId: string,
    userInput: string,
    userId?: string,
    onEvent?: (event: StreamEvent) => void,
    onError?: (error: Error) => void,
    onComplete?: () => void
  ): EventSource {
    const url = `${this.baseURL}/api/v1/intelligent-conversation/stream`;
    
    chatLogger.info('Starting EventSource streaming', { 
      sessionId, 
      userInput: userInput.substring(0, 50) + '...', 
      userId,
      url 
    });
    
    // Create EventSource with POST data (using a different approach)
    const eventSource = new EventSource(`${url}?session_id=${sessionId}&user_input=${encodeURIComponent(userInput)}&user_id=${userId || ''}`);
    
    eventSource.onopen = () => {
      chatLogger.info('EventSource connection opened', { sessionId });
    };
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        chatLogger.info('EventSource message received', { 
          type: data.type, 
          hasContent: !!data.content,
          contentLength: data.content?.length 
        });
        
        if (onEvent) {
          onEvent(data);
        }
      } catch (parseError) {
        chatLogger.error('Failed to parse EventSource data', { 
          data: event.data, 
          parseError: parseError instanceof Error ? parseError.message : 'Unknown error' 
        });
        
        if (onError) {
          onError(new Error(`Parse error: ${parseError}`));
        }
      }
    };
    
    eventSource.onerror = (error) => {
      chatLogger.error('EventSource error', { 
        error: error,
        sessionId,
        readyState: eventSource.readyState 
      });
      
      if (onError) {
        onError(new Error(`EventSource error: ${error}`));
      }
    };
    
    // Auto-close after 30 seconds to prevent hanging
    setTimeout(() => {
      if (eventSource.readyState !== EventSource.CLOSED) {
        chatLogger.info('EventSource auto-closing after timeout', { sessionId });
        eventSource.close();
        if (onComplete) {
          onComplete();
        }
      }
    }, 30000);
    
    return eventSource;
  }
}

export const streamingChatService = new StreamingChatService();
