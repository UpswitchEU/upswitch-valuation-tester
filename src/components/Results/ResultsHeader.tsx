import React, { useState } from 'react';
import type { ValuationResponse } from '../../types/valuation';
import { ConfidenceScoreModal } from './ConfidenceScoreModal';
import { formatCurrency, formatCurrencyCompact } from './utils/formatters';

interface ResultsHeaderProps {
  result: ValuationResponse;
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({ result }) => {
  const [showConfidenceModal, setShowConfidenceModal] = useState(false);

  // Dynamic methodology description based on actual weights
  const getMethodologyDescription = () => {
    const dcfWeight = result.dcf_weight || 0;
    const multiplesWeight = result.multiples_weight || 0;
    
    if (dcfWeight === 0 && multiplesWeight === 1.0) {
      return "Based on Market Multiples methodology";
    } else if (dcfWeight === 1.0 && multiplesWeight === 0) {
      return "Based on DCF methodology";
    } else if (dcfWeight > 0 && multiplesWeight > 0) {
      return `Based on DCF and Market Multiples methodology (${Math.round(dcfWeight * 100)}% / ${Math.round(multiplesWeight * 100)}%)`;
    }
    return "Based on valuation methodology";
  };

  // Calculate spread percentage for range explanation
  const calculateSpread = () => {
    const mid = result.equity_value_mid || 0;
    const low = result.equity_value_low || 0;
    const high = result.equity_value_high || 0;
    
    if (mid <= 0) return 0;
    
    const downside = ((mid - low) / mid) * 100;
    const upside = ((high - mid) / mid) * 100;
    
    // Return average spread (they should be similar)
    return Math.round((downside + upside) / 2);
  };

  const spreadPercentage = calculateSpread();
  const confidenceScore = result.confidence_score || 0;

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Main Valuation */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4 sm:p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Valuation Report</h2>
              <p className="text-sm text-gray-600">{getMethodologyDescription()}</p>
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

        {/* Range Explanation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Understanding the Valuation Range</h4>
              
              {/* Methodology Indicator */}
              {result.range_methodology && (
                <div className="mb-3 p-2 bg-white rounded border border-blue-300">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-blue-900">Range Methodology:</span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      result.range_methodology === 'multiple_dispersion' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {result.range_methodology === 'multiple_dispersion' 
                        ? '📊 Multiple Dispersion (P25/P50/P75 from comparables)'
                        : '📈 Confidence Spread (size-adjusted)'
                      }
                    </span>
                    {result.range_methodology === 'multiple_dispersion' && result.multiples_valuation?.comparables_count && (
                      <span className="text-xs text-gray-600">
                        ({result.multiples_valuation.comparables_count} comparable companies)
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <p className="text-sm text-blue-800 mb-2">
                The <strong>Mid-Point (€{formatCurrency(result.equity_value_mid)})</strong> is our best estimate of your company's value, calculated as a weighted average of the valuation methodologies used.
              </p>
              <p className="text-sm text-blue-800 mb-2">
                {result.range_methodology === 'multiple_dispersion' ? (
                  <>
                    The <strong>Low</strong> and <strong>High</strong> estimates are calculated from the <strong>25th and 75th percentile multiples</strong> of comparable companies. This reflects actual market dispersion, making it more accurate than confidence-based spreads (McKinsey best practice).
                  </>
                ) : (
                  <>
                    The <strong>Low</strong> and <strong>High</strong> estimates reflect <strong>valuation uncertainty</strong> based on data quality and market conditions. The range width of <strong>±{spreadPercentage}%</strong> is determined by your confidence score of <strong>{confidenceScore}%</strong> and company size (small companies get wider spreads ±25%).
                  </>
                )}
              </p>
              <p className="text-xs text-blue-700 mt-2 italic">
                {result.range_methodology === 'multiple_dispersion' 
                  ? 'Multiple dispersion ranges use actual comparable company data (P25/P50/P75 percentiles), providing more accurate valuation ranges than confidence-based spreads.'
                  : 'Higher confidence scores and larger companies result in tighter ranges (±12%), while lower scores and smaller companies result in wider ranges (±25%) to account for greater uncertainty.'
                }
              </p>
            </div>
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
