import React from 'react';
import { Trophy } from 'lucide-react';
import { StepCard } from '../shared/StepCard';
import type { ValuationResponse } from '../../../types/valuation';

interface JourneyStep10Props {
  result: ValuationResponse;
}

const formatCurrency = (value: number): string => `€${Math.round(value).toLocaleString()}`;
const formatCurrencyCompact = (value: number): string => {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${Math.round(value / 1_000)}K`;
  return formatCurrency(value);
};

export const JourneyStep10_FinalValuation: React.FC<JourneyStep10Props> = ({ result }) => {
  const finalLow = result.equity_value_low;
  const finalMid = result.equity_value_mid;
  const finalHigh = result.equity_value_high;
  const confidenceScore = result.confidence_score || 0;
  // Backend returns confidence_score as integer 0-100, not decimal 0-1
  const confidenceLevel = confidenceScore >= 80 ? 'HIGH' : confidenceScore >= 60 ? 'MEDIUM' : 'LOW';

  return (
    <StepCard
      id="step-10-final"
      stepNumber={10}
      title="Final Valuation Range"
      subtitle="Complete valuation after all adjustments"
      icon={<Trophy className="w-5 h-5" />}
      color="green"
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* Final Range Display */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 border-2 border-green-500 rounded-xl p-6 shadow-lg">
          <div className="text-center mb-4">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">🎯 Final Valuation Range</h3>
            <p className="text-sm text-gray-600">Equity value after all adjustments and risk factors</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-2">Low Estimate</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrencyCompact(finalLow)}</p>
              <p className="text-xs text-gray-500">{formatCurrency(finalLow)}</p>
              <p className="text-xs text-gray-600 mt-2">
                {result.range_methodology === 'multiple_dispersion' ? 'P25 Multiple' : 'Conservative'}
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-blue-500 rounded-lg p-4 text-center border-2 border-green-600 shadow-md">
              <p className="text-sm text-white opacity-90 mb-2 font-semibold">Mid-Point (Most Likely)</p>
              <p className="text-4xl font-bold text-white mb-1">{formatCurrencyCompact(finalMid)}</p>
              <p className="text-xs text-white opacity-75">{formatCurrency(finalMid)}</p>
              <p className="text-xs text-white opacity-90 mt-2 font-semibold">
                {result.range_methodology === 'multiple_dispersion' ? 'P50 / Median' : 'Best Estimate'}
              </p>
            </div>

            <div className="bg-white rounded-lg p-4 text-center border border-gray-200 shadow-sm">
              <p className="text-sm text-gray-500 mb-2">High Estimate</p>
              <p className="text-3xl font-bold text-gray-900 mb-1">{formatCurrencyCompact(finalHigh)}</p>
              <p className="text-xs text-gray-500">{formatCurrency(finalHigh)}</p>
              <p className="text-xs text-gray-600 mt-2">
                {result.range_methodology === 'multiple_dispersion' ? 'P75 Multiple' : 'Optimistic'}
              </p>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="mt-4 pt-4 border-t border-green-200">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Confidence Score</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      confidenceLevel === 'HIGH' ? 'bg-green-500' :
                      confidenceLevel === 'MEDIUM' ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${confidenceScore}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-900">{confidenceScore.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Journey Recap */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Calculation Journey Summary</h4>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <ol className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                <span className="text-gray-700"><strong>Input Data:</strong> Collected company financials and business information</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
                <span className="text-gray-700"><strong>Benchmarking:</strong> Selected {result.multiples_valuation?.primary_multiple_method === 'ebitda_multiple' ? 'EBITDA' : 'Revenue'} multiple from comparable companies</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">3</span>
                <span className="text-gray-700"><strong>Base Valuation:</strong> Calculated enterprise value using industry multiples</span>
              </li>
              {result.multiples_valuation?.owner_concentration && (
                <li className="flex items-start gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">4</span>
                  <span className="text-gray-700"><strong>Owner Concentration:</strong> Applied {(result.multiples_valuation.owner_concentration.adjustment_factor * 100).toFixed(0)}% adjustment for key person risk</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">{result.multiples_valuation?.owner_concentration ? '5' : '4'}</span>
                <span className="text-gray-700"><strong>Size Discount:</strong> Applied {(result.multiples_valuation?.size_discount || 0) * 100}% for company size</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">{result.multiples_valuation?.owner_concentration ? '6' : '5'}</span>
                <span className="text-gray-700"><strong>Liquidity Discount:</strong> Applied {(result.multiples_valuation?.liquidity_discount || 0) * 100}% for private company illiquidity</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">{result.multiples_valuation?.owner_concentration ? '7' : '6'}</span>
                <span className="text-gray-700"><strong>EV to Equity:</strong> Converted enterprise value to equity value</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">{result.multiples_valuation?.owner_concentration ? '8' : '7'}</span>
                <span className="text-gray-700"><strong>Confidence Analysis:</strong> Scored data quality at {confidenceScore.toFixed(0)}%</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">{result.multiples_valuation?.owner_concentration ? '9' : '8'}</span>
                <span className="text-gray-700"><strong>Range Methodology:</strong> Used {result.range_methodology === 'multiple_dispersion' ? 'multiple dispersion' : 'confidence spread'} approach</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">10</span>
                <span className="text-gray-700"><strong>Final Result:</strong> Arrived at valuation range of {formatCurrencyCompact(finalLow)} - {formatCurrencyCompact(finalHigh)}</span>
              </li>
            </ol>
          </div>
        </div>

        {/* Methodology Statement */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <h4 className="font-semibold text-gray-900 mb-2">Methodology Statement</h4>
          <p className="text-sm text-blue-900">
            This valuation follows internationally recognized standards including IFRS 13 (Fair Value Measurement), 
            IVS 2017 (International Valuation Standards), and methodologies from McKinsey & Company, 
            Damodaran (NYU Stern), and Big 4 consulting firms.
          </p>
        </div>

        {/* Academic Citations */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Academic & Professional Sources</h4>
          <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside ml-2">
            <li>Koller, Goedhart & Wessels (2020), "Valuation: Measuring and Managing the Value of Companies", 7th Edition</li>
            <li>Damodaran, A. (2018), "The Dark Side of Valuation: Valuing Young, Distressed, and Complex Businesses"</li>
            <li>McKinsey & Company, "Valuation Handbook" - Multiple Dispersion Analysis (Section 4.3)</li>
            <li>PwC (2024), "Valuation Guidelines" - Private Company Discounts</li>
            <li>Ibbotson SBBI Yearbook - Size Premium Data</li>
            <li>Fama-French (1992), "The Cross-Section of Expected Stock Returns"</li>
          </ul>
        </div>

        {/* Next Steps */}
        <div className="bg-green-50 border border-green-300 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Professional Review Ready</h4>
          <p className="text-sm text-green-900 mb-3">
            This comprehensive breakdown provides full transparency into every calculation step, formula, and assumption. 
            The methodology and sources are documented to academic and professional standards.
          </p>
          <p className="text-xs text-green-800">
            ✓ Suitable for presentation to professors, valuation experts, and potential investors
          </p>
        </div>
      </div>
    </StepCard>
  );
};

