/**
 * PreviewManager Engine - Live Preview Management
 *
 * Single Responsibility: Manage real-time valuation previews, updates, and display
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/valuation/preview-manager/PreviewManager
 */

import { useCallback, useMemo } from 'react';
import { backendAPI } from '../../../services/BackendAPI';
import type { ValuationFormData, ValuationRequest, ValuationResponse } from '../../../types/valuation';
import { storeLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PreviewConfig {
  enableLivePreview?: boolean;
  previewDebounceMs?: number;
  maxPreviewHistory?: number;
  previewQuality?: 'low' | 'medium' | 'high';
}

export interface PreviewState {
  isActive: boolean;
  lastUpdate: number;
  previewCount: number;
  currentEstimate: ValuationResponse | null;
  isStale: boolean;
  confidence: number;
}

export interface PreviewUpdate {
  formData: ValuationFormData;
  changes: Array<{
    field: keyof ValuationFormData;
    oldValue: any;
    newValue: any;
  }>;
  timestamp: number;
  trigger: 'field_change' | 'manual' | 'auto';
}

export interface PreviewManager {
  // Preview state
  getPreviewState(): PreviewState;
  isPreviewActive(): boolean;
  getCurrentEstimate(): ValuationResponse | null;

  // Preview control
  startPreview(): void;
  stopPreview(): void;
  updatePreview(formData: ValuationFormData, trigger?: PreviewUpdate['trigger']): Promise<void>;

  // Preview history
  getPreviewHistory(): PreviewUpdate[];
  getLastPreviewUpdate(): PreviewUpdate | null;
  clearPreviewHistory(): void;

  // Preview quality
  setPreviewQuality(quality: PreviewConfig['previewQuality']): void;
  getPreviewQuality(): PreviewConfig['previewQuality'];

  // Preview validation
  validatePreviewData(formData: ValuationFormData): { isValid: boolean; issues: string[] };
  shouldUpdatePreview(oldData: ValuationFormData, newData: ValuationFormData): boolean;

  // Preview analytics
  getPreviewStats(): PreviewStats;
  resetStats(): void;
}

// ============================================================================
// PREVIEW STATS TYPE
// ============================================================================

export interface PreviewStats {
  totalPreviews: number;
  averageUpdateTime: number;
  previewTriggers: Record<PreviewUpdate['trigger'], number>;
  fieldUpdateFrequency: Record<string, number>;
  lastActivity: number;
  uptime: number;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class PreviewManagerImpl implements PreviewManager {
  private config: PreviewConfig;
  private previewState: PreviewState;
  private previewHistory: PreviewUpdate[] = [];
  private previewStats: PreviewStats;
  private updateTimeout: NodeJS.Timeout | null = null;
  private startTime: number = Date.now();

  constructor(config: PreviewConfig = {}) {
    this.config = {
      enableLivePreview: true,
      previewDebounceMs: 500,
      maxPreviewHistory: 20,
      previewQuality: 'medium',
      ...config,
    };

    this.previewState = {
      isActive: false,
      lastUpdate: 0,
      previewCount: 0,
      currentEstimate: null,
      isStale: false,
      confidence: 0,
    };

    this.previewStats = {
      totalPreviews: 0,
      averageUpdateTime: 0,
      previewTriggers: {
        field_change: 0,
        manual: 0,
        auto: 0,
      },
      fieldUpdateFrequency: {},
      lastActivity: Date.now(),
      uptime: 0,
    };
  }

  /**
   * Get current preview state
   */
  getPreviewState(): PreviewState {
    return { ...this.previewState, isStale: this.isPreviewStale() };
  }

  /**
   * Check if preview is currently active
   */
  isPreviewActive(): boolean {
    return this.previewState.isActive;
  }

  /**
   * Get current preview estimate
   */
  getCurrentEstimate(): ValuationResponse | null {
    return this.previewState.currentEstimate ? { ...this.previewState.currentEstimate } : null;
  }

  /**
   * Start live preview
   */
  startPreview(): void {
    if (!this.config.enableLivePreview) {
      storeLogger.warn('[PreviewManager] Live preview disabled in config');
      return;
    }

    this.previewState.isActive = true;
    this.previewStats.lastActivity = Date.now();

    storeLogger.info('[PreviewManager] Live preview started');
  }

  /**
   * Stop live preview
   */
  stopPreview(): void {
    this.previewState.isActive = false;
    this.previewState.currentEstimate = null;

    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }

    storeLogger.info('[PreviewManager] Live preview stopped');
  }

  /**
   * Update preview with new form data
   */
  async updatePreview(formData: ValuationFormData, trigger: PreviewUpdate['trigger'] = 'field_change'): Promise<void> {
    if (!this.previewState.isActive) {
      return;
    }

    const startTime = Date.now();

    try {
      // Validate preview data
      const validation = this.validatePreviewData(formData);
      if (!validation.isValid) {
        storeLogger.warn('[PreviewManager] Preview data validation failed', {
          issues: validation.issues,
        });
        return;
      }

      // Check if update is needed
      const lastUpdate = this.getLastPreviewUpdate();
      if (lastUpdate && !this.shouldUpdatePreview(lastUpdate.formData, formData)) {
        storeLogger.debug('[PreviewManager] Preview update skipped - no significant changes');
        return;
      }

      // Debounce updates
      await new Promise<void>((resolve) => {
        if (this.updateTimeout) {
          clearTimeout(this.updateTimeout);
        }

        this.updateTimeout = setTimeout(async () => {
          try {
            await this.performPreviewUpdate(formData, trigger, startTime);
            resolve();
          } catch (error) {
            resolve(); // Don't throw in timeout
          }
        }, this.config.previewDebounceMs);
      });

    } catch (error) {
      storeLogger.error('[PreviewManager] Preview update failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        trigger,
        duration: Date.now() - startTime,
      });
    }
  }

  /**
   * Get preview history
   */
  getPreviewHistory(): PreviewUpdate[] {
    return [...this.previewHistory];
  }

  /**
   * Get last preview update
   */
  getLastPreviewUpdate(): PreviewUpdate | null {
    return this.previewHistory.length > 0
      ? this.previewHistory[this.previewHistory.length - 1]
      : null;
  }

  /**
   * Clear preview history
   */
  clearPreviewHistory(): void {
    this.previewHistory = [];
    storeLogger.debug('[PreviewManager] Preview history cleared');
  }

  /**
   * Set preview quality
   */
  setPreviewQuality(quality: PreviewConfig['previewQuality']): void {
    this.config.previewQuality = quality;
    storeLogger.debug('[PreviewManager] Preview quality set', { quality });
  }

  /**
   * Get current preview quality
   */
  getPreviewQuality(): PreviewConfig['previewQuality'] {
    return this.config.previewQuality || 'medium';
  }

  /**
   * Validate preview data
   */
  validatePreviewData(formData: ValuationFormData): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Basic validation for preview
    if (!formData.company_name?.trim()) {
      issues.push('Company name required for preview');
    }

    if (!formData.industry) {
      issues.push('Industry required for preview');
    }

    // For preview, we can be more lenient than full validation
    // Just need enough data for a rough estimate

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  /**
   * Determine if preview should update based on data changes
   */
  shouldUpdatePreview(oldData: ValuationFormData, newData: ValuationFormData): boolean {
    // Always update if key financial data changes
    if (oldData.revenue !== newData.revenue ||
        oldData.ebitda !== newData.ebitda ||
        oldData.industry !== newData.industry) {
      return true;
    }

    // Update if company info changes
    if (oldData.company_name !== newData.company_name ||
        oldData.founding_year !== newData.founding_year) {
      return true;
    }

    // Don't update for minor changes
    return false;
  }

  /**
   * Get preview statistics
   */
  getPreviewStats(): PreviewStats {
    const now = Date.now();
    return {
      ...this.previewStats,
      uptime: now - this.startTime,
      lastActivity: this.previewStats.lastActivity,
    };
  }

  /**
   * Reset preview statistics
   */
  resetStats(): void {
    this.previewStats = {
      totalPreviews: 0,
      averageUpdateTime: 0,
      previewTriggers: {
        field_change: 0,
        manual: 0,
        auto: 0,
      },
      fieldUpdateFrequency: {},
      lastActivity: Date.now(),
      uptime: Date.now() - this.startTime,
    };

    storeLogger.info('[PreviewManager] Preview stats reset');
  }

  // Private helper methods
  private async performPreviewUpdate(
    formData: ValuationFormData,
    trigger: PreviewUpdate['trigger'],
    startTime: number
  ): Promise<void> {
    // Generate preview estimate
    const estimate = await this.generatePreviewEstimate(formData);
    const updateTime = Date.now() - startTime;

    // Create update record
    const lastUpdate = this.getLastPreviewUpdate();
    const changes = lastUpdate ? this.calculateChanges(lastUpdate.formData, formData) : [];

    const update: PreviewUpdate = {
      formData: { ...formData },
      changes,
      timestamp: Date.now(),
      trigger,
    };

    // Update state
    this.previewState.currentEstimate = estimate;
    this.previewState.lastUpdate = Date.now();
    this.previewState.previewCount++;
    this.previewState.confidence = this.calculatePreviewConfidence(formData);

    // Track in history
    this.previewHistory.push(update);
    if (this.previewHistory.length > (this.config.maxPreviewHistory || 20)) {
      this.previewHistory = this.previewHistory.slice(-this.config.maxPreviewHistory!);
    }

    // Update stats
    this.updatePreviewStats(trigger, updateTime, changes);

    storeLogger.debug('[PreviewManager] Preview updated', {
      trigger,
      confidence: this.previewState.confidence,
      changes: changes.length,
      updateTime,
    });
  }

  private async generatePreviewEstimate(formData: ValuationFormData): Promise<ValuationResponse> {
    // Call backend preview API instead of frontend calculation
    // Backend provides lightweight preview estimate
    try {
      // Convert ValuationFormData to ValuationRequest for preview
      const request: ValuationRequest = {
        company_name: formData.company_name || 'Preview',
        country_code: formData.country_code || 'BE',
        industry: formData.industry || 'services',
        business_model: formData.business_model || 'services',
        founding_year: formData.founding_year || new Date().getFullYear() - 5,
        current_year_data: formData.current_year_data || {
          year: new Date().getFullYear(),
          revenue: formData.revenue || 0,
          ebitda: formData.ebitda || 0,
        },
        use_dcf: true,
        use_multiples: true,
        projection_years: 10,
      };

      // Call backend preview HTML generation endpoint
      // This provides a lightweight preview estimate
      const previewResult = await backendAPI.generatePreviewHtml(request);
      
      // For preview, we create a minimal response
      // Full calculation would come from calculateValuationUnified
      // This is just for UI preview purposes
      return {
        valuation_id: `preview_${Date.now()}`,
        equity_value_low: 0, // Preview doesn't provide full range
        equity_value_mid: 0,
        equity_value_high: 0,
        confidence_score: previewResult.completeness_percent / 100,
        methodology: 'preview_estimate',
        assumptions: {},
        key_metrics: {},
        risk_factors: ['Preview estimate - limited data'],
        key_value_drivers: ['Based on provided financial information'],
        html_report: previewResult.html,
        info_tab_html: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    } catch (error) {
      storeLogger.warn('[PreviewManager] Preview API call failed, returning minimal estimate', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      
      // Fallback: return minimal response if preview API fails
      // This is acceptable for preview - full calculation will work
      return {
        valuation_id: `preview_${Date.now()}`,
        equity_value_low: 0,
        equity_value_mid: 0,
        equity_value_high: 0,
        confidence_score: 0.3,
        methodology: 'preview_estimate',
        assumptions: {},
        key_metrics: {},
        risk_factors: ['Preview unavailable'],
        key_value_drivers: [],
        html_report: '',
        info_tab_html: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
  }

  private calculateChanges(oldData: ValuationFormData, newData: ValuationFormData): PreviewUpdate['changes'] {
    const changes: PreviewUpdate['changes'] = [];

    const fieldsToCheck: (keyof ValuationFormData)[] = ['revenue', 'ebitda', 'company_name', 'industry', 'founding_year'];

    for (const field of fieldsToCheck) {
      if ((oldData as any)[field] !== (newData as any)[field]) {
        changes.push({
          field,
          oldValue: (oldData as any)[field],
          newValue: (newData as any)[field],
        });
      }
    }

    return changes;
  }

  private calculatePreviewConfidence(formData: ValuationFormData): number {
    let confidence = 0.3; // Base confidence

    // Increase confidence with more data
    if (formData.revenue) confidence += 0.2;
    if (formData.ebitda) confidence += 0.2;
    if (formData.founding_year) confidence += 0.1;
    if (formData.company_name) confidence += 0.1;
    if (formData.industry) confidence += 0.1;

    return Math.min(0.8, confidence); // Max 80% confidence for preview
  }

  private updatePreviewStats(trigger: PreviewUpdate['trigger'], updateTime: number, changes: PreviewUpdate['changes']): void {
    this.previewStats.totalPreviews++;
    this.previewStats.lastActivity = Date.now();

    // Update average time
    const totalTime = this.previewStats.averageUpdateTime * (this.previewStats.totalPreviews - 1) + updateTime;
    this.previewStats.averageUpdateTime = totalTime / this.previewStats.totalPreviews;

    // Update trigger counts
    this.previewStats.previewTriggers[trigger]++;

    // Update field frequencies
    changes.forEach(change => {
      this.previewStats.fieldUpdateFrequency[change.field] =
        (this.previewStats.fieldUpdateFrequency[change.field] || 0) + 1;
    });
  }

  private isPreviewStale(): boolean {
    const stalenessThreshold = 30000; // 30 seconds
    return (Date.now() - this.previewState.lastUpdate) > stalenessThreshold;
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UsePreviewManagerResult {
  manager: PreviewManager;
  state: PreviewState;
  actions: {
    startPreview: () => void;
    stopPreview: () => void;
    updatePreview: (formData: ValuationFormData, trigger?: PreviewUpdate['trigger']) => Promise<void>;
    clearPreviewHistory: () => void;
    setPreviewQuality: (quality: PreviewConfig['previewQuality']) => void;
  };
  queries: {
    isPreviewActive: boolean;
    currentEstimate: ValuationResponse | null;
    previewHistory: PreviewUpdate[];
    lastPreviewUpdate: PreviewUpdate | null;
    previewQuality: PreviewConfig['previewQuality'];
    previewStats: PreviewStats;
  };
  validation: {
    validatePreviewData: (formData: ValuationFormData) => { isValid: boolean; issues: string[] };
    shouldUpdatePreview: (oldData: ValuationFormData, newData: ValuationFormData) => boolean;
  };
}

/**
 * usePreviewManager Hook
 *
 * React hook interface for PreviewManager engine
 * Provides reactive live preview management
 */
export const usePreviewManager = (
  config?: PreviewConfig
): UsePreviewManagerResult => {
  const manager = useMemo(() => new PreviewManagerImpl(config), [config]);

  const actions = {
    startPreview: useCallback(() => manager.startPreview(), [manager]),
    stopPreview: useCallback(() => manager.stopPreview(), [manager]),
    updatePreview: useCallback(
      (formData: ValuationFormData, trigger?: PreviewUpdate['trigger']) =>
        manager.updatePreview(formData, trigger),
      [manager]
    ),
    clearPreviewHistory: useCallback(() => manager.clearPreviewHistory(), [manager]),
    setPreviewQuality: useCallback(
      (quality: PreviewConfig['previewQuality']) => manager.setPreviewQuality(quality),
      [manager]
    ),
  };

  const state = manager.getPreviewState();

  const queries = {
    isPreviewActive: manager.isPreviewActive(),
    currentEstimate: manager.getCurrentEstimate(),
    previewHistory: manager.getPreviewHistory(),
    lastPreviewUpdate: manager.getLastPreviewUpdate(),
    previewQuality: manager.getPreviewQuality(),
    previewStats: manager.getPreviewStats(),
  };

  const validation = {
    validatePreviewData: useCallback(
      (formData: ValuationFormData) => manager.validatePreviewData(formData),
      [manager]
    ),
    shouldUpdatePreview: useCallback(
      (oldData: ValuationFormData, newData: ValuationFormData) =>
        manager.shouldUpdatePreview(oldData, newData),
      [manager]
    ),
  };

  return {
    manager,
    state,
    actions,
    queries,
    validation,
  };
};
