import React, { useMemo, useState } from 'react';
import { FINANCIAL_CONSTANTS } from '../../config/financialConstants';
import { METHODOLOGY_DOCS } from '../../content/methodologyDocs';
import type { ValuationResponse } from '../../types/valuation';
import { DocumentationModal } from '../ui/DocumentationModal';
import { Tooltip } from '../ui/Tooltip';
import { DCFExclusionNotice } from './DCFExclusionNotice';
import { SmallFirmAdjustments } from './SmallFirmAdjustments';
import { formatCurrency } from './utils/formatters';
import { getWeightExplanation } from './utils/weightExplanation';

interface MethodologyBreakdownProps {
  result: ValuationResponse;
}

export const MethodologyBreakdown: React.FC<MethodologyBreakdownProps> = ({ result }) => {
  const [modalContent, setModalContent] = useState<string | null>(null);
  
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
  
  // Get weight explanations
  const weightExplanation = useMemo(() => 
    getWeightExplanation(dcfWeight, multiplesWeight, result), 
    [dcfWeight, multiplesWeight, result]
  );
  
  // DCF details
  // Backend returns rates as decimals (0.091 = 9.1%), constants are percentages (12.1 = 12.1%)
  const waccRaw = resultAny.dcf_valuation?.wacc ?? resultAny.wacc ?? (FINANCIAL_CONSTANTS.DEFAULT_WACC / 100);
  const wacc = waccRaw < 1 ? waccRaw * 100 : waccRaw; // Convert decimal to percentage if needed
  
  const terminalGrowthRaw = resultAny.dcf_valuation?.terminal_growth_rate ?? resultAny.terminal_growth_rate ?? (FINANCIAL_CONSTANTS.DEFAULT_TERMINAL_GROWTH / 100);
  const terminalGrowth = terminalGrowthRaw < 1 ? terminalGrowthRaw * 100 : terminalGrowthRaw;
  
  const costOfEquityRaw = resultAny.dcf_valuation?.cost_of_equity ?? resultAny.cost_of_equity ?? (FINANCIAL_CONSTANTS.DEFAULT_COST_OF_EQUITY / 100);
  const costOfEquity = costOfEquityRaw < 1 ? costOfEquityRaw * 100 : costOfEquityRaw;
  
  const riskFreeRate = FINANCIAL_CONSTANTS.ECB_RISK_FREE_RATE;
  const marketRiskPremium = FINANCIAL_CONSTANTS.MARKET_RISK_PREMIUM;
  const beta = FINANCIAL_CONSTANTS.DEFAULT_BETA;
  
  // Multiples details
  const revenueMultiple = resultAny.multiples_valuation?.revenue_multiple || resultAny.revenue_multiple || 2.1;
  const ebitdaMultiple = resultAny.multiples_valuation?.ebitda_multiple || resultAny.ebitda_multiple || 8.5;
  const comparablesCount = resultAny.comparables_count || 15;
  
  // Final calculation
  const dcfValue = result.dcf_valuation?.equity_value || 0;
  const multiplesValue = result.multiples_valuation?.ev_ebitda_valuation || 0;
  const finalValue = (dcfValue * dcfWeight) + (multiplesValue * multiplesWeight);
  
  // Extract valuation range values
  const equityValueMid = result.equity_value_mid || finalValue;
  const equityValueLow = result.equity_value_low || 0;
  const equityValueHigh = result.equity_value_high || 0;
  
  // Calculate spreads for low/high estimates
  const downside = equityValueMid > 0 ? ((equityValueMid - equityValueLow) / equityValueMid) * 100 : 0;
  const upside = equityValueMid > 0 ? ((equityValueHigh - equityValueMid) / equityValueMid) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* DCF Exclusion Notice (if DCF not used) */}
      <DCFExclusionNotice result={result} />
      
      {/* Dynamic Methodology Description */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Valuation Approach</h3>
          <button
            onClick={() => setModalContent('valuation-approach')}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors duration-200"
          >
            Learn More
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>
        </div>
        
        {dcfWeight > 0 && multiplesWeight > 0 && (
          <div className="mb-4">
            <p className="text-gray-700 mb-3">This valuation combines two methodologies:</p>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <strong className="text-gray-900">
                      <Tooltip content="Discounted Cash Flow - a valuation method that projects future cash flows and discounts them to present value">
                        DCF
                      </Tooltip>
                    </strong>
                    <span className="text-gray-700">{(dcfWeight * 100).toFixed(1)}%</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Projects future cash flows and discounts to present value using{' '}
                    <Tooltip content="Weighted Average Cost of Capital - the rate used to discount future cash flows to present value">
                      <span className="cursor-help border-b border-dotted border-gray-400">WACC</span>
                    </Tooltip>
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                <div className="flex-1">
                  <div className="flex items-baseline gap-2 mb-1">
                    <strong className="text-gray-900">
                      <Tooltip content="Valuation ratios based on comparable public companies or transactions">
                        Market Multiples
                      </Tooltip>
                    </strong>
                    <span className="text-gray-700">{(multiplesWeight * 100).toFixed(1)}%</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Compares to similar companies using revenue and{' '}
                    <Tooltip content="Earnings Before Interest, Taxes, Depreciation, and Amortization - a measure of operating profitability">
                      <span className="cursor-help border-b border-dotted border-gray-400">EBITDA</span>
                    </Tooltip>{' '}
                    multiples
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {dcfWeight === 100 && (
          <div className="mb-4 p-4 bg-blue-50 rounded border border-blue-200">
            <p className="text-blue-900">
              This valuation uses <strong>Discounted Cash Flow (DCF) only</strong> because your business profile is best suited for cash flow projection.
            </p>
          </div>
        )}
        
        {multiplesWeight === 100 && (
          <div className="mb-4 p-4 bg-green-50 rounded border border-green-200">
            <p className="text-green-900">
              This valuation uses <strong>Market Multiples only</strong> because comparable company analysis is most reliable for your business type.
            </p>
          </div>
        )}

        {/* How We Determined These Weights */}
        <div className="mt-6">
          <h4 className="font-medium text-gray-900 mb-3">How We Determined These Weights</h4>
          
          {dcfWeight > 50 && (
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
              <p className="text-blue-900 font-medium mb-2">
                ✓ <strong>DCF-Favored ({(dcfWeight * 100).toFixed(1)}%)</strong> because:
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                {weightExplanation.dcfReasons.map((reason, index) => (
                  <li key={index}>• {reason}</li>
                ))}
              </ul>
            </div>
          )}
          
          {multiplesWeight > 50 && (
            <div className="mb-4 p-3 bg-green-50 rounded border border-green-200">
              <p className="text-green-900 font-medium mb-2">
                ✓ <strong>Multiples-Favored ({(multiplesWeight * 100).toFixed(1)}%)</strong> because:
              </p>
              <ul className="text-sm text-green-800 space-y-1">
                {weightExplanation.multiplesReasons.map((reason, index) => (
                  <li key={index}>• {reason}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* DCF Section - Only if dcfWeight > 0 */}
      {dcfWeight > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Method 1: Discounted Cash Flow (DCF) - {(dcfWeight * 100).toFixed(1)}%
          </h4>
          
          <div className="p-4 bg-blue-50 rounded border border-blue-200">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {formatCurrency(dcfValue)}
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• <Tooltip content="Weighted Average Cost of Capital - the rate used to discount future cash flows to present value">WACC</Tooltip> (Discount Rate): {wacc.toFixed(1)}%</div>
              <div>• <Tooltip content="The assumed constant growth rate of cash flows beyond the projection period">Terminal Growth</Tooltip>: {terminalGrowth.toFixed(1)}%</div>
              {terminalGrowth < 0.1 && (
                <div className="text-xs text-blue-700 mt-1 italic">
                  Terminal growth of 0% reflects conservative assumptions for mature market conditions.
                </div>
              )}
              <div>• Projection Period: 10 years</div>
              <div>• <Tooltip content="The return required by equity investors, calculated using the Capital Asset Pricing Model (CAPM)">Cost of Equity</Tooltip>: {costOfEquity.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Multiples Section - Only if multiplesWeight > 0 */}
      {multiplesWeight > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">
            Method 2: Market Multiples - {(multiplesWeight * 100).toFixed(1)}%
          </h4>
          
          <div className="p-4 bg-green-50 rounded border border-green-200">
            <div className="text-2xl font-bold text-green-600 mb-2">
              {formatCurrency(multiplesValue)}
            </div>
            <div className="text-sm text-green-700 space-y-1">
              {renderMultipleWithAdjustment(
                "Revenue Multiple",
                result.multiples_valuation?.unadjusted_revenue_multiple,
                revenueMultiple,
                result.multiples_valuation?.owner_concentration
              )}
              {renderMultipleWithAdjustment(
                "EBITDA Multiple",
                result.multiples_valuation?.unadjusted_ebitda_multiple,
                ebitdaMultiple,
                result.multiples_valuation?.owner_concentration
              )}
              <div>• Comparables: {comparablesCount} similar companies</div>
            </div>
          </div>
        </div>
      )}

      {/* Small Firm Adjustments Section (NEW) */}
      <SmallFirmAdjustments result={result} />

      {/* Final Calculation - Only if both methods are used */}
      {dcfWeight > 0 && multiplesWeight > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
          <h4 className="font-medium text-gray-900 mb-2">Final Valuation (Weighted Average)</h4>
          <div className="text-sm text-gray-700 space-y-1">
            <div>• DCF: {formatCurrency(dcfValue)} × {(dcfWeight * 100).toFixed(1)}% = {formatCurrency(dcfValue * dcfWeight)}</div>
            <div>• Multiples: {formatCurrency(multiplesValue)} × {(multiplesWeight * 100).toFixed(1)}% = {formatCurrency(multiplesValue * multiplesWeight)}</div>
            <div className="text-lg font-semibold text-gray-900 pt-2 border-t border-gray-300">
              = {formatCurrency(finalValue)}
            </div>
            {equityValueLow > 0 && equityValueHigh > 0 && (
              <>
                <div className="pt-2 border-t border-gray-300 mt-2">
                  • Low: {formatCurrency(equityValueMid)} × (1 - {downside.toFixed(1)}%) = {formatCurrency(equityValueLow)}
                </div>
                <div>
                  • High: {formatCurrency(equityValueMid)} × (1 + {upside.toFixed(1)}%) = {formatCurrency(equityValueHigh)}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Key Assumptions */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Assumptions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {dcfWeight > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">DCF Methodology</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• <Tooltip content="The return required by equity investors, calculated using the Capital Asset Pricing Model (CAPM)">Cost of Equity</Tooltip>: {costOfEquity.toFixed(1)}%</div>
                <div>• <Tooltip content="The risk-free rate of return, typically based on government bond yields">Risk-Free Rate</Tooltip>: {riskFreeRate.toFixed(1)}% (ECB 10-year)</div>
                <div>• <Tooltip content="The additional return investors expect for taking on market risk">Market Risk Premium</Tooltip>: {marketRiskPremium.toFixed(1)}%</div>
                <div>• <Tooltip content="A measure of a stock's volatility relative to the overall market">Beta</Tooltip>: {beta.toFixed(1)} (industry average)</div>
                <div>• <Tooltip content="The assumed constant growth rate of cash flows beyond the projection period">Terminal Growth</Tooltip>: {terminalGrowth.toFixed(1)}% (GDP growth)</div>
              </div>
            </div>
          )}
          
          {multiplesWeight > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Market Multiples</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• <Tooltip content="Company valuation divided by annual revenue - used to compare similar companies">Revenue Multiple</Tooltip>: {revenueMultiple.toFixed(1)}x (industry median)</div>
                <div>• <Tooltip content="Earnings Before Interest, Taxes, Depreciation, and Amortization - a measure of operating profitability">EBITDA</Tooltip> Multiple: {ebitdaMultiple.toFixed(1)}x (industry median)</div>
                <div>• Comparables: {comparablesCount} similar companies</div>
                <div>• Geographic Focus: European SMEs</div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded text-xs text-gray-600">
          <strong>Note:</strong> Assumptions based on industry standards and current market conditions. 
          Risk-free rate sourced from ECB, beta from industry comparables.
        </div>
      </div>

      {/* Documentation Modal */}
      <DocumentationModal
        isOpen={modalContent !== null}
        onClose={() => setModalContent(null)}
        title={modalContent ? METHODOLOGY_DOCS[modalContent as keyof typeof METHODOLOGY_DOCS]?.title : ''}
        content={modalContent ? METHODOLOGY_DOCS[modalContent as keyof typeof METHODOLOGY_DOCS]?.content : null}
      />
    </div>
  );
};

// Helper function to render multiples with adjustment transparency
const renderMultipleWithAdjustment = (
  label: string,
  unadjusted: number | undefined,
  adjusted: number,
  ownerConcentration: any
) => {
  const hasAdjustment = unadjusted && ownerConcentration && ownerConcentration.adjustment_factor !== 0;
  
  if (!hasAdjustment) {
    return <div>• {label}: {adjusted.toFixed(1)}x</div>;
  }
  
  const adjustmentPercent = Math.abs(ownerConcentration.adjustment_factor * 100).toFixed(0);
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 pl-3 py-2 -ml-1 mb-2 rounded">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="font-medium text-gray-900">• {label}:</span>
        <span className="font-mono text-gray-500 line-through">{unadjusted.toFixed(1)}x</span>
        <span className="text-gray-700">→</span>
        <span className="font-mono font-semibold text-gray-900">{adjusted.toFixed(1)}x</span>
        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded font-medium">
          -{adjustmentPercent}%
        </span>
      </div>
      <p className="text-xs text-gray-600 mt-1">
        Adjusted for owner concentration ({ownerConcentration.number_of_owners} {ownerConcentration.number_of_owners === 1 ? 'owner' : 'owners'} / {ownerConcentration.number_of_employees} {ownerConcentration.number_of_employees === 1 ? 'employee' : 'employees'})
      </p>
    </div>
  );
};
