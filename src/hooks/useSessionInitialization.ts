/**
 * useSessionInitialization Hook
 *
 * Single Responsibility: Ensure guest session is initialized on component mount
 * Works for both guest and authenticated users
 *
 * Features:
 * - Idempotent: Safe to call multiple times, uses Zustand promise cache
 * - Non-blocking: Silent failures don't block page load
 * - Auth-aware: Waits for auth to finish loading before initializing
 *
 * Usage:
 * ```tsx
 * export function MyComponent() {
 *   useSessionInitialization()
 *   // Component logic...
 * }
 * ```
 */

import { useEffect } from 'react'
import { useGuestSessionStore } from '../store/useGuestSessionStore'
import { createContextLogger } from '../utils/logger'
import { useAuth } from './useAuth'

const sessionInitLogger = createContextLogger('SessionInitialization')

/**
 * Ensures guest session is initialized on component mount.
 * Works for both guest and authenticated users.
 *
 * Idempotent: Safe to call multiple times, uses Zustand promise cache.
 * Non-blocking: Silent failures don't block page load.
 */
export function useSessionInitialization(): void {
  const { ensureSession } = useGuestSessionStore()
  const { isAuthenticated, isLoading: authLoading } = useAuth()

  useEffect(() => {
    // Wait for auth to finish loading before initializing session
    // This prevents race conditions between auth check and session initialization
    if (authLoading) {
      sessionInitLogger.debug('Auth still loading, deferring session initialization')
      return
    }

    // Ensure session exists (works for both guest and authenticated)
    // This is idempotent - safe to call multiple times
    ensureSession()
      .then((sessionId) => {
        if (sessionId) {
          sessionInitLogger.debug('Session initialized successfully', {
            sessionId: sessionId.substring(0, 15) + '...',
            isAuthenticated,
          })
        }
      })
      .catch((error) => {
        // Silent failure - session initialization is non-blocking
        // Errors are logged in the store, don't log here to avoid noise
        sessionInitLogger.debug('Session initialization failed (non-blocking)', {
          error: error instanceof Error ? error.message : 'Unknown error',
          isAuthenticated,
        })
      })
  }, [ensureSession, isAuthenticated, authLoading])
}

