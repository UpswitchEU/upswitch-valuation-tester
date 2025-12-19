/**
 * Cookie Monitoring and Health Checks
 * 
 * Periodically monitors cookie health and detects issues early
 * Provides automatic recovery when cookies are restored
 */

import { checkCookieHealth, CookieHealthStatus } from './cookieHealth'

export interface CookieMonitorOptions {
  /** Check interval in milliseconds (default: 30 seconds) */
  checkInterval?: number
  /** Callback when cookie health changes */
  onHealthChange?: (health: CookieHealthStatus) => void
  /** Callback when cookies are blocked */
  onCookieBlocked?: (health: CookieHealthStatus) => void
  /** Callback when cookies are restored */
  onCookieRestored?: (health: CookieHealthStatus) => void
}

export class CookieMonitor {
  private intervalId: NodeJS.Timeout | null = null
  private lastHealth: CookieHealthStatus | null = null
  private isActive = false
  private options: CookieMonitorOptions

  constructor(options: CookieMonitorOptions = {}) {
    this.options = {
      checkInterval: 30000, // 30 seconds
      ...options,
    }
  }

  /**
   * Start monitoring cookie health
   */
  start(): void {
    if (this.isActive) {
      return
    }

    this.isActive = true
    
    // Initial check
    this.checkHealth()

    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.checkHealth()
    }, this.options.checkInterval)
  }

  /**
   * Stop monitoring
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isActive = false
  }

  /**
   * Perform health check
   */
  private async checkHealth(): Promise<void> {
    try {
      const health = await checkCookieHealth()

      // Check for state changes
      if (this.lastHealth) {
        // Cookies were blocked, now accessible
        if (this.lastHealth.blocked && !health.blocked && health.accessible) {
          this.options.onCookieRestored?.(health)
        }

        // Cookies were accessible, now blocked
        if (!this.lastHealth.blocked && health.blocked) {
          this.options.onCookieBlocked?.(health)
        }

        // Health status changed
        if (this.lastHealth.accessible !== health.accessible) {
          this.options.onHealthChange?.(health)
        }
      } else {
        // First check
        if (health.blocked) {
          this.options.onCookieBlocked?.(health)
        }
        this.options.onHealthChange?.(health)
      }

      this.lastHealth = health
    } catch (error) {
      console.error('Cookie health check failed:', error)
    }
  }

  /**
   * Get last known health status
   */
  getLastHealth(): CookieHealthStatus | null {
    return this.lastHealth
  }

  /**
   * Check if monitor is active
   */
  isMonitoring(): boolean {
    return this.isActive
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stop()
    this.lastHealth = null
  }
}

// Singleton instance
let cookieMonitor: CookieMonitor | null = null

/**
 * Get cookie monitor instance
 */
export function getCookieMonitor(options?: CookieMonitorOptions): CookieMonitor {
  if (!cookieMonitor) {
    cookieMonitor = new CookieMonitor(options)
  }
  return cookieMonitor
}

/**
 * Cleanup cookie monitor (for testing)
 */
export function destroyCookieMonitor(): void {
  if (cookieMonitor) {
    cookieMonitor.destroy()
    cookieMonitor = null
  }
}

