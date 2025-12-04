import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, HelpCircle } from 'lucide-react';

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
    <div className={`flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center animate-in fade-in duration-500 ${className}`}>
      <div className="relative mb-6 group">
        {/* Outer pulsing rings - Error Theme */}
        <div className={`absolute inset-0 rounded-full opacity-50 ${isDark ? 'bg-red-500/20' : 'bg-red-500/10'}`} />
        <div className={`absolute inset-0 rounded-full opacity-30 ${isDark ? 'bg-red-400/15' : 'bg-red-400/8'}`} style={{ animationDuration: '2s', animationDelay: '0.5s' }} />
        
        {/* Inner container */}
        <div className={`relative p-5 rounded-full shadow-lg border z-10 flex items-center justify-center transform transition-transform group-hover:scale-105 duration-300 ${
          isDark 
            ? 'bg-zinc-900 border-red-800/50' 
            : 'bg-white border-red-100'
        }`}>
          <AlertTriangle className={`w-8 h-8 ${isDark ? 'text-red-400' : 'text-red-500'}`} />
        </div>
      </div>
      
      <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>
        {title}
      </h3>
      
      <p className={`text-sm max-w-md leading-relaxed mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
        {message}
      </p>

      {/* Helpful suggestions */}
      <div className={`max-w-md w-full mb-8 p-4 rounded-lg ${isDark ? 'bg-zinc-800/50 border border-zinc-700' : 'bg-zinc-50 border border-zinc-200'}`}>
        <div className="flex items-start gap-3 text-left">
          <HelpCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`} />
          <div className="flex-1">
            <p className={`text-xs font-medium mb-2 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>What you can do:</p>
            <ul className={`text-xs space-y-1 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
              <li>• Verify all financial data is complete and accurate</li>
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
            </ul>
          </div>
        </div>
      </div>

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

