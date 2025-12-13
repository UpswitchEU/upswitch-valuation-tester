/**
 * SessionManager Engine - Session Lifecycle Management
 *
 * Single Responsibility: Manage session creation, initialization, and lifecycle
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/session/session-manager/SessionManager
 */

import { useCallback, useMemo } from 'react';
import type { ValuationSession, ValuationRequest } from '../../../types/valuation';
import { storeLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SessionConfig {
  sessionIdPrefix?: string;
  defaultView?: 'manual' | 'conversational';
  autoSave?: boolean;
  sessionTimeout?: number; // ms
}

export interface SessionInitializationOptions {
  reportId: string;
  currentView?: 'manual' | 'conversational';
  prefilledQuery?: string | null;
  initialData?: Partial<ValuationRequest>;
  skipExistingCheck?: boolean;
}

export interface SessionManager {
  // Session lifecycle
  initializeSession(options: SessionInitializationOptions): Promise<ValuationSession>;
  createNewSession(reportId: string, view?: 'manual' | 'conversational'): ValuationSession;
  loadExistingSession(reportId: string): Promise<ValuationSession | null>;

  // Session validation
  isValidSession(session: ValuationSession): boolean;
  isExpired(session: ValuationSession): boolean;

  // Session utilities
  generateSessionId(): string;
  updateSessionMetadata(session: ValuationSession, metadata: Record<string, any>): ValuationSession;
  getSessionSummary(session: ValuationSession): SessionSummary;
}

// ============================================================================
// SESSION SUMMARY TYPE
// ============================================================================

export interface SessionSummary {
  sessionId: string;
  reportId: string;
  currentView: 'manual' | 'conversational';
  isComplete: boolean;
  createdAt: Date;
  lastUpdated: Date;
  dataCompleteness: number;
  hasPrefilledQuery: boolean;
  viewSwitchCount: number;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class SessionManagerImpl implements SessionManager {
  private config: SessionConfig;

  constructor(config: SessionConfig = {}) {
    this.config = {
      sessionIdPrefix: 'session',
      defaultView: 'manual',
      autoSave: true,
      sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
      ...config,
    };
  }

  /**
   * Initialize a session - either load existing or create new
   */
  async initializeSession(options: SessionInitializationOptions): Promise<ValuationSession> {
    const { reportId, currentView, prefilledQuery, skipExistingCheck } = options;

    storeLogger.info('[SessionManager] Initializing session', {
      reportId,
      requestedView: currentView,
      hasPrefilledQuery: !!prefilledQuery,
      skipExistingCheck,
    });

    // Try to load existing session first (unless explicitly skipped)
    if (!skipExistingCheck) {
      try {
        const existingSession = await this.loadExistingSession(reportId);
        if (existingSession) {
          // Update with any new options
          let updatedSession = existingSession;

          if (prefilledQuery && !this.hasPrefilledQuery(existingSession)) {
            updatedSession = this.addPrefilledQuery(updatedSession, prefilledQuery);
          }

          storeLogger.info('[SessionManager] Using existing session', {
            sessionId: updatedSession.sessionId,
            currentView: updatedSession.currentView,
          });

          return updatedSession;
        }
      } catch (error) {
        storeLogger.warn('[SessionManager] Failed to load existing session, creating new one', {
          reportId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    // Create new session
    const newSession = this.createNewSession(reportId, currentView);

    // Add prefilled query if provided
    if (prefilledQuery) {
      return this.addPrefilledQuery(newSession, prefilledQuery);
    }

    return newSession;
  }

  /**
   * Create a new session
   */
  createNewSession(reportId: string, view?: 'manual' | 'conversational'): ValuationSession {
    const sessionId = this.generateSessionId();
    const currentView = view || this.config.defaultView!;
    const now = new Date();

    const session: ValuationSession = {
      sessionId,
      reportId,
      currentView,
      partialData: {
        _sessionId: sessionId,
        _createdAt: now.toISOString(),
        _viewSwitchCount: 0,
      },
      createdAt: now,
      updatedAt: now,
    };

    storeLogger.info('[SessionManager] Created new session', {
      sessionId,
      reportId,
      currentView,
    });

    return session;
  }

  /**
   * Load existing session from backend
   */
  async loadExistingSession(reportId: string): Promise<ValuationSession | null> {
    try {
      // This would typically call a backend service
      // For now, return null to simulate no existing session
      // In real implementation, this would call: await backendAPI.getValuationSession(reportId);
      storeLogger.debug('[SessionManager] Checking for existing session', { reportId });
      return null; // Placeholder - would be implemented with actual backend call
    } catch (error) {
      storeLogger.warn('[SessionManager] Error loading existing session', {
        reportId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  /**
   * Validate session structure and data
   */
  isValidSession(session: ValuationSession): boolean {
    try {
      // Required fields validation
      if (!session.sessionId || !session.reportId || !session.currentView) {
        return false;
      }

      // View validation
      if (!['manual', 'conversational'].includes(session.currentView)) {
        return false;
      }

      // Date validation
      if (!(session.createdAt instanceof Date) || !(session.updatedAt instanceof Date)) {
        return false;
      }

      // Expiration check
      if (this.isExpired(session)) {
        return false;
      }

      return true;
    } catch (error) {
      storeLogger.error('[SessionManager] Session validation error', {
        sessionId: session.sessionId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  /**
   * Check if session has expired
   */
  isExpired(session: ValuationSession): boolean {
    const now = new Date().getTime();
    const createdAt = session.createdAt.getTime();
    const timeout = this.config.sessionTimeout!;

    return (now - createdAt) > timeout;
  }

  /**
   * Generate unique session ID
   */
  generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `${this.config.sessionIdPrefix}_${timestamp}_${random}`;
  }

  /**
   * Update session metadata
   */
  updateSessionMetadata(session: ValuationSession, metadata: Record<string, any>): ValuationSession {
    const updatedSession: ValuationSession = {
      ...session,
      partialData: {
        ...session.partialData,
        ...metadata,
      },
      updatedAt: new Date(),
    };

    storeLogger.debug('[SessionManager] Updated session metadata', {
      sessionId: session.sessionId,
      metadataKeys: Object.keys(metadata),
    });

    return updatedSession;
  }

  /**
   * Get session summary for debugging/analytics
   */
  getSessionSummary(session: ValuationSession): SessionSummary {
    const partialData = session.partialData as any;
    const viewSwitchCount = partialData?._viewSwitchCount || 0;
    const hasPrefilledQuery = this.hasPrefilledQuery(session);

    return {
      sessionId: session.sessionId,
      reportId: session.reportId,
      currentView: session.currentView,
      isComplete: !!session.completedAt,
      createdAt: session.createdAt,
      lastUpdated: session.updatedAt,
      dataCompleteness: this.calculateDataCompleteness(session),
      hasPrefilledQuery,
      viewSwitchCount,
    };
  }

  // Private helper methods
  private hasPrefilledQuery(session: ValuationSession): boolean {
    const partialData = session.partialData as any;
    return !!(partialData?._prefilledQuery || partialData?.prefilledQuery);
  }

  private addPrefilledQuery(session: ValuationSession, query: string): ValuationSession {
    return this.updateSessionMetadata(session, { _prefilledQuery: query });
  }

  private calculateDataCompleteness(session: ValuationSession): number {
    // Simple completeness calculation based on available fields
    const requiredFields = ['company_name', 'business_type'];
    const partialData = session.partialData as any;

    let completedFields = 0;
    for (const field of requiredFields) {
      if (partialData?.[field]) {
        completedFields++;
      }
    }

    // Bonus points for optional data
    const optionalFields = ['revenue', 'ebitda', 'founding_year'];
    for (const field of optionalFields) {
      if (partialData?.[field]) {
        completedFields += 0.5; // Half point for optional fields
      }
    }

    const maxScore = requiredFields.length + (optionalFields.length * 0.5);
    return Math.min(100, Math.round((completedFields / maxScore) * 100));
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseSessionManagerResult {
  manager: SessionManager;
  actions: {
    initializeSession: (options: SessionInitializationOptions) => Promise<ValuationSession>;
    createNewSession: (reportId: string, view?: 'manual' | 'conversational') => ValuationSession;
    loadExistingSession: (reportId: string) => Promise<ValuationSession | null>;
    validateSession: (session: ValuationSession) => boolean;
    updateMetadata: (session: ValuationSession, metadata: Record<string, any>) => ValuationSession;
    getSummary: (session: ValuationSession) => SessionSummary;
  };
  utilities: {
    generateSessionId: () => string;
    isExpired: (session: ValuationSession) => boolean;
  };
}

/**
 * useSessionManager Hook
 *
 * React hook interface for SessionManager engine
 * Provides reactive session lifecycle management
 */
export const useSessionManager = (
  config?: SessionConfig
): UseSessionManagerResult => {
  const manager = useMemo(() => new SessionManagerImpl(config), [config]);

  const actions = {
    initializeSession: useCallback(
      (options: SessionInitializationOptions) => manager.initializeSession(options),
      [manager]
    ),
    createNewSession: useCallback(
      (reportId: string, view?: 'manual' | 'conversational') => manager.createNewSession(reportId, view),
      [manager]
    ),
    loadExistingSession: useCallback(
      (reportId: string) => manager.loadExistingSession(reportId),
      [manager]
    ),
    validateSession: useCallback(
      (session: ValuationSession) => manager.isValidSession(session),
      [manager]
    ),
    updateMetadata: useCallback(
      (session: ValuationSession, metadata: Record<string, any>) => manager.updateSessionMetadata(session, metadata),
      [manager]
    ),
    getSummary: useCallback(
      (session: ValuationSession) => manager.getSessionSummary(session),
      [manager]
    ),
  };

  const utilities = {
    generateSessionId: useCallback(() => manager.generateSessionId(), [manager]),
    isExpired: useCallback((session: ValuationSession) => manager.isExpired(session), [manager]),
  };

  return {
    manager,
    actions,
    utilities,
  };
};
