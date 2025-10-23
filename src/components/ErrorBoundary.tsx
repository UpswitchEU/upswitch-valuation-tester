import { Component, ErrorInfo, ReactNode } from 'react';
import { generalLogger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  componentName?: string;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    retryCount: 0
  };

  public static getDerivedStateFromError(error: Error): State {
    return { 
      hasError: true, 
      error,
      errorInfo: null,
      retryCount: 0
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const timestamp = new Date().toISOString();
    const componentName = this.props.componentName || 'Unknown';
    
    generalLogger.error('ErrorBoundary caught an error', { 
      timestamp,
      componentName,
      error: error.message, 
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      retryCount: this.state.retryCount,
      props: this.props
    });
    
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    const newRetryCount = this.state.retryCount + 1;
    generalLogger.info('ErrorBoundary retry attempted', { 
      componentName: this.props.componentName,
      retryCount: newRetryCount 
    });
    
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null,
      retryCount: newRetryCount 
    });
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-zinc-950">
          <div className="max-w-md p-8 bg-zinc-900 rounded-lg border border-zinc-800">
            <h2 className="text-xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-zinc-400 mb-4">
              We encountered an error in {this.props.componentName || 'the application'}. 
              {this.state.retryCount > 0 && ` (Retry attempt ${this.state.retryCount})`}
            </p>
            {this.state.error && (
              <details className="mb-4">
                <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-400">
                  Technical Details
                </summary>
                <pre className="mt-2 text-xs text-zinc-600 bg-zinc-800 p-2 rounded overflow-auto">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack && (
                    <div className="mt-2">
                      <strong>Component Stack:</strong>
                      <pre>{this.state.errorInfo.componentStack}</pre>
                    </div>
                  )}
                </pre>
              </details>
            )}
            <div className="flex gap-2">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
