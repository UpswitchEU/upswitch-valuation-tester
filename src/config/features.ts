/**
 * Feature Flags Configuration for Valuation Tester
 *
 * Centralized feature flag management for the valuation tester frontend
 */

import { generalLogger } from '../utils/logger';

export const FEATURE_FLAGS = {
  // Credit System Flags
  UNLIMITED_CREDITS_MODE: import.meta.env.VITE_UNLIMITED_CREDITS_MODE !== 'false',
  SHOW_CREDIT_BADGE: import.meta.env.VITE_SHOW_CREDIT_BADGE !== 'false',
  SHOW_USAGE_STATS: import.meta.env.VITE_SHOW_USAGE_STATS === 'true',
  ENABLE_PREMIUM_UPSELL: import.meta.env.VITE_ENABLE_PREMIUM_UPSELL === 'true',
  
  // UI/UX Flags
  SHOW_ONBOARDING_TOOLTIPS: import.meta.env.VITE_SHOW_ONBOARDING_TOOLTIPS !== 'false',
  ENABLE_ANIMATIONS: import.meta.env.VITE_ENABLE_ANIMATIONS !== 'false',
  SHOW_CREDIT_ANALYTICS: import.meta.env.VITE_SHOW_CREDIT_ANALYTICS === 'true',
  
  // Development Flags
  DEBUG_CREDIT_SYSTEM: import.meta.env.VITE_DEBUG_CREDIT_SYSTEM === 'true',
  MOCK_CREDIT_DATA: import.meta.env.VITE_MOCK_CREDIT_DATA === 'true',
};

// Helper functions for feature flag checks
export const isUnlimitedCreditsMode = (): boolean => FEATURE_FLAGS.UNLIMITED_CREDITS_MODE;
export const shouldShowCreditBadge = (): boolean => FEATURE_FLAGS.SHOW_CREDIT_BADGE;
export const shouldShowUsageStats = (): boolean => FEATURE_FLAGS.SHOW_USAGE_STATS;
export const shouldEnablePremiumUpsell = (): boolean => FEATURE_FLAGS.ENABLE_PREMIUM_UPSELL;
export const shouldShowOnboardingTooltips = (): boolean => FEATURE_FLAGS.SHOW_ONBOARDING_TOOLTIPS;
export const shouldEnableAnimations = (): boolean => FEATURE_FLAGS.ENABLE_ANIMATIONS;
export const shouldShowCreditAnalytics = (): boolean => FEATURE_FLAGS.SHOW_CREDIT_ANALYTICS;
export const isDebugCreditSystem = (): boolean => FEATURE_FLAGS.DEBUG_CREDIT_SYSTEM;
export const shouldMockCreditData = (): boolean => FEATURE_FLAGS.MOCK_CREDIT_DATA;

// Environment-specific configurations
export const getEnvironmentConfig = () => {
  const isDevelopment = import.meta.env.DEV;
  const isProduction = import.meta.env.PROD;
  
  return {
    isDevelopment,
    isProduction,
    apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3001',
    creditApiUrl: import.meta.env.VITE_CREDIT_API_URL || 'http://localhost:3001/api/credits',
  };
};

// Feature flag validation
export const validateFeatureFlags = () => {
  const warnings: string[] = [];
  
  if (FEATURE_FLAGS.UNLIMITED_CREDITS_MODE && FEATURE_FLAGS.ENABLE_PREMIUM_UPSELL) {
    warnings.push('Unlimited credits mode is enabled but premium upselling is also enabled. This may confuse users.');
  }
  
  if (FEATURE_FLAGS.SHOW_CREDIT_ANALYTICS && !FEATURE_FLAGS.SHOW_USAGE_STATS) {
    warnings.push('Credit analytics are enabled but usage stats are disabled. Analytics may not display properly.');
  }
  
  if (FEATURE_FLAGS.DEBUG_CREDIT_SYSTEM && import.meta.env.PROD) {
    warnings.push('Debug mode is enabled in production. This should be disabled.');
  }
  
  return warnings;
};

// Log feature flags on startup (development only)
if (import.meta.env.DEV) {
  generalLogger.info('Valuation Tester Feature Flags loaded', FEATURE_FLAGS);
  const warnings = validateFeatureFlags();
  if (warnings.length > 0) {
    generalLogger.warn('Feature Flag validation warnings', { warnings });
  }
}
