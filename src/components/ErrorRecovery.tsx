/**
 * ErrorRecovery Component
 * Provides error recovery UI with retry functionality
 */

import { AlertTriangle, RefreshCw, X } from 'lucide-react'
import React from 'react'
import { ErrorType, extractErrorInfo } from '../utils/errorHandler'

interface ErrorRecoveryProps {
  error: Error | string
  onRetry?: () => void
  onDismiss?: () => void
  showPartialResults?: boolean
  partialResults?: Record<string, unknown>
}

export const ErrorRecovery: React.FC<ErrorRecoveryProps> = ({
  error,
  onRetry,
  onDismiss,
  showPartialResults = false,
  partialResults,
}) => {
  const errorInfo = extractErrorInfo(error instanceof Error ? error : new Error(error))

  if (errorInfo.type === ErrorType.CANCELLED) {
    // Don't show error UI for cancelled requests
    return null
  }

  return (
    <div className="bg-accent-600/10 border-l-4 border-accent-600/30 rounded-r-lg p-4 mb-4 backdrop-blur-sm">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-accent-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-accent-200">
            {errorInfo.type === ErrorType.TIMEOUT ? 'Calculation Timeout' : 'Error Occurred'}
          </h3>
          <p className="mt-1 text-sm text-zinc-200">{errorInfo.userMessage}</p>

          {/* Show partial results if available */}
          {showPartialResults && partialResults && (
            <div className="mt-3 p-3 bg-harvest-600/10 border border-harvest-600/30 rounded">
              <p className="text-sm text-harvest-200 font-medium mb-1">Partial results available</p>
              <p className="text-xs text-zinc-400">
                Some sections were generated before the error occurred. You can view them below.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            {errorInfo.retryable && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-harvest-600 hover:bg-harvest-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-harvest-500 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-3 py-2 border border-zinc-600 text-sm leading-4 font-medium rounded-md text-zinc-200 bg-zinc-800/50 hover:bg-zinc-700/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Dismiss
              </button>
            )}
          </div>

          {/* Error details (collapsible for debugging) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-3">
              <summary className="text-xs text-accent-400 cursor-pointer hover:text-accent-300">
                Error details (dev only)
              </summary>
              <pre className="mt-2 text-xs bg-accent-600/20 p-2 rounded overflow-auto max-h-40 text-zinc-300">
                {JSON.stringify(errorInfo, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
