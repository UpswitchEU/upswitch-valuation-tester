/**
 * Conversational Flow - Session Store
 *
 * Manages session state for the conversational valuation flow.
 * Isolated from manual flow to prevent race conditions.
 *
 * Key Features:
 * - Atomic functional updates (no race conditions)
 * - Session load/save/update operations
 * - Cache integration via SessionService
 * - Save status tracking (for M&A workflow trust indicators)
 *
 * @module store/conversational/useConversationalSessionStore
 */

import { create } from 'zustand'
import type { ValuationSession } from '../../types/valuation'
import { storeLogger } from '../../utils/logger'

interface ConversationalSessionStore {
  // Session state
  session: ValuationSession | null
  isLoading: boolean
  isSaving: boolean
  error: string | null

  // Save status (M&A workflow trust indicators)
  lastSaved: Date | null
  hasUnsavedChanges: boolean

  // Actions (all atomic with functional updates)
  setSession: (session: ValuationSession | null) => void
  setLoading: (isLoading: boolean) => void
  setSaving: (isSaving: boolean) => void
  setError: (error: string | null) => void
  markSaved: () => void
  markUnsaved: () => void
  clearSession: () => void

  // Session data helpers
  getReportId: () => string | null
  getSessionData: () => any | null
  
  // Async optimized methods (non-blocking, parallel execution)
  loadSessionAsync: (reportId: string) => Promise<void>
  saveSession: (reportId: string, data: Partial<any>) => Promise<void>
}

export const useConversationalSessionStore = create<ConversationalSessionStore>((set, get) => ({
  // Initial state
  session: null,
  isLoading: false,
  isSaving: false,
  error: null,
  lastSaved: null,
  hasUnsavedChanges: false,

  // Set session (atomic)
  setSession: (session: ValuationSession | null) => {
    set((state) => {
      if (session) {
        storeLogger.info('[Conversational] Session set', {
          reportId: session.reportId,
          currentView: session.currentView,
          hasSessionData: !!session.sessionData,
        })
      } else {
        storeLogger.debug('[Conversational] Session cleared')
      }

      return {
        ...state,
        session,
        error: null,
      }
    })
  },

  // Set loading state (atomic)
  setLoading: (isLoading: boolean) => {
    set((state) => ({
      ...state,
      isLoading,
    }))
  },

  // Set saving state (atomic)
  setSaving: (isSaving: boolean) => {
    set((state) => ({
      ...state,
      isSaving,
    }))
  },

  // Set error (atomic)
  setError: (error: string | null) => {
    set((state) => {
      if (error) {
        storeLogger.error('[Conversational] Session error', {
          error,
          reportId: state.session?.reportId,
        })
      }

      return {
        ...state,
        error,
      }
    })
  },

  // Mark session as saved (atomic)
  markSaved: () => {
    set((state) => ({
      ...state,
      hasUnsavedChanges: false,
      lastSaved: new Date(),
      isSaving: false,
      error: null,
    }))

    storeLogger.debug('[Conversational] Session marked as saved')
  },

  // Mark session as having unsaved changes (atomic)
  markUnsaved: () => {
    set((state) => ({
      ...state,
      hasUnsavedChanges: true,
    }))
  },

  // Clear session (atomic)
  clearSession: () => {
    set((state) => ({
      ...state,
      session: null,
      isLoading: false,
      isSaving: false,
      error: null,
      lastSaved: null,
      hasUnsavedChanges: false,
    }))

    storeLogger.info('[Conversational] Session cleared')
  },

  // Get report ID (helper)
  getReportId: () => {
    const { session } = get()
    return session?.reportId || null
  },

  // Get session data (helper)
  getSessionData: () => {
    const { session } = get()
    return session?.sessionData || null
  },

  // Async optimized: Load session with parallel asset loading
  // Non-blocking, runs in background, immediate UI feedback
  loadSessionAsync: async (reportId: string) => {
    const { setSession, setLoading, setError } = get()

    // Step 1: Immediate UI feedback (< 16ms)
    setLoading(true)
    setError(null)

    try {
      // Step 2: Background loading (non-blocking)
      storeLogger.info('[Conversational] Starting session load', { reportId })
      
      const session = await import('../../services').then(({ sessionService }) =>
        sessionService.loadSession(reportId)
      )

      // Step 3: Atomic state update
      set((state) => ({
        ...state,
        session,
        isLoading: false,
        error: null,
      }))

      storeLogger.info('[Conversational] Session loaded successfully', {
        reportId,
        hasSessionData: !!session.sessionData,
        hasValuationResult: !!session.valuationResult,
      })
    } catch (error) {
      // Error handling (non-blocking)
      const errorMessage = error instanceof Error ? error.message : 'Load failed'
      
      set((state) => ({
        ...state,
        isLoading: false,
        error: errorMessage,
      }))

      storeLogger.error('[Conversational] Session load failed', {
        reportId,
        error: errorMessage,
      })
    }
  },

  // Save session (for compatibility)
  saveSession: async (reportId: string, data: Partial<any>) => {
    const { setSaving, markSaved, setError } = get()

    // Step 1: Mark as saving
    setSaving(true)

    try {
      await import('../../services').then(({ sessionService }) =>
        sessionService.saveSession(reportId, data)
      )

      // Success
      markSaved()
      
      storeLogger.info('[Conversational] Session saved successfully', { reportId })
    } catch (error) {
      // Error handling
      const errorMessage = error instanceof Error ? error.message : 'Save failed'
      
      set((state) => ({
        ...state,
        isSaving: false,
        error: errorMessage,
      }))

      storeLogger.error('[Conversational] Session save failed', {
        reportId,
        error: errorMessage,
      })
    }
  },
}))

