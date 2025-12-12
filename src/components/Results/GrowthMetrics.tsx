import React from 'react';
import type { ValuationResponse } from '../../types/valuation';
import { formatPercent } from './utils/formatters';

interface GrowthMetricsProps {
  result: ValuationResponse;
}

export const GrowthMetrics: React.FC<GrowthMetricsProps> = ({ result }) => {
  // Use only backend-provided CAGR data
  // No frontend calculations - pure display component
  const cagr = result.financial_metrics?.revenue_cagr_3y;

  if (cagr === undefined || cagr === null) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Metrics</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Growth metrics not available</p>
          <p className="text-gray-400 text-xs mt-1">CAGR is calculated by our valuation engine</p>
        </div>
      </div>
    );
  }

  // Backend provides CAGR as decimal (0.0037 = 0.37%, 0.111 = 11.1%)
  // Convert to percentage for display
  const cagrPercentage = cagr * 100;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Metrics</h3>

      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 rounded border bg-gradient-to-r from-primary-50 to-canvas border-primary-200">
          <div>
            <span className="text-sm font-medium text-gray-700">Compound Annual Growth Rate (CAGR)</span>
            <p className="text-xs text-gray-500">3-year revenue growth</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${
              cagrPercentage >= 0 ? 'text-primary-600' : 'text-accent-600'
            }`}>
              {formatPercent(cagrPercentage)}
            </div>
            <div className="text-xs text-gray-500">
              {cagrPercentage >= 0 ? 'Revenue growth' : 'Revenue decline'}
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 bg-primary-50 p-3 rounded">
          <strong>Analysis:</strong> CAGR of {formatPercent(cagrPercentage)} over 3 years indicates{' '}
          {cagrPercentage > 25 ? 'exceptional growth' :
           cagrPercentage > 15 ? 'strong growth potential' :
           cagrPercentage > 5 ? 'moderate growth' :
           cagrPercentage > 0 ? 'slow growth' :
           cagrPercentage === 0 ? 'stable performance with no growth' : 'declining performance'}.
        </div>
      </div>
    </div>
  );
};
