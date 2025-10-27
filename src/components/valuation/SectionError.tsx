import React from 'react';
import { AlertCircle } from 'lucide-react';

interface SectionErrorProps {
  sectionName: string;
  errorMessage: string;
  onRetry?: () => void;
}

/**
 * SectionError Component
 * 
 * Displays an error state for a failed report section.
 * Provides clear error messaging and optional retry functionality.
 * 
 * @param sectionName - Human-readable section name
 * @param errorMessage - Error message to display
 * @param onRetry - Optional retry callback
 */
export const SectionError: React.FC<SectionErrorProps> = ({
  sectionName,
  errorMessage,
  onRetry
}) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-900 mb-2">{sectionName}</h3>
          <p className="text-sm text-red-700 mb-3">
            Unable to generate this section. Please try again.
          </p>
          {errorMessage && (
            <p className="text-xs text-red-600 font-mono bg-red-100 p-2 rounded mb-3">
              {errorMessage}
            </p>
          )}
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm font-medium text-red-700 hover:text-red-900 underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
};


