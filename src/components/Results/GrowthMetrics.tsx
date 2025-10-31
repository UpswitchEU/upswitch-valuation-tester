import React from 'react';
import type { ValuationResponse } from '../../types/valuation';
import { calculateGrowthMetrics } from './utils/calculations';
import { formatPercent } from './utils/formatters';

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

  // CRITICAL: Validate CAGR for reasonableness (McKinsey/Bain standards)
  // Backend should return CAGR as decimal (0.291 = 29.1%), but may inconsistently return as percentage
  // Logic:
  // - If value < 1.0: Treat as decimal (0.291 → 29.1%)
  // - If value >= 1.0 and < 100: Treat as percentage (11.11 → 11.11%)
  // - If value >= 100: Flag as error (likely calculation mistake)
  
  let finalCagrPercentage: number;
  let isUnrealistic = false;
  
  if (growth.cagr < 1.0) {
    // Backend returned decimal (0.291 = 29.1%)
    finalCagrPercentage = growth.cagr * 100;
  } else if (growth.cagr >= 1.0 && growth.cagr < 100) {
    // Backend returned percentage (11.11 = 11.11%)
    finalCagrPercentage = growth.cagr;
  } else {
    // Backend returned >= 100 - likely error (e.g., 1111.1%)
    // Treat as percentage but flag as error
    finalCagrPercentage = growth.cagr;
    isUnrealistic = true;
  }
  
  // Additional sanity check: Flag unrealistic values even if format seems correct
  if (finalCagrPercentage > 200) {
    isUnrealistic = true;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Growth Metrics</h3>
      
      {isUnrealistic && (
        <div className="mb-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <h4 className="font-semibold text-red-900 mb-1">CAGR Calculation Error Detected</h4>
              <p className="text-sm text-red-800">
                The calculated CAGR of {formatPercent(finalCagrPercentage)} is outside realistic ranges for this business type. 
                Typical SME CAGR ranges: 5-25% annually. This may indicate a data input error or calculation issue.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div className={`flex justify-between items-center p-4 rounded border ${
          isUnrealistic 
            ? 'bg-red-50 border-red-200' 
            : 'bg-gradient-to-r from-green-50 to-blue-50 border-green-200'
        }`}>
          <div>
            <span className="text-sm font-medium text-gray-700">Compound Annual Growth Rate (CAGR)</span>
            <p className="text-xs text-gray-500">Over {growth.years || 0} year{(growth.years || 0) > 1 ? 's' : ''}</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${
              isUnrealistic 
                ? 'text-red-600' 
                : finalCagrPercentage >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
            }`}>
              {formatPercent(finalCagrPercentage)}
            </div>
            <div className="text-xs text-gray-500">
              {isUnrealistic 
                ? 'Calculation error' 
                : finalCagrPercentage >= 0 
                  ? 'Positive growth' 
                  : 'Declining revenue'}
            </div>
          </div>
        </div>
        
        {!isUnrealistic && (
          <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
            <strong>Analysis:</strong> CAGR of {formatPercent(finalCagrPercentage)} over {growth.years || 0} year{(growth.years || 0) > 1 ? 's' : ''} indicates{' '}
            {finalCagrPercentage > 25 ? 'exceptional growth' :
             finalCagrPercentage > 15 ? 'strong growth potential' : 
             finalCagrPercentage > 5 ? 'moderate growth' : 
             finalCagrPercentage > 0 ? 'slow growth' : 
             finalCagrPercentage === 0 ? 'stable performance with no growth' : 'declining performance'}.
          </div>
        )}
      </div>
    </div>
  );
};
