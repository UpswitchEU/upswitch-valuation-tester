/**
 * StateManager Engine - State Management & Throttling
 *
 * Single Responsibility: Manage Zustand store state, handle throttling, provide reactive state updates
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/session/state-manager/StateManager
 */

import { useCallback, useMemo } from 'react';
import type { ValuationSession } from '../../../types/valuation';
import { storeLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface StateManagerConfig {
  updateThrottleMs?: number;
  maxRetries?: number;
  enableOptimisticUpdates?: boolean;
  stateValidation?: boolean;
}

export interface StateUpdate {
  type: 'session' | 'partial_data' | 'view_switch' | 'sync_status';
  payload: any;
  timestamp: number;
  source: string;
}

export interface ThrottledUpdate {
  execute: () => Promise<void>;
  cancel: () => void;
  isPending: boolean;
  lastExecuted: number;
}

export interface StateManager {
  // State operations
  getState(): StateSnapshot;
  updateState(update: StateUpdate): void;
  resetState(): void;

  // Throttled operations
  throttledUpdate(updateFn: () => Promise<void>, key?: string): ThrottledUpdate;
  cancelThrottledUpdate(key?: string): void;

  // Validation
  validateState(): StateValidationResult;
  repairState(): StateValidationResult;

  // State queries
  isDirty(): boolean;
  getPendingUpdates(): ThrottledUpdate[];
  getUpdateHistory(): StateUpdate[];

  // Optimistic updates
  enableOptimisticUpdates(): void;
  disableOptimisticUpdates(): void;
  revertOptimisticUpdate(updateId: string): void;
}

// ============================================================================
// STATE SNAPSHOT TYPE
// ============================================================================

export interface StateSnapshot {
  session: ValuationSession | null;
  isSyncing: boolean;
  syncError: string | null;
  pendingFlowSwitch: 'manual' | 'conversational' | null;
  lastUpdate: number;
  version: number;
}

// ============================================================================
// STATE VALIDATION RESULT TYPE
// ============================================================================

export interface StateValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  repairs: string[];
  repaired: boolean;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class StateManagerImpl implements StateManager {
  private config: StateManagerConfig;
  private currentState: StateSnapshot;
  private updateHistory: StateUpdate[] = [];
  private throttledUpdates: Map<string, ThrottledUpdate> = new Map();
  private optimisticUpdates: Map<string, StateSnapshot> = new Map();
  private maxHistorySize = 100;
  private stateVersion = 1;

  constructor(config: StateManagerConfig = {}) {
    this.config = {
      updateThrottleMs: 2000,
      maxRetries: 3,
      enableOptimisticUpdates: true,
      stateValidation: true,
      ...config,
    };

    this.currentState = {
      session: null,
      isSyncing: false,
      syncError: null,
      pendingFlowSwitch: null,
      lastUpdate: Date.now(),
      version: this.stateVersion,
    };
  }

  /**
   * Get current state snapshot
   */
  getState(): StateSnapshot {
    return { ...this.currentState };
  }

  /**
   * Update state with validation and history tracking
   */
  updateState(update: StateUpdate): void {
    try {
      storeLogger.debug('[StateManager] Processing state update', {
        type: update.type,
        source: update.source,
        hasPayload: !!update.payload,
      });

      // Create optimistic update if enabled
      let optimisticId: string | undefined;
      if (this.config.enableOptimisticUpdates) {
        optimisticId = this.createOptimisticUpdate(update);
      }

      // Apply the update
      const newState = this.applyStateUpdate(update);

      // Validate state if enabled
      if (this.config.stateValidation) {
        const validation = this.validateStateSnapshot(newState);
        if (!validation.isValid) {
          storeLogger.warn('[StateManager] State validation failed', {
            errors: validation.errors,
            updateType: update.type,
          });

          // Revert optimistic update if validation failed
          if (optimisticId) {
            this.revertOptimisticUpdate(optimisticId);
          }

          throw new Error(`State validation failed: ${validation.errors.join(', ')}`);
        }
      }

      // Update state
      this.currentState = {
        ...newState,
        lastUpdate: Date.now(),
        version: ++this.stateVersion,
      };

      // Track update in history
      this.updateHistory.push(update);
      if (this.updateHistory.length > this.maxHistorySize) {
        this.updateHistory = this.updateHistory.slice(-this.maxHistorySize);
      }

      // Clean up optimistic update
      if (optimisticId) {
        this.optimisticUpdates.delete(optimisticId);
      }

      storeLogger.debug('[StateManager] State update applied successfully', {
        newVersion: this.currentState.version,
        sessionExists: !!this.currentState.session,
      });

    } catch (error) {
      storeLogger.error('[StateManager] State update failed', {
        type: update.type,
        source: update.source,
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      throw error;
    }
  }

  /**
   * Reset state to initial values
   */
  resetState(): void {
    this.currentState = {
      session: null,
      isSyncing: false,
      syncError: null,
      pendingFlowSwitch: null,
      lastUpdate: Date.now(),
      version: ++this.stateVersion,
    };

    this.updateHistory = [];
    this.throttledUpdates.clear();
    this.optimisticUpdates.clear();

    storeLogger.info('[StateManager] State reset to initial values');
  }

  /**
   * Create throttled update to prevent excessive API calls
   */
  throttledUpdate(updateFn: () => Promise<void>, key: string = 'default'): ThrottledUpdate {
    const existing = this.throttledUpdates.get(key);

    if (existing && existing.isPending) {
      // Update the function but keep existing timeout
      existing.execute = updateFn;
      return existing;
    }

    let timeoutId: NodeJS.Timeout;
    let isCancelled = false;
    let lastExecuted = existing?.lastExecuted || 0;

    const throttledUpdate: ThrottledUpdate = {
      execute: async () => {
        if (isCancelled) return;

        try {
          await updateFn();
          lastExecuted = Date.now();
          throttledUpdate.lastExecuted = lastExecuted;

          storeLogger.debug('[StateManager] Throttled update executed', {
            key,
            lastExecuted,
          });

        } catch (error) {
          storeLogger.error('[StateManager] Throttled update failed', {
            key,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        } finally {
          this.throttledUpdates.delete(key);
        }
      },

      cancel: () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
          isCancelled = true;
          this.throttledUpdates.delete(key);

          storeLogger.debug('[StateManager] Throttled update cancelled', { key });
        }
      },

      get isPending(): boolean {
        return !!timeoutId && !isCancelled;
      },

      get lastExecuted(): number {
        return lastExecuted;
      },

      set lastExecuted(value: number) {
        lastExecuted = value;
      },
    };

    // Set up throttled execution
    timeoutId = setTimeout(() => {
      if (!isCancelled) {
        throttledUpdate.execute();
      }
    }, this.config.updateThrottleMs);

    this.throttledUpdates.set(key, throttledUpdate);

    storeLogger.debug('[StateManager] Throttled update scheduled', {
      key,
      delay: this.config.updateThrottleMs,
    });

    return throttledUpdate;
  }

  /**
   * Cancel throttled update
   */
  cancelThrottledUpdate(key?: string): void {
    if (key) {
      const update = this.throttledUpdates.get(key);
      if (update) {
        update.cancel();
      }
    } else {
      // Cancel all throttled updates
      for (const update of this.throttledUpdates.values()) {
        update.cancel();
      }
      this.throttledUpdates.clear();
    }
  }

  /**
   * Validate current state integrity
   */
  validateState(): StateValidationResult {
    return this.validateStateSnapshot(this.currentState);
  }

  /**
   * Attempt to repair invalid state
   */
  repairState(): StateValidationResult {
    const validation = this.validateState();
    const repairs: string[] = [];

    if (!validation.isValid) {
      // Attempt repairs
      if (!this.currentState.session && validation.errors.includes('Session is required')) {
        // Can't repair missing session
        repairs.push('Cannot repair missing session');
      }

      if (this.currentState.version < 1) {
        this.currentState.version = 1;
        repairs.push('Fixed invalid version number');
      }

      if (this.currentState.lastUpdate > Date.now()) {
        this.currentState.lastUpdate = Date.now();
        repairs.push('Fixed future timestamp');
      }
    }

    return {
      ...validation,
      repairs,
      repaired: repairs.length > 0,
    };
  }

  /**
   * Check if state has unsaved changes
   */
  isDirty(): boolean {
    // Simple dirty check - in real implementation would compare with last saved state
    const lastSaved = this.getLastSavedTimestamp();
    return this.currentState.lastUpdate > lastSaved;
  }

  /**
   * Get all pending throttled updates
   */
  getPendingUpdates(): ThrottledUpdate[] {
    return Array.from(this.throttledUpdates.values()).filter(update => update.isPending);
  }

  /**
   * Get update history
   */
  getUpdateHistory(): StateUpdate[] {
    return [...this.updateHistory];
  }

  /**
   * Enable optimistic updates
   */
  enableOptimisticUpdates(): void {
    this.config.enableOptimisticUpdates = true;
    storeLogger.debug('[StateManager] Optimistic updates enabled');
  }

  /**
   * Disable optimistic updates
   */
  disableOptimisticUpdates(): void {
    this.config.enableOptimisticUpdates = false;
    this.optimisticUpdates.clear();
    storeLogger.debug('[StateManager] Optimistic updates disabled');
  }

  /**
   * Revert optimistic update
   */
  revertOptimisticUpdate(updateId: string): void {
    const optimisticState = this.optimisticUpdates.get(updateId);
    if (optimisticState) {
      this.currentState = { ...optimisticState };
      this.optimisticUpdates.delete(updateId);

      storeLogger.debug('[StateManager] Optimistic update reverted', {
        updateId,
        revertedVersion: optimisticState.version,
      });
    }
  }

  // Private helper methods
  private applyStateUpdate(update: StateUpdate): StateSnapshot {
    const newState = { ...this.currentState };

    switch (update.type) {
      case 'session':
        newState.session = update.payload;
        break;

      case 'partial_data':
        if (newState.session) {
          newState.session = {
            ...newState.session,
            partialData: {
              ...newState.session.partialData,
              ...update.payload,
            },
            updatedAt: new Date(),
          };
        }
        break;

      case 'view_switch':
        if (newState.session) {
          newState.session = {
            ...newState.session,
            currentView: update.payload.view,
            updatedAt: new Date(),
          };
        }
        newState.pendingFlowSwitch = null;
        break;

      case 'sync_status':
        newState.isSyncing = update.payload.isSyncing;
        newState.syncError = update.payload.error;
        break;

      default:
        storeLogger.warn('[StateManager] Unknown update type', {
          type: update.type,
        });
    }

    return newState;
  }

  private validateStateSnapshot(state: StateSnapshot): StateValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (state.lastUpdate > Date.now() + 1000) { // Allow 1 second clock skew
      errors.push('Last update timestamp is in the future');
    }

    if (state.version < 1) {
      errors.push('Version number is invalid');
    }

    // Session validation
    if (state.session) {
      if (!state.session.sessionId) {
        errors.push('Session is missing sessionId');
      }

      if (!state.session.reportId) {
        errors.push('Session is missing reportId');
      }

      if (!['manual', 'conversational'].includes(state.session.currentView)) {
        errors.push('Session has invalid currentView');
      }

      if (!(state.session.createdAt instanceof Date)) {
        errors.push('Session createdAt is not a valid Date');
      }

      if (!(state.session.updatedAt instanceof Date)) {
        errors.push('Session updatedAt is not a valid Date');
      }
    }

    // Warnings
    if (state.syncError && state.isSyncing) {
      warnings.push('Sync error present while syncing is active');
    }

    if (state.pendingFlowSwitch && !['manual', 'conversational'].includes(state.pendingFlowSwitch)) {
      warnings.push('Pending flow switch has invalid value');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      repairs: [],
      repaired: false,
    };
  }

  private createOptimisticUpdate(update: StateUpdate): string | undefined {
    if (!this.config.enableOptimisticUpdates) return undefined;

    const updateId = `optimistic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    this.optimisticUpdates.set(updateId, { ...this.currentState });

    // Apply optimistic update immediately
    try {
      const optimisticState = this.applyStateUpdate(update);
      this.currentState = {
        ...optimisticState,
        lastUpdate: Date.now(),
        version: ++this.stateVersion,
      };

      storeLogger.debug('[StateManager] Optimistic update applied', {
        updateId,
        type: update.type,
      });

    } catch (error) {
      // Revert on error
      this.optimisticUpdates.delete(updateId);
      throw error;
    }

    return updateId;
  }

  private getLastSavedTimestamp(): number {
    // In real implementation, this would track when state was last persisted
    // For now, return 0 to always be "dirty"
    return 0;
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseStateManagerResult {
  manager: StateManager;
  state: StateSnapshot;
  actions: {
    updateState: (update: StateUpdate) => void;
    resetState: () => void;
    throttledUpdate: (updateFn: () => Promise<void>, key?: string) => ThrottledUpdate;
    cancelThrottledUpdate: (key?: string) => void;
    validateState: () => StateValidationResult;
    repairState: () => StateValidationResult;
    enableOptimisticUpdates: () => void;
    disableOptimisticUpdates: () => void;
    revertOptimisticUpdate: (updateId: string) => void;
  };
  queries: {
    isDirty: boolean;
    pendingUpdates: ThrottledUpdate[];
    updateHistory: StateUpdate[];
  };
}

/**
 * useStateManager Hook
 *
 * React hook interface for StateManager engine
 * Provides reactive Zustand-style state management with throttling
 */
export const useStateManager = (
  config?: StateManagerConfig
): UseStateManagerResult => {
  const manager = useMemo(() => new StateManagerImpl(config), [config]);
  const [state, setState] = useMemo(() => {
    let currentState = manager.getState();
    // In real implementation, would subscribe to state changes
    return [currentState, setState] as const;
  }, [manager]);

  const actions = {
    updateState: useCallback(
      (update: StateUpdate) => {
        manager.updateState(update);
        // Update local state
        setState(manager.getState());
      },
      [manager, setState]
    ),
    resetState: useCallback(() => manager.resetState(), [manager]),
    throttledUpdate: useCallback(
      (updateFn: () => Promise<void>, key?: string) => manager.throttledUpdate(updateFn, key),
      [manager]
    ),
    cancelThrottledUpdate: useCallback(
      (key?: string) => manager.cancelThrottledUpdate(key),
      [manager]
    ),
    validateState: useCallback(() => manager.validateState(), [manager]),
    repairState: useCallback(() => manager.repairState(), [manager]),
    enableOptimisticUpdates: useCallback(() => manager.enableOptimisticUpdates(), [manager]),
    disableOptimisticUpdates: useCallback(() => manager.disableOptimisticUpdates(), [manager]),
    revertOptimisticUpdate: useCallback(
      (updateId: string) => manager.revertOptimisticUpdate(updateId),
      [manager]
    ),
  };

  const queries = {
    isDirty: manager.isDirty(),
    pendingUpdates: manager.getPendingUpdates(),
    updateHistory: manager.getUpdateHistory(),
  };

  return {
    manager,
    state,
    actions,
    queries,
  };
};

