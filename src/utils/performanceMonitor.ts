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
   * @param context - Optional context data
   * @returns Result from function
   */
  async measure<T>(
    operation: string,
    fn: () => Promise<T>,
    thresholds: PerformanceThresholds,
    context?: Record<string, unknown>
  ): Promise<T> {
    const startTime = performance.now()
    const correlationId = context?.correlationId as string | undefined

    try {
      const result = await fn()
      const duration = performance.now() - startTime

      this.recordMetric(operation, duration, thresholds, context, 'success', correlationId)

      return result
    } catch (error) {
      const duration = performance.now() - startTime

      this.recordMetric(operation, duration, thresholds, context, 'error', correlationId, error)

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
    context?: Record<string, unknown>,
    outcome: 'success' | 'error' = 'success',
    correlationId?: string,
    error?: unknown
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

    // Create metric
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
    slowRate: number
    criticalRate: number
  } {
    const filtered = operation
      ? this.metrics.filter((m) => m.operation === operation)
      : this.metrics

    if (filtered.length === 0) {
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
        slowRate: 0,
        criticalRate: 0,
      }
    }

    const durations = filtered.map((m) => m.duration_ms).sort((a, b) => a - b)

    const sum = durations.reduce((acc, d) => acc + d, 0)
    const avg = sum / durations.length
    const min = durations[0]
    const max = durations[durations.length - 1]

    const p50 = durations[Math.floor(durations.length * 0.5)]
    const p95 = durations[Math.floor(durations.length * 0.95)]
    const p99 = durations[Math.floor(durations.length * 0.99)]

    const targetCount = filtered.filter((m) => m.status === 'target').length
    const acceptableCount = filtered.filter((m) => m.status === 'acceptable').length
    const slowCount = filtered.filter((m) => m.status === 'slow').length
    const criticalCount = filtered.filter((m) => m.status === 'critical').length

    return {
      count: filtered.length,
      avgDuration_ms: avg,
      minDuration_ms: min,
      maxDuration_ms: max,
      p50Duration_ms: p50,
      p95Duration_ms: p95,
      p99Duration_ms: p99,
      targetRate: targetCount / filtered.length,
      acceptableRate: acceptableCount / filtered.length,
      slowRate: slowCount / filtered.length,
      criticalRate: criticalCount / filtered.length,
    }
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = []
    storeLogger.info('Performance metrics cleared')
  }
}

// Default performance thresholds
export const performanceThresholds: Record<string, PerformanceThresholds> = {
  sessionCreate: {
    target: 500,
    acceptable: 1000,
    slow: 2000,
  },
  sessionLoad: {
    target: 300,
    acceptable: 800,
    slow: 2000,
  },
  sessionRestore: {
    target: 400,
    acceptable: 1000,
    slow: 2000,
  },
  viewSwitch: {
    target: 200,
    acceptable: 500,
    slow: 1000,
  },
  sessionLoad: {
    target: 500,
    acceptable: 1000,
    slow: 2000,
  },
}

// Global performance monitor instance
export const globalPerformanceMonitor = new PerformanceMonitor()
