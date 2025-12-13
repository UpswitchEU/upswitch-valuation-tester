/**
 * ErrorRecovery Component
 * Provides error recovery UI with retry functionality
 */

import { AlertTriangle, RefreshCw, X } from 'lucide-react'
import React from 'react'
import { extractErrorInfo, ErrorType } from '../utils/errorHandler'

interface ErrorRecoveryProps {
  error: Error | string
  onRetry?: () => void
  onDismiss?: () => void
  showPartialResults?: boolean
  partialResults?: any
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
    <div className="bg-red-50 border-l-4 border-red-500 rounded-r-lg p-4 mb-4">
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <AlertTriangle className="h-5 w-5 text-red-500" />
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {errorInfo.type === ErrorType.TIMEOUT ? 'Calculation Timeout' : 'Error Occurred'}
          </h3>
          <p className="mt-1 text-sm text-red-700">{errorInfo.userMessage}</p>

          {/* Show partial results if available */}
          {showPartialResults && partialResults && (
            <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800 font-medium mb-1">Partial results available</p>
              <p className="text-xs text-yellow-700">
                Some sections were generated before the error occurred. You can view them below.
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-4 flex gap-2">
            {errorInfo.retryable && onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </button>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
              >
                <X className="h-4 w-4 mr-2" />
                Dismiss
              </button>
            )}
          </div>

          {/* Error details (collapsible for debugging) */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-3">
              <summary className="text-xs text-red-600 cursor-pointer hover:text-red-800">
                Error details (dev only)
              </summary>
              <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
                {JSON.stringify(errorInfo, null, 2)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  )
}
