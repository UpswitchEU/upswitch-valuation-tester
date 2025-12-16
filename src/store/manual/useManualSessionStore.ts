/**
 * Manual Flow - Session Store
 *
 * Manages session state for the manual valuation flow.
 * Isolated from conversational flow to prevent race conditions.
 *
 * Key Features:
 * - Atomic functional updates (no race conditions)
 * - Session load/save/update operations
 * - Cache integration via SessionService
 * - Save status tracking (for M&A workflow trust indicators)
 *
 * @module store/manual/useManualSessionStore
 */

import { create } from 'zustand'
import type { ValuationSession, ValuationFormData } from '../../types/valuation'
import { storeLogger } from '../../utils/logger'

interface ManualSessionStore {
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
  updateSessionData: (data: Partial<any>) => Promise<void>
}

export const useManualSessionStore = create<ManualSessionStore>((set, get) => ({
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
        storeLogger.info('[Manual] Session set', {
          reportId: session.reportId,
          currentView: session.currentView,
          hasSessionData: !!session.sessionData,
        })
      } else {
        storeLogger.debug('[Manual] Session cleared')
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
        storeLogger.error('[Manual] Session error', {
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

    storeLogger.debug('[Manual] Session marked as saved')
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

    storeLogger.info('[Manual] Session cleared')
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

  // Update session data (for form sync compatibility)
  // Note: This is a lightweight update that doesn't persist to backend immediately
  // Full persistence happens through SessionService when saving
  updateSessionData: async (data: Partial<any>) => {
    set((state) => {
      if (!state.session) {
        storeLogger.warn('[Manual] Cannot update session data: no active session')
        return state
      }

      const updatedSession = {
        ...state.session,
        sessionData: {
          ...state.session.sessionData,
          ...data,
        },
      }

      storeLogger.debug('[Manual] Session data updated (in-memory)', {
        reportId: state.session.reportId,
        fieldsUpdated: Object.keys(data).length,
      })

      return {
        ...state,
        session: updatedSession,
        hasUnsavedChanges: true,
      }
    })
  },
}))

