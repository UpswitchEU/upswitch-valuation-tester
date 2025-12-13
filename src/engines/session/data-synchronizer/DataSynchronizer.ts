/**
 * DataSynchronizer Engine - Cross-Flow Data Synchronization
 *
 * Single Responsibility: Synchronize data between manual and conversational flows
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/session/data-synchronizer/DataSynchronizer
 */

import { useCallback, useMemo } from 'react';
import type { ValuationRequest, ValuationSession } from '../../../types/valuation';
import { storeLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SynchronizationConfig {
  enableAutoSync?: boolean;
  syncDebounceMs?: number;
  conflictResolution?: 'manual' | 'last_wins' | 'merge';
  maxRetries?: number;
}

export interface SyncOperation {
  id: string;
  type: 'pull' | 'push' | 'merge';
  source: 'manual' | 'conversational' | 'session';
  target: 'manual' | 'conversational' | 'session';
  fields: string[];
  timestamp: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
}

export interface SyncResult {
  success: boolean;
  operations: SyncOperation[];
  conflicts: SyncConflict[];
  errors: string[];
  syncedFields: string[];
}

export interface SyncConflict {
  field: string;
  sourceValue: any;
  targetValue: any;
  resolution: 'keep_source' | 'keep_target' | 'merge' | 'manual';
  resolvedValue?: any;
}

export interface DataSynchronizer {
  // Synchronization operations
  syncFromSource(source: 'manual' | 'conversational', session: ValuationSession): Promise<SyncResult>;
  syncToTarget(target: 'manual' | 'conversational', session: ValuationSession): Promise<SyncResult>;
  syncBidirectional(session: ValuationSession): Promise<SyncResult>;

  // Conflict resolution
  resolveConflicts(conflicts: SyncConflict[]): SyncConflict[];
  detectConflicts(sourceData: ValuationRequest, targetData: ValuationRequest): SyncConflict[];

  // Data transformation
  extractFormData(session: ValuationSession): ValuationRequest;
  applyToSession(data: ValuationRequest, session: ValuationSession): ValuationSession;

  // Validation
  validateSyncData(data: ValuationRequest): { isValid: boolean; errors: string[] };

  // State queries
  getSyncStatus(): SyncStatus;
  getLastSyncResult(): SyncResult | null;
  isSyncing(): boolean;
}

// ============================================================================
// SYNC STATUS TYPE
// ============================================================================

export interface SyncStatus {
  isActive: boolean;
  lastSyncTime?: number;
  pendingOperations: number;
  failedOperations: number;
  totalOperations: number;
  averageSyncTime: number;
}

// ============================================================================
// FIELD MAPPING DEFINITIONS
// ============================================================================

const FORM_FIELD_MAPPING: Record<string, string> = {
  // Basic company info
  'company_name': 'company_name',
  'business_type': 'business_type',
  'country_code': 'country_code',
  'founding_year': 'founding_year',

  // Financial data
  'revenue': 'revenue',
  'ebitda': 'ebitda',

  // Current year data
  'current_year_revenue': 'current_year_data.revenue',
  'current_year_ebitda': 'current_year_data.ebitda',
  'current_year_net_income': 'current_year_data.net_income',

  // Historical data (simplified mapping)
  'historical_data': 'historical_years_data',
};

const CONVERSATION_FIELD_MAPPING: Record<string, string> = {
  // Reverse mapping for conversation to form
  'company_name': 'company_name',
  'business_type': 'business_type',
  'country': 'country_code',
  'founding_year': 'founding_year',
  'revenue': 'revenue',
  'ebitda': 'ebitda',
};

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class DataSynchronizerImpl implements DataSynchronizer {
  private config: SynchronizationConfig;
  private syncHistory: SyncResult[] = [];
  private maxHistorySize = 10;
  private currentSyncStatus: SyncStatus = {
    isActive: false,
    pendingOperations: 0,
    failedOperations: 0,
    totalOperations: 0,
    averageSyncTime: 0,
  };

  constructor(config: SynchronizationConfig = {}) {
    this.config = {
      enableAutoSync: true,
      syncDebounceMs: 1000,
      conflictResolution: 'last_wins',
      maxRetries: 3,
      ...config,
    };
  }

  /**
   * Sync data from source flow to session
   */
  async syncFromSource(source: 'manual' | 'conversational', session: ValuationSession): Promise<SyncResult> {
    const startTime = Date.now();
    this.currentSyncStatus.isActive = true;

    try {
      storeLogger.info('[DataSynchronizer] Starting sync from source', {
        source,
        sessionId: session.sessionId,
        reportId: session.reportId,
      });

      let sourceData: ValuationRequest;

      if (source === 'manual') {
        // In real implementation, this would get data from manual form store
        // For now, we'll simulate getting form data
        sourceData = this.extractFormData(session);
      } else {
        // In real implementation, this would get data from conversation context
        sourceData = this.extractConversationData(session);
      }

      // Validate source data
      const validation = this.validateSyncData(sourceData);
      if (!validation.isValid) {
        throw new Error(`Invalid source data: ${validation.errors.join(', ')}`);
      }

      // Apply to session
      const updatedSession = this.applyToSession(sourceData, session);

      // Create sync operation record
      const operation: SyncOperation = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'pull',
        source,
        target: 'session',
        fields: this.getChangedFields(session.partialData as ValuationRequest, sourceData),
        timestamp: startTime,
        status: 'completed',
      };

      const result: SyncResult = {
        success: true,
        operations: [operation],
        conflicts: [],
        errors: [],
        syncedFields: operation.fields,
      };

      this.recordSyncResult(result);
      this.updateSyncStatus(startTime);

      storeLogger.info('[DataSynchronizer] Sync completed successfully', {
        source,
        sessionId: session.sessionId,
        syncedFields: result.syncedFields.length,
        duration: Date.now() - startTime,
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';

      const result: SyncResult = {
        success: false,
        operations: [],
        conflicts: [],
        errors: [errorMessage],
        syncedFields: [],
      };

      this.recordSyncResult(result);
      this.updateSyncStatus(startTime);

      storeLogger.error('[DataSynchronizer] Sync failed', {
        source,
        sessionId: session.sessionId,
        error: errorMessage,
        duration: Date.now() - startTime,
      });

      throw error;
    } finally {
      this.currentSyncStatus.isActive = false;
    }
  }

  /**
   * Sync data from session to target flow
   */
  async syncToTarget(target: 'manual' | 'conversational', session: ValuationSession): Promise<SyncResult> {
    const startTime = Date.now();
    this.currentSyncStatus.isActive = true;

    try {
      storeLogger.info('[DataSynchronizer] Starting sync to target', {
        target,
        sessionId: session.sessionId,
        reportId: session.reportId,
      });

      const sessionData = this.extractFormData(session);

      // In real implementation, this would update the target flow's state
      // For manual flow: update useValuationStore
      // For conversational flow: update conversation context

      const operation: SyncOperation = {
        id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'push',
        source: 'session',
        target,
        fields: Object.keys(sessionData),
        timestamp: startTime,
        status: 'completed',
      };

      const result: SyncResult = {
        success: true,
        operations: [operation],
        conflicts: [],
        errors: [],
        syncedFields: operation.fields,
      };

      this.recordSyncResult(result);
      this.updateSyncStatus(startTime);

      storeLogger.info('[DataSynchronizer] Sync to target completed', {
        target,
        sessionId: session.sessionId,
        syncedFields: result.syncedFields.length,
        duration: Date.now() - startTime,
      });

      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';

      const result: SyncResult = {
        success: false,
        operations: [],
        conflicts: [],
        errors: [errorMessage],
        syncedFields: [],
      };

      this.recordSyncResult(result);
      this.updateSyncStatus(startTime);

      storeLogger.error('[DataSynchronizer] Sync to target failed', {
        target,
        sessionId: session.sessionId,
        error: errorMessage,
        duration: Date.now() - startTime,
      });

      throw error;
    } finally {
      this.currentSyncStatus.isActive = false;
    }
  }

  /**
   * Bidirectional synchronization
   */
  async syncBidirectional(session: ValuationSession): Promise<SyncResult> {
    const results: SyncResult[] = [];

    // Sync from manual to session
    try {
      const manualResult = await this.syncFromSource('manual', session);
      results.push(manualResult);
    } catch (error) {
      storeLogger.warn('[DataSynchronizer] Manual sync failed in bidirectional sync', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Sync from conversational to session
    try {
      const conversationResult = await this.syncFromSource('conversational', session);
      results.push(conversationResult);
    } catch (error) {
      storeLogger.warn('[DataSynchronizer] Conversation sync failed in bidirectional sync', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Combine results
    const combinedResult: SyncResult = {
      success: results.every(r => r.success),
      operations: results.flatMap(r => r.operations),
      conflicts: results.flatMap(r => r.conflicts),
      errors: results.flatMap(r => r.errors),
      syncedFields: results.flatMap(r => r.syncedFields),
    };

    storeLogger.info('[DataSynchronizer] Bidirectional sync completed', {
      sessionId: session.sessionId,
      operations: combinedResult.operations.length,
      conflicts: combinedResult.conflicts.length,
      errors: combinedResult.errors.length,
    });

    return combinedResult;
  }

  /**
   * Resolve synchronization conflicts
   */
  resolveConflicts(conflicts: SyncConflict[]): SyncConflict[] {
    return conflicts.map(conflict => {
      switch (this.config.conflictResolution) {
        case 'last_wins':
          // Keep the most recent value (would need timestamp comparison)
          return { ...conflict, resolution: 'keep_source', resolvedValue: conflict.sourceValue };

        case 'merge':
          // Attempt to merge values if they're compatible
          if (this.canMergeValues(conflict.sourceValue, conflict.targetValue)) {
            return {
              ...conflict,
              resolution: 'merge',
              resolvedValue: this.mergeValues(conflict.sourceValue, conflict.targetValue),
            };
          }
          return { ...conflict, resolution: 'keep_source', resolvedValue: conflict.sourceValue };

        case 'manual':
        default:
          // Require manual resolution
          return { ...conflict, resolution: 'manual' };
      }
    });
  }

  /**
   * Detect conflicts between source and target data
   */
  detectConflicts(sourceData: ValuationRequest, targetData: ValuationRequest): SyncConflict[] {
    const conflicts: SyncConflict[] = [];
    const allFields = new Set([...Object.keys(sourceData), ...Object.keys(targetData)]);

    for (const field of allFields) {
      const sourceValue = (sourceData as any)[field];
      const targetValue = (targetData as any)[field];

      // Check if both have values and they're different
      if (sourceValue !== undefined && targetValue !== undefined &&
          sourceValue !== null && targetValue !== null &&
          !this.areValuesEqual(sourceValue, targetValue)) {

        conflicts.push({
          field,
          sourceValue,
          targetValue,
          resolution: 'manual', // Default to manual resolution
        });
      }
    }

    return conflicts;
  }

  /**
   * Extract form data from session
   */
  extractFormData(session: ValuationSession): ValuationRequest {
    const partialData = session.partialData as any;

    return {
      company_name: partialData.company_name || '',
      country_code: partialData.country_code || 'BE',
      industry: 'Unknown', // TODO: Map from business_type or add to form
      business_model: 'Unknown', // TODO: Map from business_type or add to form
      founding_year: partialData.founding_year || undefined,
      revenue: partialData.revenue || undefined,
      current_year_data: {
        year: partialData.current_year_data?.year || new Date().getFullYear(),
        revenue: partialData.current_year_data?.revenue || partialData.current_year_revenue || 0,
        ebitda: partialData.current_year_data?.ebitda || partialData.current_year_ebitda || 0,
        net_income: partialData.current_year_data?.net_income || partialData.current_year_net_income || 0,
      },
      historical_years_data: partialData.historical_years_data || partialData.historical_data || [],
    };
  }

  /**
   * Apply data to session
   */
  applyToSession(data: ValuationRequest, session: ValuationSession): ValuationSession {
    return {
      ...session,
      partialData: {
        ...session.partialData,
        ...data,
      },
      updatedAt: new Date(),
      lastSyncedAt: new Date(),
    };
  }

  /**
   * Validate sync data structure
   */
  validateSyncData(data: ValuationRequest): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required field validation
    if (!data.company_name?.trim()) {
      errors.push('Company name is required');
    }

    if (!data.business_type?.trim()) {
      errors.push('Business type is required');
    }

    // Data type validation
    if (data.founding_year !== undefined && (typeof data.founding_year !== 'number' || data.founding_year < 1800)) {
      errors.push('Founding year must be a valid year');
    }

    if (data.revenue !== undefined && (typeof data.revenue !== 'number' || data.revenue < 0)) {
      errors.push('Revenue must be a non-negative number');
    }

    if (data.current_year_data?.ebitda !== undefined && typeof data.current_year_data.ebitda !== 'number') {
      errors.push('EBITDA must be a number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.currentSyncStatus };
  }

  /**
   * Get last sync result
   */
  getLastSyncResult(): SyncResult | null {
    return this.syncHistory.length > 0 ? this.syncHistory[this.syncHistory.length - 1] : null;
  }

  /**
   * Check if currently syncing
   */
  isSyncing(): boolean {
    return this.currentSyncStatus.isActive;
  }

  // Private helper methods
  private extractConversationData(session: ValuationSession): ValuationRequest {
    // In real implementation, this would extract data from conversation context
    // For now, return basic structure
    const partialData = session.partialData as any;

    return {
      company_name: partialData.company_name || '',
      country_code: partialData.country_code || 'BE',
      industry: 'Unknown', // TODO: Map from business_type or add to form
      business_model: 'Unknown', // TODO: Map from business_type or add to form
      founding_year: partialData.founding_year || undefined,
      revenue: partialData.revenue || undefined,
      current_year_data: partialData.current_year_data || {},
      historical_years_data: partialData.historical_years_data || [],
    };
  }

  private getChangedFields(oldData: ValuationRequest, newData: ValuationRequest): string[] {
    const changedFields: string[] = [];
    const allFields = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const field of allFields) {
      if (!this.areValuesEqual((oldData as any)[field], (newData as any)[field])) {
        changedFields.push(field);
      }
    }

    return changedFields;
  }

  private areValuesEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== typeof b) return false;

    if (typeof a === 'object') {
      return JSON.stringify(a) === JSON.stringify(b);
    }

    return false;
  }

  private canMergeValues(source: any, target: any): boolean {
    // Simple merge logic - can be extended
    if (typeof source === 'object' && typeof target === 'object') {
      return true; // Can merge objects
    }
    return false;
  }

  private mergeValues(source: any, target: any): any {
    if (typeof source === 'object' && typeof target === 'object') {
      return { ...target, ...source }; // Source takes precedence
    }
    return source;
  }

  private recordSyncResult(result: SyncResult): void {
    this.syncHistory.push(result);
    if (this.syncHistory.length > this.maxHistorySize) {
      this.syncHistory = this.syncHistory.slice(-this.maxHistorySize);
    }
  }

  private updateSyncStatus(startTime: number): void {
    const duration = Date.now() - startTime;
    const totalTime = this.currentSyncStatus.averageSyncTime * this.currentSyncStatus.totalOperations + duration;
    this.currentSyncStatus.totalOperations++;
    this.currentSyncStatus.averageSyncTime = totalTime / this.currentSyncStatus.totalOperations;
    this.currentSyncStatus.lastSyncTime = Date.now();
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseDataSynchronizerResult {
  synchronizer: DataSynchronizer;
  actions: {
    syncFromSource: (source: 'manual' | 'conversational', session: ValuationSession) => Promise<SyncResult>;
    syncToTarget: (target: 'manual' | 'conversational', session: ValuationSession) => Promise<SyncResult>;
    syncBidirectional: (session: ValuationSession) => Promise<SyncResult>;
    resolveConflicts: (conflicts: SyncConflict[]) => SyncConflict[];
    detectConflicts: (sourceData: ValuationRequest, targetData: ValuationRequest) => SyncConflict[];
    extractFormData: (session: ValuationSession) => ValuationRequest;
    applyToSession: (data: ValuationRequest, session: ValuationSession) => ValuationSession;
    validateSyncData: (data: ValuationRequest) => { isValid: boolean; errors: string[] };
  };
  status: {
    syncStatus: SyncStatus;
    lastSyncResult: SyncResult | null;
    isSyncing: boolean;
  };
}

/**
 * useDataSynchronizer Hook
 *
 * React hook interface for DataSynchronizer engine
 * Provides reactive cross-flow data synchronization
 */
export const useDataSynchronizer = (
  config?: SynchronizationConfig
): UseDataSynchronizerResult => {
  const synchronizer = useMemo(() => new DataSynchronizerImpl(config), [config]);

  const actions = {
    syncFromSource: useCallback(
      (source: 'manual' | 'conversational', session: ValuationSession) =>
        synchronizer.syncFromSource(source, session),
      [synchronizer]
    ),
    syncToTarget: useCallback(
      (target: 'manual' | 'conversational', session: ValuationSession) =>
        synchronizer.syncToTarget(target, session),
      [synchronizer]
    ),
    syncBidirectional: useCallback(
      (session: ValuationSession) => synchronizer.syncBidirectional(session),
      [synchronizer]
    ),
    resolveConflicts: useCallback(
      (conflicts: SyncConflict[]) => synchronizer.resolveConflicts(conflicts),
      [synchronizer]
    ),
    detectConflicts: useCallback(
      (sourceData: ValuationRequest, targetData: ValuationRequest) =>
        synchronizer.detectConflicts(sourceData, targetData),
      [synchronizer]
    ),
    extractFormData: useCallback(
      (session: ValuationSession) => synchronizer.extractFormData(session),
      [synchronizer]
    ),
    applyToSession: useCallback(
      (data: ValuationRequest, session: ValuationSession) =>
        synchronizer.applyToSession(data, session),
      [synchronizer]
    ),
    validateSyncData: useCallback(
      (data: ValuationRequest) => synchronizer.validateSyncData(data),
      [synchronizer]
    ),
  };

  const status = {
    syncStatus: synchronizer.getSyncStatus(),
    lastSyncResult: synchronizer.getLastSyncResult(),
    isSyncing: synchronizer.isSyncing(),
  };

  return {
    synchronizer,
    actions,
    status,
  };
};
