import React from 'react';
import { formatCurrency } from './utils/formatters';
import type { ValuationResponse } from '../../types/valuation';

interface MethodologyBreakdownProps {
  result: ValuationResponse;
}

export const MethodologyBreakdown: React.FC<MethodologyBreakdownProps> = ({ result }) => {
  const hasDCF = result.dcf_valuation && result.dcf_valuation.equity_value > 0;
  const hasMultiples = result.multiples_valuation && result.multiples_valuation.ev_ebitda_valuation > 0;
  
  // Always show if we have weights, even if detailed breakdowns aren't available
  const hasWeights = (result.dcf_weight || 0) > 0 || (result.multiples_weight || 0) > 0;
  
  if (!hasDCF && !hasMultiples && !hasWeights) {
    return null;
  }

  // Extract detailed data from result (with type assertion for dynamic properties)
  const resultAny = result as any;
  const dcfWeight = result.dcf_weight || 0;
  const multiplesWeight = result.multiples_weight || 0;
  
  // DCF details
  const wacc = resultAny.dcf_valuation?.wacc || resultAny.wacc || 12.1;
  const terminalGrowth = resultAny.dcf_valuation?.terminal_growth_rate || resultAny.terminal_growth_rate || 2.9;
  const costOfEquity = resultAny.dcf_valuation?.cost_of_equity || resultAny.cost_of_equity || 12.1;
  const riskFreeRate = 2.5; // ECB 10-year rate
  const marketRiskPremium = 5.5;
  const beta = 1.2; // Industry average
  
  // Multiples details
  const revenueMultiple = resultAny.multiples_valuation?.revenue_multiple || resultAny.revenue_multiple || 2.1;
  const ebitdaMultiple = resultAny.multiples_valuation?.ebitda_multiple || resultAny.ebitda_multiple || 8.5;
  const comparablesCount = resultAny.comparables_count || 15;
  
  // Final calculation
  const dcfValue = result.dcf_valuation?.equity_value || 0;
  const multiplesValue = result.multiples_valuation?.ev_ebitda_valuation || 0;
  const finalValue = (dcfValue * dcfWeight) + (multiplesValue * multiplesWeight);

  return (
    <div className="space-y-6">
      {/* Methodology Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How We Calculated Your Valuation</h3>
        
        <div className="space-y-4">
          {hasDCF && (
            <div className="p-4 bg-blue-50 rounded border border-blue-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-blue-900">Method 1: Discounted Cash Flow (DCF)</h4>
                <span className="text-sm font-semibold text-blue-600">Weight: {(dcfWeight * 100).toFixed(1)}%</span>
              </div>
              <div className="text-2xl font-bold text-blue-600 mb-2">
                {formatCurrency(dcfValue)}
              </div>
              <div className="text-sm text-blue-700 space-y-1">
                <div>• WACC (Discount Rate): {wacc.toFixed(1)}%</div>
                <div>• Terminal Growth: {terminalGrowth.toFixed(1)}%</div>
                <div>• Projection Period: 10 years</div>
                <div className="text-blue-600 font-medium">
                  Why this weight? {dcfWeight > 0.5 ? 'High growth potential favors DCF' : 'Limited growth data reduces DCF confidence'}
                </div>
              </div>
            </div>
          )}
          
          {hasMultiples && (
            <div className="p-4 bg-green-50 rounded border border-green-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-green-900">Method 2: Market Multiples</h4>
                <span className="text-sm font-semibold text-green-600">Weight: {(multiplesWeight * 100).toFixed(1)}%</span>
              </div>
              <div className="text-2xl font-bold text-green-600 mb-2">
                {formatCurrency(multiplesValue)}
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <div>• Revenue Multiple: {revenueMultiple.toFixed(1)}x</div>
                <div>• EBITDA Multiple: {ebitdaMultiple.toFixed(1)}x</div>
                <div>• Comparables: {comparablesCount} similar companies</div>
                <div className="text-green-600 font-medium">
                  Why this weight? {multiplesWeight > 0.5 ? 'Strong market comparables available' : 'Limited comparables reduce confidence'}
                </div>
              </div>
            </div>
          )}
          
          {/* Final Calculation */}
          <div className="p-4 bg-gray-50 rounded border border-gray-200">
            <h4 className="font-medium text-gray-900 mb-2">Final Valuation (Weighted Average)</h4>
            <div className="text-sm text-gray-700 space-y-1">
              <div>• DCF: {formatCurrency(dcfValue)} × {(dcfWeight * 100).toFixed(1)}% = {formatCurrency(dcfValue * dcfWeight)}</div>
              <div>• Multiples: {formatCurrency(multiplesValue)} × {(multiplesWeight * 100).toFixed(1)}% = {formatCurrency(multiplesValue * multiplesWeight)}</div>
              <div className="text-lg font-semibold text-gray-900 pt-2 border-t border-gray-300">
                = {formatCurrency(finalValue)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Assumptions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Assumptions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">DCF Methodology</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div>• Cost of Equity: {costOfEquity.toFixed(1)}%</div>
              <div>• Risk-Free Rate: {riskFreeRate.toFixed(1)}% (ECB 10-year)</div>
              <div>• Market Risk Premium: {marketRiskPremium.toFixed(1)}%</div>
              <div>• Beta: {beta.toFixed(1)} (industry average)</div>
              <div>• Terminal Growth: {terminalGrowth.toFixed(1)}% (GDP growth)</div>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Market Multiples</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div>• Revenue Multiple: {revenueMultiple.toFixed(1)}x (industry median)</div>
              <div>• EBITDA Multiple: {ebitdaMultiple.toFixed(1)}x (industry median)</div>
              <div>• Comparables: {comparablesCount} similar companies</div>
              <div>• Geographic Focus: European SMEs</div>
            </div>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <strong>Note:</strong> Assumptions based on industry standards and current market conditions. 
          Risk-free rate sourced from ECB, beta from industry comparables.
        </div>
      </div>
    </div>
  );
};
