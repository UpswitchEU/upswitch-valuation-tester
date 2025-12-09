import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';
import React from 'react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
  className?: string;
  variant?: 'light' | 'dark';
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Valuation Generation Failed",
  message = "We encountered an unexpected issue while generating your report. Please check your inputs and try again.",
  onRetry,
  onBack,
  className = "",
  variant = 'light'
}) => {
  const isDark = variant === 'dark';

  return (
    <div className={`flex flex-col items-center justify-center p-6 sm:p-8 text-center animate-in fade-in duration-500 ${className}`}>
      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mb-3 sm:mb-4 transition-colors ${
        isDark ? 'bg-red-500/10' : 'bg-red-50'
      }`}>
        <AlertTriangle className={`w-6 h-6 sm:w-8 sm:h-8 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
      </div>
      
      <h3 className={`text-base sm:text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-ink'}`}>
        {title}
      </h3>
      
      <p className={`text-xs sm:text-sm max-w-md leading-relaxed mb-6 ${isDark ? 'text-zinc-400' : 'text-gray-600'}`}>
        {message}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {onBack && (
          <button
            onClick={onBack}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
              isDark
                ? 'text-zinc-300 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-white hover:border-zinc-600'
                : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 hover:text-slate-ink hover:border-primary-300'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        )}
        
        {onRetry && (
          <button
            onClick={onRetry}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white rounded-lg shadow-sm hover:shadow-md transition-all ${
              isDark
                ? 'bg-accent-600 hover:bg-accent-500'
                : 'bg-accent-600 hover:bg-accent-500'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

