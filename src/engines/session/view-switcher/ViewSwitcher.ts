/**
 * ViewSwitcher Engine - Flow View Switching & Confirmation Logic
 *
 * Single Responsibility: Handle switching between manual and conversational flows with confirmation logic
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/session/view-switcher/ViewSwitcher
 */

import { useCallback, useMemo } from 'react';
import type { ValuationSession } from '../../../types/valuation';
import { storeLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ViewSwitchConfig {
  enableConfirmations?: boolean;
  allowDataLossWarning?: boolean;
  maxSwitchCount?: number;
  switchCooldownMs?: number;
}

export interface ViewSwitchOptions {
  targetView: 'manual' | 'conversational';
  skipConfirmation?: boolean;
  force?: boolean;
  preserveData?: boolean;
  reason?: string;
}

export interface ViewSwitchResult {
  success: boolean;
  switched: boolean;
  needsConfirmation: boolean;
  confirmationReason?: string;
  dataLossWarning?: boolean;
  switchedFrom?: 'manual' | 'conversational';
  switchedTo?: 'manual' | 'conversational';
  switchCount: number;
  error?: string;
}

export interface ViewSwitchConfirmation {
  required: boolean;
  reason: string;
  dataLoss: boolean;
  recommendedAction: 'confirm' | 'cancel' | 'save_first';
  details: {
    currentDataCompleteness: number;
    targetDataCompleteness: number;
    dataDifference: string[];
  };
}

export interface ViewSwitcher {
  // View switching
  switchView(session: ValuationSession, options: ViewSwitchOptions): ViewSwitchResult;
  canSwitchView(session: ValuationSession, targetView: 'manual' | 'conversational'): boolean;

  // Confirmation logic
  requiresConfirmation(session: ValuationSession, targetView: 'manual' | 'conversational'): ViewSwitchConfirmation;
  confirmSwitch(session: ValuationSession, confirmed: boolean): ViewSwitchResult;

  // State queries
  getCurrentView(session: ValuationSession): 'manual' | 'conversational';
  getSwitchHistory(session: ValuationSession): ViewSwitchEvent[];
  getSwitchCount(session: ValuationSession): number;

  // Utilities
  calculateDataCompleteness(session: ValuationSession): number;
  getDataDifference(session: ValuationSession, targetView: 'manual' | 'conversational'): string[];
}

// ============================================================================
// VIEW SWITCH EVENT TYPE
// ============================================================================

export interface ViewSwitchEvent {
  id: string;
  timestamp: number;
  fromView: 'manual' | 'conversational';
  toView: 'manual' | 'conversational';
  reason?: string;
  success: boolean;
  dataPreserved: boolean;
  confirmationRequired: boolean;
  confirmationGranted: boolean;
}

// ============================================================================
// DATA COMPLETENESS WEIGHTS
// ============================================================================

const DATA_COMPLETENESS_WEIGHTS: Record<string, number> = {
  // High priority fields
  company_name: 20,
  business_type: 20,

  // Medium priority fields
  country_code: 10,
  founding_year: 10,

  // Financial fields
  revenue: 15,
  ebitda: 15,

  // Current year data
  'current_year_data.revenue': 5,
  'current_year_data.ebitda': 5,
  'current_year_data.net_income': 5,

  // Historical data (each year counts less)
  'historical_years_data': 10, // Base weight, scales with number of years
};

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class ViewSwitcherImpl implements ViewSwitcher {
  private config: ViewSwitchConfig;
  private lastSwitchTime: number = 0;

  constructor(config: ViewSwitchConfig = {}) {
    this.config = {
      enableConfirmations: true,
      allowDataLossWarning: true,
      maxSwitchCount: 10,
      switchCooldownMs: 1000,
      ...config,
    };
  }

  /**
   * Switch between manual and conversational views
   */
  switchView(session: ValuationSession, options: ViewSwitchOptions): ViewSwitchResult {
    const { targetView, skipConfirmation, force, preserveData, reason } = options;

    storeLogger.info('[ViewSwitcher] Attempting view switch', {
      sessionId: session.sessionId,
      fromView: session.currentView,
      toView: targetView,
      skipConfirmation,
      force,
      reason,
    });

    // Basic validation
    if (session.currentView === targetView) {
      return {
        success: true,
        switched: false,
        needsConfirmation: false,
        switchCount: this.getSwitchCount(session),
      };
    }

    // Check if switch is allowed
    if (!this.canSwitchView(session, targetView) && !force) {
      return {
        success: false,
        switched: false,
        needsConfirmation: false,
        switchCount: this.getSwitchCount(session),
        error: 'View switch not allowed',
      };
    }

    // Check confirmation requirements
    const confirmation = this.requiresConfirmation(session, targetView);
    if (confirmation.required && !skipConfirmation && !force) {
      return {
        success: true,
        switched: false,
        needsConfirmation: true,
        confirmationReason: confirmation.reason,
        dataLossWarning: confirmation.dataLoss,
        switchCount: this.getSwitchCount(session),
      };
    }

    // Perform the switch
    try {
      const updatedSession = this.performViewSwitch(session, targetView, preserveData);
      const switchEvent = this.recordSwitchEvent(session, updatedSession, reason, true, !!preserveData, confirmation.required, !skipConfirmation);

      storeLogger.info('[ViewSwitcher] View switch completed successfully', {
        sessionId: session.sessionId,
        fromView: session.currentView,
        toView: updatedSession.currentView,
        switchCount: switchEvent.switchCount,
        dataPreserved: !!preserveData,
      });

      return {
        success: true,
        switched: true,
        needsConfirmation: false,
        switchedFrom: session.currentView,
        switchedTo: updatedSession.currentView,
        switchCount: switchEvent.switchCount,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown switch error';

      this.recordSwitchEvent(session, session, reason, false, !!preserveData, confirmation.required, !skipConfirmation);

      storeLogger.error('[ViewSwitcher] View switch failed', {
        sessionId: session.sessionId,
        fromView: session.currentView,
        toView: targetView,
        error: errorMessage,
      });

      return {
        success: false,
        switched: false,
        needsConfirmation: false,
        switchCount: this.getSwitchCount(session),
        error: errorMessage,
      };
    }
  }

  /**
   * Check if view switch is currently allowed
   */
  canSwitchView(session: ValuationSession, targetView: 'manual' | 'conversational'): boolean {
    // Check cooldown
    const now = Date.now();
    if (now - this.lastSwitchTime < (this.config.switchCooldownMs || 0)) {
      return false;
    }

    // Check max switch count
    const switchCount = this.getSwitchCount(session);
    if (switchCount >= (this.config.maxSwitchCount || 10)) {
      return false;
    }

    // Check if session is in a valid state
    if (session.completedAt) {
      // Allow switching after completion, but with warnings
      return true;
    }

    return true;
  }

  /**
   * Determine if confirmation is required for view switch
   */
  requiresConfirmation(session: ValuationSession, targetView: 'manual' | 'conversational'): ViewSwitchConfirmation {
    const currentCompleteness = this.calculateDataCompleteness(session);
    const dataDifference = this.getDataDifference(session, targetView);

    // Always require confirmation if data might be lost
    if (dataDifference.length > 0 && this.config.allowDataLossWarning) {
      return {
        required: true,
        reason: 'Switching views may result in data loss',
        dataLoss: true,
        recommendedAction: 'save_first',
        details: {
          currentDataCompleteness: currentCompleteness,
          targetDataCompleteness: 0, // Assume target has no data
          dataDifference,
        },
      };
    }

    // Require confirmation for frequent switching
    const switchCount = this.getSwitchCount(session);
    if (switchCount >= 3) {
      return {
        required: true,
        reason: 'You have switched views multiple times. Please confirm.',
        dataLoss: false,
        recommendedAction: 'confirm',
        details: {
          currentDataCompleteness: currentCompleteness,
          targetDataCompleteness: 0,
          dataDifference: [],
        },
      };
    }

    // Require confirmation if session is completed
    if (session.completedAt) {
      return {
        required: true,
        reason: 'This valuation is already completed. Switching may reset progress.',
        dataLoss: true,
        recommendedAction: 'cancel',
        details: {
          currentDataCompleteness: 100,
          targetDataCompleteness: currentCompleteness,
          dataDifference,
        },
      };
    }

    return {
      required: false,
      reason: '',
      dataLoss: false,
      recommendedAction: 'confirm',
      details: {
        currentDataCompleteness: currentCompleteness,
        targetDataCompleteness: 0,
        dataDifference,
      },
    };
  }

  /**
   * Confirm or cancel a pending view switch
   */
  confirmSwitch(session: ValuationSession, confirmed: boolean): ViewSwitchResult {
    // This would be called after a user confirms/rejects a switch
    // In real implementation, this would coordinate with pending switch state
    storeLogger.info('[ViewSwitcher] Switch confirmation received', {
      sessionId: session.sessionId,
      confirmed,
    });

    if (confirmed) {
      // Perform the actual switch
      return this.switchView(session, {
        targetView: session.currentView === 'manual' ? 'conversational' : 'manual',
        skipConfirmation: true,
      });
    } else {
      return {
        success: true,
        switched: false,
        needsConfirmation: false,
        switchCount: this.getSwitchCount(session),
      };
    }
  }

  /**
   * Get current view
   */
  getCurrentView(session: ValuationSession): 'manual' | 'conversational' {
    return session.currentView;
  }

  /**
   * Get switch history
   */
  getSwitchHistory(session: ValuationSession): ViewSwitchEvent[] {
    const partialData = session.partialData as any;
    return partialData?._switchHistory || [];
  }

  /**
   * Get total switch count
   */
  getSwitchCount(session: ValuationSession): number {
    const partialData = session.partialData as any;
    return partialData?._viewSwitchCount || 0;
  }

  /**
   * Calculate data completeness percentage
   */
  calculateDataCompleteness(session: ValuationSession): number {
    const partialData = session.partialData as any;
    let totalWeight = 0;
    let completedWeight = 0;

    for (const [field, weight] of Object.entries(DATA_COMPLETENESS_WEIGHTS)) {
      totalWeight += weight;

      if (field === 'historical_years_data') {
        // Special handling for historical data
        const historicalData = partialData?.[field] || [];
        if (Array.isArray(historicalData) && historicalData.length > 0) {
          completedWeight += Math.min(weight, weight * (historicalData.length / 3)); // Max 3 years
        }
      } else if (field.includes('.')) {
        // Handle nested fields like current_year_data.revenue
        const [parent, child] = field.split('.');
        if (partialData?.[parent]?.[child]) {
          completedWeight += weight;
        }
      } else {
        // Direct field check
        if (partialData?.[field]) {
          completedWeight += weight;
        }
      }
    }

    return totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
  }

  /**
   * Get fields that might be lost in view switch
   */
  getDataDifference(session: ValuationSession, targetView: 'manual' | 'conversational'): string[] {
    // In a real implementation, this would compare data compatibility
    // between manual and conversational flows

    const partialData = session.partialData as any;
    const differences: string[] = [];

    // Check for conversational-specific data that might not transfer well to manual
    if (targetView === 'manual') {
      if (partialData?._conversationContext) {
        differences.push('conversation context');
      }
      if (partialData?._extractedData) {
        differences.push('AI-extracted data');
      }
    }

    // Check for manual-specific data that might not transfer well to conversational
    if (targetView === 'conversational') {
      // Most manual form data should transfer fine
    }

    return differences;
  }

  // Private helper methods
  private performViewSwitch(
    session: ValuationSession,
    targetView: 'manual' | 'conversational',
    preserveData?: boolean
  ): ValuationSession {
    const updatedSession: ValuationSession = {
      ...session,
      currentView: targetView,
      updatedAt: new Date(),
      partialData: {
        ...session.partialData,
        _lastViewSwitch: Date.now(),
        _previousView: session.currentView,
      },
    };

    // Update switch count
    const currentCount = this.getSwitchCount(session);
    (updatedSession.partialData as any)._viewSwitchCount = currentCount + 1;

    // Record the switch in history
    const switchHistory = this.getSwitchHistory(session);
    const switchEvent: ViewSwitchEvent = {
      id: `switch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      fromView: session.currentView,
      toView: targetView,
      success: true,
      dataPreserved: !!preserveData,
      confirmationRequired: false,
      confirmationGranted: true,
    };

    switchHistory.push(switchEvent);
    (updatedSession.partialData as any)._switchHistory = switchHistory.slice(-10); // Keep last 10

    this.lastSwitchTime = Date.now();

    return updatedSession;
  }

  private recordSwitchEvent(
    fromSession: ValuationSession,
    toSession: ValuationSession,
    reason: string | undefined,
    success: boolean,
    dataPreserved: boolean,
    confirmationRequired: boolean,
    confirmationGranted: boolean
  ): { switchCount: number } {
    // This would record the event in the session metadata
    // Implementation would depend on how we store this data
    return {
      switchCount: this.getSwitchCount(toSession),
    };
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseViewSwitcherResult {
  switcher: ViewSwitcher;
  actions: {
    switchView: (session: ValuationSession, options: ViewSwitchOptions) => ViewSwitchResult;
    canSwitchView: (session: ValuationSession, targetView: 'manual' | 'conversational') => boolean;
    requiresConfirmation: (session: ValuationSession, targetView: 'manual' | 'conversational') => ViewSwitchConfirmation;
    confirmSwitch: (session: ValuationSession, confirmed: boolean) => ViewSwitchResult;
  };
  queries: {
    getCurrentView: (session: ValuationSession) => 'manual' | 'conversational';
    getSwitchHistory: (session: ValuationSession) => ViewSwitchEvent[];
    getSwitchCount: (session: ValuationSession) => number;
    calculateDataCompleteness: (session: ValuationSession) => number;
    getDataDifference: (session: ValuationSession, targetView: 'manual' | 'conversational') => string[];
  };
}

/**
 * useViewSwitcher Hook
 *
 * React hook interface for ViewSwitcher engine
 * Provides reactive view switching with confirmation logic
 */
export const useViewSwitcher = (
  config?: ViewSwitchConfig
): UseViewSwitcherResult => {
  const switcher = useMemo(() => new ViewSwitcherImpl(config), [config]);

  const actions = {
    switchView: useCallback(
      (session: ValuationSession, options: ViewSwitchOptions) =>
        switcher.switchView(session, options),
      [switcher]
    ),
    canSwitchView: useCallback(
      (session: ValuationSession, targetView: 'manual' | 'conversational') =>
        switcher.canSwitchView(session, targetView),
      [switcher]
    ),
    requiresConfirmation: useCallback(
      (session: ValuationSession, targetView: 'manual' | 'conversational') =>
        switcher.requiresConfirmation(session, targetView),
      [switcher]
    ),
    confirmSwitch: useCallback(
      (session: ValuationSession, confirmed: boolean) =>
        switcher.confirmSwitch(session, confirmed),
      [switcher]
    ),
  };

  const queries = {
    getCurrentView: useCallback(
      (session: ValuationSession) => switcher.getCurrentView(session),
      [switcher]
    ),
    getSwitchHistory: useCallback(
      (session: ValuationSession) => switcher.getSwitchHistory(session),
      [switcher]
    ),
    getSwitchCount: useCallback(
      (session: ValuationSession) => switcher.getSwitchCount(session),
      [switcher]
    ),
    calculateDataCompleteness: useCallback(
      (session: ValuationSession) => switcher.calculateDataCompleteness(session),
      [switcher]
    ),
    getDataDifference: useCallback(
      (session: ValuationSession, targetView: 'manual' | 'conversational') =>
        switcher.getDataDifference(session, targetView),
      [switcher]
    ),
  };

  return {
    switcher,
    actions,
    queries,
  };
};

