'use client'

import { Component, ReactNode, useEffect } from 'react'
import { AuthProvider } from '../src/contexts/AuthProvider'
import { ToastProvider } from '../src/hooks/useToast'
import { registerServiceWorker } from '../src/utils/serviceWorkerRegistration'
// RUM is auto-initialized on import - no need to import rumManager
import '../src/utils/performance/rum'

/**
 * Error Boundary for AuthProvider
 * Catches any errors preventing AuthProvider from mounting
 */
class AuthProviderErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('❌❌❌ [AUTH PROVIDER ERROR BOUNDARY] ===========================================')
    console.error('❌❌❌ [AUTH PROVIDER ERROR BOUNDARY] CRITICAL: AuthProvider failed to mount!')
    console.error('❌❌❌ [AUTH PROVIDER ERROR BOUNDARY] Error:', error)
    console.error('❌❌❌ [AUTH PROVIDER ERROR BOUNDARY] Error message:', error.message)
    console.error('❌❌❌ [AUTH PROVIDER ERROR BOUNDARY] Error stack:', error.stack)
    console.error('❌❌❌ [AUTH PROVIDER ERROR BOUNDARY] Component stack:', errorInfo.componentStack)
    console.error('❌❌❌ [AUTH PROVIDER ERROR BOUNDARY] This prevents authentication from running!')
    console.error('❌❌❌ [AUTH PROVIDER ERROR BOUNDARY] ===========================================')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '20px', color: 'red', backgroundColor: '#1a1a1a' }}>
          <h2>⚠️ Authentication Provider Error</h2>
          <p>The authentication system failed to initialize.</p>
          <p>Error: {this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null })
              window.location.reload()
            }}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Reload Page
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

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
      navigator.serviceWorker
        .getRegistrations()
        .then((registrations) => {
          console.log('[App] Service worker registrations:', registrations.length)
          registrations.forEach((reg) => {
            console.log('[App] SW state:', reg.active?.state, 'scope:', reg.scope)
            // Check if service worker is active
            if (reg.active) {
              console.log('[App] Active SW script URL:', reg.active.scriptURL)
            }
          })
        })
        .catch((error) => {
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
    <AuthProviderErrorBoundary>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </AuthProviderErrorBoundary>
  )
}
