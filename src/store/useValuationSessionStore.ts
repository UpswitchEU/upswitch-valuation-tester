import { create } from 'zustand';
import { backendAPI } from '../services/backendApi';
import type { ValuationFormData, ValuationRequest, ValuationSession } from '../types/valuation';
import { sessionCircuitBreaker } from '../utils/circuitBreaker';
import { createCorrelationId, CorrelationPrefixes } from '../utils/correlationId';
import { extractErrorMessage, is409Conflict } from '../utils/errorDetection';
import { storeLogger } from '../utils/logger';
import { globalSessionMetrics } from '../utils/metrics/sessionMetrics';
import { globalPerformanceMonitor, performanceThresholds } from '../utils/performanceMonitor';
import { globalRequestDeduplicator } from '../utils/requestDeduplication';
import { retrySessionOperation } from '../utils/retryWithBackoff';
import { globalAuditTrail } from '../utils/sessionAuditTrail';
import { globalSessionCache } from '../utils/sessionCacheManager';
import { createFallbackSession, createOrLoadSession } from '../utils/sessionErrorHandlers';
import { mergePrefilledQuery, normalizeSessionDates } from '../utils/sessionHelpers';
import { validateSessionData } from '../utils/sessionValidation';

export interface ValuationSessionStore {
  // Session state
  session: ValuationSession | null;

  // Actions
  initializeSession: (reportId: string, currentView?: 'manual' | 'conversational', prefilledQuery?: string | null) => Promise<void>;
  loadSession: (reportId: string) => Promise<void>;
  updateSessionData: (data: Partial<ValuationRequest>) => Promise<void>;
  switchView: (view: 'manual' | 'conversational', resetData?: boolean, skipConfirmation?: boolean) => Promise<{ needsConfirmation?: boolean } | void>;
  getSessionData: () => ValuationRequest | null;
  clearSession: () => void;

  // Sync methods for cross-flow data sharing
  syncFromManualForm: () => Promise<void>;
  syncToManualForm: () => void;
  getCompleteness: () => number;

  // Sync state
  isSyncing: boolean;
  syncError: string | null;

  // Save status (for M&A workflow - trust indicators)
  isSaving: boolean;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;

  // Flow switch confirmation
  pendingFlowSwitch: 'manual' | 'conversational' | null;
  setPendingFlowSwitch: (view: 'manual' | 'conversational' | null) => void;
}

export const useValuationSessionStore = create<ValuationSessionStore>((set, get) => {
  // Throttling for session updates
  let lastUpdateTime = 0;
  let pendingUpdate: NodeJS.Timeout | null = null;
  const UPDATE_THROTTLE_MS = 2000; // Minimum 2 seconds between updates

  return {
    // Initial state
    session: null,
    isSyncing: false,
    syncError: null,
    pendingFlowSwitch: null,

    // Save status (M&A workflow trust indicators)
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,

    /**
     * Initialize a new session or load existing one
     */
  initializeSession: async (reportId: string, currentView: 'manual' | 'conversational' = 'manual', prefilledQuery?: string | null) => {
      try {
      storeLogger.info('Initializing valuation session', { reportId, currentView, hasPrefilledQuery: !!prefilledQuery });

        // Check if we already have a session for this reportId - if so, don't override it
      const { session: existingLocalSession } = get();
        if (existingLocalSession?.reportId === reportId && existingLocalSession.currentView) {
          storeLogger.info('Session already exists locally, skipping initialization', {
            reportId,
            existingView: existingLocalSession.currentView,
          requestedView: currentView 
        });
          // Only update prefilledQuery if provided and not already set
          if (prefilledQuery && existingLocalSession.partialData) {
          const updatedPartialData = { ...existingLocalSession.partialData } as any;
            if (!updatedPartialData._prefilledQuery) {
            updatedPartialData._prefilledQuery = prefilledQuery;
              set({
                session: {
                  ...existingLocalSession,
                  partialData: updatedPartialData,
                },
            });
          }
        }
        return; // Don't re-initialize if session already exists
        }

        // Try to load existing session from backend
      const existingSessionResponse = await backendAPI.getValuationSession(reportId);

      if (existingSessionResponse?.session) {
        const existingSession = existingSessionResponse.session;
          // Load existing session - use backend's currentView, not the parameter
          // This prevents overriding a view that was just switched
        const updatedPartialData = mergePrefilledQuery(existingSession.partialData, prefilledQuery);

          set({
            session: normalizeSessionDates({
              ...existingSession,
              partialData: updatedPartialData,
            }),
            syncError: null,
        });
        storeLogger.info('Loaded existing session', { reportId, currentView: existingSession.currentView });
        } else {
          // Create new session using helper (handles 409 conflicts automatically)
          const newSession = await createOrLoadSession(reportId, currentView, prefilledQuery);
          set({
            session: newSession,
            syncError: null,
          });
        }
    } catch (error: any) {
        storeLogger.error('Failed to initialize session', {
          error: extractErrorMessage(error),
          reportId,
      });

        // Create fallback local session if not a 409 conflict
        if (!is409Conflict(error)) {
          const fallbackSession = createFallbackSession(reportId, currentView, prefilledQuery, error);
          set({
            session: fallbackSession,
            syncError: extractErrorMessage(error),
          });
        } else {
          // 409 conflict but couldn't load - this shouldn't happen, but log it
          storeLogger.error('Session conflict but failed to load existing session', { 
            reportId, 
            error: extractErrorMessage(error) 
          });
        }
      }
    },

    /**
     * Load session from backend
     * 
     * ENHANCED with fail-proof features for M&A workflow robustness:
     * - Request deduplication (prevents concurrent loads)
     * - Exponential backoff retry (recovers from network glitches)
     * - Circuit breaker (fast-fail when backend down)
     * - localStorage cache (offline resilience)
     * - Performance monitoring (<500ms target)
     * - Audit trail (compliance)
     * - Session validation (prevents corrupted data crashes)
     * 
     * CRITICAL: This ensures users NEVER lose access to existing reports
     * Even with network issues, rate limits, or backend hiccups
     */
    loadSession: async (reportId: string) => {
      const correlationId = createCorrelationId(CorrelationPrefixes.SESSION_LOAD);
      const startTime = performance.now();

      try {
        set({ isSyncing: true, syncError: null });

        // Deduplicate concurrent load requests (prevents double-load)
        const session = await globalRequestDeduplicator.deduplicate(
          `session-load-${reportId}`,
          async () => {
            // Monitor performance (<500ms target)
            return await globalPerformanceMonitor.measure(
              'session-load',
              async () => {
                // Retry with exponential backoff (handles transient failures)
                return await retrySessionOperation(
                  async () => {
                    // Circuit breaker protection (fast-fail when backend down)
                    return await sessionCircuitBreaker.execute(async () => {
                      const sessionResponse = await backendAPI.getValuationSession(reportId);

                      if (!sessionResponse?.session) {
                        // Try cache as fallback before throwing
                        storeLogger.info('Session not found on backend, checking cache', {
                          reportId,
                          correlationId,
                        });

                        const cachedSession = globalSessionCache.get(reportId);
                        if (cachedSession) {
                          storeLogger.info('Session loaded from cache', {
                            reportId,
                            correlationId,
                          });
                          return cachedSession;
                        }

                        throw new Error('Session not found');
                      }

                      // Validate session data (prevents corrupted data crashes)
                      validateSessionData(sessionResponse.session);

                      // Normalize dates
                      const normalizedSession = normalizeSessionDates(sessionResponse.session);

                      // Cache for offline resilience
                      globalSessionCache.set(reportId, normalizedSession);

                      return normalizedSession;
                    });
                  },
                  {
                    onRetry: (attempt, error, delay) => {
                      storeLogger.warn('Retrying session load', {
                        reportId,
                        attempt,
                        delay_ms: delay,
                        error: extractErrorMessage(error),
                        correlationId,
                      });

                      // Record retry in metrics
                      globalSessionMetrics.recordOperation(
                        'load',
                        false,
                        performance.now() - startTime,
                        attempt,
                        extractErrorMessage(error)
                      );
                    },
                  }
                );
              },
              performanceThresholds.sessionLoad,
              { reportId, correlationId }
            );
          }
        );

        // Success - update state
        set({
          session,
          isSyncing: false,
          syncError: null,
        });

        // Record success in audit trail
        const duration = performance.now() - startTime;
        globalAuditTrail.log({
          operation: 'LOAD',
          reportId,
          success: true,
          duration_ms: duration,
          correlationId,
          metadata: {
            sessionId: session.sessionId,
            currentView: session.currentView,
          },
        });

        // Record success in metrics
        globalSessionMetrics.recordOperation('load', true, duration);

        storeLogger.info('Session loaded successfully', {
          reportId,
          sessionId: session.sessionId,
          duration_ms: duration.toFixed(2),
          correlationId,
        });
      } catch (error: any) {
        const duration = performance.now() - startTime;

        // Record failure in audit trail
        globalAuditTrail.log({
          operation: 'LOAD',
          reportId,
          success: false,
          duration_ms: duration,
          correlationId,
          error: extractErrorMessage(error),
        });

        // Record failure in metrics
        globalSessionMetrics.recordOperation(
          'load',
          false,
          duration,
          0,
          extractErrorMessage(error)
        );

        storeLogger.error('Failed to load session after retries', {
          error: extractErrorMessage(error),
          reportId,
          duration_ms: duration.toFixed(2),
          correlationId,
        });

        set({
          isSyncing: false,
          syncError: extractErrorMessage(error),
        });

        // Re-throw so caller can handle (ValuationSessionManager will try to create new)
        throw error;
      }
    },

    /**
     * Update session data (merge partial data with deep merging for nested objects)
     * Throttled to prevent excessive API calls
     * Enhanced with save status indicators for M&A workflow trust
     */
    updateSessionData: async (data: Partial<ValuationRequest>) => {
    const { session } = get();

      if (!session) {
      storeLogger.warn('Cannot update session data: no active session');
      return;
    }

      // Mark as having unsaved changes
      set({ hasUnsavedChanges: true });

      // Throttle updates - if called too soon, queue the update
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTime;

      if (timeSinceLastUpdate < UPDATE_THROTTLE_MS) {
        // Clear any pending update
        if (pendingUpdate) {
        clearTimeout(pendingUpdate);
        }

        // Queue this update
        return new Promise<void>((resolve) => {
          pendingUpdate = setTimeout(async () => {
          lastUpdateTime = Date.now();
          pendingUpdate = null;
          await get().updateSessionData(data);
          resolve();
        }, UPDATE_THROTTLE_MS - timeSinceLastUpdate);
      });
      }

      // Update immediately
    lastUpdateTime = now;

      try {
      set({ isSyncing: true, syncError: null });

        // Deep merge function for nested objects
        const deepMerge = (target: any, source: any) => {
        const output = { ...target };

          for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            output[key] = deepMerge(target[key] || {}, source[key]);
            } else {
            output[key] = source[key];
          }
        }
        
        return output;
      };

        // Deep merge new data into partialData
      const updatedPartialData = deepMerge(session.partialData, data);

        // Deep merge into sessionData (complete data)
      const updatedSessionData = deepMerge(session.sessionData || {}, data);

        // Determine data source
      let dataSource: 'manual' | 'conversational' | 'mixed' = session.dataSource;
        if (session.dataSource !== session.currentView) {
        dataSource = 'mixed';
        }

        const updatedSession: ValuationSession = {
          ...session,
          partialData: updatedPartialData,
          sessionData: updatedSessionData,
          dataSource,
          updatedAt: new Date(),
      };

        // Calculate completeness
      const tempSession = { ...session, sessionData: updatedSessionData };
      set({ session: tempSession });
      const completeness = get().getCompleteness();
      updatedSession.completeness = completeness;

        // Update backend
        await backendAPI.updateValuationSession(session.reportId, {
          partialData: updatedPartialData,
          sessionData: updatedSessionData,
          dataSource,
          currentView: session.currentView,
      });

        set({
          session: updatedSession,
          isSyncing: false,
          syncError: null,
      });

        storeLogger.debug('Session data updated', {
          reportId: session.reportId,
          fieldsUpdated: Object.keys(data),
          completeness,
      });
    } catch (error: any) {
        storeLogger.error('Failed to update session data', {
          error: error instanceof Error ? error.message : 'Unknown error',
          reportId: session.reportId,
      });

        // Deep merge function for fallback
      const deepMerge = (target: any, source: any) => {
        const output = { ...target };

          for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            output[key] = deepMerge(target[key] || {}, source[key]);
            } else {
            output[key] = source[key];
          }
        }
        
        return output;
      };

        // Update local state even if backend fails
      const updatedPartialData = deepMerge(session.partialData, data);
      const updatedSessionData = deepMerge(session.sessionData || {}, data);
      let dataSource: 'manual' | 'conversational' | 'mixed' = session.dataSource;
        if (session.dataSource !== session.currentView) {
        dataSource = 'mixed';
        }

        // Calculate completeness
      const tempSession = { ...session, sessionData: updatedSessionData };
      set({ session: tempSession });
      const completeness = get().getCompleteness();

        set({
          session: {
            ...session,
            partialData: updatedPartialData,
            sessionData: updatedSessionData,
            dataSource,
            updatedAt: new Date(),
            completeness,
          },
          isSyncing: false,
          syncError: error.message || 'Failed to sync with backend',
      });
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
  switchView: async (view: 'manual' | 'conversational', resetData: boolean = true, skipConfirmation: boolean = false) => {
    const { session } = get();

      if (!session) {
      storeLogger.warn('Cannot switch view: no active session');
      return;
      }

      // Idempotency check: if already in target view, no-op
      if (session.currentView === view) {
      storeLogger.debug('Already in target view', { reportId: session.reportId, view });
      return;
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
      });

        // Set pending switch for modal to access
      set({ pendingFlowSwitch: view });

        // Return early - caller should show confirmation modal
      return { needsConfirmation: true };
      }

      // CRITICAL FIX: Atomic check-and-set to prevent concurrent switches
      // Use Zustand's set callback to atomically check and set isSyncing flag
      // This prevents race conditions where multiple requests pass the check simultaneously
    let lockAcquired = false;
      set((state) => {
        if (state.isSyncing) {
          // Another switch is already in progress
          storeLogger.warn('Switch already in progress, ignoring concurrent request', {
            reportId: session.reportId,
            requestedView: view,
        });
        return state; // Return unchanged state
        }
        // Atomically acquire the lock
      lockAcquired = true;
      return { ...state, isSyncing: true, syncError: null };
    });

      // If we didn't acquire the lock, another request is handling the switch
      if (!lockAcquired) {
      return;
      }

      // CRITICAL FIX: Clear valuation results when switching flows
      // This prevents the regeneration modal from appearing incorrectly
      // Results are flow-specific and should not carry over between flows
      try {
      const { useValuationResultsStore } = await import('./useValuationResultsStore');
      useValuationResultsStore.getState().clearResult();
        storeLogger.info('Cleared valuation result on flow switch', {
          from: session.currentView,
        to: view
      });
      } catch (error) {
      storeLogger.error('Failed to clear result on flow switch', { error });
      }

      // Clear pending switch since we're proceeding
    set({ pendingFlowSwitch: null });

      // Re-check session state after setting syncing flag to prevent race conditions
    const { session: currentSession } = get();
      if (!currentSession || currentSession.reportId !== session.reportId) {
        storeLogger.warn('Session changed during switch, aborting', {
          originalReportId: session.reportId,
      });
      set({ isSyncing: false });
      return;
      }

      // Double-check we're not already in the target view (race condition protection)
      if (currentSession.currentView === view) {
        storeLogger.debug('Already in target view (race condition check)', {
          reportId: currentSession.reportId,
          view,
      });
      set({ isSyncing: false });
      return;
      }

      // Store original session for potential rollback
    const originalSession = { ...currentSession };

      const updatedSession: ValuationSession = {
        ...currentSession,
        currentView: view,
        updatedAt: new Date(),
    };

      // If resetData is true, keep only _prefilledQuery, discard everything else
      if (resetData) {
      const prefilledQuery = (currentSession.partialData as any)?._prefilledQuery;
      updatedSession.partialData = prefilledQuery ? { _prefilledQuery: prefilledQuery } as any : {};
      updatedSession.sessionData = {};
      updatedSession.dataSource = view; // Reset to single source
        storeLogger.info('Resetting session data on flow switch', {
          reportId: currentSession.reportId,
          preservedPrefilledQuery: !!prefilledQuery,
      });
      }

      // OPTIMISTIC UPDATE: Update UI immediately for instant feedback
      set({
        session: updatedSession,
        isSyncing: true, // Keep syncing flag true during background sync
        syncError: null,
    });

      storeLogger.info('View switched optimistically (UI updated immediately)', {
        reportId: currentSession.reportId,
        from: currentSession.currentView,
        to: view,
        resetData,
    });

      // Background sync: Update backend asynchronously (non-blocking)
      // URL will be synced by useEffect in ValuationReport.tsx
    backendAPI.switchValuationView(currentSession.reportId, view)
        .then(() => {
          // Backend sync successful - clear syncing flag
        const { session: latestSession } = get();
          if (latestSession?.reportId === currentSession.reportId) {
            set({
              isSyncing: false,
              syncError: null,
          });
            storeLogger.info('Backend sync completed successfully', {
              reportId: currentSession.reportId,
              view,
          });
          }
        })
      .catch((error: any) => {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          storeLogger.error('Failed to sync view switch with backend', {
            error: errorMessage,
            reportId: currentSession.reportId,
            requestedView: view,
        });

          // FIX: Don't rollback on switch error - keep optimistic update
          // The user has already switched flows, so rolling back would be confusing
          // Instead, just log the error and clear syncing flag
          // The session will remain in the switched state, and we'll retry on next action
        const { session: latestSession } = get();
          if (latestSession?.reportId === currentSession.reportId) {
            // Keep the switched state, just mark sync as failed
            set({
              isSyncing: false,
              syncError: errorMessage,
          });
            storeLogger.warn('View switch backend sync failed, keeping optimistic update', {
              reportId: currentSession.reportId,
              currentView: latestSession.currentView,
              error: errorMessage,
          });
          } else {
            // Session changed, just clear syncing flag
          set({ isSyncing: false, syncError: errorMessage });
          }
      });
    },

    /**
     * Get complete session data as ValuationRequest
     * Returns null if session is not initialized or data is incomplete
     */
    getSessionData: () => {
    const { session } = get();

      if (!session || !session.sessionData) {
      return null;
      }

      // CRITICAL FIX: Filter out empty/null/zero values before returning
      // Bank-Grade Principle: Reliability - Don't return misleading data
      // WHAT: Removes keys with null/undefined/empty/zero values from sessionData
      // WHY: Prevents frontend from showing welcome messages for non-existent data
      // HOW: Filters out keys where values are null, undefined, empty string, or zero
      // WHEN: When retrieving session data for initialData prop
    const sessionData = session.sessionData as ValuationRequest;

      // Helper to check if value is meaningful
      // CRITICAL FIX: EBITDA can be zero or negative, so don't exclude zero for financial fields
      // Bank-Grade Principle: Reliability - Don't filter out valid zero/negative financial values
      // WHAT: Checks if value is meaningful, with special handling for financial fields
      // WHY: EBITDA and other financial metrics can legitimately be zero or negative
      // HOW: Validates value exists and is appropriate type, allows zero for numbers
      // WHEN: When filtering sessionData before returning
    const hasMeaningfulValue = (value: any, fieldName?: string): boolean => {
      if (value === null || value === undefined) return false;
      if (typeof value === 'string' && value.trim() === '') return false;
        // CRITICAL: Don't exclude zero for financial fields where zero is valid (ebitda can be zero/negative)
        // But exclude zero for revenue (business must have revenue) and counts (employee_count, etc.)
        if (typeof value === 'number') {
          // Financial fields where zero IS valid: ebitda (can be zero or negative)
          // Financial fields where zero is NOT meaningful: revenue (business must have revenue)
          // Non-financial fields: employee_count, etc. (zero is not meaningful)
        const fieldsAllowZero = ['ebitda'];  // Only EBITDA can legitimately be zero or negative
          if (value === 0 && !fieldsAllowZero.includes(fieldName || '')) {
          return false;  // Zero revenue/employees/etc. is not meaningful
          }
          // Non-zero numbers or zero for allowed fields are meaningful
        return true;
        }
      if (Array.isArray(value) && value.length === 0) return false;
      if (typeof value === 'object' && value !== null && Object.keys(value).length === 0) return false;
      return true;
    };

      // Filter out keys with non-meaningful values
    const filteredData: any = {};
      for (const [key, value] of Object.entries(sessionData)) {
        // Special handling for nested objects like current_year_data
        if (key === 'current_year_data' && typeof value === 'object' && value !== null) {
        const nestedFiltered: any = {};
        for (const [nestedKey, nestedValue] of Object.entries(value as any)) {
            if (hasMeaningfulValue(nestedValue)) {
            nestedFiltered[nestedKey] = nestedValue;
            }
          }
          if (Object.keys(nestedFiltered).length > 0) {
          filteredData[key] = nestedFiltered;
          }
        } else if (hasMeaningfulValue(value, key)) {
        filteredData[key] = value;
        }
      }

      // Only return filtered data if it has at least one meaningful field
      // Return null if all values were filtered out (empty object)
      if (Object.keys(filteredData).length === 0) {
      return null;
      }

      // Return sessionData as ValuationRequest (now filtered)
      // Note: This may be partial data, components should validate required fields
    return filteredData as ValuationRequest;
    },

    /**
     * Clear session (reset to initial state)
     */
    clearSession: () => {
      set({
        session: null,
        isSyncing: false,
        syncError: null,
    });
    storeLogger.info('Session cleared');
    },

    /**
     * Sync data from manual form to session
   * Reads current form data from useValuationFormStore and updates session
     */
    syncFromManualForm: async () => {
    const { session } = get();

      if (!session) {
      storeLogger.warn('Cannot sync from manual form: no active session');
      return;
      }

      try {
        // Import dynamically to avoid circular dependency
      const { useValuationFormStore } = await import('./useValuationFormStore');
      const manualFormData = useValuationFormStore.getState().formData;

        storeLogger.debug('Syncing from manual form to session', {
          reportId: session.reportId,
          fieldsPresent: Object.keys(manualFormData).length,
      });

        // Convert form data to ValuationRequest format
        const sessionUpdate: Partial<ValuationRequest> = {
          company_name: manualFormData.company_name,
          country_code: manualFormData.country_code,
          industry: manualFormData.industry,
          business_model: manualFormData.business_model,
          founding_year: manualFormData.founding_year,
          current_year_data: manualFormData.current_year_data,
          historical_years_data: manualFormData.historical_years_data,
          number_of_employees: manualFormData.number_of_employees,
          number_of_owners: manualFormData.number_of_owners,
          recurring_revenue_percentage: manualFormData.recurring_revenue_percentage,
          shares_for_sale: manualFormData.shares_for_sale,
          business_type_id: manualFormData.business_type_id,
          business_context: manualFormData.business_context,
          comparables: manualFormData.comparables,
      };

        // Remove undefined values
      Object.keys(sessionUpdate).forEach(key => {
          if (sessionUpdate[key as keyof typeof sessionUpdate] === undefined) {
          delete sessionUpdate[key as keyof typeof sessionUpdate];
          }
      });

        // Update session with merged data
      await get().updateSessionData(sessionUpdate);

        // Update lastSyncedAt
        set({
          session: {
            ...session,
            lastSyncedAt: new Date(),
          },
      });

        storeLogger.info('Synced from manual form to session', {
          reportId: session.reportId,
          fieldsUpdated: Object.keys(sessionUpdate).length,
      });
    } catch (error: any) {
        storeLogger.error('Failed to sync from manual form', {
          error: error instanceof Error ? error.message : 'Unknown error',
      });
      }
    },

    /**
     * Sync data from session to manual form
   * Writes session data to useValuationFormStore for manual form display
     */
    syncToManualForm: () => {
    const { session } = get();

      if (!session || !session.sessionData) {
      storeLogger.warn('Cannot sync to manual form: no session data');
      return;
      }

      try {
        // Import dynamically to avoid circular dependency
      const { useValuationFormStore } = require('./useValuationFormStore');
      const sessionData = session.sessionData;

        storeLogger.debug('Syncing from session to manual form', {
          reportId: session.reportId,
          fieldsPresent: Object.keys(sessionData).length,
      });

        // Convert session data to form data format
        const formUpdate: Partial<ValuationFormData> = {
          company_name: sessionData.company_name,
          country_code: sessionData.country_code,
          industry: sessionData.industry,
          business_model: sessionData.business_model,
          founding_year: sessionData.founding_year,
          current_year_data: sessionData.current_year_data,
          historical_years_data: sessionData.historical_years_data,
          number_of_employees: sessionData.number_of_employees,
          number_of_owners: sessionData.number_of_owners,
          recurring_revenue_percentage: sessionData.recurring_revenue_percentage,
          shares_for_sale: sessionData.shares_for_sale,
          business_type_id: sessionData.business_type_id,
          business_context: sessionData.business_context,
          comparables: sessionData.comparables,
      };

        // Remove undefined values
      Object.keys(formUpdate).forEach(key => {
          if (formUpdate[key as keyof typeof formUpdate] === undefined) {
          delete formUpdate[key as keyof typeof formUpdate];
          }
      });

        // Update manual form store
      useValuationFormStore.getState().updateFormData(formUpdate);

        storeLogger.info('Synced from session to manual form', {
          reportId: session.reportId,
          fieldsUpdated: Object.keys(formUpdate).length,
      });
    } catch (error: any) {
        storeLogger.error('Failed to sync to manual form', {
          error: error instanceof Error ? error.message : 'Unknown error',
      });
      }
    },

    /**
     * Calculate data completeness percentage (0-100)
     * Based on required fields for valuation
     */
    getCompleteness: () => {
    const { session } = get();

      if (!session || !session.sessionData) {
      return 0;
      }

    const data = session.sessionData;

      // Define required fields with weights
      const requiredFields = [
        { key: 'company_name', weight: 1 },
        { key: 'country_code', weight: 1 },
        { key: 'industry', weight: 1 },
        { key: 'business_model', weight: 1 },
        { key: 'founding_year', weight: 1 },
        { key: 'current_year_data.revenue', weight: 2 },
        { key: 'current_year_data.ebitda', weight: 2 },
    ];

    let completedWeight = 0;
    let totalWeight = 0;

      requiredFields.forEach(({ key, weight }) => {
      totalWeight += weight;

        // Handle nested keys
        if (key.includes('.')) {
        const [parent, child] = key.split('.');
        if (data[parent as keyof typeof data] && 
            (data[parent as keyof typeof data] as any)[child] !== undefined &&
            (data[parent as keyof typeof data] as any)[child] !== null &&
            (data[parent as keyof typeof data] as any)[child] !== '') {
          completedWeight += weight;
          }
        } else {
        if (data[key as keyof typeof data] !== undefined && 
            data[key as keyof typeof data] !== null &&
            data[key as keyof typeof data] !== '') {
          completedWeight += weight;
          }
        }
    });

    const completeness = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;

    return completeness;
    },

    /**
     * Set pending flow switch (for confirmation modal)
     */
    setPendingFlowSwitch: (view: 'manual' | 'conversational' | null) => {
    set({ pendingFlowSwitch: view });
    },
  };
});



