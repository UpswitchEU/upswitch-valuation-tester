/**
 * UIManager Engine - UI State Management
 *
 * Single Responsibility: Manage UI state, loading states, errors, and user interactions
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/valuation/ui-manager/UIManager
 */

import { useCallback, useMemo } from 'react';
import { storeLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface UIConfig {
  enableLoadingStates?: boolean;
  enableErrorHandling?: boolean;
  errorDisplayDuration?: number;
  loadingIndicators?: boolean;
}

export interface UIState {
  isCalculating: boolean;
  isCalculatingLive: boolean;
  error: string | null;
  correlationId: string | null;
  savedValuationId: string | null;
  lastActivity: number;
  interactionCount: number;
}

export interface UIUpdate {
  type: 'loading_start' | 'loading_end' | 'error_set' | 'error_clear' | 'correlation_update' | 'valuation_saved';
  payload?: any;
  timestamp: number;
  source: string;
}

export interface LoadingState {
  id: string;
  message: string;
  progress?: number;
  startTime: number;
  timeout?: number;
}

export interface UIManager {
  // UI state management
  getUIState(): UIState;
  updateUIState(update: UIUpdate): void;

  // Loading state management
  startLoading(operationId: string, message: string, timeout?: number): void;
  updateLoadingProgress(operationId: string, progress: number): void;
  endLoading(operationId: string): void;
  isLoading(operationId?: string): boolean;
  getActiveLoadings(): LoadingState[];

  // Error management
  setError(error: string, context?: Record<string, any>): void;
  clearError(): void;
  getLastError(): string | null;
  hasErrors(): boolean;

  // Correlation tracking
  setCorrelationId(id: string): void;
  getCorrelationId(): string | null;

  // Valuation ID tracking
  setSavedValuationId(id: string | null): void;
  getSavedValuationId(): string | null;

  // UI interaction tracking
  trackInteraction(action: string, data?: Record<string, any>): void;
  getInteractionStats(): InteractionStats;

  // UI state queries
  isCalculating(): boolean;
  isCalculatingLive(): boolean;
  getActivitySummary(): ActivitySummary;
}

// ============================================================================
// INTERACTION STATS TYPE
// ============================================================================

export interface InteractionStats {
  totalInteractions: number;
  interactionsByAction: Record<string, number>;
  lastInteraction: number;
  averageInteractionRate: number; // per minute
  sessionStart: number;
}

// ============================================================================
// ACTIVITY SUMMARY TYPE
// ============================================================================

export interface ActivitySummary {
  isActive: boolean;
  lastActivity: number;
  activeOperations: number;
  pendingOperations: number;
  errorCount: number;
  sessionDuration: number;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class UIManagerImpl implements UIManager {
  private config: UIConfig;
  private uiState: UIState;
  private loadingStates: Map<string, LoadingState> = new Map();
  private interactionStats: InteractionStats;
  private uiHistory: UIUpdate[] = [];
  private maxHistorySize = 50;
  private sessionStart: number = Date.now();

  constructor(config: UIConfig = {}) {
    this.config = {
      enableLoadingStates: true,
      enableErrorHandling: true,
      errorDisplayDuration: 5000,
      loadingIndicators: true,
      ...config,
    };

    this.uiState = {
      isCalculating: false,
      isCalculatingLive: false,
      error: null,
      correlationId: null,
      savedValuationId: null,
      lastActivity: Date.now(),
      interactionCount: 0,
    };

    this.interactionStats = {
      totalInteractions: 0,
      interactionsByAction: {},
      lastInteraction: Date.now(),
      averageInteractionRate: 0,
      sessionStart: this.sessionStart,
    };
  }

  /**
   * Get current UI state
   */
  getUIState(): UIState {
    return { ...this.uiState };
  }

  /**
   * Update UI state
   */
  updateUIState(update: UIUpdate): void {
    // Track update in history
    this.uiHistory.push(update);
    if (this.uiHistory.length > this.maxHistorySize) {
      this.uiHistory = this.uiHistory.slice(-this.maxHistorySize);
    }

    // Apply update
    switch (update.type) {
      case 'loading_start':
        this.uiState.isCalculating = true;
        this.uiState.lastActivity = update.timestamp;
        break;

      case 'loading_end':
        this.uiState.isCalculating = false;
        this.uiState.lastActivity = update.timestamp;
        break;

      case 'error_set':
        if (this.config.enableErrorHandling) {
          this.uiState.error = update.payload.message;
          this.uiState.lastActivity = update.timestamp;

          // Auto-clear error after duration
          if (this.config.errorDisplayDuration) {
            setTimeout(() => {
              this.clearError();
            }, this.config.errorDisplayDuration);
          }
        }
        break;

      case 'error_clear':
        this.uiState.error = null;
        break;

      case 'correlation_update':
        this.uiState.correlationId = update.payload.id;
        break;

      case 'valuation_saved':
        this.uiState.savedValuationId = update.payload.id;
        this.uiState.lastActivity = update.timestamp;
        break;
    }

    storeLogger.debug('[UIManager] UI state updated', {
      type: update.type,
      source: update.source,
      hasError: !!this.uiState.error,
      isLoading: this.uiState.isCalculating,
    });
  }

  /**
   * Start loading state
   */
  startLoading(operationId: string, message: string, timeout?: number): void {
    if (!this.config.enableLoadingStates) return;

    const loadingState: LoadingState = {
      id: operationId,
      message,
      progress: 0,
      startTime: Date.now(),
      timeout,
    };

    this.loadingStates.set(operationId, loadingState);

    // Update UI state
    this.updateUIState({
      type: 'loading_start',
      timestamp: Date.now(),
      source: 'ui_manager',
    });

    // Set timeout if provided
    if (timeout) {
      setTimeout(() => {
        if (this.loadingStates.has(operationId)) {
          this.endLoading(operationId);
          storeLogger.warn('[UIManager] Loading operation timed out', {
            operationId,
            timeout,
          });
        }
      }, timeout);
    }

    storeLogger.debug('[UIManager] Loading started', {
      operationId,
      message,
      timeout,
    });
  }

  /**
   * Update loading progress
   */
  updateLoadingProgress(operationId: string, progress: number): void {
    const loadingState = this.loadingStates.get(operationId);
    if (loadingState) {
      loadingState.progress = Math.max(0, Math.min(100, progress));
    }
  }

  /**
   * End loading state
   */
  endLoading(operationId: string): void {
    const loadingState = this.loadingStates.get(operationId);
    if (loadingState) {
      const duration = Date.now() - loadingState.startTime;
      this.loadingStates.delete(operationId);

      // Update UI state if no more loadings
      if (this.loadingStates.size === 0) {
        this.updateUIState({
          type: 'loading_end',
          timestamp: Date.now(),
          source: 'ui_manager',
        });
      }

      storeLogger.debug('[UIManager] Loading ended', {
        operationId,
        duration,
        finalProgress: loadingState.progress,
      });
    }
  }

  /**
   * Check if operation is loading
   */
  isLoading(operationId?: string): boolean {
    if (operationId) {
      return this.loadingStates.has(operationId);
    }
    return this.loadingStates.size > 0;
  }

  /**
   * Get all active loading states
   */
  getActiveLoadings(): LoadingState[] {
    return Array.from(this.loadingStates.values()).map(state => ({ ...state }));
  }

  /**
   * Set error state
   */
  setError(error: string, context?: Record<string, any>): void {
    this.updateUIState({
      type: 'error_set',
      payload: { message: error, context },
      timestamp: Date.now(),
      source: 'ui_manager',
    });

    storeLogger.warn('[UIManager] Error set', {
      error,
      context,
    });
  }

  /**
   * Clear error state
   */
  clearError(): void {
    this.updateUIState({
      type: 'error_clear',
      timestamp: Date.now(),
      source: 'ui_manager',
    });
  }

  /**
   * Get last error
   */
  getLastError(): string | null {
    return this.uiState.error;
  }

  /**
   * Check if there are active errors
   */
  hasErrors(): boolean {
    return !!this.uiState.error;
  }

  /**
   * Set correlation ID for tracking
   */
  setCorrelationId(id: string): void {
    this.uiState.correlationId = id;

    this.updateUIState({
      type: 'correlation_update',
      payload: { id },
      timestamp: Date.now(),
      source: 'ui_manager',
    });
  }

  /**
   * Get current correlation ID
   */
  getCorrelationId(): string | null {
    return this.uiState.correlationId;
  }

  /**
   * Set saved valuation ID
   */
  setSavedValuationId(id: string | null): void {
    this.uiState.savedValuationId = id;

    this.updateUIState({
      type: 'valuation_saved',
      payload: { id },
      timestamp: Date.now(),
      source: 'ui_manager',
    });
  }

  /**
   * Get saved valuation ID
   */
  getSavedValuationId(): string | null {
    return this.uiState.savedValuationId;
  }

  /**
   * Track user interaction
   */
  trackInteraction(action: string, data?: Record<string, any>): void {
    this.uiState.interactionCount++;
    this.uiState.lastActivity = Date.now();

    // Update stats
    this.interactionStats.totalInteractions++;
    this.interactionStats.lastInteraction = Date.now();
    this.interactionStats.interactionsByAction[action] =
      (this.interactionStats.interactionsByAction[action] || 0) + 1;

    // Calculate interaction rate
    const sessionDurationMinutes = (Date.now() - this.interactionStats.sessionStart) / 60000;
    this.interactionStats.averageInteractionRate =
      sessionDurationMinutes > 0 ? this.interactionStats.totalInteractions / sessionDurationMinutes : 0;

    storeLogger.debug('[UIManager] Interaction tracked', {
      action,
      data,
      totalInteractions: this.interactionStats.totalInteractions,
    });
  }

  /**
   * Get interaction statistics
   */
  getInteractionStats(): InteractionStats {
    return { ...this.interactionStats };
  }

  /**
   * Check if calculating
   */
  isCalculating(): boolean {
    return this.uiState.isCalculating;
  }

  /**
   * Check if calculating live preview
   */
  isCalculatingLive(): boolean {
    return this.uiState.isCalculatingLive;
  }

  /**
   * Get activity summary
   */
  getActivitySummary(): ActivitySummary {
    const now = Date.now();
    const timeSinceLastActivity = now - this.uiState.lastActivity;
    const isActive = timeSinceLastActivity < 300000; // 5 minutes

    return {
      isActive,
      lastActivity: this.uiState.lastActivity,
      activeOperations: this.loadingStates.size,
      pendingOperations: 0, // Could be extended to track pending operations
      errorCount: this.uiState.error ? 1 : 0,
      sessionDuration: now - this.sessionStart,
    };
  }

  // Private helper methods
  private getUIHistory(): UIUpdate[] {
    return [...this.uiHistory];
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseUIManagerResult {
  manager: UIManager;
  state: UIState;
  actions: {
    updateUIState: (update: UIUpdate) => void;
    startLoading: (operationId: string, message: string, timeout?: number) => void;
    updateLoadingProgress: (operationId: string, progress: number) => void;
    endLoading: (operationId: string) => void;
    setError: (error: string, context?: Record<string, any>) => void;
    clearError: () => void;
    setCorrelationId: (id: string) => void;
    setSavedValuationId: (id: string | null) => void;
    trackInteraction: (action: string, data?: Record<string, any>) => void;
  };
  queries: {
    isLoading: (operationId?: string) => boolean;
    isCalculating: boolean;
    isCalculatingLive: boolean;
    getLastError: string | null;
    getCorrelationId: string | null;
    getSavedValuationId: string | null;
    hasErrors: boolean;
    activeLoadings: LoadingState[];
    interactionStats: InteractionStats;
    activitySummary: ActivitySummary;
    uiHistory: UIUpdate[];
  };
}

/**
 * useUIManager Hook
 *
 * React hook interface for UIManager engine
 * Provides reactive UI state management and user interaction tracking
 */
export const useUIManager = (
  config?: UIConfig
): UseUIManagerResult => {
  const manager = useMemo(() => new UIManagerImpl(config), [config]);

  const actions = {
    updateUIState: useCallback(
      (update: UIUpdate) => manager.updateUIState(update),
      [manager]
    ),
    startLoading: useCallback(
      (operationId: string, message: string, timeout?: number) =>
        manager.startLoading(operationId, message, timeout),
      [manager]
    ),
    updateLoadingProgress: useCallback(
      (operationId: string, progress: number) =>
        manager.updateLoadingProgress(operationId, progress),
      [manager]
    ),
    endLoading: useCallback(
      (operationId: string) => manager.endLoading(operationId),
      [manager]
    ),
    setError: useCallback(
      (error: string, context?: Record<string, any>) =>
        manager.setError(error, context),
      [manager]
    ),
    clearError: useCallback(() => manager.clearError(), [manager]),
    setCorrelationId: useCallback(
      (id: string) => manager.setCorrelationId(id),
      [manager]
    ),
    setSavedValuationId: useCallback(
      (id: string | null) => manager.setSavedValuationId(id),
      [manager]
    ),
    trackInteraction: useCallback(
      (action: string, data?: Record<string, any>) =>
        manager.trackInteraction(action, data),
      [manager]
    ),
  };

  const state = manager.getUIState();

  const queries = {
    isLoading: useCallback(
      (operationId?: string) => manager.isLoading(operationId),
      [manager]
    ),
    isCalculating: manager.isCalculating(),
    isCalculatingLive: manager.isCalculatingLive(),
    getLastError: manager.getLastError(),
    getCorrelationId: manager.getCorrelationId(),
    getSavedValuationId: manager.getSavedValuationId(),
    hasErrors: manager.hasErrors(),
    activeLoadings: manager.getActiveLoadings(),
    interactionStats: manager.getInteractionStats(),
    activitySummary: manager.getActivitySummary(),
    uiHistory: (manager as any).getUIHistory?.() || [],
  };

  return {
    manager,
    state,
    actions,
    queries,
  };
};

