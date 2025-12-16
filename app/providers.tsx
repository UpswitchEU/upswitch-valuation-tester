'use client'

import { useEffect } from 'react'
import { AuthProvider } from '../src/contexts/AuthContext'
import { ToastProvider } from '../src/hooks/useToast'
import { registerServiceWorker } from '../src/utils/serviceWorkerRegistration'
// RUM is auto-initialized on import - no need to import rumManager
import '../src/utils/performance/rum'

/**
 * Root Providers Component
 * 
 * Centralizes all context providers for the application.
 * This is used in the root layout to wrap all pages.
 * 
 * Also initializes async architecture utilities:
 * - Service Worker registration (offline support)
 * - Real User Monitoring (RUM) - auto-initialized on import
 */
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Log service worker version and state (for debugging)
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        console.log('[App] Service worker registrations:', registrations.length)
        registrations.forEach((reg) => {
          console.log('[App] SW state:', reg.active?.state, 'scope:', reg.scope)
          // Check if service worker is active
          if (reg.active) {
            console.log('[App] Active SW script URL:', reg.active.scriptURL)
          }
        })
      }).catch((error) => {
        console.error('[App] Failed to get SW registrations:', error)
      })
    }

    // Register service worker for offline support (production only)
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker({
        onUpdate: (registration) => {
          console.log('[ServiceWorker] New version available! Please refresh.')
          // Optional: Show toast notification to user
        },
        onSuccess: () => {
          console.log('[ServiceWorker] App is ready for offline use')
        },
        onError: (error) => {
          console.error('[ServiceWorker] Registration failed:', error)
        },
      })
    }

    // RUM is automatically initialized on import
    // Core Web Vitals are collected in the background
    // No action needed - metrics are tracked automatically
  }, [])

  return (
    <AuthProvider>
      <ToastProvider>{children}</ToastProvider>
    </AuthProvider>
  )
}
