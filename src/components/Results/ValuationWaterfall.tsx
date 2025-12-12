import React from 'react';
import type { ValuationResponse } from '../../types/valuation';
import { formatCurrency } from './utils/formatters';

interface ValuationWaterfallProps {
  result: ValuationResponse;
}

export const ValuationWaterfall: React.FC<ValuationWaterfallProps> = ({ result }) => {
  // Pure display component - no calculations
  // Shows final valuation results from backend

  const low = result.equity_value_low || 0;
  const mid = result.equity_value_mid || 0;
  const high = result.equity_value_high || 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Valuation Summary</h3>

      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-red-50 rounded border border-red-200">
            <div className="text-sm text-red-700 font-medium">Low Estimate</div>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(low)}</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded border border-green-200">
            <div className="text-sm text-green-700 font-medium">Most Likely Value</div>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(mid)}</div>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded border border-blue-200">
            <div className="text-sm text-blue-700 font-medium">High Estimate</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(high)}</div>
          </div>
        </div>

        <div className="text-sm text-gray-600 bg-gray-50 p-4 rounded">
          <strong>Valuation Range:</strong> This represents the estimated enterprise value of your business
          based on industry comparables and financial analysis. The range reflects uncertainty in
          valuation inputs and market conditions.
        </div>
      </div>
    </div>
  );
};
