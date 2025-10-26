import React from 'react';
import { formatPercent } from './utils/formatters';
import { calculateGrowthMetrics } from './utils/calculations';
import type { ValuationResponse } from '../../types/valuation';

interface GrowthMetricsProps {
  result: ValuationResponse;
}

export const GrowthMetrics: React.FC<GrowthMetricsProps> = ({ result }) => {
  const growth = calculateGrowthMetrics(result);
  
  if (!growth.hasHistoricalData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Metrics</h3>
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">Insufficient historical data for growth analysis</p>
          <p className="text-gray-400 text-xs mt-1">Add 2+ years of revenue data for CAGR calculation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Metrics</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded border border-green-200">
          <div>
            <span className="text-sm font-medium text-gray-700">Compound Annual Growth Rate (CAGR)</span>
            <p className="text-xs text-gray-500">Over {growth.years || 0} year{(growth.years || 0) > 1 ? 's' : ''}</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${growth.cagr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatPercent(growth.cagr)}
            </div>
            <div className="text-xs text-gray-500">
              {growth.cagr >= 0 ? 'Positive growth' : 'Declining revenue'}
            </div>
          </div>
        </div>
        
        <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
          <strong>Analysis:</strong> CAGR of {formatPercent(growth.cagr)} over {growth.years || 0} year{(growth.years || 0) > 1 ? 's' : ''} indicates{' '}
          {growth.cagr > 0.1 ? 'strong growth potential' : 
           growth.cagr > 0.05 ? 'moderate growth' : 
           growth.cagr > 0 ? 'slow growth' : 
           growth.cagr === 0 ? 'stable performance with no growth' : 'declining performance'}.
        </div>
      </div>
    </div>
  );
};
