/**
 * IAnalyticsService Interface - Analytics Abstraction
 *
 * Defines the contract for analytics and tracking services.
 * Components depend on this interface, not concrete implementations.
 */

export interface IAnalyticsService {
  trackEvent(eventName: string, properties?: Record<string, unknown>): void
  trackPageView(pageName: string, properties?: Record<string, unknown>): void
  trackUserAction(action: string, properties?: Record<string, unknown>): void
  identifyUser(userId: string, traits?: Record<string, unknown>): void
}
