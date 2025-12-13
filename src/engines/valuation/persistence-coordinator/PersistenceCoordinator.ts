/**
 * PersistenceCoordinator Engine - Backend Persistence Coordination
 *
 * Single Responsibility: Coordinate backend persistence operations, handle saves, loads, and sync
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/valuation/persistence-coordinator/PersistenceCoordinator
 */

import { useCallback, useMemo } from 'react';
import type { ValuationFormData, ValuationResponse, ValuationRequest } from '../../../types/valuation';
import { storeLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PersistenceConfig {
  autoSave?: boolean;
  saveDebounceMs?: number;
  enableOfflineSupport?: boolean;
  maxRetries?: number;
  retryDelayMs?: number;
}

export interface SaveOptions {
  businessId?: string;
  skipValidation?: boolean;
  priority?: 'low' | 'normal' | 'high';
  metadata?: Record<string, any>;
}

export interface PersistenceResult {
  success: boolean;
  data?: any;
  error?: string;
  savedId?: string;
  timestamp: number;
  duration: number;
  retryCount?: number;
}

export interface PersistenceState {
  isSaving: boolean;
  lastSaveTime: number | null;
  pendingSaves: number;
  unsavedChanges: boolean;
  offlineMode: boolean;
  lastError: string | null;
}

export interface PersistenceCoordinator {
  // Persistence state
  getPersistenceState(): PersistenceState;
  isSaving(): boolean;
  hasUnsavedChanges(): boolean;

  // Save operations
  saveToBackend(formData: ValuationFormData, result?: ValuationResponse, options?: SaveOptions): Promise<PersistenceResult>;
  savePartialData(data: Partial<ValuationRequest>): Promise<PersistenceResult>;
  saveResult(result: ValuationResponse, metadata?: Record<string, any>): Promise<PersistenceResult>;

  // Load operations
  loadSavedValuation(valuationId: string): Promise<PersistenceResult>;
  loadUserValuations(userId?: string): Promise<PersistenceResult>;

  // Sync operations
  syncWithBackend(): Promise<PersistenceResult>;
  getLastSyncTime(): number | null;

  // Offline support
  enableOfflineMode(): void;
  disableOfflineMode(): void;
  isOfflineMode(): boolean;
  getOfflineQueue(): any[];

  // Error handling
  getLastError(): string | null;
  clearError(): void;
  retryLastOperation(): Promise<PersistenceResult>;

  // Cleanup
  clearPendingOperations(): void;
  resetState(): void;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class PersistenceCoordinatorImpl implements PersistenceCoordinator {
  private config: PersistenceConfig;
  private persistenceState: PersistenceState;
  private offlineQueue: any[] = [];
  private lastOperation: { type: string; params: any[] } | null = null;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor(config: PersistenceConfig = {}) {
    this.config = {
      autoSave: true,
      saveDebounceMs: 2000,
      enableOfflineSupport: false,
      maxRetries: 3,
      retryDelayMs: 1000,
      ...config,
    };

    this.persistenceState = {
      isSaving: false,
      lastSaveTime: null,
      pendingSaves: 0,
      unsavedChanges: false,
      offlineMode: false,
      lastError: null,
    };
  }

  /**
   * Get current persistence state
   */
  getPersistenceState(): PersistenceState {
    return { ...this.persistenceState };
  }

  /**
   * Check if currently saving
   */
  isSaving(): boolean {
    return this.persistenceState.isSaving;
  }

  /**
   * Check if there are unsaved changes
   */
  hasUnsavedChanges(): boolean {
    return this.persistenceState.unsavedChanges;
  }

  /**
   * Save complete valuation to backend
   */
  async saveToBackend(
    formData: ValuationFormData,
    result?: ValuationResponse,
    options: SaveOptions = {}
  ): Promise<PersistenceResult> {
    const startTime = Date.now();

    try {
      this.persistenceState.isSaving = true;
      this.persistenceState.pendingSaves++;
      this.persistenceState.unsavedChanges = false;

      storeLogger.info('[PersistenceCoordinator] Saving valuation to backend', {
        hasResult: !!result,
        businessId: options.businessId,
        priority: options.priority,
      });

      // Prepare data for backend
      const saveData = this.prepareSaveData(formData, result, options);

      // Execute save operation with retry logic
      const resultData = await this.executeWithRetry(
        () => this.performBackendSave(saveData),
        this.config.maxRetries || 3
      );

      // Update state
      this.persistenceState.lastSaveTime = Date.now();
      this.persistenceState.pendingSaves--;

      const persistenceResult: PersistenceResult = {
        success: true,
        data: resultData,
        savedId: resultData.id,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };

      storeLogger.info('[PersistenceCoordinator] Valuation saved successfully', {
        savedId: resultData.id,
        duration: persistenceResult.duration,
      });

      return persistenceResult;

    } catch (error) {
      this.persistenceState.isSaving = false;
      this.persistenceState.pendingSaves--;
      this.persistenceState.lastError = error instanceof Error ? error.message : 'Save failed';

      const persistenceResult: PersistenceResult = {
        success: false,
        error: this.persistenceState.lastError,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };

      storeLogger.error('[PersistenceCoordinator] Save failed', {
        error: persistenceResult.error,
        duration: persistenceResult.duration,
      });

      return persistenceResult;

    } finally {
      this.persistenceState.isSaving = false;
    }
  }

  /**
   * Save partial data changes
   */
  async savePartialData(data: Partial<ValuationRequest>): Promise<PersistenceResult> {
    const startTime = Date.now();

    try {
      storeLogger.debug('[PersistenceCoordinator] Saving partial data', {
        fields: Object.keys(data),
      });

      // Execute partial save
      const result = await this.executeWithRetry(
        () => this.performPartialSave(data),
        this.config.maxRetries || 3
      );

      return {
        success: true,
        data: result,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Partial save failed';

      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Save valuation result
   */
  async saveResult(result: ValuationResponse, metadata?: Record<string, any>): Promise<PersistenceResult> {
    const startTime = Date.now();

    try {
      storeLogger.debug('[PersistenceCoordinator] Saving valuation result', {
        valuationId: result.valuation_id,
        methodology: result.methodology,
      });

      const resultData = await this.executeWithRetry(
        () => this.performResultSave(result, metadata),
        this.config.maxRetries || 3
      );

      return {
        success: true,
        data: resultData,
        savedId: result.valuation_id,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Result save failed';

      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Load saved valuation
   */
  async loadSavedValuation(valuationId: string): Promise<PersistenceResult> {
    const startTime = Date.now();

    try {
      storeLogger.debug('[PersistenceCoordinator] Loading saved valuation', {
        valuationId,
      });

      const result = await this.executeWithRetry(
        () => this.performValuationLoad(valuationId),
        this.config.maxRetries || 3
      );

      return {
        success: true,
        data: result,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Load failed';

      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Load user valuations
   */
  async loadUserValuations(userId?: string): Promise<PersistenceResult> {
    const startTime = Date.now();

    try {
      storeLogger.debug('[PersistenceCoordinator] Loading user valuations', {
        userId,
      });

      const result = await this.executeWithRetry(
        () => this.performUserValuationsLoad(userId),
        this.config.maxRetries || 3
      );

      return {
        success: true,
        data: result,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'User valuations load failed';

      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Sync with backend
   */
  async syncWithBackend(): Promise<PersistenceResult> {
    const startTime = Date.now();

    try {
      storeLogger.debug('[PersistenceCoordinator] Syncing with backend');

      // Process offline queue if in offline mode
      if (this.persistenceState.offlineMode && this.offlineQueue.length > 0) {
        await this.processOfflineQueue();
      }

      // Perform sync operation
      const result = await this.executeWithRetry(
        () => this.performBackendSync(),
        this.config.maxRetries || 3
      );

      this.persistenceState.lastSaveTime = Date.now();

      return {
        success: true,
        data: result,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';

      return {
        success: false,
        error: errorMessage,
        timestamp: Date.now(),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): number | null {
    return this.persistenceState.lastSaveTime;
  }

  /**
   * Enable offline mode
   */
  enableOfflineMode(): void {
    this.persistenceState.offlineMode = true;
    storeLogger.info('[PersistenceCoordinator] Offline mode enabled');
  }

  /**
   * Disable offline mode
   */
  disableOfflineMode(): void {
    this.persistenceState.offlineMode = false;
    storeLogger.info('[PersistenceCoordinator] Offline mode disabled');
  }

  /**
   * Check if in offline mode
   */
  isOfflineMode(): boolean {
    return this.persistenceState.offlineMode;
  }

  /**
   * Get offline queue
   */
  getOfflineQueue(): any[] {
    return [...this.offlineQueue];
  }

  /**
   * Get last error
   */
  getLastError(): string | null {
    return this.persistenceState.lastError;
  }

  /**
   * Clear last error
   */
  clearError(): void {
    this.persistenceState.lastError = null;
  }

  /**
   * Retry last operation
   */
  async retryLastOperation(): Promise<PersistenceResult> {
    if (!this.lastOperation) {
      throw new Error('No operation to retry');
    }

    const { type, params } = this.lastOperation;

    switch (type) {
      case 'saveToBackend':
        return this.saveToBackend(...params);
      case 'savePartialData':
        return this.savePartialData(...params);
      case 'saveResult':
        return this.saveResult(...params);
      case 'loadSavedValuation':
        return this.loadSavedValuation(...params);
      case 'loadUserValuations':
        return this.loadUserValuations(...params);
      case 'syncWithBackend':
        return this.syncWithBackend();
      default:
        throw new Error(`Unknown operation type: ${type}`);
    }
  }

  /**
   * Clear pending operations
   */
  clearPendingOperations(): void {
    this.persistenceState.pendingSaves = 0;
    this.offlineQueue = [];

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    storeLogger.info('[PersistenceCoordinator] Pending operations cleared');
  }

  /**
   * Reset persistence state
   */
  resetState(): void {
    this.persistenceState = {
      isSaving: false,
      lastSaveTime: null,
      pendingSaves: 0,
      unsavedChanges: false,
      offlineMode: false,
      lastError: null,
    };

    this.offlineQueue = [];
    this.lastOperation = null;

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    storeLogger.info('[PersistenceCoordinator] State reset');
  }

  // Private helper methods
  private prepareSaveData(
    formData: ValuationFormData,
    result?: ValuationResponse,
    options?: SaveOptions
  ): any {
    return {
      formData,
      result,
      businessId: options?.businessId,
      metadata: options?.metadata,
      timestamp: new Date().toISOString(),
    };
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number,
    currentRetry: number = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (currentRetry < maxRetries) {
        const delay = (this.config.retryDelayMs || 1000) * Math.pow(2, currentRetry);
        storeLogger.warn(`[PersistenceCoordinator] Operation failed, retrying in ${delay}ms`, {
          attempt: currentRetry + 1,
          maxRetries,
          error: error instanceof Error ? error.message : 'Unknown error',
        });

        await new Promise(resolve => setTimeout(resolve, delay));
        return this.executeWithRetry(operation, maxRetries, currentRetry + 1);
      }

      throw error;
    }
  }

  private async performBackendSave(saveData: any): Promise<any> {
    // In real implementation, this would call backendAPI.saveValuation(saveData)
    // For now, simulate successful save
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    return {
      id: `saved_${Date.now()}`,
      ...saveData,
      savedAt: new Date().toISOString(),
    };
  }

  private async performPartialSave(data: Partial<ValuationRequest>): Promise<any> {
    // In real implementation, this would call backendAPI.updateValuationData(data)
    await new Promise(resolve => setTimeout(resolve, 200));

    return {
      updatedFields: Object.keys(data),
      timestamp: new Date().toISOString(),
    };
  }

  private async performResultSave(result: ValuationResponse, metadata?: Record<string, any>): Promise<any> {
    // In real implementation, this would call backendAPI.saveValuationResult(result, metadata)
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      valuationId: result.valuation_id,
      saved: true,
      metadata,
      timestamp: new Date().toISOString(),
    };
  }

  private async performValuationLoad(valuationId: string): Promise<any> {
    // In real implementation, this would call backendAPI.getValuation(valuationId)
    await new Promise(resolve => setTimeout(resolve, 300));

    return {
      valuationId,
      loaded: true,
      timestamp: new Date().toISOString(),
    };
  }

  private async performUserValuationsLoad(userId?: string): Promise<any> {
    // In real implementation, this would call backendAPI.getUserValuations(userId)
    await new Promise(resolve => setTimeout(resolve, 400));

    return {
      userId,
      valuations: [],
      count: 0,
      timestamp: new Date().toISOString(),
    };
  }

  private async performBackendSync(): Promise<any> {
    // In real implementation, this would sync local state with backend
    await new Promise(resolve => setTimeout(resolve, 600));

    return {
      synced: true,
      changes: [],
      timestamp: new Date().toISOString(),
    };
  }

  private async processOfflineQueue(): Promise<void> {
    storeLogger.info('[PersistenceCoordinator] Processing offline queue', {
      queueSize: this.offlineQueue.length,
    });

    // Process queued operations
    for (const operation of this.offlineQueue) {
      try {
        await this.executeWithRetry(
          () => operation.execute(),
          this.config.maxRetries || 3
        );
      } catch (error) {
        storeLogger.error('[PersistenceCoordinator] Offline operation failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    this.offlineQueue = [];
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UsePersistenceCoordinatorResult {
  coordinator: PersistenceCoordinator;
  state: PersistenceState;
  actions: {
    saveToBackend: (formData: ValuationFormData, result?: ValuationResponse, options?: SaveOptions) => Promise<PersistenceResult>;
    savePartialData: (data: Partial<ValuationRequest>) => Promise<PersistenceResult>;
    saveResult: (result: ValuationResponse, metadata?: Record<string, any>) => Promise<PersistenceResult>;
    loadSavedValuation: (valuationId: string) => Promise<PersistenceResult>;
    loadUserValuations: (userId?: string) => Promise<PersistenceResult>;
    syncWithBackend: () => Promise<PersistenceResult>;
    retryLastOperation: () => Promise<PersistenceResult>;
    clearError: () => void;
    clearPendingOperations: () => void;
    resetState: () => void;
  };
  offline: {
    enableOfflineMode: () => void;
    disableOfflineMode: () => void;
    isOfflineMode: boolean;
    offlineQueue: any[];
  };
  queries: {
    isSaving: boolean;
    hasUnsavedChanges: boolean;
    lastError: string | null;
    lastSyncTime: number | null;
  };
}

/**
 * usePersistenceCoordinator Hook
 *
 * React hook interface for PersistenceCoordinator engine
 * Provides reactive backend persistence coordination
 */
export const usePersistenceCoordinator = (
  config?: PersistenceConfig
): UsePersistenceCoordinatorResult => {
  const coordinator = useMemo(() => new PersistenceCoordinatorImpl(config), [config]);

  const actions = {
    saveToBackend: useCallback(
      (formData: ValuationFormData, result?: ValuationResponse, options?: SaveOptions) =>
        coordinator.saveToBackend(formData, result, options),
      [coordinator]
    ),
    savePartialData: useCallback(
      (data: Partial<ValuationRequest>) => coordinator.savePartialData(data),
      [coordinator]
    ),
    saveResult: useCallback(
      (result: ValuationResponse, metadata?: Record<string, any>) =>
        coordinator.saveResult(result, metadata),
      [coordinator]
    ),
    loadSavedValuation: useCallback(
      (valuationId: string) => coordinator.loadSavedValuation(valuationId),
      [coordinator]
    ),
    loadUserValuations: useCallback(
      (userId?: string) => coordinator.loadUserValuations(userId),
      [coordinator]
    ),
    syncWithBackend: useCallback(() => coordinator.syncWithBackend(), [coordinator]),
    retryLastOperation: useCallback(() => coordinator.retryLastOperation(), [coordinator]),
    clearError: useCallback(() => coordinator.clearError(), [coordinator]),
    clearPendingOperations: useCallback(() => coordinator.clearPendingOperations(), [coordinator]),
    resetState: useCallback(() => coordinator.resetState(), [coordinator]),
  };

  const state = coordinator.getPersistenceState();

  const offline = {
    enableOfflineMode: useCallback(() => coordinator.enableOfflineMode(), [coordinator]),
    disableOfflineMode: useCallback(() => coordinator.disableOfflineMode(), [coordinator]),
    isOfflineMode: coordinator.isOfflineMode(),
    offlineQueue: coordinator.getOfflineQueue(),
  };

  const queries = {
    isSaving: coordinator.isSaving(),
    hasUnsavedChanges: coordinator.hasUnsavedChanges(),
    lastError: coordinator.getLastError(),
    lastSyncTime: coordinator.getLastSyncTime(),
  };

  return {
    coordinator,
    state,
    actions,
    offline,
    queries,
  };
};
