/**
 * CalculationCoordinator Engine - Valuation Calculation Orchestration
 *
 * Single Responsibility: Coordinate valuation calculations, manage calculation state, handle progress
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/valuation/calculation-coordinator/CalculationCoordinator
 */

import { useCallback, useMemo } from 'react';
import type { ValuationFormData, ValuationResponse } from '../../../types/valuation';
import { storeLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CalculationConfig {
  enableStreaming?: boolean;
  enableLivePreview?: boolean;
  timeoutMs?: number;
  retryAttempts?: number;
  progressCallback?: (progress: number) => void;
}

export interface CalculationState {
  isCalculating: boolean;
  isCalculatingLive: boolean;
  progress: number;
  currentStep: string;
  error: string | null;
  startTime: number | null;
  estimatedTimeRemaining: number | null;
}

export interface CalculationOptions {
  useStreaming?: boolean;
  skipValidation?: boolean;
  priority?: 'low' | 'normal' | 'high';
  timeout?: number;
  onProgress?: (progress: number) => void;
  onStepChange?: (step: string) => void;
}

export interface CalculationResult {
  success: boolean;
  result: ValuationResponse | null;
  error: string | null;
  duration: number;
  steps: CalculationStep[];
  metadata: {
    correlationId: string;
    valuationId: string | null;
    method: string;
    streamingUsed: boolean;
  };
}

export interface CalculationStep {
  name: string;
  description: string;
  progress: number;
  duration: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  timestamp: number;
}

export interface CalculationCoordinator {
  // Calculation state
  getCalculationState(): CalculationState;
  isCalculating(): boolean;
  isCalculatingLive(): boolean;

  // Calculation execution
  calculateValuation(formData: ValuationFormData, options?: CalculationOptions): Promise<CalculationResult>;
  calculateValuationStreaming(formData: ValuationFormData, options?: CalculationOptions): Promise<CalculationResult>;
  quickValuation(formData: ValuationFormData): Promise<CalculationResult>;

  // Live preview
  startLivePreview(formData: ValuationFormData): Promise<void>;
  stopLivePreview(): void;
  getLiveEstimate(): ValuationResponse | null;

  // Calculation management
  cancelCalculation(): void;
  getCalculationProgress(): number;
  getCurrentStep(): string;

  // Error handling
  getLastError(): string | null;
  clearError(): void;
  retryLastCalculation(): Promise<CalculationResult>;

  // Calculation history
  getCalculationHistory(): CalculationResult[];
  clearHistory(): void;
}

// ============================================================================
// CALCULATION STEPS DEFINITION
// ============================================================================

const CALCULATION_STEPS: Omit<CalculationStep, 'duration' | 'status' | 'timestamp'>[] = [
  { name: 'validation', description: 'Validating input data', progress: 10 },
  { name: 'preprocessing', description: 'Preprocessing financial data', progress: 20 },
  { name: 'method_selection', description: 'Selecting valuation methodology', progress: 30 },
  { name: 'calculation', description: 'Performing valuation calculations', progress: 70 },
  { name: 'postprocessing', description: 'Post-processing results', progress: 90 },
  { name: 'finalization', description: 'Finalizing valuation report', progress: 100 },
];

const QUICK_CALCULATION_STEPS: Omit<CalculationStep, 'duration' | 'status' | 'timestamp'>[] = [
  { name: 'quick_validation', description: 'Quick data validation', progress: 25 },
  { name: 'quick_calculation', description: 'Quick valuation estimate', progress: 75 },
  { name: 'quick_finalization', description: 'Quick result formatting', progress: 100 },
];

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class CalculationCoordinatorImpl implements CalculationCoordinator {
  private config: CalculationConfig;
  private calculationState: CalculationState;
  private liveEstimate: ValuationResponse | null = null;
  private calculationHistory: CalculationResult[] = [];
  private maxHistorySize = 5;
  private currentCalculation: Promise<CalculationResult> | null = null;
  private abortController: AbortController | null = null;
  private lastCalculationOptions: { formData: ValuationFormData; options?: CalculationOptions } | null = null;

  constructor(config: CalculationConfig = {}) {
    this.config = {
      enableStreaming: true,
      enableLivePreview: true,
      timeoutMs: 30000, // 30 seconds
      retryAttempts: 3,
      ...config,
    };

    this.calculationState = {
      isCalculating: false,
      isCalculatingLive: false,
      progress: 0,
      currentStep: '',
      error: null,
      startTime: null,
      estimatedTimeRemaining: null,
    };
  }

  /**
   * Get current calculation state
   */
  getCalculationState(): CalculationState {
    return { ...this.calculationState };
  }

  /**
   * Check if currently calculating
   */
  isCalculating(): boolean {
    return this.calculationState.isCalculating;
  }

  /**
   * Check if currently calculating live preview
   */
  isCalculatingLive(): boolean {
    return this.calculationState.isCalculatingLive;
  }

  /**
   * Execute full valuation calculation
   */
  async calculateValuation(formData: ValuationFormData, options: CalculationOptions = {}): Promise<CalculationResult> {
    return this.executeCalculation(formData, { ...options, useStreaming: false });
  }

  /**
   * Execute streaming valuation calculation
   */
  async calculateValuationStreaming(formData: ValuationFormData, options: CalculationOptions = {}): Promise<CalculationResult> {
    if (!this.config.enableStreaming) {
      throw new Error('Streaming calculations are disabled');
    }

    return this.executeCalculation(formData, { ...options, useStreaming: true });
  }

  /**
   * Execute quick valuation estimate
   */
  async quickValuation(formData: ValuationFormData): Promise<CalculationResult> {
    return this.executeQuickCalculation(formData);
  }

  /**
   * Start live preview calculations
   */
  async startLivePreview(formData: ValuationFormData): Promise<void> {
    if (!this.config.enableLivePreview) {
      return;
    }

    if (this.calculationState.isCalculatingLive) {
      return; // Already running
    }

    this.calculationState.isCalculatingLive = true;

    try {
      // Run quick calculation for live preview
      const result = await this.executeQuickCalculation(formData, true);
      if (result.success && result.result) {
        this.liveEstimate = result.result;
      }
    } catch (error) {
      storeLogger.warn('[CalculationCoordinator] Live preview failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      this.calculationState.isCalculatingLive = false;
    }
  }

  /**
   * Stop live preview
   */
  stopLivePreview(): void {
    this.calculationState.isCalculatingLive = false;
    this.liveEstimate = null;
  }

  /**
   * Get current live estimate
   */
  getLiveEstimate(): ValuationResponse | null {
    return this.liveEstimate ? { ...this.liveEstimate } : null;
  }

  /**
   * Cancel current calculation
   */
  cancelCalculation(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    this.calculationState.isCalculating = false;
    this.calculationState.isCalculatingLive = false;
    this.calculationState.progress = 0;
    this.calculationState.currentStep = '';
    this.calculationState.error = 'Calculation cancelled';

    storeLogger.info('[CalculationCoordinator] Calculation cancelled by user');
  }

  /**
   * Get calculation progress
   */
  getCalculationProgress(): number {
    return this.calculationState.progress;
  }

  /**
   * Get current calculation step
   */
  getCurrentStep(): string {
    return this.calculationState.currentStep;
  }

  /**
   * Get last calculation error
   */
  getLastError(): string | null {
    return this.calculationState.error;
  }

  /**
   * Clear calculation error
   */
  clearError(): void {
    this.calculationState.error = null;
  }

  /**
   * Retry last calculation
   */
  async retryLastCalculation(): Promise<CalculationResult> {
    if (!this.lastCalculationOptions) {
      throw new Error('No previous calculation to retry');
    }

    const { formData, options } = this.lastCalculationOptions;
    return this.executeCalculation(formData, options || {});
  }

  /**
   * Get calculation history
   */
  getCalculationHistory(): CalculationResult[] {
    return [...this.calculationHistory];
  }

  /**
   * Clear calculation history
   */
  clearHistory(): void {
    this.calculationHistory = [];
  }

  // Private helper methods
  private async executeCalculation(
    formData: ValuationFormData,
    options: CalculationOptions
  ): Promise<CalculationResult> {
    if (this.calculationState.isCalculating) {
      throw new Error('Calculation already in progress');
    }

    // Store for retry capability
    this.lastCalculationOptions = { formData, options };

    // Initialize calculation state
    this.abortController = new AbortController();
    this.calculationState = {
      isCalculating: true,
      isCalculatingLive: false,
      progress: 0,
      currentStep: '',
      error: null,
      startTime: Date.now(),
      estimatedTimeRemaining: null,
    };

    const startTime = Date.now();
    const correlationId = `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const steps: CalculationStep[] = [];

    try {
      storeLogger.info('[CalculationCoordinator] Starting valuation calculation', {
        correlationId,
        useStreaming: options.useStreaming,
        hasProgressCallback: !!options.onProgress,
      });

      // Execute calculation steps
      for (const stepDef of CALCULATION_STEPS) {
        if (this.abortController.signal.aborted) {
          throw new Error('Calculation aborted');
        }

        const stepStartTime = Date.now();
        this.updateCalculationStep(stepDef.name, stepDef.description);

        // Simulate step execution (would call actual calculation service)
        await this.executeCalculationStep(stepDef, formData, options);

        const stepDuration = Date.now() - stepStartTime;
        steps.push({
          ...stepDef,
          duration: stepDuration,
          status: 'completed',
          timestamp: Date.now(),
        });

        this.updateProgress(stepDef.progress);
        options.onProgress?.(stepDef.progress);
      }

      // Generate mock result (would come from actual calculation)
      const result = this.generateMockResult(formData, correlationId, options.useStreaming);

      const calculationResult: CalculationResult = {
        success: true,
        result,
        error: null,
        duration: Date.now() - startTime,
        steps,
        metadata: {
          correlationId,
          valuationId: result.valuation_id,
          method: result.methodology,
          streamingUsed: !!options.useStreaming,
        },
      };

      this.recordCalculationResult(calculationResult);

      storeLogger.info('[CalculationCoordinator] Calculation completed successfully', {
        correlationId,
        duration: calculationResult.duration,
        valuationId: result.valuation_id,
      });

      return calculationResult;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown calculation error';

      // Mark failed steps
      CALCULATION_STEPS.forEach(stepDef => {
        if (!steps.find(s => s.name === stepDef.name)) {
          steps.push({
            ...stepDef,
            duration: 0,
            status: 'failed',
            timestamp: Date.now(),
          });
        }
      });

      const calculationResult: CalculationResult = {
        success: false,
        result: null,
        error: errorMessage,
        duration: Date.now() - startTime,
        steps,
        metadata: {
          correlationId,
          valuationId: null,
          method: 'unknown',
          streamingUsed: !!options.useStreaming,
        },
      };

      this.recordCalculationResult(calculationResult);
      this.calculationState.error = errorMessage;

      storeLogger.error('[CalculationCoordinator] Calculation failed', {
        correlationId,
        error: errorMessage,
        duration: calculationResult.duration,
      });

      throw error;

    } finally {
      this.calculationState.isCalculating = false;
      this.calculationState.startTime = null;
      this.calculationState.estimatedTimeRemaining = null;
      this.abortController = null;
    }
  }

  private async executeQuickCalculation(
    formData: ValuationFormData,
    isLivePreview: boolean = false
  ): Promise<CalculationResult> {
    const startTime = Date.now();
    const correlationId = `quick_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const steps: CalculationStep[] = [];

    try {
      for (const stepDef of QUICK_CALCULATION_STEPS) {
        const stepStartTime = Date.now();

        if (!isLivePreview) {
          this.updateCalculationStep(stepDef.name, stepDef.description);
          this.updateProgress(stepDef.progress);
        }

        // Simulate quick calculation step
        await new Promise(resolve => setTimeout(resolve, 100));

        steps.push({
          ...stepDef,
          duration: Date.now() - stepStartTime,
          status: 'completed',
          timestamp: Date.now(),
        });
      }

      const result = this.generateQuickMockResult(formData, correlationId);

      return {
        success: true,
        result,
        error: null,
        duration: Date.now() - startTime,
        steps,
        metadata: {
          correlationId,
          valuationId: result.valuation_id,
          method: result.methodology,
          streamingUsed: false,
        },
      };

    } catch (error) {
      return {
        success: false,
        result: null,
        error: error instanceof Error ? error.message : 'Quick calculation failed',
        duration: Date.now() - startTime,
        steps: steps.map(s => ({ ...s, status: 'failed' })),
        metadata: {
          correlationId,
          valuationId: null,
          method: 'quick',
          streamingUsed: false,
        },
      };
    }
  }

  private updateCalculationStep(stepName: string, description: string): void {
    this.calculationState.currentStep = description;

    storeLogger.debug('[CalculationCoordinator] Calculation step started', {
      step: stepName,
      description,
    });
  }

  private updateProgress(progress: number): void {
    this.calculationState.progress = progress;

    // Estimate remaining time
    if (this.calculationState.startTime) {
      const elapsed = Date.now() - this.calculationState.startTime;
      const remaining = (elapsed / progress) * (100 - progress);
      this.calculationState.estimatedTimeRemaining = Math.round(remaining);
    }
  }

  private async executeCalculationStep(
    step: any,
    formData: ValuationFormData,
    options: CalculationOptions
  ): Promise<void> {
    // Simulate step execution time based on step complexity
    const delays = {
      validation: 200,
      preprocessing: 300,
      method_selection: 200,
      calculation: 1000,
      postprocessing: 300,
      finalization: 200,
    };

    const delay = delays[step.name as keyof typeof delays] || 500;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  private generateMockResult(
    formData: ValuationFormData,
    correlationId: string,
    useStreaming?: boolean
  ): ValuationResponse {
    const baseValue = (formData.revenue || 100000) * 2.5; // Simple mock calculation
    const variance = 0.2; // 20% variance

    return {
      valuation_id: `val_${Date.now()}`,
      equity_value_low: baseValue * (1 - variance),
      equity_value_mid: baseValue,
      equity_value_high: baseValue * (1 + variance),
      confidence_score: 0.75,
      methodology: 'dcf',
      assumptions: {
        growth_rate: 0.05,
        discount_rate: 0.10,
        terminal_growth: 0.02,
      },
      key_metrics: {
        revenue_multiple: 2.5,
        ebitda_multiple: 8.0,
      },
      risk_factors: [
        'Market volatility',
        'Competitive landscape',
      ],
      key_value_drivers: [
        'Strong revenue growth',
        'Recurring revenue model',
      ],
      html_report: '<div>Mock HTML Report</div>',
      info_tab_html: '<div>Mock Info Tab</div>',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private generateQuickMockResult(formData: ValuationFormData, correlationId: string): ValuationResponse {
    const baseValue = (formData.revenue || 100000) * 2.3; // Slightly different for quick calc

    return {
      valuation_id: `quick_${Date.now()}`,
      equity_value_low: baseValue * 0.9,
      equity_value_mid: baseValue,
      equity_value_high: baseValue * 1.1,
      confidence_score: 0.6, // Lower confidence for quick calc
      methodology: 'quick_estimate',
      assumptions: {},
      key_metrics: {},
      risk_factors: [],
      key_value_drivers: [],
      html_report: '',
      info_tab_html: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  private recordCalculationResult(result: CalculationResult): void {
    this.calculationHistory.push(result);

    if (this.calculationHistory.length > this.maxHistorySize) {
      this.calculationHistory = this.calculationHistory.slice(-this.maxHistorySize);
    }
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseCalculationCoordinatorResult {
  coordinator: CalculationCoordinator;
  state: CalculationState;
  actions: {
    calculateValuation: (formData: ValuationFormData, options?: CalculationOptions) => Promise<CalculationResult>;
    calculateValuationStreaming: (formData: ValuationFormData, options?: CalculationOptions) => Promise<CalculationResult>;
    quickValuation: (formData: ValuationFormData) => Promise<CalculationResult>;
    startLivePreview: (formData: ValuationFormData) => Promise<void>;
    stopLivePreview: () => void;
    cancelCalculation: () => void;
    retryLastCalculation: () => Promise<CalculationResult>;
    clearError: () => void;
  };
  queries: {
    isCalculating: boolean;
    isCalculatingLive: boolean;
    progress: number;
    currentStep: string;
    lastError: string | null;
    liveEstimate: ValuationResponse | null;
    calculationHistory: CalculationResult[];
  };
}

/**
 * useCalculationCoordinator Hook
 *
 * React hook interface for CalculationCoordinator engine
 * Provides reactive valuation calculation orchestration
 */
export const useCalculationCoordinator = (
  config?: CalculationConfig
): UseCalculationCoordinatorResult => {
  const coordinator = useMemo(() => new CalculationCoordinatorImpl(config), [config]);

  const actions = {
    calculateValuation: useCallback(
      (formData: ValuationFormData, options?: CalculationOptions) =>
        coordinator.calculateValuation(formData, options),
      [coordinator]
    ),
    calculateValuationStreaming: useCallback(
      (formData: ValuationFormData, options?: CalculationOptions) =>
        coordinator.calculateValuationStreaming(formData, options),
      [coordinator]
    ),
    quickValuation: useCallback(
      (formData: ValuationFormData) => coordinator.quickValuation(formData),
      [coordinator]
    ),
    startLivePreview: useCallback(
      (formData: ValuationFormData) => coordinator.startLivePreview(formData),
      [coordinator]
    ),
    stopLivePreview: useCallback(() => coordinator.stopLivePreview(), [coordinator]),
    cancelCalculation: useCallback(() => coordinator.cancelCalculation(), [coordinator]),
    retryLastCalculation: useCallback(() => coordinator.retryLastCalculation(), [coordinator]),
    clearError: useCallback(() => coordinator.clearError(), [coordinator]),
  };

  const state = coordinator.getCalculationState();

  const queries = {
    isCalculating: coordinator.isCalculating(),
    isCalculatingLive: coordinator.isCalculatingLive(),
    progress: coordinator.getCalculationProgress(),
    currentStep: coordinator.getCurrentStep(),
    lastError: coordinator.getLastError(),
    liveEstimate: coordinator.getLiveEstimate(),
    calculationHistory: coordinator.getCalculationHistory(),
  };

  return {
    coordinator,
    state,
    actions,
    queries,
  };
};
