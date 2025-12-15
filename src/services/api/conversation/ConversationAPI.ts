/**
 * Conversation API
 * 
 * Handles conversation history persistence and retrieval
 */

import { HttpClient } from '../HttpClient'
import { apiLogger } from '../../../utils/logger'
import type { Message } from '../../../types/message'
import type { InternalAxiosRequestConfig } from 'axios'

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

export class ConversationAPI extends HttpClient {
  /**
   * Save a conversation message to the database
   * Non-blocking - errors are logged but don't fail the conversation flow
   */
  async saveMessage(data: SaveMessageRequest): Promise<void> {
    try {
      await this.executeRequest<void>({
        method: 'POST',
        url: '/api/conversation/messages',
        data,
      } as InternalAxiosRequestConfig)
    } catch (error) {
      // Log but don't throw - message persistence shouldn't block conversation
      apiLogger.warn('Failed to persist message to database', {
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
    return this.executeRequest<ConversationHistoryResponse>({
      method: 'GET',
      url: `/api/conversation/history/${reportId}`,
    } as InternalAxiosRequestConfig)
  }
}

// Export singleton instance
export const conversationAPI = new ConversationAPI()

