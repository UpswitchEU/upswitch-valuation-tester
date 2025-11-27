import { create } from 'zustand';
import { backendAPI } from '../services/backendApi';
import type { ValuationFormData, ValuationRequest, ValuationSession } from '../types/valuation';
import { storeLogger } from '../utils/logger';

interface ValuationSessionStore {
  // Session state
  session: ValuationSession | null;
  
  // Actions
  initializeSession: (reportId: string, currentView?: 'manual' | 'ai-guided') => Promise<void>;
  loadSession: (reportId: string) => Promise<void>;
  updateSessionData: (data: Partial<ValuationRequest>) => Promise<void>;
  switchView: (view: 'manual' | 'ai-guided') => Promise<void>;
  getSessionData: () => ValuationRequest | null;
  clearSession: () => void;
  
  // Sync methods for cross-flow data sharing
  syncFromManualForm: () => Promise<void>;
  syncToManualForm: () => void;
  getCompleteness: () => number;
  
  // Sync state
  isSyncing: boolean;
  syncError: string | null;
}

export const useValuationSessionStore = create<ValuationSessionStore>((set, get) => ({
  // Initial state
  session: null,
  isSyncing: false,
  syncError: null,
  
  /**
   * Initialize a new session or load existing one
   */
  initializeSession: async (reportId: string, currentView: 'manual' | 'ai-guided' = 'manual') => {
    try {
      storeLogger.info('Initializing valuation session', { reportId, currentView });
      
      // Try to load existing session from backend
      const existingSession = await backendAPI.getValuationSession(reportId);
      
      if (existingSession) {
        // Load existing session
        set({
          session: {
            ...existingSession,
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
          partialData: {},
          sessionData: {},
        };
        
        // Save to backend
        await backendAPI.createValuationSession(newSession);
        
        set({
          session: newSession,
          syncError: null,
        });
        
        storeLogger.info('Created new session', { reportId, sessionId, currentView });
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
   */
  updateSessionData: async (data: Partial<ValuationRequest>) => {
    const { session } = get();
    
    if (!session) {
      storeLogger.warn('Cannot update session data: no active session');
      return;
    }
    
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
      let dataSource: 'manual' | 'ai-guided' | 'mixed' = session.dataSource;
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
      let dataSource: 'manual' | 'ai-guided' | 'mixed' = session.dataSource;
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
   */
  switchView: async (view: 'manual' | 'ai-guided') => {
    const { session } = get();
    
    if (!session) {
      storeLogger.warn('Cannot switch view: no active session');
      return;
    }
    
    if (session.currentView === view) {
      // Already in this view
      return;
    }
    
    try {
      set({ isSyncing: true, syncError: null });
      
      const updatedSession: ValuationSession = {
        ...session,
        currentView: view,
        updatedAt: new Date(),
      };
      
      // Update backend
      await backendAPI.switchValuationView(session.reportId, view);
      
      // Update URL query parameter to reflect the new flow
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('flow', view);
      window.history.replaceState({}, '', currentUrl.toString());
      
      set({
        session: updatedSession,
        isSyncing: false,
        syncError: null,
      });
      
      storeLogger.info('View switched', {
        reportId: session.reportId,
        from: session.currentView,
        to: view,
      });
    } catch (error: any) {
      storeLogger.error('Failed to switch view', {
        error: error instanceof Error ? error.message : 'Unknown error',
        reportId: session.reportId,
      });
      
      // Update local state even if backend fails
      set({
        session: {
          ...session,
          currentView: view,
          updatedAt: new Date(),
        },
        isSyncing: false,
        syncError: error.message || 'Failed to sync with backend',
      });
      
      // Still update URL even if backend fails
      const currentUrl = new URL(window.location.href);
      currentUrl.searchParams.set('flow', view);
      window.history.replaceState({}, '', currentUrl.toString());
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
}));



