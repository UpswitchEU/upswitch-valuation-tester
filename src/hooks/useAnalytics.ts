/**
 * Analytics Hook for Upswitch Valuation Tester
 * 
 * Provides easy-to-use analytics tracking for valuation-specific events
 * and user journey monitoring on the tester subdomain.
 */

import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  trackEvent, 
  trackValuationJourney, 
  trackPerformance, 
  trackError,
  ValuationEvents,
  analyticsConfig 
} from '../config/analytics';

export const useAnalytics = () => {
  const location = useLocation();

  // Track page views
  useEffect(() => {
    trackEvent(ValuationEvents.PAGE_VIEW, {
      page_path: location.pathname,
      page_title: document.title,
      timestamp: new Date().toISOString(),
    });
  }, [location]);

  // Track valuation journey
  const trackValuation = useCallback((action: string, data?: any) => {
    switch (action) {
      case 'started':
        trackValuationJourney.started(data.method || 'manual');
        break;
      case 'completed':
        trackValuationJourney.completed(
          data.valuationAmount || 0,
          data.confidence || 0,
          data.method || 'unknown'
        );
        break;
      case 'exported':
        trackValuationJourney.exported(data.format || 'json');
        break;
      case 'abandoned':
        trackValuationJourney.abandoned(data.step || 'unknown', data.reason);
        break;
      default:
        trackEvent(action, data);
    }
  }, []);

  // Track performance metrics
  const trackPerformanceMetric = useCallback((metric: string, value: number, context?: any) => {
    switch (metric) {
      case 'calculation_time':
        trackPerformance.calculationTime(value, context?.method || 'unknown');
        break;
      case 'page_load_time':
        trackPerformance.pageLoadTime(value, context?.page || location.pathname);
        break;
      default:
        trackEvent(metric, { value, ...context });
    }
  }, [location.pathname]);

  // Track errors
  const trackErrorEvent = useCallback((error: Error, context: string) => {
    trackError(error, context);
  }, []);

  // Track form interactions
  const trackFormInteraction = useCallback((action: string, field?: string, value?: any) => {
    trackEvent('form_interaction', {
      action,
      field,
      value: typeof value === 'string' ? value.substring(0, 100) : value, // Truncate long values
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Track API calls
  const trackApiCall = useCallback((endpoint: string, method: string, success: boolean, duration?: number) => {
    trackEvent('api_call', {
      endpoint,
      method,
      success,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Track user engagement
  const trackEngagement = useCallback((action: string, data?: any) => {
    trackEvent('user_engagement', {
      action,
      ...data,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return {
    trackValuation,
    trackPerformanceMetric,
    trackErrorEvent,
    trackFormInteraction,
    trackApiCall,
    trackEngagement,
    config: analyticsConfig,
  };
};

/**
 * Hook for tracking valuation-specific metrics
 */
export const useValuationAnalytics = () => {
  const analytics = useAnalytics();

  // Track when user starts a valuation
  const trackValuationStart = useCallback((method: 'manual' | 'registry' | 'document') => {
    analytics.trackValuation('started', { method });
  }, [analytics]);

  // Track when valuation is completed
  const trackValuationComplete = useCallback((
    valuationAmount: number,
    confidence: number,
    method: string,
    calculationTime: number
  ) => {
    analytics.trackValuation('completed', {
      valuationAmount,
      confidence,
      method,
    });
    
    analytics.trackPerformanceMetric('calculation_time', calculationTime, { method });
  }, [analytics]);

  // Track when user exports results
  const trackValuationExport = useCallback((format: 'pdf' | 'json') => {
    analytics.trackValuation('exported', { format });
  }, [analytics]);

  // Track form abandonment
  const trackFormAbandonment = useCallback((step: string, reason?: string) => {
    analytics.trackValuation('abandoned', { step, reason });
  }, [analytics]);

  return {
    trackValuationStart,
    trackValuationComplete,
    trackValuationExport,
    trackFormAbandonment,
  };
};

/**
 * Hook for tracking performance metrics
 */
export const usePerformanceAnalytics = () => {
  const analytics = useAnalytics();

  // Track page load performance
  useEffect(() => {
    const startTime = performance.now();
    
    const trackLoadTime = () => {
      const loadTime = performance.now() - startTime;
      analytics.trackPerformanceMetric('page_load_time', loadTime, {
        page: window.location.pathname,
      });
    };

    if (document.readyState === 'complete') {
      trackLoadTime();
    } else {
      window.addEventListener('load', trackLoadTime);
      return () => window.removeEventListener('load', trackLoadTime);
    }
  }, [analytics]);

  // Track Core Web Vitals
  useEffect(() => {
    const trackWebVitals = () => {
      // Track Largest Contentful Paint (LCP)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        analytics.trackPerformanceMetric('lcp', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // Track First Input Delay (FID)
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          analytics.trackPerformanceMetric('fid', entry.processingStart - entry.startTime);
        });
      }).observe({ entryTypes: ['first-input'] });

      // Track Cumulative Layout Shift (CLS)
      let clsValue = 0;
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        analytics.trackPerformanceMetric('cls', clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
    };

    trackWebVitals();
  }, [analytics]);

  return analytics;
};
