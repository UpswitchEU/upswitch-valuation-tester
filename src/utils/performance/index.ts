/**
 * Performance Utilities - Centralized Exports
 * 
 * Provides easy access to performance monitoring:
 * - Performance metrics collection
 * - Real User Monitoring (RUM)
 * - Core Web Vitals tracking
 * 
 * @module utils/performance
 */

export { PerformanceMonitor, performanceMonitor } from './metrics'
export type { PerformanceMetric, PerformanceThresholds } from './metrics'

export { RUMManager, rumManager } from './rum'
export type { WebVitalsMetric, CustomMetric, RUMConfig } from './rum'

