import React from 'react';
import { formatCurrency, formatCurrencyCompact } from './utils/formatters';
import type { ValuationResponse } from '../../types/valuation';

interface ResultsHeaderProps {
  result: ValuationResponse;
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({ result }) => {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header - Professional Credibility Focus */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-4 sm:p-6 text-white">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold mb-2">Your Professional Valuation</h2>
            <p className="text-sm sm:text-base text-blue-100">
              Big 4 methodology (EY, Deloitte, PwC, KPMG) • 85-95% accuracy • 100% transparent
            </p>
          </div>
          <div className="flex items-center space-x-3 sm:space-x-4 text-sm flex-shrink-0">
            <div className="text-center">
              <div className="font-bold text-2xl">⚡</div>
              <div className="text-blue-100 text-xs">5 seconds</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl">🏆</div>
              <div className="text-blue-100 text-xs">Big 4 Quality</div>
            </div>
            <div className="text-center">
              <div className="font-bold text-2xl">🔍</div>
              <div className="text-blue-100 text-xs">Transparent</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Valuation */}
      <div className="bg-white rounded-lg border-2 border-primary-500 p-4 sm:p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Enterprise Value</h3>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Big 4 Methodology
          </span>
        </div>
        
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
