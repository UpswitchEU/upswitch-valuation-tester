/**
 * Conversation Reducer
 *
 * Pure reducer function for conversational valuation state management.
 * Implements single source of truth following clean architecture principles.
 */

import { ConversationState, ConversationAction } from '../types/conversation'

// Initial state
export const initialConversationState: ConversationState = {
  // Session
  sessionId: '',
  pythonSessionId: null,
  isRestored: false,

  // Conversation
  messages: [],
  isLoading: false,
  isInitialized: false,
  error: null,

  // Valuation
  valuationResult: null,
  isGenerating: false,

  // Business Profile
  businessProfile: null,
  profileLoading: false,

  // UI State
  activeTab: 'preview',
  isFullScreen: false,
  showRegenerationWarning: false,
  pendingValuationResult: null,
}

/**
 * Pure reducer function for conversation state management
 * Handles all state transitions in a predictable, testable way
 */
export function conversationReducer(
  state: ConversationState,
  action: ConversationAction
): ConversationState {
  switch (action.type) {
    // Session actions
    case 'SET_SESSION_ID':
      return { ...state, sessionId: action.payload }

    case 'SET_PYTHON_SESSION_ID':
      return { ...state, pythonSessionId: action.payload }

    case 'SET_RESTORED':
      return { ...state, isRestored: action.payload }

    // Conversation actions
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }

    case 'SET_INITIALIZED':
      return { ...state, isInitialized: action.payload }

    case 'SET_ERROR':
      return { ...state, error: action.payload }

    case 'ADD_MESSAGE':
      return { ...state, messages: [...state.messages, action.payload] }

    case 'SET_MESSAGES':
      return { ...state, messages: action.payload }

    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] }

    // Valuation actions
    case 'SET_VALUATION_RESULT':
      return { ...state, valuationResult: action.payload }

    case 'SET_GENERATING':
      return { ...state, isGenerating: action.payload }

    // Business profile actions
    case 'SET_BUSINESS_PROFILE':
      return { ...state, businessProfile: action.payload }

    case 'SET_PROFILE_LOADING':
      return { ...state, profileLoading: action.payload }

    // UI actions
    case 'SET_ACTIVE_TAB':
      return { ...state, activeTab: action.payload }

    case 'SET_FULLSCREEN':
      return { ...state, isFullScreen: action.payload }

    case 'SET_REGENERATION_WARNING':
      return { ...state, showRegenerationWarning: action.payload }

    case 'SET_PENDING_RESULT':
      return { ...state, pendingValuationResult: action.payload }

    // Reset
    case 'RESET_STATE':
      return { ...initialConversationState }

    default:
      return state
  }
}
