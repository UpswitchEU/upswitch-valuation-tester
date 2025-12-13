/**
 * Conversational Valuation Types
 *
 * Type definitions for conversational valuation state management.
 * Following DIP principles with clear interfaces.
 */

import { Message } from '../../../hooks/useStreamingChatState'
import { ValuationResponse } from '../../../types/valuation'

// Core state interface
export interface ConversationState {
  // Session
  sessionId: string
  pythonSessionId: string | null
  isRestored: boolean

  // Conversation
  messages: Message[]
  isLoading: boolean
  isInitialized: boolean
  error: string | null

  // Valuation
  valuationResult: ValuationResponse | null
  isGenerating: boolean

  // Business Profile
  businessProfile: any | null // TODO: Define proper type
  profileLoading: boolean

  // UI State
  activeTab: 'preview' | 'source' | 'info'
  isFullScreen: boolean
  showRegenerationWarning: boolean
  pendingValuationResult: ValuationResponse | null
}

// Action types for the reducer
export type ConversationAction =
  // Session actions
  | { type: 'SET_SESSION_ID'; payload: string }
  | { type: 'SET_PYTHON_SESSION_ID'; payload: string | null }
  | { type: 'SET_RESTORED'; payload: boolean }

  // Conversation actions
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_INITIALIZED'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_MESSAGES'; payload: Message[] }
  | { type: 'CLEAR_MESSAGES' }

  // Valuation actions
  | { type: 'SET_VALUATION_RESULT'; payload: ValuationResponse | null }
  | { type: 'SET_GENERATING'; payload: boolean }

  // Business profile actions
  | { type: 'SET_BUSINESS_PROFILE'; payload: any }
  | { type: 'SET_PROFILE_LOADING'; payload: boolean }

  // UI actions
  | { type: 'SET_ACTIVE_TAB'; payload: 'preview' | 'source' | 'info' }
  | { type: 'SET_FULLSCREEN'; payload: boolean }
  | { type: 'SET_REGENERATION_WARNING'; payload: boolean }
  | { type: 'SET_PENDING_RESULT'; payload: ValuationResponse | null }

  // Reset
  | { type: 'RESET_STATE' }

// Context value interface
export interface ConversationContextValue {
  state: ConversationState
  dispatch: React.Dispatch<ConversationAction>
}

// Provider props
export interface ConversationProviderProps {
  children: React.ReactNode
  initialState?: Partial<ConversationState>
}
