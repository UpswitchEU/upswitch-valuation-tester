/**
 * Guest Session Service
 * 
 * Manages guest user session tracking in the frontend
 * Ensures 100% session capture for guest users
 */

const GUEST_SESSION_KEY = 'upswitch_guest_session_id';
const GUEST_SESSION_EXPIRES_KEY = 'upswitch_guest_session_expires_at';

interface GuestSession {
  session_id: string;
  expires_at: string;
  days_remaining: number;
}

class GuestSessionService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = import.meta.env.VITE_BACKEND_URL || 
                  import.meta.env.VITE_API_BASE_URL || 
                  'https://web-production-8d00b.up.railway.app';
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
            console.warn('Failed to verify existing session, creating new one', error);
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

      console.log('Guest session created', {
        session_id: data.data.session_id,
        expires_at: data.data.expires_at,
        days_remaining: data.data.days_remaining
      });

      return data.data.session_id;
    } catch (error) {
      console.error('Failed to get or create guest session', error);
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
   */
  async updateActivity(): Promise<void> {
    try {
      const sessionId = this.getCurrentSessionId();
      if (!sessionId) {
        return; // No session to update
      }

      // Fire and forget - don't block on this
      fetch(`${this.apiUrl}/api/guest/session/${sessionId}/activity`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch(error => {
        console.warn('Failed to update guest session activity', error);
        // Don't throw - this is not critical
      });
    } catch (error) {
      console.warn('Failed to update guest session activity', error);
      // Don't throw - this is not critical
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
}

// Export singleton instance
export const guestSessionService = new GuestSessionService();
