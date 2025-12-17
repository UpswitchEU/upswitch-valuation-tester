/**
 * Conversation Metrics Types
 *
 * Types for tracking conversation performance and analytics.
 * Extracted from useStreamingChatState for better organization.
 */

export interface ConversationMetrics {
  session_id: string
  user_id?: string
  started_at: Date
  total_turns: number
  successful: boolean
  ai_response_count: number
  user_message_count: number
  error_count: number
  retry_count: number
  avg_response_time_ms: number
  valuation_generated: boolean
  data_completeness_percent: number
  collected_fields: string[]
  total_tokens_used: number
  estimated_cost_usd: number
  feedback_provided: boolean
}
