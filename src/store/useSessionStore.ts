/**
 * Unified Session Store (Cursor-Style Simplicity)
 *
 * Single source of truth for both manual and conversational flows.
 * Replaces useManualSessionStore + useConversationalSessionStore.
 *
 * Key Features:
 * - Promise cache prevents duplicate loads
 * - Atomic state updates
 * - Simple API (loadSession, updateSession, clearSession)
 * - No orchestration, no asset stores
 * - Optimistic rendering support
 *
 * @module store/useSessionStore
 */

import { create } from 'zustand'
import { sessionService } from '../services'
import type { ValuationSession } from '../types/valuation'
import { storeLogger } from '../utils/logger'

interface SessionStore {
  // State
  session: ValuationSession | null
  isLoading: boolean
  error: string | null
  
  // Save state (M&A workflow)
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  
  // Actions
  loadSession: (reportId: string, flow?: 'manual' | 'conversational') => Promise<void>
  updateSession: (updates: Partial<ValuationSession>) => void
  updateSessionData: (data: Partial<any>) => Promise<void>  // Async for hook compatibility
  saveSession: () => Promise<void>
  clearSession: () => void
  
  // Helpers
  getReportId: () => string | null
  getSessionData: () => any | null
  markSaved: () => void
  markUnsaved: () => void
}

// Promise cache to prevent duplicate loads (Cursor pattern)
const loadingPromises = new Map<string, Promise<void>>()

/**
 * Unified Session Store
 *
 * Handles both manual and conversational flows with single store.
 */
export const useSessionStore = create<SessionStore>((set, get) => ({
  // Initial state
  session: null,
  isLoading: false,
  error: null,
  isSaving: false,
  lastSaved: null,
  hasUnsavedChanges: false,
  
  /**
   * Load session from backend/cache
   *
   * Features:
   * - Promise cache prevents duplicate calls
   * - Atomic state updates
   * - Error handling with clear messages
   * - Auto-creates session if not found (for new reports)
   */
  loadSession: async (reportId: string, flow?: 'manual' | 'conversational') => {
    const state = get()
    
    // GUARD 1: Already loaded for this reportId
    if (state.session?.reportId === reportId && !state.error) {
      storeLogger.debug('[Session] Already loaded, skipping', { reportId })
      return
    }
    
    // GUARD 2: Already loading (promise cache)
    if (loadingPromises.has(reportId)) {
      storeLogger.debug('[Session] Already loading, reusing promise', { reportId })
      await loadingPromises.get(reportId)
      return
    }
    
    // Create load promise
    const loadPromise = (async () => {
      set({ isLoading: true, error: null })
      
      try {
        storeLogger.info('[Session] Loading session', { reportId, flow })
        
        // Load from SessionService (handles cache, backend, merging, auto-creation)
        const session = await sessionService.loadSession(reportId, flow)
        
        if (!session) {
          throw new Error(`Session not found: ${reportId}`)
        }
        
        set({ 
          session, 
          isLoading: false,
          error: null
        })
        
        storeLogger.info('[Session] Session loaded successfully', {
          reportId,
          currentView: session.currentView,
          hasSessionData: !!session.sessionData,
          hasHtmlReport: !!session.htmlReport,
          hasInfoTabHtml: !!session.infoTabHtml,
          hasValuationResult: !!session.valuationResult,
        })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to load session'
        
        storeLogger.error('[Session] Load failed', {
          reportId,
          error: message,
        })
        
        set({ 
          error: message, 
          isLoading: false 
        })
        
        throw error
      }
    })()
    
    // Store in promise cache
    loadingPromises.set(reportId, loadPromise)
    
    try {
      await loadPromise
    } finally {
      // Clean up promise cache
      loadingPromises.delete(reportId)
    }
  },
  
  /**
   * Update entire session object
   */
  updateSession: (updates: Partial<ValuationSession>) => {
    set(state => {
      if (!state.session) {
        storeLogger.warn('[Session] Cannot update: no active session')
        return state
      }
      
      const updatedSession = {
        ...state.session,
        ...updates,
      }
      
      storeLogger.debug('[Session] Session updated', {
        reportId: state.session.reportId,
        fieldsUpdated: Object.keys(updates).length,
      })
      
      return {
        ...state,
        session: updatedSession,
        hasUnsavedChanges: true,
      }
    })
  },
  
  /**
   * Update session data (form fields)
   * Async for compatibility with hooks expecting Promise<void>
   */
  updateSessionData: async (data: Partial<any>) => {
    set(state => {
      if (!state.session) {
        storeLogger.warn('[Session] Cannot update data: no active session')
        return state
      }
      
      const updatedSession = {
        ...state.session,
        sessionData: {
          ...state.session.sessionData,
          ...data,
        },
      }
      
      storeLogger.debug('[Session] Session data updated', {
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
  
  /**
   * Save session to backend
   */
  saveSession: async () => {
    const state = get()
    
    if (!state.session) {
      storeLogger.warn('[Session] Cannot save: no active session')
      return
    }
    
    set({ isSaving: true, error: null })
    
    try {
      storeLogger.info('[Session] Saving session', {
        reportId: state.session.reportId,
      })
      
      // Save via SessionService
      await sessionService.saveSession(state.session.reportId, state.session.sessionData || {})
      
      set({
        isSaving: false,
        hasUnsavedChanges: false,
        lastSaved: new Date(),
        error: null,
      })
      
      storeLogger.info('[Session] Session saved successfully', {
        reportId: state.session.reportId,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save session'
      
      storeLogger.error('[Session] Save failed', {
        reportId: state.session.reportId,
        error: message,
      })
      
      set({ 
        isSaving: false,
        error: message 
      })
      
      throw error
    }
  },
  
  /**
   * Clear session state
   */
  clearSession: () => {
    const state = get()
    
    storeLogger.info('[Session] Clearing session', {
      reportId: state.session?.reportId,
    })
    
    set({
      session: null,
      isLoading: false,
      isSaving: false,
      error: null,
      lastSaved: null,
      hasUnsavedChanges: false,
    })
  },
  
  /**
   * Get current report ID
   */
  getReportId: () => {
    const { session } = get()
    return session?.reportId || null
  },
  
  /**
   * Get session data
   */
  getSessionData: () => {
    const { session } = get()
    return session?.sessionData || null
  },
  
  /**
   * Mark session as saved
   */
  markSaved: () => {
    set({
      hasUnsavedChanges: false,
      lastSaved: new Date(),
      isSaving: false,
      error: null,
    })
    
    storeLogger.debug('[Session] Marked as saved')
  },
  
  /**
   * Mark session as having unsaved changes
   */
  markUnsaved: () => {
    set({
      hasUnsavedChanges: true,
    })
  },
}))
