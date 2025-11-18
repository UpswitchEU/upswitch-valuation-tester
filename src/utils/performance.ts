/**
 * Performance Tracking Utilities
 * Tracks TTFB, TTI, report generation time, and section rendering time
 */

export interface PerformanceMetrics {
  ttfb?: number; // Time to First Byte (ms)
  tti?: number; // Time to Interactive (ms)
  reportGenerationTime?: number; // Total report generation time (ms)
  sectionRenderingTimes?: Record<string, number>; // Section rendering times (ms)
  firstContentfulPaint?: number; // FCP (ms)
  largestContentfulPaint?: number; // LCP (ms)
  cumulativeLayoutShift?: number; // CLS score
}

class PerformanceTracker {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private marks: Map<string, number> = new Map();

  /**
   * Mark the start of an operation
   */
  markStart(operationId: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${operationId}-start`);
    }
    this.marks.set(operationId, Date.now());
  }

  /**
   * Mark the end of an operation and calculate duration
   */
  markEnd(operationId: string): number {
    const startTime = this.marks.get(operationId);
    if (!startTime) {
      console.warn(`[PerformanceTracker] No start mark found for ${operationId}`);
      return 0;
    }

    const duration = Date.now() - startTime;
    
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${operationId}-end`);
      try {
        performance.measure(operationId, `${operationId}-start`, `${operationId}-end`);
      } catch (e) {
        // Ignore measurement errors
      }
    }

    this.marks.delete(operationId);
    return duration;
  }

  /**
   * Track Time to First Byte (TTFB)
   */
  trackTTFB(requestId: string, ttfb: number): void {
    const metrics = this.getOrCreateMetrics(requestId);
    metrics.ttfb = ttfb;
    this.logMetric('TTFB', ttfb, requestId);
  }

  /**
   * Track Time to Interactive (TTI)
   */
  trackTTI(requestId: string, tti: number): void {
    const metrics = this.getOrCreateMetrics(requestId);
    metrics.tti = tti;
    this.logMetric('TTI', tti, requestId);
  }

  /**
   * Track report generation time
   */
  trackReportGeneration(requestId: string, duration: number): void {
    const metrics = this.getOrCreateMetrics(requestId);
    metrics.reportGenerationTime = duration;
    this.logMetric('Report Generation', duration, requestId);
  }

  /**
   * Track section rendering time
   */
  trackSectionRendering(requestId: string, sectionId: string, duration: number): void {
    const metrics = this.getOrCreateMetrics(requestId);
    if (!metrics.sectionRenderingTimes) {
      metrics.sectionRenderingTimes = {};
    }
    metrics.sectionRenderingTimes[sectionId] = duration;
    this.logMetric(`Section: ${sectionId}`, duration, requestId);
  }

  /**
   * Track First Contentful Paint (FCP)
   */
  trackFCP(requestId: string, fcp: number): void {
    const metrics = this.getOrCreateMetrics(requestId);
    metrics.firstContentfulPaint = fcp;
    this.logMetric('FCP', fcp, requestId);
  }

  /**
   * Track Largest Contentful Paint (LCP)
   */
  trackLCP(requestId: string, lcp: number): void {
    const metrics = this.getOrCreateMetrics(requestId);
    metrics.largestContentfulPaint = lcp;
    this.logMetric('LCP', lcp, requestId);
  }

  /**
   * Track Cumulative Layout Shift (CLS)
   */
  trackCLS(requestId: string, cls: number): void {
    const metrics = this.getOrCreateMetrics(requestId);
    metrics.cumulativeLayoutShift = cls;
    this.logMetric('CLS', cls, requestId);
  }

  /**
   * Get metrics for a request
   */
  getMetrics(requestId: string): PerformanceMetrics | undefined {
    return this.metrics.get(requestId);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Map<string, PerformanceMetrics> {
    return new Map(this.metrics);
  }

  /**
   * Clear metrics for a request
   */
  clearMetrics(requestId: string): void {
    this.metrics.delete(requestId);
  }

  /**
   * Get or create metrics for a request
   */
  private getOrCreateMetrics(requestId: string): PerformanceMetrics {
    if (!this.metrics.has(requestId)) {
      this.metrics.set(requestId, {});
    }
    return this.metrics.get(requestId)!;
  }

  /**
   * Log metric to console (dev only)
   */
  private logMetric(name: string, value: number, requestId: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms (${requestId})`);
    }
  }

  /**
   * Get performance summary
   */
  getSummary(requestId: string): {
    totalTime: number;
    averageSectionTime: number;
    slowestSection: string | null;
    fastestSection: string | null;
  } {
    const metrics = this.getMetrics(requestId);
    if (!metrics) {
      return {
        totalTime: 0,
        averageSectionTime: 0,
        slowestSection: null,
        fastestSection: null
      };
    }

    const sectionTimes = metrics.sectionRenderingTimes || {};
    const sectionEntries = Object.entries(sectionTimes);
    
    if (sectionEntries.length === 0) {
      return {
        totalTime: metrics.reportGenerationTime || 0,
        averageSectionTime: 0,
        slowestSection: null,
        fastestSection: null
      };
    }

    const times = sectionEntries.map(([_, time]) => time);
    const averageSectionTime = times.reduce((a, b) => a + b, 0) / times.length;
    
    const slowest = sectionEntries.reduce((a, b) => a[1] > b[1] ? a : b);
    const fastest = sectionEntries.reduce((a, b) => a[1] < b[1] ? a : b);

    return {
      totalTime: metrics.reportGenerationTime || 0,
      averageSectionTime,
      slowestSection: slowest[0],
      fastestSection: fastest[0]
    };
  }
}

// Export singleton instance
export const performanceTracker = new PerformanceTracker();

/**
 * Hook for tracking performance in React components
 */
export function usePerformanceTracking(requestId: string) {
  const trackStart = (operation: string) => {
    performanceTracker.markStart(`${requestId}-${operation}`);
  };

  const trackEnd = (operation: string): number => {
    return performanceTracker.markEnd(`${requestId}-${operation}`);
  };

  const trackSection = (sectionId: string, duration: number) => {
    performanceTracker.trackSectionRendering(requestId, sectionId, duration);
  };

  return {
    trackStart,
    trackEnd,
    trackSection,
    getMetrics: () => performanceTracker.getMetrics(requestId),
    getSummary: () => performanceTracker.getSummary(requestId)
  };
}

/**
 * Measure Web Vitals (if available)
 */
export function measureWebVitals(requestId: string): void {
  if (typeof window === 'undefined') return;

  // Track FCP
  if ('PerformanceObserver' in window) {
    try {
      const fcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            performanceTracker.trackFCP(requestId, entry.startTime);
            fcpObserver.disconnect();
          }
        }
      });
      fcpObserver.observe({ entryTypes: ['paint'] });
    } catch (e) {
      // FCP tracking not supported
    }

    // Track LCP
    try {
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        performanceTracker.trackLCP(requestId, lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch (e) {
      // LCP tracking not supported
    }

    // Track CLS
    try {
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        performanceTracker.trackCLS(requestId, clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
    } catch (e) {
      // CLS tracking not supported
    }
  }
}

