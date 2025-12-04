import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

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
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3 sm:mb-4">
        <AlertTriangle className={`w-6 h-6 sm:w-8 sm:h-8 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
      </div>
      
      <h3 className={`text-base sm:text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
        {title}
      </h3>
      
      <p className={`text-xs sm:text-sm max-w-xs leading-relaxed mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
        {message}
      </p>

      <div className="flex gap-3">
        {onBack && (
          <button
            onClick={onBack}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              isDark
                ? 'text-zinc-300 bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 hover:text-white'
                : 'text-zinc-600 bg-white border border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        )}
        
        {onRetry && (
          <button
            onClick={onRetry}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm hover:shadow transition-all ${
              isDark
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-red-600 hover:bg-red-700'
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

