import React, { useState } from 'react';
import type { ValuationResponse } from '../../types/valuation';
import { ConfidenceScoreModal } from './ConfidenceScoreModal';
import { formatCurrency, formatCurrencyCompact } from './utils/formatters';

interface ResultsHeaderProps {
  result: ValuationResponse;
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({ result }) => {
  const [showConfidenceModal, setShowConfidenceModal] = useState(false);

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Main Valuation */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Valuation Report</h2>
              <p className="text-sm text-gray-600">Based on DCF and Market Multiples methodology</p>
            </div>
            <div className="text-right">
              {/* Confidence Score - Enhanced Design - Clickable */}
              <div
                onClick={() => setShowConfidenceModal(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowConfidenceModal(true);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View detailed confidence score breakdown${result.confidence_score !== undefined && result.confidence_score !== null ? ` for ${result.confidence_score}% confidence` : ''}`}
                aria-expanded={showConfidenceModal}
                aria-controls="modal-content"
                className={`
                  relative inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 shadow-sm cursor-pointer
                  ${result.confidence_score !== undefined && result.confidence_score !== null
                    ? result.confidence_score >= 80 
                      ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300 hover:from-green-100 hover:to-emerald-100'
                      : result.confidence_score >= 60
                      ? 'bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300 hover:from-yellow-100 hover:to-amber-100'
                      : 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300 hover:from-red-100 hover:to-rose-100'
                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                  }
                  transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${result.confidence_score !== undefined && result.confidence_score !== null
                    ? result.confidence_score >= 80 
                      ? 'focus:ring-green-500'
                      : result.confidence_score >= 60
                      ? 'focus:ring-yellow-500'
                      : 'focus:ring-red-500'
                    : 'focus:ring-gray-500'
                  }
                `}
              >
                {/* Visual indicator circle */}
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full border-2
                  ${result.confidence_score !== undefined && result.confidence_score !== null
                    ? result.confidence_score >= 80 
                      ? 'bg-green-100 border-green-400'
                      : result.confidence_score >= 60
                      ? 'bg-yellow-100 border-yellow-400'
                      : 'bg-red-100 border-red-400'
                    : 'bg-gray-100 border-gray-400'
                  }
                `}>
                  <span className={`
                    text-xl font-bold
                    ${result.confidence_score !== undefined && result.confidence_score !== null
                      ? result.confidence_score >= 80 
                        ? 'text-green-700'
                        : result.confidence_score >= 60
                        ? 'text-yellow-700'
                        : 'text-red-700'
                      : 'text-gray-600'
                    }
                  `}>
                    {result.confidence_score !== undefined && result.confidence_score !== null
                      ? result.confidence_score
                      : '—'}
                  </span>
                </div>
                
                {/* Score and label */}
                <div className="flex flex-col items-end">
                  <div className={`
                    text-2xl font-bold leading-none
                    ${result.confidence_score !== undefined && result.confidence_score !== null
                      ? result.confidence_score >= 80 
                        ? 'text-green-700'
                        : result.confidence_score >= 60
                        ? 'text-yellow-700'
                        : 'text-red-700'
                      : 'text-gray-600'
                    }
                  `}>
                    {result.confidence_score !== undefined && result.confidence_score !== null
                      ? `${result.confidence_score}%`
                      : 'N/A'}
                  </div>
                  <div className="text-xs font-medium text-gray-600 mt-0.5">
                    Confidence
                  </div>
                </div>
              </div>
            </div>
          </div>
        
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enterprise Value</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="text-center p-3 sm:p-4 bg-gray-50 rounded">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Low Estimate</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-words">
              {formatCurrencyCompact(result.equity_value_low)}
            </p>
            <p className="text-xs text-gray-500 mt-1 hidden sm:block">
              {formatCurrency(result.equity_value_low)}
            </p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-primary-50 rounded border-2 border-primary-500">
            <p className="text-xs sm:text-sm text-primary-600 mb-1">Mid-Point</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-600 break-words">
              {formatCurrencyCompact(result.equity_value_mid)}
            </p>
            <p className="text-xs text-primary-500 mt-1 hidden sm:block">
              {formatCurrency(result.equity_value_mid)}
            </p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-gray-50 rounded">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">High Estimate</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-words">
              {formatCurrencyCompact(result.equity_value_high)}
            </p>
            <p className="text-xs text-gray-500 mt-1 hidden sm:block">
              {formatCurrency(result.equity_value_high)}
            </p>
          </div>
        </div>
      </div>
    </div>
    
    {/* Confidence Score Modal */}
    <ConfidenceScoreModal
      isOpen={showConfidenceModal}
      onClose={() => setShowConfidenceModal(false)}
      result={result}
    />
    </>
  );
};
