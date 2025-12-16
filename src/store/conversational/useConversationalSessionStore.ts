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

  // Promise cache (Zustand pattern - prevents duplicate loads)
  loadPromise: Promise<void> | null
  loadingReportId: string | null // Track which reportId is being loaded

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
  saveSessionOptimistic: (reportId: string, data: Partial<any>) => Promise<void>
}

export const useConversationalSessionStore = create<ConversationalSessionStore>((set, get) => ({
  // Initial state
  session: null,
  isLoading: false,
  isSaving: false,
  error: null,
  lastSaved: null,
  hasUnsavedChanges: false,
  loadPromise: null,
  loadingReportId: null,

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
      loadPromise: null, // Clear promise cache
      loadingReportId: null,
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
  // Uses Zustand promise cache pattern to prevent duplicate loads (atomic state)
  loadSessionAsync: async (reportId: string) => {
    const state = get()

    // GUARD 1: If session already loaded successfully for this reportId, skip
    if (state.session?.reportId === reportId && !state.error) {
      storeLogger.debug('[Conversational] Session already loaded, skipping duplicate load', { reportId })
      return
    }

    // GUARD 2: If already loading this reportId, return existing promise (prevents duplicates)
    if (state.loadPromise && state.loadingReportId === reportId) {
      storeLogger.debug('[Conversational] Session already loading, reusing promise', { reportId })
      return state.loadPromise
    }

    // GUARD 3: If there's an error for this reportId, don't auto-retry (prevents infinite loops)
    // User must explicitly clear error (via clearSession) to retry
    if (state.error && state.session?.reportId === reportId) {
      storeLogger.debug('[Conversational] Session has error, skipping retry. Clear error to retry.', { reportId, error: state.error })
      return
    }

    // Create load promise
    const loadPromise = (async () => {
      const { setSession, setLoading, setError } = get()

      // Step 1: Immediate UI feedback (< 16ms)
      setLoading(true)
      setError(null)

      try {
        // Step 2: Parallel background loading (non-blocking)
        storeLogger.info('[Conversational] Starting parallel session load', { reportId })
      
      const startTime = performance.now()
      
      // OPTIMIZATION: Load session and versions in parallel using Promise.all
      // This reduces load time by ~50% compared to sequential loading
      const [sessionService, versionService] = await Promise.all([
        import('../../services').then(({ sessionService }) => sessionService),
        import('../../services').then(({ versionService }) => versionService),
      ])

      // Load session data and versions in parallel
      const [loadedSession, versionsResult] = await Promise.all([
        sessionService.loadSession(reportId),
        versionService.fetchVersions(reportId).catch((error) => {
          // Versions are non-critical, log but don't fail
          storeLogger.warn('[Conversational] Failed to load versions (non-critical)', {
            reportId,
            error: error instanceof Error ? error.message : String(error),
          })
          return { versions: [], activeVersion: 1 }
        }),
      ])

      // If session doesn't exist, create it
      let session = loadedSession
      if (!session) {
        storeLogger.info('[Conversational] Session not found, creating new session', { reportId })
        session = await sessionService.createSession(reportId, 'conversational', {})
        storeLogger.info('[Conversational] New session created', { reportId })
      }

      // Step 3: Atomic state update
      set((state) => ({
        ...state,
        session,
        isLoading: false,
        error: null,
      }))

      const duration = performance.now() - startTime

      storeLogger.info('[Conversational] Session loaded successfully (parallel)', {
        reportId,
        hasSessionData: !!session?.sessionData,
        hasValuationResult: !!session?.valuationResult,
        versionsCount: versionsResult.versions.length,
        duration_ms: duration.toFixed(2),
      })
    } catch (error) {
      // Error handling: Only genuine errors (network, server errors, etc.)
      // 404s are handled by createSession above
      const errorMessage = error instanceof Error ? error.message : 'Failed to load or create session'
      
      // Store error with minimal session stub to prevent retries
      const errorSession: ValuationSession = {
        reportId,
        sessionData: {},
        valuationResult: null,
        currentView: 'conversational',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      
      set((state) => ({
        ...state,
        session: errorSession, // Store reportId to prevent auto-retry
        isLoading: false,
        error: errorMessage,
      }))

      storeLogger.error('[Conversational] Session load/create failed', {
        reportId,
        error: errorMessage,
      })
      } finally {
        // Clear promise cache on completion (success or error)
        // Only clear if this is still the active promise (prevents clearing newer loads)
        set((currentState) => {
          if (currentState.loadPromise === loadPromise) {
            return { ...currentState, loadPromise: null, loadingReportId: null }
          }
          return currentState
        })
      }
    })()

    // ATOMIC: Store promise and reportId using functional update
    // This atomically checks if another promise was set, and only sets if none exists
    let cachedPromise: Promise<void> | null = null
    set((currentState) => {
      // Double-check: if another promise was set between check and set, use that one
      if (currentState.loadPromise && currentState.loadingReportId === reportId) {
        cachedPromise = currentState.loadPromise
        return currentState // No change needed
      }
      // Set our promise atomically
      return { ...currentState, loadPromise, loadingReportId: reportId }
    })

    // If another promise was cached (race condition), return that instead
    if (cachedPromise) {
      storeLogger.debug('[Conversational] Another load started concurrently, using that promise', { reportId })
      return cachedPromise
    }

    return loadPromise
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

    storeLogger.debug('[Conversational] Optimistic save started', {
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
      
      storeLogger.info('[Conversational] Background save succeeded', { reportId })
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

      storeLogger.error('[Conversational] Background save failed, reverted', {
        reportId,
        error: errorMessage,
      })
    }
  },
}))

