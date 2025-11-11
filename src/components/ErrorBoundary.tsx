import { AlertTriangle } from 'lucide-react';
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { componentLogger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  retryCount: number;
}

/**
 * Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing.
 * 
 * Usage:
 * <ErrorBoundary componentName="ValuationMethods">
 *   <SomeComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    // Note: We preserve retryCount by only updating hasError and error
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || 'Unknown';
    
    // Log error with structured logging
    componentLogger.error(
      `Error caught by ErrorBoundary in ${componentName}`,
      {
        componentName,
        errorMessage: error.message,
        errorName: error.name,
        errorStack: error.stack,
        componentStack: errorInfo.componentStack,
        retryCount: this.state.retryCount
      },
      error
    );
    
    // Also log to console in development for easier debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Error caught by ErrorBoundary:', error, errorInfo);
    }
    
    // In production, you could log to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      const componentName = this.props.componentName || 'Component';
      const { retryCount } = this.state;
      const MAX_RETRIES = 2;
      const canRetry = retryCount < MAX_RETRIES;
      
      return (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                {componentName} Error
              </h3>
              <p className="text-sm text-red-800 mb-3">
                An unexpected error occurred while rendering this component.
                {this.state.error && (
                  <>
                    {' '}
                    <span className="font-mono text-xs bg-red-100 px-2 py-1 rounded">
                      {this.state.error.message}
                    </span>
                  </>
                )}
              </p>
              
              {/* Retry count warning */}
              {retryCount > 0 && canRetry && (
                <div className="mb-3 text-xs text-red-700 bg-red-100 p-2 rounded border border-red-200">
                  <strong>⚠️ This error has occurred {retryCount} time{retryCount > 1 ? 's' : ''}.</strong>
                  {' '}If it persists after another attempt, please reload the page.
                </div>
              )}
              
              {/* Max retries reached warning */}
              {!canRetry && (
                <div className="mb-3 text-xs text-red-800 bg-red-100 p-2 rounded border border-red-300">
                  <strong>❌ Maximum retry attempts reached ({MAX_RETRIES}).</strong>
                  {' '}This appears to be a persistent error. Please reload the page or contact support if the issue continues.
                </div>
              )}
              
              <div className="flex gap-3">
                {canRetry ? (
                  <button
                    onClick={this.handleReset}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition-colors"
                  >
                    Try Again {retryCount > 0 && `(${retryCount}/${MAX_RETRIES})`}
                  </button>
                ) : (
                  <button
                    onClick={this.handleReset}
                    disabled
                    className="px-4 py-2 bg-gray-300 text-gray-500 rounded cursor-not-allowed text-sm font-medium"
                    title="Maximum retry attempts reached"
                  >
                    Try Again (Max Reached)
                  </button>
                )}
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm font-medium transition-colors"
                >
                  Reload Page
                </button>
              </div>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <details className="mt-4">
                  <summary className="text-xs text-red-700 cursor-pointer hover:text-red-900">
                    Show Error Details (Development Only)
                  </summary>
                  <pre className="mt-2 text-xs bg-red-100 p-3 rounded overflow-auto max-h-64 border border-red-300">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for functional components
 * 
 * Usage:
 * const SafeComponent = withErrorBoundary(MyComponent, 'MyComponent');
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.FC<P> {
  return (props: P) => (
    <ErrorBoundary componentName={componentName || Component.displayName || Component.name}>
      <Component {...props} />
    </ErrorBoundary>
  );
}
