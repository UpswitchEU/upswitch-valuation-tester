import { create } from 'zustand';
import { backendAPI } from '../services/backendApi';
import type { ValuationFormData, ValuationRequest, ValuationSession } from '../types/valuation';
import { storeLogger } from '../utils/logger';

interface ValuationSessionStore {
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
      const existingSession = await backendAPI.getValuationSession(reportId);
      
      if (existingSession) {
        // Load existing session - use backend's currentView, not the parameter
        // This prevents overriding a view that was just switched
        const updatedPartialData = { ...existingSession.partialData } as any;
        if (prefilledQuery && !updatedPartialData._prefilledQuery) {
          updatedPartialData._prefilledQuery = prefilledQuery;
        }
        
        set({
          session: {
            ...existingSession,
            partialData: updatedPartialData,
            createdAt: new Date(existingSession.createdAt),
            updatedAt: new Date(existingSession.updatedAt),
            completedAt: existingSession.completedAt ? new Date(existingSession.completedAt) : undefined,
          },
          syncError: null,
        });
        storeLogger.info('Loaded existing session', { reportId, currentView: existingSession.currentView });
      } else {
        // Create new session
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
        const newSession: ValuationSession = {
          sessionId,
          reportId,
          currentView,
          dataSource: currentView,
          createdAt: new Date(),
          updatedAt: new Date(),
          partialData: prefilledQuery ? { _prefilledQuery: prefilledQuery } as any : {},
          sessionData: {},
        };
        
        // Save to backend
        await backendAPI.createValuationSession(newSession);
        
        set({
          session: newSession,
          syncError: null,
        });
        
        storeLogger.info('Created new session', { reportId, sessionId, currentView, hasPrefilledQuery: !!prefilledQuery });
      }
    } catch (error: any) {
      storeLogger.error('Failed to initialize session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        reportId,
      });
      
      // Create local session even if backend fails (offline mode)
      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      const newSession: ValuationSession = {
        sessionId,
        reportId,
        currentView,
        dataSource: currentView,
        createdAt: new Date(),
        updatedAt: new Date(),
        partialData: {},
        sessionData: {},
      };
      
      set({
        session: newSession,
        syncError: error.message || 'Failed to sync with backend',
      });
      
      storeLogger.warn('Created local session (backend sync failed)', { reportId, sessionId });
    }
  },
  
  /**
   * Load session from backend
   */
  loadSession: async (reportId: string) => {
    try {
      set({ isSyncing: true, syncError: null });
      
      const session = await backendAPI.getValuationSession(reportId);
      
      if (session) {
        set({
          session: {
            ...session,
            createdAt: new Date(session.createdAt),
            updatedAt: new Date(session.updatedAt),
            completedAt: session.completedAt ? new Date(session.completedAt) : undefined,
          },
          isSyncing: false,
          syncError: null,
        });
        storeLogger.info('Session loaded', { reportId });
      } else {
        set({ isSyncing: false, syncError: 'Session not found' });
      }
    } catch (error: any) {
      storeLogger.error('Failed to load session', {
        error: error instanceof Error ? error.message : 'Unknown error',
        reportId,
      });
      set({
        isSyncing: false,
        syncError: error.message || 'Failed to load session',
      });
    }
  },
  
  /**
   * Update session data (merge partial data with deep merging for nested objects)
   * Throttled to prevent excessive API calls
   */
  updateSessionData: async (data: Partial<ValuationRequest>) => {
    const { session } = get();
    
    if (!session) {
      storeLogger.warn('Cannot update session data: no active session');
      return;
    }
    
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
    
    // Check if confirmation is needed (only for user-initiated switches with data)
    if (!skipConfirmation && resetData) {
      const completeness = get().getCompleteness();
      const needsConfirmation = completeness > 5; // Only require confirmation if >5% complete
      
      if (needsConfirmation) {
        storeLogger.info('Flow switch requires confirmation', {
          reportId: session.reportId,
          currentView: session.currentView,
          targetView: view,
          completeness,
        });
        
        // Set pending switch for modal to access
        set({ pendingFlowSwitch: view });
        
        // Return early - caller should show confirmation modal
        return { needsConfirmation: true };
      }
    }
    
    // CRITICAL FIX: Clear valuation results when switching flows
    // This prevents the regeneration modal from appearing incorrectly
    // Results are flow-specific and should not carry over between flows
    try {
      const { useValuationStore } = await import('./useValuationStore');
      useValuationStore.getState().clearResult();
      storeLogger.info('Cleared valuation result on flow switch', {
        from: session.currentView,
        to: view
      });
    } catch (error) {
      storeLogger.error('Failed to clear result on flow switch', { error });
    }
    
    // Clear pending switch since we're proceeding
    set({ pendingFlowSwitch: null });
    
    // Prevent concurrent switches by checking if already syncing
    const { isSyncing } = get();
    if (isSyncing) {
      storeLogger.warn('Switch already in progress, ignoring concurrent request', {
        reportId: session.reportId,
        requestedView: view,
      });
      return;
    }
    
    try {
      set({ isSyncing: true, syncError: null });
      
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
      
      // Update backend first (fail-fast approach)
      await backendAPI.switchValuationView(currentSession.reportId, view);
      
      // Update local state only after successful backend update
      // URL will be synced by useEffect in ValuationReport.tsx
      // This prevents circular updates and infinite loops
      set({
        session: updatedSession,
        isSyncing: false,
        syncError: null,
      });
      
      storeLogger.info('View switched successfully', {
        reportId: currentSession.reportId,
        from: currentSession.currentView,
        to: view,
        resetData,
      });
    } catch (error: any) {
      storeLogger.error('Failed to switch view', {
        error: error instanceof Error ? error.message : 'Unknown error',
        reportId: session.reportId,
        requestedView: view,
      });
      
      // Update local state even if backend fails (optimistic update)
      // This allows UI to update immediately, backend will sync later
      // URL will be synced by useEffect in ValuationReport.tsx
      const { session: currentSession } = get();
      if (currentSession?.reportId === session.reportId) {
        set({
          session: {
            ...currentSession,
            currentView: view,
            updatedAt: new Date(),
          },
          isSyncing: false,
          syncError: error.message || 'Failed to sync with backend',
        });
      } else {
        // Session changed, just clear syncing flag
        set({ isSyncing: false, syncError: error.message || 'Failed to sync with backend' });
      }
    }
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
    
    // Return sessionData as ValuationRequest
    // Note: This may be partial data, components should validate required fields
    return session.sessionData as ValuationRequest;
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
   * Reads current form data from useValuationStore and updates session
   */
  syncFromManualForm: async () => {
    const { session } = get();
    
    if (!session) {
      storeLogger.warn('Cannot sync from manual form: no active session');
      return;
    }
    
    try {
      // Import dynamically to avoid circular dependency
      const { useValuationStore } = await import('./useValuationStore');
      const manualFormData = useValuationStore.getState().formData;
      
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
   * Writes session data to useValuationStore for manual form display
   */
  syncToManualForm: () => {
    const { session } = get();
    
    if (!session || !session.sessionData) {
      storeLogger.warn('Cannot sync to manual form: no session data');
      return;
    }
    
    try {
      // Import dynamically to avoid circular dependency
      const { useValuationStore } = require('./useValuationStore');
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
      useValuationStore.getState().updateFormData(formUpdate);
      
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



