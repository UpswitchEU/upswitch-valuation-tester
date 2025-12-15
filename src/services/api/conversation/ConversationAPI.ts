/**
 * Conversation API
 * 
 * Handles conversation history persistence and retrieval
 */

import { BaseAPI } from '../BaseAPI'
import type { Message } from '../../../types/message'

export interface SaveMessageRequest {
  reportId: string
  messageId: string
  role: string
  type: string
  content: string
  metadata: Record<string, any>
}

export interface ConversationHistoryResponse {
  exists: boolean
  messages: Message[]
  session_id: string
  source?: 'python' | 'database'
}

export class ConversationAPI extends BaseAPI {
  /**
   * Save a conversation message to the database
   * Non-blocking - errors are logged but don't fail the conversation flow
   */
  async saveMessage(data: SaveMessageRequest): Promise<void> {
    try {
      await this.post('/api/conversation/messages', data)
    } catch (error) {
      // Log but don't throw - message persistence shouldn't block conversation
      console.warn('Failed to persist message to database', {
        messageId: data.messageId,
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  /**
   * Get conversation history for a report
   * Checks Python backend first, falls back to database
   */
  async getHistory(reportId: string): Promise<ConversationHistoryResponse> {
    return this.get<ConversationHistoryResponse>(`/api/conversation/history/${reportId}`)
  }
}

// Export singleton instance
export const conversationAPI = new ConversationAPI()

