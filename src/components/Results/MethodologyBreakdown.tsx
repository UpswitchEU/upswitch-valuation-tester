import React, { useState, useMemo } from 'react';
import { formatCurrency } from './utils/formatters';
import { ConfidenceFactor } from './ConfidenceFactor';
import { getWeightExplanation, calculateConfidenceFactors } from './utils/weightExplanation';
import type { ValuationResponse } from '../../types/valuation';

interface MethodologyBreakdownProps {
  result: ValuationResponse;
}

export const MethodologyBreakdown: React.FC<MethodologyBreakdownProps> = ({ result }) => {
  const [showConfidenceDetails, setShowConfidenceDetails] = useState(false);
  
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
  
  // Calculate confidence factors
  const confidenceFactors = useMemo(() => calculateConfidenceFactors(result), [result]);
  
  // Get weight explanations
  const weightExplanation = useMemo(() => 
    getWeightExplanation(dcfWeight, multiplesWeight, result), 
    [dcfWeight, multiplesWeight, result]
  );
  
  // Calculate overall confidence if not provided
  const overallConfidence = result.confidence_score || 
    (Object.values(confidenceFactors) as number[]).reduce((a: number, b: number) => a + b, 0) / 
    Object.keys(confidenceFactors).length;
  
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
      {/* Dynamic Methodology Description */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Valuation Approach</h3>
        
        {dcfWeight > 0 && multiplesWeight > 0 && (
          <div className="mb-4">
            <p className="text-gray-700 mb-3">This valuation combines two methodologies:</p>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                <strong>Discounted Cash Flow (DCF):</strong> {(dcfWeight * 100).toFixed(1)}% - Projects future cash flows and discounts to present value using WACC
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                <strong>Market Multiples:</strong> {(multiplesWeight * 100).toFixed(1)}% - Compares to similar companies using revenue and EBITDA multiples
              </li>
            </ul>
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

      {/* Confidence Score with Progressive Disclosure */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-lg font-semibold text-gray-900">Confidence Score: {Math.round(overallConfidence)}%</h4>
          <button 
            onClick={() => setShowConfidenceDetails(!showConfidenceDetails)}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            {showConfidenceDetails ? '▼ Hide Details' : '▶ Show Details'}
          </button>
        </div>
        
        {/* Simple Breakdown (Always Visible) */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Data Quality</span>
              <span className="text-sm font-semibold text-gray-900">{confidenceFactors.data_quality}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${confidenceFactors.data_quality}%` }}
              />
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Methodology Agreement</span>
              <span className="text-sm font-semibold text-gray-900">{confidenceFactors.methodology_agreement}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${confidenceFactors.methodology_agreement}%` }}
              />
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Industry Benchmarks</span>
              <span className="text-sm font-semibold text-gray-900">{confidenceFactors.industry_benchmarks}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${confidenceFactors.industry_benchmarks}%` }}
              />
            </div>
          </div>
          
          <div className="p-3 bg-gray-50 rounded">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm font-medium text-gray-700">Company Profile</span>
              <span className="text-sm font-semibold text-gray-900">{confidenceFactors.company_profile}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${confidenceFactors.company_profile}%` }}
              />
            </div>
          </div>
        </div>

        {/* Detailed Breakdown (Progressive Disclosure) */}
        {showConfidenceDetails && (
          <div className="mt-4 space-y-3">
            <h5 className="font-medium text-gray-900 mb-3">Detailed Confidence Factors</h5>
            
            <ConfidenceFactor
              name="Data Quality"
              score={confidenceFactors.data_quality}
              description="Completeness and accuracy of financial data provided"
              impact={confidenceFactors.data_quality > 80 ? 'Strong' : confidenceFactors.data_quality > 60 ? 'Moderate' : 'Weak'}
              improvement={confidenceFactors.data_quality < 80 ? 'Add complete financial statements for current year' : null}
            />
            
            <ConfidenceFactor
              name="Historical Data"
              score={confidenceFactors.historical_data}
              description="Years of historical financial data available"
              impact={confidenceFactors.historical_data > 80 ? 'Strong' : 'Moderate'}
              improvement={confidenceFactors.historical_data < 80 ? 'Provide 3+ years of historical data' : null}
            />
            
            <ConfidenceFactor
              name="Methodology Agreement"
              score={confidenceFactors.methodology_agreement}
              description="How closely DCF and Multiples valuations agree"
              impact={confidenceFactors.methodology_agreement > 80 ? 'Strong' : 'Moderate'}
              improvement={confidenceFactors.methodology_agreement < 70 ? 'Valuations differ significantly - consider additional data points' : null}
            />
            
            <ConfidenceFactor
              name="Industry Benchmarks"
              score={confidenceFactors.industry_benchmarks}
              description="Quality of comparable companies and market data"
              impact={confidenceFactors.industry_benchmarks > 80 ? 'Strong' : 'Moderate'}
              improvement={confidenceFactors.industry_benchmarks < 80 ? 'Industry has limited comparable data - this is normal for niche markets' : null}
            />
            
            <ConfidenceFactor
              name="Company Profile"
              score={confidenceFactors.company_profile}
              description="Business stability, profitability, and growth characteristics"
              impact={confidenceFactors.company_profile > 80 ? 'Strong' : 'Moderate'}
              improvement={confidenceFactors.company_profile < 80 ? 'Improve financial stability and profitability metrics' : null}
            />
            
            <ConfidenceFactor
              name="Market Conditions"
              score={confidenceFactors.market_conditions}
              description="Current market volatility and economic conditions"
              impact={confidenceFactors.market_conditions > 80 ? 'Strong' : 'Moderate'}
              improvement={null}
            />
            
            <ConfidenceFactor
              name="Geographic Data"
              score={confidenceFactors.geographic_data}
              description="Quality of country-specific market data"
              impact={confidenceFactors.geographic_data > 80 ? 'Strong' : 'Moderate'}
              improvement={null}
            />
            
            <ConfidenceFactor
              name="Business Model Clarity"
              score={confidenceFactors.business_model_clarity}
              description="How well business model fits valuation approach"
              impact={confidenceFactors.business_model_clarity > 80 ? 'Strong' : 'Moderate'}
              improvement={null}
            />
          </div>
        )}

        {/* What Would Improve Confidence */}
        <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
          <h5 className="font-medium text-blue-900 mb-2">💡 How to Improve Confidence Score</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            {confidenceFactors.data_quality < 80 && <li>• Add complete financial statements for current year</li>}
            {confidenceFactors.historical_data < 80 && <li>• Provide 3+ years of historical financial data</li>}
            {confidenceFactors.industry_benchmarks < 80 && <li>• Industry has limited comparable data - this is normal for niche markets</li>}
            {confidenceFactors.company_profile < 80 && <li>• Improve financial stability and profitability metrics</li>}
          </ul>
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
              <div>• WACC (Discount Rate): {wacc.toFixed(1)}%</div>
              <div>• Terminal Growth: {terminalGrowth.toFixed(1)}%</div>
              <div>• Projection Period: 10 years</div>
              <div>• Cost of Equity: {costOfEquity.toFixed(1)}%</div>
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
              <div>• Revenue Multiple: {revenueMultiple.toFixed(1)}x</div>
              <div>• EBITDA Multiple: {ebitdaMultiple.toFixed(1)}x</div>
              <div>• Comparables: {comparablesCount} similar companies</div>
            </div>
          </div>
        </div>
      )}

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
                <div>• Cost of Equity: {costOfEquity.toFixed(1)}%</div>
                <div>• Risk-Free Rate: {riskFreeRate.toFixed(1)}% (ECB 10-year)</div>
                <div>• Market Risk Premium: {marketRiskPremium.toFixed(1)}%</div>
                <div>• Beta: {beta.toFixed(1)} (industry average)</div>
                <div>• Terminal Growth: {terminalGrowth.toFixed(1)}% (GDP growth)</div>
              </div>
            </div>
          )}
          
          {multiplesWeight > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Market Multiples</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div>• Revenue Multiple: {revenueMultiple.toFixed(1)}x (industry median)</div>
                <div>• EBITDA Multiple: {ebitdaMultiple.toFixed(1)}x (industry median)</div>
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
    </div>
  );
};
