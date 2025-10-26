import React from 'react';
import { formatCurrency, formatCurrencyCompact } from './utils/formatters';
import type { ValuationResponse } from '../../types/valuation';

interface ResultsHeaderProps {
  result: ValuationResponse;
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({ result }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Main Valuation */}
      <div className="bg-white rounded-lg border-2 border-gray-200 p-4 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Valuation Report</h2>
            <p className="text-sm text-gray-600">Based on DCF and Market Multiples methodology</p>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Confidence Score</div>
            <div className="text-2xl font-bold text-blue-600">{result.confidence_score}%</div>
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
  );
};
