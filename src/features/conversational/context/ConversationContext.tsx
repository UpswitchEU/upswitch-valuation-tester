/**
<<<<<<< HEAD
 * Conversation Context
 *
 * React Context for conversational valuation state management.
 * Provides unified state access throughout the conversational valuation feature.
 */

import React, { createContext, useContext, useReducer } from 'react'
import { ConversationContextValue, ConversationProviderProps } from '../types/conversation'
import { conversationReducer, initialConversationState } from './conversationReducer'

// Create the context
const ConversationContext = createContext<ConversationContextValue | undefined>(undefined)
=======
 * Conversation Context - State Management for Conversational Flow
 *
 * Single Responsibility: Manage conversation state (messages, session, valuation results)
 * SOLID Principles: SRP - Only handles conversation state management
 *
 * @module features/conversational/context/ConversationContext
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Message } from '../../../types/message'
import type { ValuationResponse } from '../../../types/valuation'
import { chatLogger } from '../../../utils/logger'

/**
 * Business Profile Data
 */
export interface BusinessProfile {
  company_name?: string
  industry?: string
  business_type?: string
  revenue?: number
  ebitda?: number
  number_of_employees?: number
  [key: string]: unknown
}

/**
 * Conversation State Interface
 */
interface ConversationState {
  // Session management
  sessionId: string
  pythonSessionId: string | null
  isInitialized: boolean
  isRestored: boolean

  // Messages
  messages: Message[]

  // Valuation results
  valuationResult: ValuationResponse | null
  businessProfile: BusinessProfile | null

  // UI state
  isGenerating: boolean
  error: string | null
}

/**
 * Conversation Actions Interface
 */
interface ConversationActions {
  // Session management
  setSessionId: (sessionId: string) => void
  setPythonSessionId: (pythonSessionId: string | null) => void
  setInitialized: (isInitialized: boolean) => void
  setRestored: (isRestored: boolean) => void

  // Messages
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void

  // Valuation results
  setValuationResult: (result: ValuationResponse | null) => void
  setBusinessProfile: (profile: BusinessProfile | null) => void

  // UI state
  setGenerating: (isGenerating: boolean) => void
  setError: (error: string | null) => void
}

/**
 * Conversation Context Type
 */
interface ConversationContextType {
  state: ConversationState
  actions: ConversationActions
}

/**
 * Conversation Context
 */
const ConversationContext = createContext<ConversationContextType | undefined>(undefined)

/**
 * Conversation Provider Props
 */
interface ConversationProviderProps {
  children: React.ReactNode
  initialSessionId: string
}
>>>>>>> refactor-gtm

/**
 * Conversation Provider Component
 *
<<<<<<< HEAD
 * Wraps the conversational valuation feature with unified state management.
 * Provides single source of truth for all conversational valuation state.
 */
export const ConversationProvider: React.FC<ConversationProviderProps> = ({
  children,
  initialState = {},
}) => {
  // Initialize state with any provided initial values
  const [state, dispatch] = useReducer(conversationReducer, {
    ...initialConversationState,
    ...initialState,
  })

  const contextValue: ConversationContextValue = {
    state,
    dispatch,
  }

  return (
    <ConversationContext.Provider value={contextValue}>{children}</ConversationContext.Provider>
=======
 * Provides conversation state and actions to child components.
 */
export const ConversationProvider: React.FC<ConversationProviderProps> = ({
  children,
  initialSessionId,
}) => {
  // Session management state
  const [sessionId, setSessionId] = useState<string>(initialSessionId)
  const [pythonSessionId, setPythonSessionId] = useState<string | null>(null)
  const [isInitialized, setInitialized] = useState<boolean>(false)
  const [isRestored, setRestored] = useState<boolean>(false)

  // Update sessionId when initialSessionId prop changes (reportId change)
  useEffect(() => {
    if (initialSessionId !== sessionId) {
      chatLogger.info('ConversationProvider: Session ID changed, resetting state', {
        previousSessionId: sessionId,
        newSessionId: initialSessionId,
      })
      setSessionId(initialSessionId)
      setPythonSessionId(null)
      setInitialized(false)
      setRestored(false)
      setMessages([])
      setValuationResult(null)
      setBusinessProfile(null)
      setGenerating(false)
      setError(null)
    }
  }, [initialSessionId, sessionId])

  // Messages state
  const [messages, setMessages] = useState<Message[]>([])

  // Valuation results state
  const [valuationResult, setValuationResult] = useState<ValuationResponse | null>(null)
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null)

  // UI state
  const [isGenerating, setGenerating] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Actions
  const actions: ConversationActions = {
    setSessionId: useCallback((newSessionId: string) => {
      chatLogger.debug('ConversationContext: Setting session ID', { sessionId: newSessionId })
      setSessionId(newSessionId)
    }, []),

    setPythonSessionId: useCallback((newPythonSessionId: string | null) => {
      chatLogger.debug('ConversationContext: Setting Python session ID', {
        pythonSessionId: newPythonSessionId,
      })
      setPythonSessionId(newPythonSessionId)
    }, []),

    setInitialized: useCallback((initialized: boolean) => {
      chatLogger.debug('ConversationContext: Setting initialized', { initialized })
      setInitialized(initialized)
    }, []),

    setRestored: useCallback((restored: boolean) => {
      chatLogger.debug('ConversationContext: Setting restored', { restored })
      setRestored(restored)
    }, []),

    setMessages: useCallback((newMessages: Message[]) => {
      chatLogger.debug('ConversationContext: Setting messages', {
        count: newMessages.length,
      })
      setMessages(newMessages)
    }, []),

    addMessage: useCallback(
      (message: Message) => {
        chatLogger.debug('ConversationContext: Adding message', {
          messageId: message.id,
          type: message.type,
        })
        setMessages((prev) => [...prev, message])
      },
      []
    ),

    setValuationResult: useCallback((result: ValuationResponse | null) => {
      chatLogger.info('ConversationContext: Setting valuation result', {
        valuationId: result?.valuation_id,
        hasHtmlReport: !!result?.html_report,
      })
      setValuationResult(result)
    }, []),

    setBusinessProfile: useCallback((profile: BusinessProfile | null) => {
      chatLogger.debug('ConversationContext: Setting business profile', {
        companyName: profile?.company_name,
      })
      setBusinessProfile(profile)
    }, []),

    setGenerating: useCallback((generating: boolean) => {
      chatLogger.debug('ConversationContext: Setting generating', { generating })
      setGenerating(generating)
    }, []),

    setError: useCallback((errorMessage: string | null) => {
      if (errorMessage) {
        chatLogger.error('ConversationContext: Setting error', { error: errorMessage })
      }
      setError(errorMessage)
    }, []),
  }

  // State object
  const state: ConversationState = {
    sessionId,
    pythonSessionId,
    isInitialized,
    isRestored,
    messages,
    valuationResult,
    businessProfile,
    isGenerating,
    error,
  }

  return (
    <ConversationContext.Provider value={{ state, actions }}>
      {children}
    </ConversationContext.Provider>
>>>>>>> refactor-gtm
  )
}

/**
<<<<<<< HEAD
 * Hook to access conversation context
 *
 * Must be used within ConversationProvider.
 * Provides access to unified conversational valuation state.
 */
export function useConversationContext(): ConversationContextValue {
  const context = useContext(ConversationContext)

  if (context === undefined) {
    throw new Error('useConversationContext must be used within a ConversationProvider')
  }

  return context
}

/**
 * Hook for conversation state (convenience wrapper)
 *
 * Returns just the state portion of the context.
 */
export function useConversationState() {
  const { state } = useConversationContext()
  return state
}

/**
 * Hook for conversation dispatch (convenience wrapper)
 *
 * Returns just the dispatch function of the context.
 */
export function useConversationDispatch() {
  const { dispatch } = useConversationContext()
  return dispatch
}

// Re-export the actions hook for convenience
export { useConversationActions } from '../hooks/useConversationActions'
=======
 * Hook to access conversation state
 */
export const useConversationState = (): ConversationState => {
  const context = useContext(ConversationContext)
  if (!context) {
    throw new Error('useConversationState must be used within ConversationProvider')
  }
  return context.state
}

/**
 * Hook to access conversation actions
 */
export const useConversationActions = (): ConversationActions => {
  const context = useContext(ConversationContext)
  if (!context) {
    throw new Error('useConversationActions must be used within ConversationProvider')
  }
  return context.actions
}

/**
 * Hook to access full conversation context
 */
export const useConversationContext = (): ConversationContextType => {
  const context = useContext(ConversationContext)
  if (!context) {
    throw new Error('useConversationContext must be used within ConversationProvider')
  }
  return context
}
>>>>>>> refactor-gtm
