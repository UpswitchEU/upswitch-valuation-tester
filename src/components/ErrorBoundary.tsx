import { Component, ErrorInfo, ReactNode } from 'react';
import { generalLogger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    generalLogger.error('ErrorBoundary caught an error', { 
      error: error.message, 
      stack: error.stack,
      componentStack: errorInfo.componentStack 
    });
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-zinc-950">
          <div className="max-w-md p-8 bg-zinc-900 rounded-lg border border-zinc-800">
            <h2 className="text-xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-zinc-400 mb-4">
              We encountered an error. Please refresh the page to try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
