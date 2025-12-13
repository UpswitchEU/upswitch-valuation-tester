/**
 * Guest Session Service
 * 
 * Manages guest user session tracking in the frontend
 * Ensures 100% session capture for guest users
 */

import { generalLogger } from '../utils/logger';

const GUEST_SESSION_KEY = 'upswitch_guest_session_id';
const GUEST_SESSION_EXPIRES_KEY = 'upswitch_guest_session_expires_at';
const ACTIVITY_UPDATE_DISABLED_KEY = 'upswitch_activity_update_disabled';
const ACTIVITY_FAILURE_COUNT_KEY = 'upswitch_activity_failure_count';
const ACTIVITY_LAST_FAILURE_KEY = 'upswitch_activity_last_failure';

// Circuit breaker configuration
const MAX_CONSECUTIVE_FAILURES = 5; // Disable after 5 consecutive failures
const CIRCUIT_BREAKER_COOLDOWN = 5 * 60 * 1000; // 5 minutes cooldown before retry
const ACTIVITY_UPDATE_THROTTLE = 5000; // 5 seconds minimum between updates

class GuestSessionService {
  private apiUrl: string;
  private lastActivityUpdate: number = 0;
  private consecutiveFailures: number = 0;
  private circuitBreakerOpen: boolean = false;
  private circuitBreakerOpenUntil: number = 0;

  constructor() {
    this.apiUrl = import.meta.env.VITE_BACKEND_URL || 
                  import.meta.env.VITE_API_BASE_URL || 
                  'https://web-production-8d00b.up.railway.app';
    
    // Restore circuit breaker state from localStorage
    this.restoreCircuitBreakerState();
  }

  /**
   * Restore circuit breaker state from localStorage
   */
  private restoreCircuitBreakerState(): void {
    try {
      const disabled = localStorage.getItem(ACTIVITY_UPDATE_DISABLED_KEY);
      const failureCount = parseInt(localStorage.getItem(ACTIVITY_FAILURE_COUNT_KEY) || '0', 10);
      const lastFailure = parseInt(localStorage.getItem(ACTIVITY_LAST_FAILURE_KEY) || '0', 10);
      
      if (disabled === 'true') {
        const now = Date.now();
        // Check if cooldown period has passed
        if (now - lastFailure < CIRCUIT_BREAKER_COOLDOWN) {
          this.circuitBreakerOpen = true;
          this.circuitBreakerOpenUntil = lastFailure + CIRCUIT_BREAKER_COOLDOWN;
          this.consecutiveFailures = failureCount;
        } else {
          // Cooldown passed, reset circuit breaker
          this.resetCircuitBreaker();
        }
      } else {
        this.consecutiveFailures = failureCount;
      }
    } catch (error) {
      // If localStorage fails, start fresh
      this.resetCircuitBreaker();
    }
  }

  /**
   * Reset circuit breaker (after successful update or cooldown)
   */
  private resetCircuitBreaker(): void {
    this.circuitBreakerOpen = false;
    this.circuitBreakerOpenUntil = 0;
    this.consecutiveFailures = 0;
    try {
      localStorage.removeItem(ACTIVITY_UPDATE_DISABLED_KEY);
      localStorage.removeItem(ACTIVITY_FAILURE_COUNT_KEY);
      localStorage.removeItem(ACTIVITY_LAST_FAILURE_KEY);
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  /**
   * Record a failure and check if circuit breaker should open
   */
  private recordFailure(): void {
    this.consecutiveFailures++;
    const now = Date.now();
    
    try {
      localStorage.setItem(ACTIVITY_FAILURE_COUNT_KEY, this.consecutiveFailures.toString());
      localStorage.setItem(ACTIVITY_LAST_FAILURE_KEY, now.toString());
    } catch (error) {
      // Ignore localStorage errors
    }

    if (this.consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
      this.circuitBreakerOpen = true;
      this.circuitBreakerOpenUntil = now + CIRCUIT_BREAKER_COOLDOWN;
      try {
        localStorage.setItem(ACTIVITY_UPDATE_DISABLED_KEY, 'true');
      } catch (error) {
        // Ignore localStorage errors
      }
      generalLogger.warn('Guest session activity updates disabled due to repeated failures. Will retry after cooldown period.');
    }
  }

  /**
   * Record a success and reset failure count
   */
  private recordSuccess(): void {
    if (this.consecutiveFailures > 0) {
      this.consecutiveFailures = 0;
      try {
        localStorage.removeItem(ACTIVITY_FAILURE_COUNT_KEY);
        localStorage.removeItem(ACTIVITY_LAST_FAILURE_KEY);
      } catch (error) {
        // Ignore localStorage errors
      }
    }
  }

  /**
   * Check if circuit breaker is open
   */
  private isCircuitBreakerOpen(): boolean {
    if (!this.circuitBreakerOpen) {
      return false;
    }

    const now = Date.now();
    if (now >= this.circuitBreakerOpenUntil) {
      // Cooldown period passed, try again
      this.resetCircuitBreaker();
      return false;
    }

    return true;
  }

  /**
   * Generate a unique guest session ID (client-side)
   */
  private generateSessionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 10);
    return `guest_${timestamp}_${random}`;
  }

  /**
   * Get or create guest session
   * Ensures session is tracked on backend
   */
  async getOrCreateSession(): Promise<string> {
    try {
      // Check if we have a stored session ID
      const storedSessionId = localStorage.getItem(GUEST_SESSION_KEY);
      const storedExpiresAt = localStorage.getItem(GUEST_SESSION_EXPIRES_KEY);

      // Check if stored session is still valid
      if (storedSessionId && storedExpiresAt) {
        const expiresAt = new Date(storedExpiresAt);
        if (expiresAt > new Date()) {
          // Session is still valid, verify it exists on backend
          try {
            const response = await fetch(`${this.apiUrl}/api/guest/session/${storedSessionId}`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success) {
                // Update expires_at if needed
                localStorage.setItem(GUEST_SESSION_EXPIRES_KEY, data.data.expires_at);
                return storedSessionId;
              }
            }
          } catch (error) {
            generalLogger.warn('Failed to verify existing session, creating new one', { error });
          }
        }
      }

      // Create new session
      const sessionId = this.generateSessionId();
      const response = await fetch(`${this.apiUrl}/api/guest/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          session_id: sessionId
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create guest session: ${response.statusText}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error('Failed to create guest session');
      }

      // Store session ID and expiration
      localStorage.setItem(GUEST_SESSION_KEY, data.data.session_id);
      localStorage.setItem(GUEST_SESSION_EXPIRES_KEY, data.data.expires_at);

      generalLogger.info('Guest session created', {
        session_id: data.data.session_id,
        expires_at: data.data.expires_at,
        days_remaining: data.data.days_remaining
      });

      return data.data.session_id;
    } catch (error) {
      generalLogger.error('Failed to get or create guest session', { error });
      // Fallback: use client-generated session ID even if backend fails
      const fallbackSessionId = this.generateSessionId();
      localStorage.setItem(GUEST_SESSION_KEY, fallbackSessionId);
      // Set expiration to 7 days from now
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      localStorage.setItem(GUEST_SESSION_EXPIRES_KEY, expiresAt.toISOString());
      return fallbackSessionId;
    }
  }

  /**
   * Get current session ID (doesn't create if doesn't exist)
   */
  getCurrentSessionId(): string | null {
    return localStorage.getItem(GUEST_SESSION_KEY);
  }

  /**
   * Update session activity (call on each guest action)
   * Safe, throttled, and circuit-breaker protected
   */
  async updateActivity(): Promise<void> {
    // Early exit checks
    const sessionId = this.getCurrentSessionId();
    if (!sessionId) {
      return; // No session to update
    }

    // Check throttling
    const now = Date.now();
    if (now - this.lastActivityUpdate < ACTIVITY_UPDATE_THROTTLE) {
      return; // Too soon since last update
    }

    // Check circuit breaker
    if (this.isCircuitBreakerOpen()) {
      return; // Circuit breaker is open, skip update
    }

    // Update throttle timestamp
    this.lastActivityUpdate = now;

    // Perform update with timeout and error handling
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout

      const response = await fetch(`${this.apiUrl}/api/guest/session/${sessionId}/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal,
        // Don't wait for response - fire and forget
      });

      clearTimeout(timeoutId);

      // Check if request was successful (but don't wait for response body)
      if (response.ok || response.status === 0) {
        // Success - reset failure count
        this.recordSuccess();
      } else {
        // Non-OK response - record failure
        this.recordFailure();
      }
    } catch (error: any) {
      // Handle various error types
      if (error.name === 'AbortError') {
        // Timeout - record failure but don't log (expected)
        this.recordFailure();
      } else if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        // Network error - record failure
        this.recordFailure();
      } else {
        // Other errors - record failure
        this.recordFailure();
      }
      // Silently fail - this is not critical functionality
    }
  }

  /**
   * Check if session is expired
   */
  isSessionExpired(): boolean {
    const expiresAt = localStorage.getItem(GUEST_SESSION_EXPIRES_KEY);
    if (!expiresAt) {
      return true;
    }
    return new Date(expiresAt) < new Date();
  }

  /**
   * Get days remaining until session expiration
   */
  getDaysRemaining(): number {
    const expiresAt = localStorage.getItem(GUEST_SESSION_EXPIRES_KEY);
    if (!expiresAt) {
      return 0;
    }
    const now = new Date();
    const expires = new Date(expiresAt);
    const diffTime = expires.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  /**
   * Clear session (for logout or conversion to authenticated user)
   */
  clearSession(): void {
    localStorage.removeItem(GUEST_SESSION_KEY);
    localStorage.removeItem(GUEST_SESSION_EXPIRES_KEY);
  }

  /**
   * Check if user is a guest (no authenticated user)
   */
  isGuest(): boolean {
    // Check if there's an authenticated user
    const authToken = localStorage.getItem('upswitch_auth_token');
    const userId = localStorage.getItem('upswitch_user_id');
    return !authToken && !userId;
  }

  /**
   * Manually reset circuit breaker (for testing or recovery)
   */
  resetActivityUpdateCircuitBreaker(): void {
    this.resetCircuitBreaker();
    generalLogger.info('Guest session activity update circuit breaker manually reset');
  }

  /**
   * Get circuit breaker status (for debugging)
   */
  getActivityUpdateStatus(): {
    enabled: boolean;
    consecutiveFailures: number;
    circuitBreakerOpen: boolean;
    cooldownRemaining?: number;
  } {
    const now = Date.now();
    const cooldownRemaining = this.circuitBreakerOpen && this.circuitBreakerOpenUntil > now
      ? Math.max(0, this.circuitBreakerOpenUntil - now)
      : undefined;

    return {
      enabled: !this.isCircuitBreakerOpen(),
      consecutiveFailures: this.consecutiveFailures,
      circuitBreakerOpen: this.circuitBreakerOpen,
      cooldownRemaining
    };
  }
}

// Export singleton instance
export const guestSessionService = new GuestSessionService();
