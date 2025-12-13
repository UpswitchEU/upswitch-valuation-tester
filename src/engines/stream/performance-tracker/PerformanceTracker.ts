/**
 * PerformanceTracker Engine - Model Performance Metrics Tracking
 *
 * Single Responsibility: Track, analyze, and report AI model performance metrics
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/stream/performance-tracker/PerformanceTracker
 */

import { useCallback, useMemo } from 'react';
import { chatLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ModelPerformanceMetrics {
  model_name: string;
  model_version: string;
  time_to_first_token_ms: number;
  total_response_time_ms: number;
  tokens_per_second: number;
  response_coherence_score?: number;
  response_relevance_score?: number;
  hallucination_detected: boolean;
  input_tokens: number;
  output_tokens: number;
  estimated_cost_usd: number;
  error_occurred: boolean;
  error_type?: string;
  retry_count: number;
  timestamp: number;
  session_id?: string;
  conversation_id?: string;
}

export interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  averageTokensPerSecond: number;
  averageCostPerRequest: number;
  errorRate: number;
  coherenceScore: number;
  relevanceScore: number;
  hallucinationRate: number;
  modelUsage: Record<string, number>;
}

export interface PerformanceThresholds {
  maxResponseTime: number; // ms
  minTokensPerSecond: number;
  maxCostPerRequest: number; // USD
  minCoherenceScore: number;
  minRelevanceScore: number;
  maxHallucinationRate: number;
}

export interface PerformanceTracker {
  // Metric tracking
  trackMetrics(metrics: ModelPerformanceMetrics): void;

  // Performance analysis
  getStats(timeRange?: number): PerformanceStats;
  getModelStats(modelName: string): PerformanceStats;
  detectAnomalies(): PerformanceAnomaly[];

  // Threshold monitoring
  checkThresholds(metrics: ModelPerformanceMetrics): ThresholdViolation[];
  setThresholds(thresholds: Partial<PerformanceThresholds>): void;

  // Reporting
  generateReport(timeRange?: number): PerformanceReport;
  exportMetrics(): ModelPerformanceMetrics[];

  // Cleanup
  clearMetrics(olderThan?: number): void;
  resetStats(): void;
}

export interface PerformanceAnomaly {
  type: 'high_latency' | 'low_throughput' | 'high_cost' | 'low_quality' | 'high_errors';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: number;
  metrics: Partial<ModelPerformanceMetrics>;
}

export interface ThresholdViolation {
  threshold: keyof PerformanceThresholds;
  actualValue: number;
  thresholdValue: number;
  severity: 'warning' | 'error';
  message: string;
}

export interface PerformanceReport {
  summary: PerformanceStats;
  anomalies: PerformanceAnomaly[];
  violations: ThresholdViolation[];
  recommendations: string[];
  generatedAt: number;
}

// ============================================================================
// DEFAULT THRESHOLDS
// ============================================================================

const DEFAULT_THRESHOLDS: PerformanceThresholds = {
  maxResponseTime: 10000, // 10 seconds
  minTokensPerSecond: 10,
  maxCostPerRequest: 0.10, // $0.10 per request
  minCoherenceScore: 0.7,
  minRelevanceScore: 0.6,
  maxHallucinationRate: 0.05, // 5%
};

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class PerformanceTrackerImpl implements PerformanceTracker {
  private metrics: ModelPerformanceMetrics[] = [];
  private thresholds: PerformanceThresholds;
  private maxMetricsHistory = 10000; // Keep last 10k metrics

  constructor(thresholds?: Partial<PerformanceThresholds>) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Track performance metrics for a model request
   */
  trackMetrics(metrics: ModelPerformanceMetrics): void {
    const completeMetrics: ModelPerformanceMetrics = {
      ...metrics,
      timestamp: metrics.timestamp || Date.now(),
    };

    this.metrics.push(completeMetrics);

    // Maintain history limit
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }

    chatLogger.debug('[PerformanceTracker] Tracked metrics', {
      model: metrics.model_name,
      responseTime: metrics.total_response_time_ms,
      tokensPerSecond: metrics.tokens_per_second,
      cost: metrics.estimated_cost_usd,
      success: !metrics.error_occurred,
    });

    // Check for immediate anomalies
    const violations = this.checkThresholds(completeMetrics);
    if (violations.length > 0) {
      chatLogger.warn('[PerformanceTracker] Threshold violations detected', {
        violations: violations.length,
        model: metrics.model_name,
      });
    }
  }

  /**
   * Get performance statistics for a time range
   */
  getStats(timeRange?: number): PerformanceStats {
    const cutoff = timeRange ? Date.now() - timeRange : 0;
    const relevantMetrics = this.metrics.filter(m => m.timestamp >= cutoff);

    if (relevantMetrics.length === 0) {
      return this.createEmptyStats();
    }

    const successfulMetrics = relevantMetrics.filter(m => !m.error_occurred);
    const modelUsage = this.calculateModelUsage(relevantMetrics);

    return {
      totalRequests: relevantMetrics.length,
      successfulRequests: successfulMetrics.length,
      failedRequests: relevantMetrics.length - successfulMetrics.length,
      averageResponseTime: this.calculateAverage(relevantMetrics, 'total_response_time_ms'),
      averageTokensPerSecond: this.calculateAverage(successfulMetrics, 'tokens_per_second'),
      averageCostPerRequest: this.calculateAverage(relevantMetrics, 'estimated_cost_usd'),
      errorRate: (relevantMetrics.length - successfulMetrics.length) / relevantMetrics.length,
      coherenceScore: this.calculateAverage(successfulMetrics, 'response_coherence_score'),
      relevanceScore: this.calculateAverage(successfulMetrics, 'response_relevance_score'),
      hallucinationRate: successfulMetrics.filter(m => m.hallucination_detected).length / successfulMetrics.length,
      modelUsage,
    };
  }

  /**
   * Get performance stats for a specific model
   */
  getModelStats(modelName: string): PerformanceStats {
    const modelMetrics = this.metrics.filter(m => m.model_name === modelName);
    const mockTracker = new PerformanceTrackerImpl(this.thresholds);

    modelMetrics.forEach(metrics => mockTracker.trackMetrics(metrics));
    return mockTracker.getStats();
  }

  /**
   * Detect performance anomalies
   */
  detectAnomalies(): PerformanceAnomaly[] {
    const anomalies: PerformanceAnomaly[] = [];
    const recentMetrics = this.metrics.slice(-100); // Last 100 requests

    if (recentMetrics.length < 10) return anomalies;

    const stats = this.getStats(3600000); // Last hour

    // High latency anomaly
    if (stats.averageResponseTime > this.thresholds.maxResponseTime * 1.5) {
      anomalies.push({
        type: 'high_latency',
        severity: stats.averageResponseTime > this.thresholds.maxResponseTime * 2 ? 'critical' : 'high',
        description: `Average response time (${stats.averageResponseTime.toFixed(0)}ms) significantly above threshold`,
        timestamp: Date.now(),
        metrics: { total_response_time_ms: stats.averageResponseTime },
      });
    }

    // Low throughput anomaly
    if (stats.averageTokensPerSecond < this.thresholds.minTokensPerSecond * 0.5) {
      anomalies.push({
        type: 'low_throughput',
        severity: 'high',
        description: `Token throughput (${stats.averageTokensPerSecond.toFixed(1)}/s) below acceptable threshold`,
        timestamp: Date.now(),
        metrics: { tokens_per_second: stats.averageTokensPerSecond },
      });
    }

    // High cost anomaly
    if (stats.averageCostPerRequest > this.thresholds.maxCostPerRequest * 1.5) {
      anomalies.push({
        type: 'high_cost',
        severity: 'medium',
        description: `Cost per request ($${stats.averageCostPerRequest.toFixed(4)}) above threshold`,
        timestamp: Date.now(),
        metrics: { estimated_cost_usd: stats.averageCostPerRequest },
      });
    }

    // Low quality anomaly
    if (stats.coherenceScore < this.thresholds.minCoherenceScore * 0.8) {
      anomalies.push({
        type: 'low_quality',
        severity: 'medium',
        description: `Response coherence score (${stats.coherenceScore.toFixed(2)}) below threshold`,
        timestamp: Date.now(),
        metrics: { response_coherence_score: stats.coherenceScore },
      });
    }

    // High error rate anomaly
    if (stats.errorRate > 0.1) { // 10% error rate
      anomalies.push({
        type: 'high_errors',
        severity: stats.errorRate > 0.25 ? 'critical' : 'high',
        description: `Error rate (${(stats.errorRate * 100).toFixed(1)}%) is too high`,
        timestamp: Date.now(),
        metrics: {},
      });
    }

    return anomalies;
  }

  /**
   * Check if metrics violate thresholds
   */
  checkThresholds(metrics: ModelPerformanceMetrics): ThresholdViolation[] {
    const violations: ThresholdViolation[] = [];

    // Response time check
    if (metrics.total_response_time_ms > this.thresholds.maxResponseTime) {
      violations.push({
        threshold: 'maxResponseTime',
        actualValue: metrics.total_response_time_ms,
        thresholdValue: this.thresholds.maxResponseTime,
        severity: metrics.total_response_time_ms > this.thresholds.maxResponseTime * 2 ? 'error' : 'warning',
        message: `Response time ${metrics.total_response_time_ms}ms exceeds threshold`,
      });
    }

    // Throughput check
    if (metrics.tokens_per_second < this.thresholds.minTokensPerSecond) {
      violations.push({
        threshold: 'minTokensPerSecond',
        actualValue: metrics.tokens_per_second,
        thresholdValue: this.thresholds.minTokensPerSecond,
        severity: 'warning',
        message: `Token throughput ${metrics.tokens_per_second}/s below threshold`,
      });
    }

    // Cost check
    if (metrics.estimated_cost_usd > this.thresholds.maxCostPerRequest) {
      violations.push({
        threshold: 'maxCostPerRequest',
        actualValue: metrics.estimated_cost_usd,
        thresholdValue: this.thresholds.maxCostPerRequest,
        severity: 'warning',
        message: `Cost $${metrics.estimated_cost_usd} exceeds threshold`,
      });
    }

    // Quality checks
    if (metrics.response_coherence_score !== undefined && metrics.response_coherence_score < this.thresholds.minCoherenceScore) {
      violations.push({
        threshold: 'minCoherenceScore',
        actualValue: metrics.response_coherence_score,
        thresholdValue: this.thresholds.minCoherenceScore,
        severity: 'warning',
        message: `Coherence score ${metrics.response_coherence_score} below threshold`,
      });
    }

    if (metrics.response_relevance_score !== undefined && metrics.response_relevance_score < this.thresholds.minRelevanceScore) {
      violations.push({
        threshold: 'minRelevanceScore',
        actualValue: metrics.response_relevance_score,
        thresholdValue: this.thresholds.minRelevanceScore,
        severity: 'warning',
        message: `Relevance score ${metrics.response_relevance_score} below threshold`,
      });
    }

    return violations;
  }

  /**
   * Set performance thresholds
   */
  setThresholds(thresholds: Partial<PerformanceThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds };

    chatLogger.info('[PerformanceTracker] Updated thresholds', { thresholds });
  }

  /**
   * Generate comprehensive performance report
   */
  generateReport(timeRange?: number): PerformanceReport {
    const summary = this.getStats(timeRange);
    const anomalies = this.detectAnomalies();
    const violations: ThresholdViolation[] = [];

    // Check recent metrics against thresholds
    const recentMetrics = this.metrics.slice(-50); // Last 50 requests
    recentMetrics.forEach(metrics => {
      violations.push(...this.checkThresholds(metrics));
    });

    const recommendations = this.generateRecommendations(summary, anomalies, violations);

    return {
      summary,
      anomalies,
      violations: [...new Set(violations.map(v => JSON.stringify(v)))].map(v => JSON.parse(v)), // Deduplicate
      recommendations,
      generatedAt: Date.now(),
    };
  }

  /**
   * Export all tracked metrics
   */
  exportMetrics(): ModelPerformanceMetrics[] {
    return [...this.metrics];
  }

  /**
   * Clear old metrics
   */
  clearMetrics(olderThan?: number): void {
    const cutoff = olderThan || (Date.now() - 86400000); // Default: older than 24 hours
    const beforeCount = this.metrics.length;
    this.metrics = this.metrics.filter(m => m.timestamp >= cutoff);

    chatLogger.info('[PerformanceTracker] Cleared old metrics', {
      beforeCount,
      afterCount: this.metrics.length,
      cutoffDate: new Date(cutoff).toISOString(),
    });
  }

  /**
   * Reset all statistics
   */
  resetStats(): void {
    this.metrics = [];
    chatLogger.info('[PerformanceTracker] Reset all statistics');
  }

  // Private helper methods
  private createEmptyStats(): PerformanceStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      averageTokensPerSecond: 0,
      averageCostPerRequest: 0,
      errorRate: 0,
      coherenceScore: 0,
      relevanceScore: 0,
      hallucinationRate: 0,
      modelUsage: {},
    };
  }

  private calculateAverage(metrics: ModelPerformanceMetrics[], field: keyof ModelPerformanceMetrics): number {
    const values = metrics
      .map(m => m[field])
      .filter(v => typeof v === 'number' && !isNaN(v as number)) as number[];

    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private calculateModelUsage(metrics: ModelPerformanceMetrics[]): Record<string, number> {
    return metrics.reduce((usage, metric) => {
      usage[metric.model_name] = (usage[metric.model_name] || 0) + 1;
      return usage;
    }, {} as Record<string, number>);
  }

  private generateRecommendations(
    stats: PerformanceStats,
    anomalies: PerformanceAnomaly[],
    violations: ThresholdViolation[]
  ): string[] {
    const recommendations: string[] = [];

    if (stats.errorRate > 0.1) {
      recommendations.push('High error rate detected. Consider implementing retry logic or fallback models.');
    }

    if (stats.averageResponseTime > this.thresholds.maxResponseTime) {
      recommendations.push('Response times are too slow. Consider optimizing prompts or using faster models.');
    }

    if (stats.averageTokensPerSecond < this.thresholds.minTokensPerSecond) {
      recommendations.push('Token throughput is low. Consider using models optimized for speed.');
    }

    if (stats.hallucinationRate > this.thresholds.maxHallucinationRate) {
      recommendations.push('High hallucination rate detected. Consider adding fact-checking layers.');
    }

    if (anomalies.length > 0) {
      recommendations.push(`${anomalies.length} performance anomalies detected. Review recent model performance.`);
    }

    if (violations.length > 0) {
      recommendations.push(`${violations.length} threshold violations detected. Adjust model parameters or switch models.`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is within acceptable thresholds. Continue monitoring.');
    }

    return recommendations;
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UsePerformanceTrackerResult {
  tracker: PerformanceTracker;
  actions: {
    trackMetrics: (metrics: ModelPerformanceMetrics) => void;
    getStats: (timeRange?: number) => PerformanceStats;
    getModelStats: (modelName: string) => PerformanceStats;
    detectAnomalies: () => PerformanceAnomaly[];
    checkThresholds: (metrics: ModelPerformanceMetrics) => ThresholdViolation[];
    generateReport: (timeRange?: number) => PerformanceReport;
    exportMetrics: () => ModelPerformanceMetrics[];
    clearMetrics: (olderThan?: number) => void;
    resetStats: () => void;
  };
  helpers: {
    hasAnomalies: boolean;
    hasViolations: boolean;
    overallHealth: 'healthy' | 'warning' | 'critical';
  };
  thresholds: {
    setThresholds: (thresholds: Partial<PerformanceThresholds>) => void;
    getThresholds: () => PerformanceThresholds;
  };
}

/**
 * usePerformanceTracker Hook
 *
 * React hook interface for PerformanceTracker engine
 * Provides reactive AI model performance tracking and analysis
 */
export const usePerformanceTracker = (
  initialThresholds?: Partial<PerformanceThresholds>
): UsePerformanceTrackerResult => {
  const tracker = useMemo(() => new PerformanceTrackerImpl(initialThresholds), [initialThresholds]);
  const anomalies = useMemo(() => tracker.detectAnomalies(), [tracker]);

  const actions = {
    trackMetrics: useCallback((metrics: ModelPerformanceMetrics) => tracker.trackMetrics(metrics), [tracker]),
    getStats: useCallback((timeRange?: number) => tracker.getStats(timeRange), [tracker]),
    getModelStats: useCallback((modelName: string) => tracker.getModelStats(modelName), [tracker]),
    detectAnomalies: useCallback(() => tracker.detectAnomalies(), [tracker]),
    checkThresholds: useCallback((metrics: ModelPerformanceMetrics) => tracker.checkThresholds(metrics), [tracker]),
    generateReport: useCallback((timeRange?: number) => tracker.generateReport(timeRange), [tracker]),
    exportMetrics: useCallback(() => tracker.exportMetrics(), [tracker]),
    clearMetrics: useCallback((olderThan?: number) => tracker.clearMetrics(olderThan), [tracker]),
    resetStats: useCallback(() => tracker.resetStats(), [tracker]),
  };

  const helpers = {
    hasAnomalies: anomalies.length > 0,
    hasViolations: useMemo(() => {
      const recentMetrics = tracker.exportMetrics().slice(-10);
      return recentMetrics.some(metrics => tracker.checkThresholds(metrics).length > 0);
    }, [tracker]),
    overallHealth: useMemo(() => {
      const stats = tracker.getStats(3600000); // Last hour
      if (stats.errorRate > 0.2 || anomalies.some(a => a.severity === 'critical')) return 'critical';
      if (stats.errorRate > 0.1 || anomalies.length > 0) return 'warning';
      return 'healthy';
    }, [tracker, anomalies]),
  };

  const thresholds = {
    setThresholds: useCallback((newThresholds: Partial<PerformanceThresholds>) => tracker.setThresholds(newThresholds), [tracker]),
    getThresholds: useCallback(() => ({ ...DEFAULT_THRESHOLDS }), []),
  };

  return {
    tracker,
    actions,
    helpers,
    thresholds,
  };
};
