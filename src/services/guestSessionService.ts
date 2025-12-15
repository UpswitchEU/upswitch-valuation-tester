/**
 * Guest Session Service (Simplified Version)
 *
 * Manages guest user session tracking in the frontend
 * Simplified for subdomain integration - removed circuit breaker complexity
 */

import { generalLogger } from '../utils/logger'
import { retry } from '../utils/retry'

const GUEST_SESSION_KEY = 'upswitch_guest_session_id'
const GUEST_SESSION_EXPIRES_KEY = 'upswitch_guest_session_expires_at'
const ACTIVITY_UPDATE_THROTTLE = 10000 // 10 seconds minimum between updates (increased to prevent 429 errors)

class GuestSessionService {
  private apiUrl: string
  private lastActivityUpdate: number = 0

  constructor() {
    this.apiUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      'https://web-production-8d00b.up.railway.app'
  }

  /**
   * Generate a unique guest session ID (client-side)
   */
  private generateSessionId(): string {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(2, 10)
    return `guest_${timestamp}_${random}`
  }

  /**
   * Get or create guest session (with retry logic)
   */
  async getOrCreateSession(): Promise<string> {
    try {
      // Check if we have a stored session ID
      const storedSessionId = localStorage.getItem(GUEST_SESSION_KEY)
      const storedExpiresAt = localStorage.getItem(GUEST_SESSION_EXPIRES_KEY)

      // Check if stored session is still valid
      if (storedSessionId && storedExpiresAt) {
        const expiresAt = new Date(storedExpiresAt)
        if (expiresAt > new Date()) {
          // Verify session exists on backend (with retry)
          try {
            const response = await retry(
              () =>
                fetch(`${this.apiUrl}/api/guest/session/${storedSessionId}`, {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' },
                }),
              3,
              1000
            )

            if (response.ok) {
              const data = await response.json()
              if (data.success) {
                localStorage.setItem(GUEST_SESSION_EXPIRES_KEY, data.data.expires_at)
                return storedSessionId
              }
            }
          } catch (error) {
            generalLogger.warn('Failed to verify existing session, creating new one', { error })
          }
        }
      }

      // Create new session (with retry)
      const sessionId = this.generateSessionId()
      const response = await retry(
        () =>
          fetch(`${this.apiUrl}/api/guest/session`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ session_id: sessionId }),
          }),
        3,
        1000
      )

      if (!response.ok) {
        throw new Error(`Failed to create guest session: ${response.statusText}`)
      }

      const data = await response.json()
      if (!data.success || !data.data?.session_id) {
        throw new Error('Invalid response from session creation')
      }

      // Store session ID and expiration
      localStorage.setItem(GUEST_SESSION_KEY, data.data.session_id)
      localStorage.setItem(GUEST_SESSION_EXPIRES_KEY, data.data.expires_at)

      generalLogger.info('Guest session created', {
        sessionId: data.data.session_id,
        expiresAt: data.data.expires_at,
      })

      return data.data.session_id
    } catch (error) {
      generalLogger.error('Failed to get or create guest session', { error })
      // Fallback: use client-generated session ID
      const fallbackSessionId = this.generateSessionId()
      localStorage.setItem(GUEST_SESSION_KEY, fallbackSessionId)
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)
      localStorage.setItem(GUEST_SESSION_EXPIRES_KEY, expiresAt.toISOString())
      return fallbackSessionId
    }
  }

  /**
   * Get current session ID (doesn't create if doesn't exist)
   */
  getCurrentSessionId(): string | null {
    return localStorage.getItem(GUEST_SESSION_KEY)
  }

  /**
   * Get cached guest session ID synchronously
   */
  getGuestSessionId(): string | null {
    return this.getCurrentSessionId()
  }

  /**
   * Check if user is currently a guest (has guest session but no auth)
   */
  isGuest(): boolean {
    return !!this.getCurrentSessionId()
  }

  /**
   * Update session activity (simplified with throttling and silent failure)
   */
  async updateActivity(): Promise<void> {
    const sessionId = this.getCurrentSessionId()
    if (!sessionId) return

    // Simple throttling
    const now = Date.now()
    if (now - this.lastActivityUpdate < ACTIVITY_UPDATE_THROTTLE) {
      return
    }
    this.lastActivityUpdate = now

    // Fire and forget with simple retry
    // FIX: Handle 429 rate limiting gracefully - don't retry on rate limit
    try {
      const response = await fetch(`${this.apiUrl}/api/guest/session/${sessionId}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      // If rate limited (429), just skip - don't retry
      if (response.status === 429) {
        generalLogger.debug('Activity update rate limited, skipping', { sessionId })
        return
      }

      if (!response.ok) {
        throw new Error(`Activity update failed: ${response.status}`)
      }
    } catch (error) {
      // Silent failure - activity tracking is non-critical
      // Don't log 429 errors as warnings - they're expected under load
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (!errorMessage.includes('429')) {
        generalLogger.warn('Activity update failed (will retry next time)', {
          error: errorMessage,
        })
      }
    }
  }

  /**
   * Clear guest session
   */
  clearSession(): void {
    try {
      localStorage.removeItem(GUEST_SESSION_KEY)
      localStorage.removeItem(GUEST_SESSION_EXPIRES_KEY)
      generalLogger.info('Guest session cleared')
    } catch (error) {
      generalLogger.warn('Failed to clear guest session', { error })
    }
  }
}

export const guestSessionService = new GuestSessionService()
