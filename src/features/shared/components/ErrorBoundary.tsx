/**
 * Error Boundary Components
 *
 * Hierarchical error boundaries following clean architecture principles.
 * Provides graceful error handling at different levels of the application.
 */

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { generalLogger } from '../../../utils/logger'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  level: 'app' | 'feature' | 'component' | 'network'
}

/**
 * Base Error Boundary Component
 *
 * Provides error catching and logging at different architectural levels.
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

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { level, onError } = this.props

    // Log error with level context
    generalLogger.error(`[${level.toUpperCase()}] Error Boundary caught error`, {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      level,
    })

    // Update state with error info
    this.setState({
      error,
      errorInfo,
    })

    // Call custom error handler if provided
    onError?.(error, errorInfo)
  }

  render() {
    const { hasError, error } = this.state
    const { children, fallback, level } = this.props

    if (hasError) {
      // Use custom fallback if provided
      if (fallback) {
        return fallback
      }

      // Default error UI based on level
      return <DefaultErrorFallback error={error} level={level} />
    }

    return children
  }
}

/**
 * Default Error Fallback Component
 *
 * Provides consistent error UI across different levels.
 */
interface DefaultErrorFallbackProps {
  error: Error | null
  level: 'app' | 'feature' | 'component' | 'network'
}

const DefaultErrorFallback: React.FC<DefaultErrorFallbackProps> = ({ error, level }) => {
  const getErrorConfig = (level: string) => {
    switch (level) {
      case 'app':
        return {
          title: 'Application Error',
          message: 'Something went wrong with the application. Please refresh the page.',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-800',
          icon: '🚨',
        }
      case 'feature':
        return {
          title: 'Feature Error',
          message: 'This feature encountered an error. Try refreshing or contact support.',
          bgColor: 'bg-orange-50',
          borderColor: 'border-orange-200',
          textColor: 'text-orange-800',
          icon: '⚠️',
        }
      case 'component':
        return {
          title: 'Component Error',
          message: 'This component failed to load. The rest of the page should still work.',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-800',
          icon: '🔧',
        }
      case 'network':
        return {
          title: 'Connection Error',
          message: 'Unable to connect to our servers. Please check your internet connection.',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-800',
          icon: '🌐',
        }
      default:
        return {
          title: 'Error',
          message: 'An unexpected error occurred.',
          bgColor: 'bg-gray-50',
          borderColor: 'border-gray-200',
          textColor: 'text-gray-800',
          icon: '❌',
        }
    }
  }

  const config = getErrorConfig(level)

  return (
    <div className={`p-6 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
      <div className="flex items-start space-x-3">
        <div className="text-2xl">{config.icon}</div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${config.textColor}`}>{config.title}</h3>
          <p className={`mt-2 text-sm ${config.textColor} opacity-90`}>{config.message}</p>
          {error && process.env.NODE_ENV === 'development' && (
            <details className="mt-4">
              <summary className={`cursor-pointer text-sm font-medium ${config.textColor}`}>
                Error Details (Development)
              </summary>
              <pre className={`mt-2 text-xs ${config.textColor} opacity-75 whitespace-pre-wrap`}>
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}
          <div className="mt-4">
            <button
              onClick={() => window.location.reload()}
              className={`px-4 py-2 text-sm font-medium rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Application-Level Error Boundary
 *
 * Catches errors at the application level. Should wrap the entire app.
 */
export const AppErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary
    level="app"
    onError={(error, errorInfo) => {
      // Could send to error reporting service
      console.error('Application-level error:', error, errorInfo)
    }}
  >
    {children}
  </ErrorBoundary>
)

/**
 * Feature-Level Error Boundary
 *
 * Catches errors within a specific feature. Should wrap feature components.
 */
export const FeatureErrorBoundary: React.FC<{
  children: ReactNode
  feature: string
  fallback?: ReactNode
}> = ({ children, feature, fallback }) => (
  <ErrorBoundary
    level="feature"
    fallback={fallback}
    onError={(error, errorInfo) => {
      generalLogger.error(`Feature error in ${feature}`, {
        error: error.message,
        feature,
        componentStack: errorInfo.componentStack,
      })
    }}
  >
    {children}
  </ErrorBoundary>
)

/**
 * Component-Level Error Boundary
 *
 * Catches errors within individual components. Should wrap complex components.
 */
export const ComponentErrorBoundary: React.FC<{
  children: ReactNode
  component: string
  fallback?: ReactNode
}> = ({ children, component, fallback }) => (
  <ErrorBoundary
    level="component"
    fallback={fallback}
    onError={(error, errorInfo) => {
      generalLogger.warn(`Component error in ${component}`, {
        error: error.message,
        component,
        componentStack: errorInfo.componentStack,
      })
    }}
  >
    {children}
  </ErrorBoundary>
)

/**
 * Network-Level Error Boundary
 *
 * Catches errors related to network/API calls. Should wrap network-dependent components.
 */
export const NetworkErrorBoundary: React.FC<{
  children: ReactNode
  operation: string
  fallback?: ReactNode
  onRetry?: () => void
}> = ({ children, operation, fallback, onRetry }) => {
  const networkFallback = fallback || (
    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
      <div className="flex items-center space-x-3">
        <div className="text-blue-600">🌐</div>
        <div>
          <h4 className="text-blue-800 font-medium">Connection Error</h4>
          <p className="text-blue-700 text-sm">
            Failed to {operation}. Please check your connection and try again.
          </p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <ErrorBoundary
      level="network"
      fallback={networkFallback}
      onError={(error, errorInfo) => {
        generalLogger.warn(`Network error during ${operation}`, {
          error: error.message,
          operation,
          componentStack: errorInfo.componentStack,
        })
      }}
    >
      {children}
    </ErrorBoundary>
  )
}
