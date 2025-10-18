import React from 'react';
import { formatCurrency } from './utils/formatters';
import type { ValuationResponse } from '../../types/valuation';

interface MethodologyBreakdownProps {
  result: ValuationResponse;
}

export const MethodologyBreakdown: React.FC<MethodologyBreakdownProps> = ({ result }) => {
  const hasDCF = result.dcf_valuation && result.dcf_valuation.equity_value > 0;
  const hasMultiples = result.multiples_valuation && result.multiples_valuation.ev_ebitda_valuation > 0;
  
  if (!hasDCF && !hasMultiples) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Methodology Breakdown</h3>
      
      <div className="space-y-4">
        {hasDCF && (
          <div className="p-4 bg-blue-50 rounded border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-blue-900">Discounted Cash Flow (DCF)</h4>
              <span className="text-sm text-blue-600">Weight: {result.dcf_weight || 50}%</span>
            </div>
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {formatCurrency(result.dcf_valuation?.equity_value || 0)}
            </div>
            <div className="text-sm text-blue-700">
              Based on projected cash flows and 10% discount rate
            </div>
          </div>
        )}
        
        {hasMultiples && (
          <div className="p-4 bg-green-50 rounded border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-green-900">Market Multiples</h4>
              <span className="text-sm text-green-600">Weight: {result.multiples_weight || 50}%</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {formatCurrency(result.multiples_valuation?.ev_ebitda_valuation || 0)}
            </div>
            <div className="text-sm text-green-700">
              Based on industry multiples and comparable companies
            </div>
          </div>
        )}
        
        <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
          <strong>Methodology:</strong> The final valuation combines multiple approaches to provide 
          a comprehensive and balanced assessment of your company's value.
        </div>
      </div>
    </div>
  );
};
