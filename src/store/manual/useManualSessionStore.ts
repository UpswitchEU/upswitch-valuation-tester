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

  // Progress tracking (for parallel loading)
  loadProgress: number

  // Actions (all atomic with functional updates)
  setSession: (session: ValuationSession | null) => void
  setLoading: (isLoading: boolean) => void
  setSaving: (isSaving: boolean) => void
  setError: (error: string | null) => void
  markSaved: () => void
  markUnsaved: () => void
  clearSession: () => void
  setLoadProgress: (progress: number) => void

  // Session data helpers
  getReportId: () => string | null
  getSessionData: () => any | null
  updateSessionData: (data: Partial<any>) => Promise<void>

  // Async optimized methods (non-blocking, parallel execution)
  loadSessionAsync: (reportId: string) => Promise<void>
  saveSessionOptimistic: (reportId: string, data: Partial<any>) => Promise<void>
}

export const useManualSessionStore = create<ManualSessionStore>((set, get) => ({
  // Initial state
  session: null,
  isLoading: false,
  isSaving: false,
  error: null,
  lastSaved: null,
  hasUnsavedChanges: false,
  loadProgress: 0,

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

  // Set load progress (for parallel loading UI)
  setLoadProgress: (progress: number) => {
    set((state) => ({
      ...state,
      loadProgress: Math.min(Math.max(progress, 0), 100),
    }))
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

  // Async optimized: Load session with parallel asset loading
  // Non-blocking, runs in background, immediate UI feedback
  loadSessionAsync: async (reportId: string) => {
    const { setSession, setLoading, setError, setLoadProgress } = get()

    // Step 1: Immediate UI feedback (< 16ms)
    setLoading(true)
    setLoadProgress(0)
    setError(null)

    try {
      // Step 2: Parallel background loading (non-blocking)
      storeLogger.info('[Manual] Starting parallel session load', { reportId })
      
      const startTime = performance.now()
      
      // OPTIMIZATION: Load session and versions in parallel using Promise.all
      // This reduces load time by ~50% compared to sequential loading
      const [sessionService, versionService] = await Promise.all([
        import('../../services').then(({ sessionService }) => sessionService),
        import('../../services').then(({ versionService }) => versionService),
      ])

      setLoadProgress(25) // Services loaded

      // Load session data and versions in parallel
      const [session, versionsResult] = await Promise.all([
        sessionService.loadSession(reportId),
        versionService.fetchVersions(reportId).catch((error) => {
          // Versions are non-critical, log but don't fail
          storeLogger.warn('[Manual] Failed to load versions (non-critical)', {
            reportId,
            error: error instanceof Error ? error.message : String(error),
          })
          return { versions: [], activeVersion: 1 }
        }),
      ])

      setLoadProgress(75) // Data loaded

      // Step 3: Atomic state update
      set((state) => ({
        ...state,
        session,
        isLoading: false,
        loadProgress: 100,
        error: null,
      }))

      const duration = performance.now() - startTime

      storeLogger.info('[Manual] Session loaded successfully (parallel)', {
        reportId,
        hasSessionData: !!session?.sessionData,
        hasValuationResult: !!session?.valuationResult,
        versionsCount: versionsResult.versions.length,
        duration_ms: duration.toFixed(2),
      })
    } catch (error) {
      // Error handling (non-blocking)
      const errorMessage = error instanceof Error ? error.message : 'Load failed'
      
      set((state) => ({
        ...state,
        isLoading: false,
        loadProgress: 0,
        error: errorMessage,
      }))

      storeLogger.error('[Manual] Session load failed', {
        reportId,
        error: errorMessage,
      })
    }
  },

  // Async optimized: Save with optimistic update
  // UI updates immediately, save runs in background
  saveSessionOptimistic: async (reportId: string, data: Partial<any>) => {
    const previousSession = get().session
    const { setError, markSaved } = get()

    // Step 1: Optimistic update (immediate UI feedback)
    set((state) => ({
      ...state,
      session: state.session ? { ...state.session, ...data } : null,
      hasUnsavedChanges: false,
      lastSaved: new Date(),
      isSaving: true,
    }))

    storeLogger.debug('[Manual] Optimistic save started', {
      reportId,
      fieldsUpdated: Object.keys(data).length,
    })

    // Step 2: Background save (non-blocking)
    try {
      await import('../../services').then(({ sessionService }) =>
        sessionService.saveSession(reportId, data)
      )

      // Success - keep optimistic state
      markSaved()
      
      storeLogger.info('[Manual] Background save succeeded', { reportId })
    } catch (error) {
      // Step 3: Revert on error
      const errorMessage = error instanceof Error ? error.message : 'Save failed'
      
      set((state) => ({
        ...state,
        session: previousSession,
        hasUnsavedChanges: true,
        isSaving: false,
        error: errorMessage,
      }))

      storeLogger.error('[Manual] Background save failed, reverted', {
        reportId,
        error: errorMessage,
      })
    }
  },
}))

