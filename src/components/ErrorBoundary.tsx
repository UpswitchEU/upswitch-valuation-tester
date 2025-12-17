/**
 * ErrorBoundary Component
 *
 * Production-grade error boundary that catches React render errors
 * and provides user-facing recovery UI with Retry and Start Over options.
 *
 * @module components/ErrorBoundary
 */

'use client'

import { useRouter } from 'next/navigation'
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { generalLogger } from '../utils/logger'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: (props: {
    error: Error
    errorInfo: ErrorInfo | null
    onRetry: () => void
    onStartOver: () => void
  }) => ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

/**
 * Default error UI with recovery options
 */
function DefaultErrorFallback({
  error,
  errorInfo,
  onRetry,
  onStartOver,
}: {
  error: Error
  errorInfo: ErrorInfo | null
  onRetry: () => void
  onStartOver: () => void
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        {/* Error Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          {/* Icon */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-white text-center mb-2">Something went wrong</h1>

          {/* Description */}
          <p className="text-gray-400 text-center mb-6">
            We encountered an unexpected error. You can try again or start over with a new
            valuation.
          </p>

          {/* Error Details (collapsible, for debugging) */}
          <details className="mb-6 bg-white/5 rounded-lg p-4">
            <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
              Technical Details (for debugging)
            </summary>
            <div className="mt-4 space-y-2">
              <div className="text-xs text-red-400 font-mono bg-red-900/20 p-3 rounded border border-red-500/20 overflow-auto">
                <strong className="block mb-2">Error Message:</strong>
                {error.message}
              </div>
              {errorInfo && (
                <div className="text-xs text-gray-500 font-mono bg-white/5 p-3 rounded border border-white/10 overflow-auto max-h-40">
                  <strong className="block mb-2">Component Stack:</strong>
                  {errorInfo.componentStack}
                </div>
              )}
            </div>
          </details>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onRetry}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                <span>Retry</span>
              </div>
            </button>
            <button
              onClick={onStartOver}
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-gray-900 border border-white/10"
            >
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>Start Over</span>
              </div>
            </button>
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-gray-500 text-sm mt-6">
          If this issue persists, please contact support
        </p>
      </div>
    </div>
  )
}

/**
 * Error Boundary Component
 *
 * Catches React errors and displays recovery UI.
 * Logs errors with full context for debugging.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error with full context
    generalLogger.error('[ErrorBoundary] React error caught', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    })

    // Update state with error info
    this.setState({
      errorInfo,
    })

    // Store in sessionStorage for debugging (persists even after reload)
    try {
      const errorRecord = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
      }
      sessionStorage.setItem('last-error', JSON.stringify(errorRecord))
    } catch (e) {
      // Ignore sessionStorage errors
      console.error('Failed to store error in sessionStorage:', e)
    }
  }

  handleRetry = () => {
    generalLogger.info('[ErrorBoundary] User clicked retry')

    // Reset error state
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })

    // Force page reload to reset all state
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  handleStartOver = () => {
    generalLogger.info('[ErrorBoundary] User clicked start over')

    // Navigate to homepage
    if (typeof window !== 'undefined') {
      window.location.href = '/'
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided, otherwise use default
      if (this.props.fallback) {
        return this.props.fallback({
          error: this.state.error,
          errorInfo: this.state.errorInfo,
          onRetry: this.handleRetry,
          onStartOver: this.handleStartOver,
        })
      }

      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onRetry={this.handleRetry}
          onStartOver={this.handleStartOver}
        />
      )
    }

    return this.props.children
  }
}

/**
 * Hook-based wrapper for functional components
 * (for use with router, etc.)
 */
export function ErrorBoundaryWrapper({
  children,
  fallback,
}: {
  children: ReactNode
  fallback?: ErrorBoundaryProps['fallback']
}) {
  const router = useRouter()

  const customFallback: ErrorBoundaryProps['fallback'] = fallback
    ? fallback
    : ({ error, errorInfo, onRetry }) => {
        const handleStartOver = () => {
          generalLogger.info('[ErrorBoundary] User clicked start over (with router)')
          router.push('/')
        }

        return (
          <DefaultErrorFallback
            error={error}
            errorInfo={errorInfo}
            onRetry={onRetry}
            onStartOver={handleStartOver}
          />
        )
      }

  return <ErrorBoundary fallback={customFallback}>{children}</ErrorBoundary>
}
