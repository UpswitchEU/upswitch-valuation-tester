/**
 * Performance Monitor
 * 
 * Single Responsibility: Monitor and enforce performance targets (<2s framework requirement).
 * Tracks operation duration, logs slow operations, provides metrics.
 * 
 * Framework compliance: Lines 1453-1468 (Performance Monitoring)
 * 
 * @module utils/performanceMonitor
 */

import { storeLogger } from './logger'

export interface PerformanceThresholds {
  /** Target duration in ms */
  target: number
  /** Acceptable duration in ms */
  acceptable: number
  /** Slow duration in ms (triggers warning) */
  slow: number
}

export interface PerformanceMetric {
  operation: string
  duration_ms: number
  timestamp: Date
  correlationId?: string
  context?: Record<string, unknown>
  status: 'target' | 'acceptable' | 'slow' | 'critical'
}

/**
 * Performance Monitor Class
 * 
 * Tracks operation performance against thresholds.
 * Logs warnings for slow operations.
 * Collects metrics for analysis.
 * 
 * @example
 * ```typescript
 * const monitor = new PerformanceMonitor()
 * 
 * const result = await monitor.measure('session-create', async () => {
 *   return await createSession(reportId)
 * }, {
 *   target: 500,
 *   acceptable: 1000,
 *   slow: 2000
 * })
 * ```
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = []
  private readonly maxMetrics = 1000

  /**
   * Measure operation performance
   * 
   * @param operation - Operation name
   * @param fn - Function to measure
   * @param thresholds - Performance thresholds
   * @param context - Additional context for logging
   * @returns Result from function
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    thresholds: PerformanceThresholds,
    context?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now()

    try {
      const result = await fn()
      const duration = performance.now() - start

      this.recordMetric(operation, duration, thresholds, 'success', context)
      return result
    } catch (error) {
      const duration = performance.now() - start
      this.recordMetric(operation, duration, thresholds, 'error', context)
      throw error
    }
  }

  /**
   * Record performance metric
   */
  private recordMetric(
    operation: string,
    duration_ms: number,
    thresholds: PerformanceThresholds,
    outcome: 'success' | 'error',
    context?: Record<string, unknown>
  ): void {
    // Determine status
    let status: PerformanceMetric['status']
    if (duration_ms <= thresholds.target) {
      status = 'target'
    } else if (duration_ms <= thresholds.acceptable) {
      status = 'acceptable'
    } else if (duration_ms <= thresholds.slow) {
      status = 'slow'
    } else {
      status = 'critical'
    }

    const metric: PerformanceMetric = {
      operation,
      duration_ms,
      timestamp: new Date(),
      context,
      status,
    }

    // Add to metrics
    this.metrics.push(metric)
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift() // Remove oldest
    }

    // Log based on status
    const logData = {
      operation,
      duration_ms: duration_ms.toFixed(2),
      status,
      outcome,
      thresholds,
      ...context,
    }

    if (status === 'critical') {
      storeLogger.error('Performance CRITICAL - exceeds slow threshold', logData)
    } else if (status === 'slow') {
      storeLogger.warn('Performance SLOW - exceeds acceptable threshold', logData)
    } else if (status === 'acceptable') {
      storeLogger.info('Performance ACCEPTABLE - exceeds target', logData)
    } else {
      storeLogger.debug('Performance TARGET met', logData)
    }
  }

  /**
   * Get metrics for operation
   * 
   * @param operation - Operation name to filter by
   * @returns Array of metrics
   */
  getMetrics(operation?: string): PerformanceMetric[] {
    if (operation) {
      return this.metrics.filter((m) => m.operation === operation)
    }
    return [...this.metrics]
  }

  /**
   * Get performance statistics
   * 
   * @param operation - Optional operation to filter by
   * @returns Statistics object
   */
  getStats(operation?: string): {
    count: number
    avgDuration_ms: number
    minDuration_ms: number
    maxDuration_ms: number
    p50Duration_ms: number
    p95Duration_ms: number
    p99Duration_ms: number
    targetRate: number
    acceptableRate: number
  } {
    const metrics = operation ? this.getMetrics(operation) : this.metrics

    if (metrics.length === 0) {
      return {
        count: 0,
        avgDuration_ms: 0,
        minDuration_ms: 0,
        maxDuration_ms: 0,
        p50Duration_ms: 0,
        p95Duration_ms: 0,
        p99Duration_ms: 0,
        targetRate: 0,
        acceptableRate: 0,
      }
    }

    const durations = metrics.map((m) => m.duration_ms).sort((a, b) => a - b)
    const sum = durations.reduce((acc, d) => acc + d, 0)

    const targetCount = metrics.filter((m) => m.status === 'target').length
    const acceptableCount = metrics.filter(
      (m) => m.status === 'target' || m.status === 'acceptable'
    ).length

    return {
      count: metrics.length,
      avgDuration_ms: sum / metrics.length,
      minDuration_ms: durations[0],
      maxDuration_ms: durations[durations.length - 1],
      p50Duration_ms: durations[Math.floor(durations.length * 0.5)],
      p95Duration_ms: durations[Math.floor(durations.length * 0.95)],
      p99Duration_ms: durations[Math.floor(durations.length * 0.99)],
      targetRate: targetCount / metrics.length,
      acceptableRate: acceptableCount / metrics.length,
    }
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = []
  }
}

// Singleton performance monitor
export const globalPerformanceMonitor = new PerformanceMonitor()

/**
 * Preset thresholds for common operations
 * 
 * Based on framework requirements (lines 1400-1406).
 */
export const performanceThresholds = {
  /**
   * Session creation
   * - Target: <500ms
   * - Acceptable: <1s
   * - Slow: >1s
   */
  sessionCreate: {
    target: 500,
    acceptable: 1000,
    slow: 2000,
  },

  /**
   * Conversation restoration
   * - Target: <1s
   * - Acceptable: <2s
   * - Slow: >2s
   */
  restoration: {
    target: 1000,
    acceptable: 2000,
    slow: 5000,
  },

  /**
   * View switching
   * - Target: <500ms
   * - Acceptable: <1s
   * - Slow: >1s
   */
  viewSwitch: {
    target: 500,
    acceptable: 1000,
    slow: 2000,
  },

  /**
   * Session load
   * - Target: <500ms
   * - Acceptable: <1s
   * - Slow: >1s
   */
  sessionLoad: {
    target: 500,
    acceptable: 1000,
    slow: 2000,
  },

  /**
   * General API call
   * - Target: <200ms
   * - Acceptable: <500ms
   * - Slow: >500ms
   */
  apiCall: {
    target: 200,
    acceptable: 500,
    slow: 1000,
  },
} as const

/**
 * Convenience function to measure session operation
 * 
 * @param operation - Operation name
 * @param fn - Function to measure
 * @param context - Additional context
 * @returns Result from function
 */
export async function measureSessionOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  return globalPerformanceMonitor.measure(
    operation,
    fn,
    performanceThresholds.sessionCreate,
    context
  )
}

/**
 * Convenience function to measure restoration operation
 * 
 * @param operation - Operation name
 * @param fn - Function to measure
 * @param context - Additional context
 * @returns Result from function
 */
export async function measureRestorationOperation<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T> {
  return globalPerformanceMonitor.measure(
    operation,
    fn,
    performanceThresholds.restoration,
    context
  )
}

