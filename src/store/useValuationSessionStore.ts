import { create } from 'zustand'
import { backendAPI } from '../services/BackendAPI'
import type { ValuationRequest, ValuationSession } from '../types/valuation'
import { storeLogger } from '../utils/logger'
import { useValuationSyncStore } from './useValuationSyncStore'

interface ValuationSessionStore {
  // Session state
  session: ValuationSession | null

  // Actions
  initializeSession: (
    reportId: string,
    currentView?: 'manual' | 'conversational',
    prefilledQuery?: string | null
  ) => Promise<void>
  loadSession: (reportId: string) => Promise<void>
  updateSessionData: (data: Partial<ValuationRequest>) => Promise<void>
  switchView: (
    view: 'manual' | 'conversational',
    resetData?: boolean,
    skipConfirmation?: boolean
  ) => Promise<{ needsConfirmation?: boolean } | void>
  getSessionData: () => ValuationRequest | null
  clearSession: () => void

  // Sync methods delegate to useValuationSyncStore
  syncFromManualForm: () => Promise<void>
  syncToManualForm: () => void
  getCompleteness: () => number

  // Session operation state (loading, updating, switching views)
  isSyncing: boolean
  syncError: string | null

  // Flow switch confirmation
  pendingFlowSwitch: 'manual' | 'conversational' | null
  setPendingFlowSwitch: (view: 'manual' | 'conversational' | null) => void
}

export const useValuationSessionStore = create<ValuationSessionStore>((set, get) => {
  // Throttling for session updates
  let lastUpdateTime = 0
  let pendingUpdate: NodeJS.Timeout | null = null
  const UPDATE_THROTTLE_MS = 2000 // Minimum 2 seconds between updates

  return {
    // Initial state
    session: null,
    // Session operation state (separate from sync store's sync state)
    isSyncing: false,
    syncError: null,
    pendingFlowSwitch: null,

    /**
     * Initialize a new session or load existing one
     */
    initializeSession: async (
      reportId: string,
      currentView: 'manual' | 'conversational' = 'manual',
      prefilledQuery?: string | null
    ) => {
      try {
        storeLogger.info('Initializing valuation session', {
          reportId,
          currentView,
          hasPrefilledQuery: !!prefilledQuery,
        })

        // Check if we already have a session for this reportId - if so, don't override it
        const { session: existingLocalSession } = get()
        if (existingLocalSession?.reportId === reportId && existingLocalSession.currentView) {
          storeLogger.info('Session already exists locally, skipping initialization', {
            reportId,
            existingView: existingLocalSession.currentView,
            requestedView: currentView,
          })
          // Only update prefilledQuery if provided and not already set
          if (prefilledQuery && existingLocalSession.partialData) {
            const updatedPartialData = { ...existingLocalSession.partialData } as any
            if (!updatedPartialData._prefilledQuery) {
              updatedPartialData._prefilledQuery = prefilledQuery
              set({
                session: {
                  ...existingLocalSession,
                  partialData: updatedPartialData,
                },
              })
            }
          }
          return // Don't re-initialize if session already exists
        }

        // Try to load existing session from backend
        const existingSession = await backendAPI.getValuationSession(reportId)

        if (existingSession) {
          // Load existing session - use backend's currentView, not the parameter
          // This prevents overriding a view that was just switched
          const updatedPartialData = { ...existingSession.partialData } as any
          if (prefilledQuery && !updatedPartialData._prefilledQuery) {
            updatedPartialData._prefilledQuery = prefilledQuery
          }

          set({
            session: {
              ...existingSession,
              partialData: updatedPartialData,
              createdAt: new Date(existingSession.createdAt),
              updatedAt: new Date(existingSession.updatedAt),
              completedAt: existingSession.completedAt
                ? new Date(existingSession.completedAt)
                : undefined,
            },
          })
          storeLogger.info('Loaded existing session', {
            reportId,
            currentView: existingSession.currentView,
          })
        } else {
          // Create new session
          const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
          const newSession: ValuationSession = {
            sessionId,
            reportId,
            currentView,
            dataSource: currentView,
            createdAt: new Date(),
            updatedAt: new Date(),
            partialData: prefilledQuery ? ({ _prefilledQuery: prefilledQuery } as any) : {},
            sessionData: {},
          }

          // Save to backend
          await backendAPI.createValuationSession(newSession)

          set({
            session: newSession,
            // Note: Sync state is managed by useValuationSyncStore
          })

          storeLogger.info('Created new session', {
            reportId,
            sessionId,
            currentView,
            hasPrefilledQuery: !!prefilledQuery,
          })
        }
      } catch (error) {
        storeLogger.error('Failed to initialize session', {
          error: error instanceof Error ? error.message : 'Unknown error',
          reportId,
        })

        // Create local session even if backend fails (offline mode)
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
        const newSession: ValuationSession = {
          sessionId,
          reportId,
          currentView,
          dataSource: currentView,
          createdAt: new Date(),
          updatedAt: new Date(),
          partialData: {},
          sessionData: {},
        }

        set({
          session: newSession,
          // Note: Sync state is managed by useValuationSyncStore
        })

        storeLogger.warn('Created local session (backend sync failed)', { reportId, sessionId })
      }
    },

    /**
     * Load session from backend
     */
    loadSession: async (reportId: string) => {
      try {
        set({ isSyncing: true, syncError: null })

        const session = await backendAPI.getValuationSession(reportId)

        if (session) {
          set({
            session: {
              ...session,
              createdAt: new Date(session.createdAt),
              updatedAt: new Date(session.updatedAt),
              completedAt: session.completedAt ? new Date(session.completedAt) : undefined,
            },
            // Note: Sync state is managed by useValuationSyncStore
          })
          storeLogger.info('Session loaded', { reportId })
        } else {
          // Note: Sync state is managed by useValuationSyncStore
        }
      } catch (error) {
        storeLogger.error('Failed to load session', {
          error: error instanceof Error ? error.message : 'Unknown error',
          reportId,
        })
        // Note: Sync state is managed by useValuationSyncStore
      }
    },

    /**
     * Update session data (merge partial data with deep merging for nested objects)
     * Throttled to prevent excessive API calls
     */
    updateSessionData: async (data: Partial<ValuationRequest>) => {
      const { session } = get()

      if (!session) {
        storeLogger.warn('Cannot update session data: no active session')
        return
      }

      // Throttle updates - if called too soon, queue the update
      const now = Date.now()
      const timeSinceLastUpdate = now - lastUpdateTime

      if (timeSinceLastUpdate < UPDATE_THROTTLE_MS) {
        // Clear any pending update
        if (pendingUpdate) {
          clearTimeout(pendingUpdate)
        }

        // Queue this update
        return new Promise<void>((resolve) => {
          pendingUpdate = setTimeout(async () => {
            lastUpdateTime = Date.now()
            pendingUpdate = null
            await get().updateSessionData(data)
            resolve()
          }, UPDATE_THROTTLE_MS - timeSinceLastUpdate)
        })
      }

      // Update immediately
      lastUpdateTime = now

      try {
        // Note: Sync state is managed by useValuationSyncStore

        // Deep merge function for nested objects
        const deepMerge = (target: any, source: any) => {
          const output = { ...target }

          for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
              output[key] = deepMerge(target[key] || {}, source[key])
            } else {
              output[key] = source[key]
            }
          }

          return output
        }

        // Deep merge new data into partialData
        const updatedPartialData = deepMerge(session.partialData, data)

        // Deep merge into sessionData (complete data)
        const updatedSessionData = deepMerge(session.sessionData || {}, data)

        // Determine data source
        let dataSource: 'manual' | 'conversational' | 'mixed' = session.dataSource
        if (session.dataSource !== session.currentView) {
          dataSource = 'mixed'
        }

        const updatedSession: ValuationSession = {
          ...session,
          partialData: updatedPartialData,
          sessionData: updatedSessionData,
          dataSource,
          updatedAt: new Date(),
        }

        // Calculate completeness
        const tempSession = { ...session, sessionData: updatedSessionData }
        set({ session: tempSession })
        const completeness = get().getCompleteness()
        updatedSession.completeness = completeness

        // Update backend
        await backendAPI.updateValuationSession(session.reportId, {
          partialData: updatedPartialData,
          sessionData: updatedSessionData,
          dataSource,
          currentView: session.currentView,
        })

        set({
          session: updatedSession,
          isSyncing: false,
          syncError: null,
        })

        storeLogger.debug('Session data updated', {
          reportId: session.reportId,
          fieldsUpdated: Object.keys(data),
          completeness,
        })
      } catch (error) {
        storeLogger.error('Failed to update session data', {
          error: error instanceof Error ? error.message : 'Unknown error',
          reportId: session.reportId,
        })

        // Deep merge function for fallback
        const deepMerge = (
          target: Record<string, unknown>,
          source: Record<string, unknown>
        ): Record<string, unknown> => {
          const output = { ...target }

          for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
              output[key] = deepMerge(target[key] || {}, source[key])
            } else {
              output[key] = source[key]
            }
          }

          return output
        }

        // Update local state even if backend fails
        const updatedPartialData = deepMerge(session.partialData, data)
        const updatedSessionData = deepMerge(session.sessionData || {}, data)
        let dataSource: 'manual' | 'conversational' | 'mixed' = session.dataSource
        if (session.dataSource !== session.currentView) {
          dataSource = 'mixed'
        }

        // Calculate completeness
        const tempSession = { ...session, sessionData: updatedSessionData }
        set({ session: tempSession })
        const completeness = get().getCompleteness()

        set({
          session: {
            ...session,
            partialData: updatedPartialData,
            sessionData: updatedSessionData,
            dataSource,
            updatedAt: new Date(),
            completeness,
          },
          // Note: Sync state is managed by useValuationSyncStore
        })
      }
    },

    /**
     * Switch between manual and AI-guided views
     *
     * This function is idempotent and safe to call multiple times.
     * It prevents race conditions by checking current state before updating.
     *
     * @param view - Target view to switch to
     * @param resetData - Whether to reset session data (default: true for user-initiated switches)
     * @param skipConfirmation - Skip confirmation dialog (for programmatic switches)
     * @returns Object with needsConfirmation flag if confirmation is required
     */
    switchView: async (
      view: 'manual' | 'conversational',
      resetData: boolean = true,
      skipConfirmation: boolean = false
    ) => {
      const { session } = get()

      if (!session) {
        storeLogger.warn('Cannot switch view: no active session')
        return
      }

      // Idempotency check: if already in target view, no-op
      if (session.currentView === view) {
        storeLogger.debug('Already in target view', { reportId: session.reportId, view })
        return
      }

      // Check if confirmation is needed (for all user-initiated switches)
      // This check happens BEFORE the atomic lock to avoid setting isSyncing unnecessarily
      if (!skipConfirmation) {
        // Always show confirmation for user-initiated switches
        // This gives users a chance to confirm before switching flows
        storeLogger.info('Flow switch requires confirmation', {
          reportId: session.reportId,
          currentView: session.currentView,
          targetView: view,
          resetData,
        })

        // Set pending switch for modal to access
        set({ pendingFlowSwitch: view })

        // Return early - caller should show confirmation modal
        return { needsConfirmation: true }
      }

      // CRITICAL FIX: Atomic check-and-set to prevent concurrent switches
      // Use Zustand's set callback to atomically check and set isSyncing flag
      // This prevents race conditions where multiple requests pass the check simultaneously
      let lockAcquired = false
      set((state) => {
        if (state.isSyncing) {
          // Another switch is already in progress
          storeLogger.warn('Switch already in progress, ignoring concurrent request', {
            reportId: session.reportId,
            requestedView: view,
          })
          return state // Return unchanged state
        }
        // Atomically acquire the lock
        lockAcquired = true
        return { ...state, isSyncing: true, syncError: null }
      })

      // If we didn't acquire the lock, another request is handling the switch
      if (!lockAcquired) {
        return
      }

      // CRITICAL FIX: Clear valuation results when switching flows
      // This prevents the regeneration modal from appearing incorrectly
      // Results are flow-specific and should not carry over between flows
      try {
        const { useValuationResultsStore } = await import('./useValuationResultsStore')
        useValuationResultsStore.getState().clearResult()
        storeLogger.info('Cleared valuation result on flow switch', {
          from: session.currentView,
          to: view,
        })
      } catch (error) {
        storeLogger.error('Failed to clear result on flow switch', { error })
      }

      // Clear pending switch since we're proceeding
      set({ pendingFlowSwitch: null })

      // Re-check session state after setting syncing flag to prevent race conditions
      const { session: currentSession } = get()
      if (!currentSession || currentSession.reportId !== session.reportId) {
        storeLogger.warn('Session changed during switch, aborting', {
          originalReportId: session.reportId,
        })
        set({ isSyncing: false })
        return
      }

      // Double-check we're not already in the target view (race condition protection)
      if (currentSession.currentView === view) {
        storeLogger.debug('Already in target view (race condition check)', {
          reportId: currentSession.reportId,
          view,
        })
        set({ isSyncing: false })
        return
      }

      // Store original session for potential rollback
      const originalSession = { ...currentSession }

      const updatedSession: ValuationSession = {
        ...currentSession,
        currentView: view,
        updatedAt: new Date(),
      }

      // If resetData is true, keep only _prefilledQuery, discard everything else
      if (resetData) {
        const prefilledQuery = (currentSession.partialData as any)?._prefilledQuery
        updatedSession.partialData = prefilledQuery
          ? ({ _prefilledQuery: prefilledQuery } as any)
          : {}
        updatedSession.sessionData = {}
        updatedSession.dataSource = view // Reset to single source
        storeLogger.info('Resetting session data on flow switch', {
          reportId: currentSession.reportId,
          preservedPrefilledQuery: !!prefilledQuery,
        })
      }

      // OPTIMISTIC UPDATE: Update UI immediately for instant feedback
      set({
        session: updatedSession,
        // Note: Sync state is managed by useValuationSyncStore
      })

      storeLogger.info('View switched optimistically (UI updated immediately)', {
        reportId: currentSession.reportId,
        from: currentSession.currentView,
        to: view,
        resetData,
      })

      // Background sync: Update backend asynchronously (non-blocking)
      // URL will be synced by useEffect in ValuationReport.tsx
      backendAPI
        .switchValuationView(currentSession.reportId, view)
        .then(() => {
          // Backend sync successful - clear syncing flag
          const { session: latestSession } = get()
          if (latestSession?.reportId === currentSession.reportId) {
            // Note: Sync state is managed by useValuationSyncStore
            storeLogger.info('Backend sync completed successfully', {
              reportId: currentSession.reportId,
              view,
            })
          }
        })
        .catch((error) => {
          storeLogger.error('Failed to sync view switch with backend', {
            error: error instanceof Error ? error.message : 'Unknown error',
            reportId: currentSession.reportId,
            requestedView: view,
          })

          // Rollback: Restore original session state on error
          const { session: latestSession } = get()
          if (latestSession?.reportId === currentSession.reportId) {
            set({
              session: originalSession,
              // Note: Sync state is managed by useValuationSyncStore
            })
            storeLogger.warn('Rolled back view switch due to backend error', {
              reportId: currentSession.reportId,
              originalView: originalSession.currentView,
            })
          } else {
            // Session changed, sync state managed by useValuationSyncStore
          }
        })
    },

    /**
     * Get complete session data as ValuationRequest
     * Returns null if session is not initialized or data is incomplete
     */
    getSessionData: () => {
      const { session } = get()

      if (!session || !session.sessionData) {
        return null
      }

      // CRITICAL FIX: Filter out empty/null/zero values before returning
      // Bank-Grade Principle: Reliability - Don't return misleading data
      // WHAT: Removes keys with null/undefined/empty/zero values from sessionData
      // WHY: Prevents frontend from showing welcome messages for non-existent data
      // HOW: Filters out keys where values are null, undefined, empty string, or zero
      // WHEN: When retrieving session data for initialData prop
      const sessionData = session.sessionData as ValuationRequest

      // Helper to check if value is meaningful
      // CRITICAL FIX: EBITDA can be zero or negative, so don't exclude zero for financial fields
      // Bank-Grade Principle: Reliability - Don't filter out valid zero/negative financial values
      // WHAT: Checks if value is meaningful, with special handling for financial fields
      // WHY: EBITDA and other financial metrics can legitimately be zero or negative
      // HOW: Validates value exists and is appropriate type, allows zero for numbers
      // WHEN: When filtering sessionData before returning
      const hasMeaningfulValue = (value: unknown, fieldName?: string): boolean => {
        if (value === null || value === undefined) return false
        if (typeof value === 'string' && value.trim() === '') return false
        // CRITICAL: Don't exclude zero for financial fields where zero is valid (ebitda can be zero/negative)
        // But exclude zero for revenue (business must have revenue) and counts (employee_count, etc.)
        if (typeof value === 'number') {
          // Financial fields where zero IS valid: ebitda (can be zero or negative)
          // Financial fields where zero is NOT meaningful: revenue (business must have revenue)
          // Non-financial fields: employee_count, etc. (zero is not meaningful)
          const fieldsAllowZero = ['ebitda'] // Only EBITDA can legitimately be zero or negative
          if (value === 0 && !fieldsAllowZero.includes(fieldName || '')) {
            return false // Zero revenue/employees/etc. is not meaningful
          }
          // Non-zero numbers or zero for allowed fields are meaningful
          return true
        }
        if (Array.isArray(value) && value.length === 0) return false
        if (typeof value === 'object' && value !== null && Object.keys(value).length === 0)
          return false
        return true
      }

      // Filter out keys with non-meaningful values
      const filteredData: any = {}
      for (const [key, value] of Object.entries(sessionData)) {
        // Special handling for nested objects like current_year_data
        if (key === 'current_year_data' && typeof value === 'object' && value !== null) {
          const nestedFiltered: Record<string, unknown> = {}
          for (const [nestedKey, nestedValue] of Object.entries(value as Record<string, unknown>)) {
            if (hasMeaningfulValue(nestedValue)) {
              nestedFiltered[nestedKey] = nestedValue
            }
          }
          if (Object.keys(nestedFiltered).length > 0) {
            filteredData[key] = nestedFiltered
          }
        } else if (hasMeaningfulValue(value, key)) {
          filteredData[key] = value
        }
      }

      // Only return filtered data if it has at least one meaningful field
      // Return null if all values were filtered out (empty object)
      if (Object.keys(filteredData).length === 0) {
        return null
      }

      // Return sessionData as ValuationRequest (now filtered)
      // Note: This may be partial data, components should validate required fields
      return filteredData as ValuationRequest
    },

    /**
     * Clear session (reset to initial state)
     */
    clearSession: () => {
      set({
        session: null,
        // Note: Sync state is managed by useValuationSyncStore
      })
      storeLogger.info('Session cleared')
    },

    /**
     * Sync data from manual form to session
     * Delegates to useValuationSyncStore
     */
    syncFromManualForm: async () => {
      return useValuationSyncStore.getState().syncFromManualForm()
    },

    /**
     * Sync data from session to manual form
     * Delegates to useValuationSyncStore
     */
    syncToManualForm: () => {
      return useValuationSyncStore.getState().syncToManualForm()
    },

    /**
     * Calculate data completeness percentage (0-100)
     * Delegates to useValuationSyncStore
     */
    getCompleteness: () => {
      return useValuationSyncStore.getState().getCompleteness()
    },

    /**
     * Set pending flow switch (for confirmation modal)
     */
    setPendingFlowSwitch: (view: 'manual' | 'conversational' | null) => {
      set({ pendingFlowSwitch: view })
    },
  }
})
