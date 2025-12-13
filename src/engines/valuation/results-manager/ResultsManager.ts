/**
 * ResultsManager Engine - Valuation Results Management & Display
 *
 * Single Responsibility: Manage valuation results, display logic, and result persistence
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/valuation/results-manager/ResultsManager
 */

import { useCallback, useMemo } from 'react';
import type { ValuationInputData, ValuationResponse } from '../../../types/valuation';
import { storeLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ResultsDisplayConfig {
  showConfidenceIntervals?: boolean;
  showMethodologyDetails?: boolean;
  showRiskFactors?: boolean;
  showValueDrivers?: boolean;
  defaultTab?: 'preview' | 'source' | 'info';
}

export interface ResultsMetadata {
  valuationId: string | null;
  correlationId: string | null;
  generatedAt: Date;
  source: 'calculation' | 'streaming' | 'quick' | 'preview';
  isLiveEstimate: boolean;
  calculationTime: number; // ms
}

export interface ResultsExport {
  format: 'json' | 'pdf' | 'csv';
  includeMetadata: boolean;
  includeRawData: boolean;
  filename?: string;
}

export interface ResultsManager {
  // Results management
  getResult(): ValuationResponse | null;
  setResult(result: ValuationResponse | null, metadata?: Partial<ResultsMetadata>): void;
  clearResult(): void;

  // Results display
  getDisplayConfig(): ResultsDisplayConfig;
  updateDisplayConfig(config: Partial<ResultsDisplayConfig>): void;

  // Results metadata
  getMetadata(): ResultsMetadata | null;
  updateMetadata(metadata: Partial<ResultsMetadata>): void;

  // Input data management
  getInputData(): ValuationInputData | null;
  setInputData(data: ValuationInputData | null): void;

  // Results analysis
  analyzeResults(result: ValuationResponse): ResultsAnalysis;
  compareResults(current: ValuationResponse, previous: ValuationResponse): ResultsComparison;

  // Export functionality
  exportResults(config: ResultsExport): Promise<Blob>;
  canExport(format: ResultsExport['format']): boolean;

  // Results validation
  validateResult(result: ValuationResponse): { isValid: boolean; errors: string[] };

  // Results history
  getResultsHistory(): ResultsHistoryEntry[];
  addToHistory(result: ValuationResponse, metadata: ResultsMetadata): void;
  clearHistory(): void;
}

// ============================================================================
// RESULTS ANALYSIS TYPES
// ============================================================================

export interface ResultsAnalysis {
  valuationRange: {
    low: number;
    mid: number;
    high: number;
    range: number;
    rangePercentage: number;
  };
  confidence: {
    score: number;
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  keyInsights: string[];
  riskFactors: string[];
  valueDrivers: string[];
  recommendations: string[];
}

export interface ResultsComparison {
  changes: {
    valueChange: number;
    valueChangePercentage: number;
    confidenceChange: number;
    methodologyChanged: boolean;
  };
  significantChanges: string[];
  trend: 'improving' | 'declining' | 'stable';
  analysis: string;
}

export interface ResultsHistoryEntry {
  id: string;
  result: ValuationResponse;
  metadata: ResultsMetadata;
  timestamp: number;
  comparison?: ResultsComparison;
}

// ============================================================================
// DEFAULT CONFIG
// ============================================================================

const DEFAULT_DISPLAY_CONFIG: ResultsDisplayConfig = {
  showConfidenceIntervals: true,
  showMethodologyDetails: true,
  showRiskFactors: true,
  showValueDrivers: true,
  defaultTab: 'preview',
};

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class ResultsManagerImpl implements ResultsManager {
  private result: ValuationResponse | null = null;
  private metadata: ResultsMetadata | null = null;
  private inputData: ValuationInputData | null = null;
  private displayConfig: ResultsDisplayConfig;
  private resultsHistory: ResultsHistoryEntry[] = [];
  private maxHistorySize = 10;

  constructor(config?: Partial<ResultsDisplayConfig>) {
    this.displayConfig = { ...DEFAULT_DISPLAY_CONFIG, ...config };
  }

  /**
   * Get current valuation result
   */
  getResult(): ValuationResponse | null {
    return this.result ? { ...this.result } : null;
  }

  /**
   * Set valuation result with metadata
   */
  setResult(result: ValuationResponse | null, metadata?: Partial<ResultsMetadata>): void {
    const previousResult = this.result;

    this.result = result ? { ...result } : null;

    if (result && metadata) {
      this.metadata = {
        valuationId: result.valuation_id || null,
        correlationId: null,
        generatedAt: new Date(),
        source: 'calculation',
        isLiveEstimate: false,
        calculationTime: 0,
        ...metadata,
      };

      // Add to history
      this.addToHistory(result, this.metadata);

      // Compare with previous result
      if (previousResult) {
        const comparison = this.compareResults(result, previousResult);
        const lastHistoryEntry = this.resultsHistory[this.resultsHistory.length - 1];
        if (lastHistoryEntry) {
          lastHistoryEntry.comparison = comparison;
        }
      }
    } else {
      this.metadata = null;
    }

    storeLogger.info('[ResultsManager] Result updated', {
      hasResult: !!result,
      valuationId: result?.valuation_id,
      source: metadata?.source,
      isLiveEstimate: metadata?.isLiveEstimate,
    });
  }

  /**
   * Clear current result
   */
  clearResult(): void {
    this.result = null;
    this.metadata = null;
    this.inputData = null;

    storeLogger.info('[ResultsManager] Result cleared');
  }

  /**
   * Get display configuration
   */
  getDisplayConfig(): ResultsDisplayConfig {
    return { ...this.displayConfig };
  }

  /**
   * Update display configuration
   */
  updateDisplayConfig(config: Partial<ResultsDisplayConfig>): void {
    this.displayConfig = { ...this.displayConfig, ...config };

    storeLogger.debug('[ResultsManager] Display config updated', {
      config: this.displayConfig,
    });
  }

  /**
   * Get result metadata
   */
  getMetadata(): ResultsMetadata | null {
    return this.metadata ? { ...this.metadata } : null;
  }

  /**
   * Update result metadata
   */
  updateMetadata(metadata: Partial<ResultsMetadata>): void {
    if (this.metadata) {
      this.metadata = { ...this.metadata, ...metadata };

      storeLogger.debug('[ResultsManager] Metadata updated', {
        metadata: this.metadata,
      });
    }
  }

  /**
   * Get input data used for calculation
   */
  getInputData(): ValuationInputData | null {
    return this.inputData ? { ...this.inputData } : null;
  }

  /**
   * Set input data
   */
  setInputData(data: ValuationInputData | null): void {
    this.inputData = data ? { ...data } : null;

    storeLogger.debug('[ResultsManager] Input data updated', {
      hasData: !!data,
    });
  }

  /**
   * Analyze valuation results
   */
  analyzeResults(result: ValuationResponse): ResultsAnalysis {
    const range = {
      low: result.equity_value_low,
      mid: result.equity_value_mid,
      high: result.equity_value_high,
      range: result.equity_value_high - result.equity_value_low,
      rangePercentage: ((result.equity_value_high - result.equity_value_low) / result.equity_value_mid) * 100,
    };

    const confidence = {
      score: result.confidence_score,
      level: result.confidence_score >= 0.8 ? 'high' :
             result.confidence_score >= 0.6 ? 'medium' : 'low',
      factors: this.determineConfidenceFactors(result),
    };

    const keyInsights = this.generateKeyInsights(result, range, confidence);
    const recommendations = this.generateRecommendations(result, range, confidence);

    return {
      valuationRange: range,
      confidence,
      keyInsights,
      riskFactors: result.risk_factors || [],
      valueDrivers: result.key_value_drivers || [],
      recommendations,
    };
  }

  /**
   * Compare two valuation results
   */
  compareResults(current: ValuationResponse, previous: ValuationResponse): ResultsComparison {
    const valueChange = current.equity_value_mid - previous.equity_value_mid;
    const valueChangePercentage = (valueChange / previous.equity_value_mid) * 100;
    const confidenceChange = current.confidence_score - previous.confidence_score;
    const methodologyChanged = current.methodology !== previous.methodology;

    const significantChanges: string[] = [];

    if (Math.abs(valueChangePercentage) > 10) {
      significantChanges.push(`Value changed by ${valueChangePercentage.toFixed(1)}%`);
    }

    if (Math.abs(confidenceChange) > 0.1) {
      significantChanges.push(`Confidence ${confidenceChange > 0 ? 'increased' : 'decreased'} by ${(Math.abs(confidenceChange) * 100).toFixed(0)}%`);
    }

    if (methodologyChanged) {
      significantChanges.push(`Methodology changed from ${previous.methodology} to ${current.methodology}`);
    }

    const trend = valueChange > 0 ? 'improving' :
                  valueChange < 0 ? 'declining' : 'stable';

    const analysis = this.generateComparisonAnalysis(current, previous, significantChanges, trend);

    return {
      changes: {
        valueChange,
        valueChangePercentage,
        confidenceChange,
        methodologyChanged,
      },
      significantChanges,
      trend,
      analysis,
    };
  }

  /**
   * Export results in specified format
   */
  async exportResults(config: ResultsExport): Promise<Blob> {
    if (!this.result) {
      throw new Error('No results to export');
    }

    const exportData = {
      result: this.result,
      ...(config.includeMetadata && this.metadata && { metadata: this.metadata }),
      ...(config.includeRawData && this.inputData && { inputData: this.inputData }),
      exportedAt: new Date().toISOString(),
    };

    switch (config.format) {
      case 'json':
        return new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });

      case 'csv':
        const csvContent = this.convertToCSV(exportData);
        return new Blob([csvContent], { type: 'text/csv' });

      case 'pdf':
        // Would integrate with PDF generation library
        throw new Error('PDF export not yet implemented');

      default:
        throw new Error(`Unsupported export format: ${config.format}`);
    }
  }

  /**
   * Check if export format is supported
   */
  canExport(format: ResultsExport['format']): boolean {
    return ['json', 'csv'].includes(format);
  }

  /**
   * Validate valuation result structure
   */
  validateResult(result: ValuationResponse): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!result.valuation_id) {
      errors.push('Missing valuation ID');
    }

    if (typeof result.equity_value_mid !== 'number' || result.equity_value_mid <= 0) {
      errors.push('Invalid equity value');
    }

    if (typeof result.confidence_score !== 'number' ||
        result.confidence_score < 0 || result.confidence_score > 1) {
      errors.push('Invalid confidence score');
    }

    if (!result.methodology) {
      errors.push('Missing methodology');
    }

    // Business logic validations
    if (result.equity_value_low && result.equity_value_mid &&
        result.equity_value_low > result.equity_value_mid) {
      errors.push('Low value cannot be higher than mid value');
    }

    if (result.equity_value_high && result.equity_value_mid &&
        result.equity_value_high < result.equity_value_mid) {
      errors.push('High value cannot be lower than mid value');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get results history
   */
  getResultsHistory(): ResultsHistoryEntry[] {
    return [...this.resultsHistory];
  }

  /**
   * Add result to history
   */
  addToHistory(result: ValuationResponse, metadata: ResultsMetadata): void {
    const entry: ResultsHistoryEntry = {
      id: `result_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      result: { ...result },
      metadata: { ...metadata },
      timestamp: Date.now(),
    };

    this.resultsHistory.push(entry);

    // Maintain history size
    if (this.resultsHistory.length > this.maxHistorySize) {
      this.resultsHistory = this.resultsHistory.slice(-this.maxHistorySize);
    }

    storeLogger.debug('[ResultsManager] Result added to history', {
      historySize: this.resultsHistory.length,
      valuationId: result.valuation_id,
    });
  }

  /**
   * Clear results history
   */
  clearHistory(): void {
    this.resultsHistory = [];
    storeLogger.info('[ResultsManager] Results history cleared');
  }

  // Private helper methods
  private determineConfidenceFactors(result: ValuationResponse): string[] {
    const factors: string[] = [];

    if (result.confidence_score >= 0.8) {
      factors.push('High quality input data');
      factors.push('Established valuation methodology');
    } else if (result.confidence_score >= 0.6) {
      factors.push('Moderate data completeness');
    } else {
      factors.push('Limited input data available');
      factors.push('High uncertainty in estimates');
    }

    if (result.key_metrics && Object.keys(result.key_metrics).length > 0) {
      factors.push('Key financial metrics available');
    }

    return factors;
  }

  private generateKeyInsights(result: ValuationResponse, range: any, confidence: any): string[] {
    const insights: string[] = [];

    insights.push(`Estimated valuation range: €${range.low.toLocaleString()} - €${range.high.toLocaleString()}`);
    insights.push(`Most likely value: €${result.equity_value_mid.toLocaleString()}`);
    insights.push(`Confidence level: ${confidence.level} (${(result.confidence_score * 100).toFixed(0)}%)`);

    if (range.rangePercentage > 50) {
      insights.push(`Wide valuation range (${range.rangePercentage.toFixed(0)}%) indicates high uncertainty`);
    }

    if (result.methodology) {
      insights.push(`Valuation based on ${result.methodology} methodology`);
    }

    return insights;
  }

  private generateRecommendations(result: ValuationResponse, range: any, confidence: any): string[] {
    const recommendations: string[] = [];

    if (confidence.score < 0.6) {
      recommendations.push('Consider providing more financial data to improve valuation accuracy');
    }

    if (range.rangePercentage > 30) {
      recommendations.push('The wide valuation range suggests additional due diligence may be beneficial');
    }

    if (result.risk_factors && result.risk_factors.length > 0) {
      recommendations.push('Address identified risk factors to potentially increase valuation');
    }

    if (result.key_value_drivers && result.key_value_drivers.length > 0) {
      recommendations.push('Focus on the identified value drivers to maximize business value');
    }

    return recommendations;
  }

  private generateComparisonAnalysis(
    current: ValuationResponse,
    previous: ValuationResponse,
    significantChanges: string[],
    trend: string
  ): string {
    let analysis = `Valuation ${trend} compared to previous estimate. `;

    if (significantChanges.length > 0) {
      analysis += `Key changes: ${significantChanges.join(', ')}. `;
    }

    if (current.confidence_score > previous.confidence_score) {
      analysis += 'Confidence in the estimate has improved.';
    } else if (current.confidence_score < previous.confidence_score) {
      analysis += 'Confidence in the estimate has decreased.';
    } else {
      analysis += 'Confidence level remains unchanged.';
    }

    return analysis;
  }

  private convertToCSV(data: any): string {
    // Simple CSV conversion - would be enhanced for full export
    const rows: string[] = [];

    rows.push('Field,Value');
    rows.push(`Valuation ID,${data.result?.valuation_id || ''}`);
    rows.push(`Equity Value Mid,${data.result?.equity_value_mid || ''}`);
    rows.push(`Confidence Score,${data.result?.confidence_score || ''}`);
    rows.push(`Methodology,${data.result?.methodology || ''}`);
    rows.push(`Generated At,${data.exportedAt || ''}`);

    return rows.join('\n');
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseResultsManagerResult {
  manager: ResultsManager;
  result: ValuationResponse | null;
  metadata: ResultsMetadata | null;
  inputData: ValuationInputData | null;
  actions: {
    setResult: (result: ValuationResponse | null, metadata?: Partial<ResultsMetadata>) => void;
    clearResult: () => void;
    setInputData: (data: ValuationInputData | null) => void;
    updateDisplayConfig: (config: Partial<ResultsDisplayConfig>) => void;
    exportResults: (config: ResultsExport) => Promise<Blob>;
  };
  analysis: {
    analyzeResults: (result: ValuationResponse) => ResultsAnalysis;
    compareResults: (current: ValuationResponse, previous: ValuationResponse) => ResultsComparison;
    validateResult: (result: ValuationResponse) => { isValid: boolean; errors: string[] };
  };
  history: {
    getHistory: () => ResultsHistoryEntry[];
    clearHistory: () => void;
  };
  config: {
    displayConfig: ResultsDisplayConfig;
    canExport: (format: ResultsExport['format']) => boolean;
  };
}

/**
 * useResultsManager Hook
 *
 * React hook interface for ResultsManager engine
 * Provides reactive valuation results management and analysis
 */
export const useResultsManager = (
  config?: Partial<ResultsDisplayConfig>
): UseResultsManagerResult => {
  const manager = useMemo(() => new ResultsManagerImpl(config), [config]);

  const actions = {
    setResult: useCallback(
      (result: ValuationResponse | null, metadata?: Partial<ResultsMetadata>) =>
        manager.setResult(result, metadata),
      [manager]
    ),
    clearResult: useCallback(() => manager.clearResult(), [manager]),
    setInputData: useCallback(
      (data: ValuationInputData | null) => manager.setInputData(data),
      [manager]
    ),
    updateDisplayConfig: useCallback(
      (config: Partial<ResultsDisplayConfig>) => manager.updateDisplayConfig(config),
      [manager]
    ),
    exportResults: useCallback(
      (config: ResultsExport) => manager.exportResults(config),
      [manager]
    ),
  };

  const analysis = {
    analyzeResults: useCallback(
      (result: ValuationResponse) => manager.analyzeResults(result),
      [manager]
    ),
    compareResults: useCallback(
      (current: ValuationResponse, previous: ValuationResponse) =>
        manager.compareResults(current, previous),
      [manager]
    ),
    validateResult: useCallback(
      (result: ValuationResponse) => manager.validateResult(result),
      [manager]
    ),
  };

  const history = {
    getHistory: useCallback(() => manager.getResultsHistory(), [manager]),
    clearHistory: useCallback(() => manager.clearHistory(), [manager]),
  };

  const result = manager.getResult();
  const metadata = manager.getMetadata();
  const inputData = manager.getInputData();
  const displayConfig = manager.getDisplayConfig();

  const canExport = useCallback(
    (format: ResultsExport['format']) => manager.canExport(format),
    [manager]
  );

  return {
    manager,
    result,
    metadata,
    inputData,
    actions,
    analysis,
    history,
    config: {
      displayConfig,
      canExport,
    },
  };
};
