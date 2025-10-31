import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Calculator } from 'lucide-react';
import type { ValuationResponse, ValuationInputData } from '../../types/valuation';
import { formatCurrency, formatPercent } from '../Results/utils/formatters';
import { FINANCIAL_CONSTANTS } from '../../config/financialConstants';

interface CalculationBreakdownProps {
  result: ValuationResponse;
  inputData: ValuationInputData | null;
}

export const CalculationBreakdown: React.FC<CalculationBreakdownProps> = ({ result, inputData }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['dcf', 'multiples']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const dcfWeight = result.dcf_weight || 0;
  const multiplesWeight = result.multiples_weight || 0;
  const dcfValue = result.dcf_valuation?.equity_value || 0;
  const multiplesValue = result.multiples_valuation?.ev_ebitda_valuation || 0;
  
  // Use real data instead of hardcoded values
  const revenue = inputData?.revenue || 0;
  const ebitda = inputData?.ebitda || 0;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Calculator className="w-5 h-5 text-primary-600" />
        Calculation Breakdown
      </h3>

      {/* DCF Calculation */}
      {dcfWeight > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('dcf')}
            className="w-full px-4 py-3 bg-blue-50 flex items-center justify-between hover:bg-blue-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedSections.has('dcf') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="font-medium text-gray-900">Discounted Cash Flow (DCF) - {(dcfWeight * 100).toFixed(0)}%</span>
            </div>
            <span className="text-blue-600 font-semibold">{formatCurrency(dcfValue)}</span>
          </button>

          {expandedSections.has('dcf') && (
            <div className="p-4 space-y-4 bg-white">
              {/* WACC Calculation */}
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-900 mb-3">1. WACC (Discount Rate)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost of Equity (CAPM):</span>
                    <span className="font-mono">{formatPercent((result.dcf_valuation?.cost_of_equity || FINANCIAL_CONSTANTS.DEFAULT_COST_OF_EQUITY / 100) * 100)}</span>
                  </div>
                  <div className="ml-4 space-y-1 text-xs text-gray-500">
                    <div className="flex justify-between">
                      <span>• Risk-Free Rate:</span>
                      <span>{formatPercent(FINANCIAL_CONSTANTS.ECB_RISK_FREE_RATE)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Beta:</span>
                      <span>{FINANCIAL_CONSTANTS.DEFAULT_BETA}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>• Market Risk Premium:</span>
                      <span>{formatPercent(FINANCIAL_CONSTANTS.MARKET_RISK_PREMIUM)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-gray-600 pt-1 border-t border-gray-300">
                      <span>= {FINANCIAL_CONSTANTS.ECB_RISK_FREE_RATE}% + {FINANCIAL_CONSTANTS.DEFAULT_BETA} × {FINANCIAL_CONSTANTS.MARKET_RISK_PREMIUM}%</span>
                      <span>{formatPercent(FINANCIAL_CONSTANTS.DEFAULT_COST_OF_EQUITY)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cash Flow Projections */}
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-900 mb-3">2. Free Cash Flow Projections (10 Years)</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="text-left py-2">Year</th>
                        <th className="text-right py-2">FCF</th>
                        <th className="text-right py-2">Discount Factor</th>
                        <th className="text-right py-2">Present Value</th>
                      </tr>
                    </thead>
                    <tbody>
                      {/* Generate 10 years of projections */}
                      {Array.from({ length: 10 }, (_, i) => {
                        const year = i + 1;
                        const fcf = calculateProjectedFCF(result, inputData, year);
                        const discountFactor = 1 / Math.pow(1 + (result.dcf_valuation?.wacc || FINANCIAL_CONSTANTS.DEFAULT_WACC) / 100, year);
                        const pv = fcf * discountFactor;
                        return (
                          <tr key={year} className="border-b border-gray-200">
                            <td className="py-2">{year}</td>
                            <td className="text-right font-mono">{formatCurrency(fcf)}</td>
                            <td className="text-right font-mono">{discountFactor.toFixed(3)}</td>
                            <td className="text-right font-mono">{formatCurrency(pv)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Terminal Value */}
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-900 mb-3">3. Terminal Value</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terminal Growth Rate:</span>
                    <span className="font-mono">{formatPercent(result.dcf_valuation?.terminal_growth_rate || FINANCIAL_CONSTANTS.DEFAULT_TERMINAL_GROWTH)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Terminal Value:</span>
                    <span className="font-mono font-semibold">{formatCurrency(result.dcf_valuation?.terminal_value || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">PV of Terminal Value:</span>
                    <span className="font-mono font-semibold">{formatCurrency(result.dcf_valuation?.pv_terminal_value || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Final DCF Value */}
              <div className="bg-blue-100 p-4 rounded border border-blue-300">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Enterprise Value (DCF)</span>
                  <span className="text-xl font-bold text-blue-600">{formatCurrency(dcfValue)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Multiples Calculation */}
      {multiplesWeight > 0 && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('multiples')}
            className="w-full px-4 py-3 bg-green-50 flex items-center justify-between hover:bg-green-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              {expandedSections.has('multiples') ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              <span className="font-medium text-gray-900">Market Multiples - {(multiplesWeight * 100).toFixed(0)}%</span>
            </div>
            <span className="text-green-600 font-semibold">{formatCurrency(multiplesValue)}</span>
          </button>

          {expandedSections.has('multiples') && (
            <div className="p-4 space-y-4 bg-white">
              {/* Revenue Multiple */}
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-900 mb-3">Revenue Multiple Approach</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Annual Revenue:</span>
                    <span className="font-mono">{formatCurrency(revenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Industry Revenue Multiple:</span>
                    <span className="font-mono">{(result.multiples_valuation?.revenue_multiple || 2.1).toFixed(1)}x</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-gray-300">
                    <span>Revenue-Based Valuation:</span>
                    <span className="font-mono">{formatCurrency(revenue * (result.multiples_valuation?.revenue_multiple || 2.1))}</span>
                  </div>
                </div>
              </div>

              {/* EBITDA Multiple */}
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-900 mb-3">EBITDA Multiple Approach</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">EBITDA:</span>
                    <span className="font-mono">{formatCurrency(ebitda)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Industry EBITDA Multiple:</span>
                    <span className="font-mono">{(result.multiples_valuation?.ebitda_multiple || 8.5).toFixed(1)}x</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-gray-300">
                    <span>EBITDA-Based Valuation:</span>
                    <span className="font-mono">{formatCurrency(ebitda * (result.multiples_valuation?.ebitda_multiple || 8.5))}</span>
                  </div>
                </div>
              </div>

              {/* Comparable Companies */}
              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium text-gray-900 mb-3">Comparable Companies</h4>
                <div className="text-sm text-gray-600">
                  <p>Based on {result.multiples_valuation?.comparables_count || 15} similar companies in your industry</p>
                  <p className="mt-2 text-xs">Multiples adjusted for company size, growth, and profitability</p>
                </div>
              </div>

              {/* Final Multiples Value */}
              <div className="bg-green-100 p-4 rounded border border-green-300">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Enterprise Value (Multiples)</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(multiplesValue)}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Weighted Average */}
      {dcfWeight > 0 && multiplesWeight > 0 && (
        <div className="border-2 border-primary-500 rounded-lg p-4 bg-primary-50">
          <h4 className="font-semibold text-gray-900 mb-3">Final Valuation (Weighted Average)</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>DCF ({(dcfWeight * 100).toFixed(0)}%):</span>
              <span className="font-mono">{formatCurrency(dcfValue)} × {(dcfWeight * 100).toFixed(0)}% = {formatCurrency(dcfValue * dcfWeight)}</span>
            </div>
            <div className="flex justify-between">
              <span>Multiples ({(multiplesWeight * 100).toFixed(0)}%):</span>
              <span className="font-mono">{formatCurrency(multiplesValue)} × {(multiplesWeight * 100).toFixed(0)}% = {formatCurrency(multiplesValue * multiplesWeight)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t-2 border-primary-600">
              <span>Final Mid-Point Estimate:</span>
              <span className="text-primary-600">{formatCurrency(result.equity_value_mid || 0)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate projected FCF
function calculateProjectedFCF(_result: ValuationResponse, inputData: ValuationInputData | null, year: number): number {
  const baseFCF = inputData?.ebitda || (inputData?.revenue || 0) * 0.15; // Use real EBITDA or estimate from revenue
  const growthRate = 0.08; // 8% annual growth assumption
  return baseFCF * Math.pow(1 + growthRate, year);
}
