/**
 * Async Architecture Initializer
 *
 * Initializes async architecture utilities on app startup:
 * - Service Worker registration (offline support)
 * - Real User Monitoring (RUM) - auto-initialized on import
 * - Performance monitoring - auto-initialized on import
 *
 * This component should be included in the app root to ensure
 * all async optimizations are active.
 *
 * @module components/AsyncArchitectureInitializer
 */

'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '../utils/serviceWorkerRegistration'
// RUM and performance monitoring auto-initialize on import
import '../utils/performance/rum'
import '../utils/performance/metrics'

export function AsyncArchitectureInitializer() {
  useEffect(() => {
    // Register service worker for offline support (production only)
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker({
        onUpdate: (registration) => {
          console.log('[AsyncArchitecture] New version available! Please refresh.')
          // Optional: Show toast notification to user
        },
        onSuccess: () => {
          console.log('[AsyncArchitecture] App is ready for offline use')
        },
        onError: (error) => {
          console.error('[AsyncArchitecture] Service worker registration failed:', error)
        },
      }).catch((error) => {
        console.error('[AsyncArchitecture] Failed to register service worker:', error)
      })
    } else {
      console.log('[AsyncArchitecture] Service worker disabled in development')
    }

    // RUM and performance monitoring are automatically initialized on import
    // No additional setup needed
  }, [])

  // This component doesn't render anything
  return null
}
