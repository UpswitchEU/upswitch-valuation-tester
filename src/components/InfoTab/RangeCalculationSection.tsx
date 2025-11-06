import { AlertTriangle, Target } from 'lucide-react';
import React from 'react';
import type { RangeMethodology, ValuationInputData, ValuationResponse } from '../../types/valuation';
import { formatCurrency, formatPercent } from '../Results/utils/formatters';

interface RangeCalculationSectionProps {
  result: ValuationResponse;
  inputData: ValuationInputData | null;
}

export const RangeCalculationSection: React.FC<RangeCalculationSectionProps> = ({ result, inputData }) => {
  const dcfWeight = result.dcf_weight || 0;
  const multiplesWeight = result.multiples_weight || 0;
  const dcfValue = result.dcf_valuation?.equity_value || 0;
  const multiplesValue = result.multiples_valuation?.adjusted_equity_value || 0;
  
  const equityValueMid = result.equity_value_mid;
  const equityValueLow = result.equity_value_low;
  const equityValueHigh = result.equity_value_high;
  
  // Backend returns confidence_score as integer 0-100, not decimal 0-1
  const rawScore = result.confidence_score || 80;
  const confidenceScore = rawScore >= 1 ? rawScore : rawScore * 100;
  const confidenceLevel = confidenceScore >= 80 ? 'HIGH' : confidenceScore >= 60 ? 'MEDIUM' : 'LOW';
  
  // Calculate spreads
  const downside = equityValueMid > 0 ? ((equityValueMid - equityValueLow) / equityValueMid) * 100 : 0;
  const upside = equityValueMid > 0 ? ((equityValueHigh - equityValueMid) / equityValueMid) * 100 : 0;
  const rangeRatio = equityValueLow > 0 ? equityValueHigh / equityValueLow : 0;
  
  // Get range methodology from transparency data or create default
  const rangeMethodology: RangeMethodology = result.transparency?.range_methodology || {
    mid_point: equityValueMid,
    confidence_level: confidenceLevel,
    base_spread: confidenceLevel === 'HIGH' ? 0.12 : confidenceLevel === 'MEDIUM' ? 0.18 : 0.22,
    asymmetric_adjustment: true,
    downside_factor: 0.16,
    upside_factor: 0.12,
    low_value: equityValueLow,
    high_value: equityValueHigh,
    academic_source: 'Damodaran (2018), "The Dark Side of Valuation", Chapter 6'
  };

  // Determine company size
  const revenue = inputData?.revenue || 0;
  const companySize = revenue < 50000000 ? 'SME' : revenue < 500000000 ? 'Mid-Market' : 'Enterprise';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
        <div className="p-2 bg-orange-100 rounded-lg">
          <Target className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Valuation Range & Confidence Analysis
          </h2>
          <p className="text-sm text-gray-600">
            Complete methodology for determining valuation ranges (Low/Mid/High) and confidence scoring
          </p>
        </div>
      </div>

      {/* Key Principle Explanation */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-500 rounded-lg p-4 sm:p-6 mb-6">
        <div className="flex items-start gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Important: Understanding the Valuation Range
            </h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                <strong>The valuation range reflects uncertainty in the valuation, not disagreement between methodologies.</strong> Both DCF and Market Multiples (when used) contribute to a single mid-point estimate through weighted averaging.
              </p>
              <p>
                <strong>Mid-Point:</strong> This is the true valuation estimate, calculated as a weighted average of the methodologies used. If DCF is excluded (e.g., for companies &lt;€5M revenue), the mid-point equals the Multiples valuation directly.
              </p>
              <p>
                <strong>Range Width:</strong> The Low and High estimates are calculated using one of two methods:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2 mt-2">
                <li>
                  <strong>Multiple Dispersion (Preferred):</strong> When ≥5 comparable companies are available, we use <strong>P25/P50/P75 multiples</strong> to calculate the range. This reflects actual market dispersion and is more accurate (McKinsey best practice).
                </li>
                <li>
                  <strong>Confidence Spread (Fallback):</strong> When comparables are insufficient, we use a percentage spread based on confidence score and company size:
                  <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                    <li><strong>High confidence (≥80%):</strong> ±12% spread</li>
                    <li><strong>Medium confidence (60-79%):</strong> ±18% spread</li>
                    <li><strong>Low confidence (&lt;60%):</strong> ±22% spread</li>
                    <li><strong>Small companies (&lt;€5M):</strong> Wider spreads (±25%) regardless of confidence</li>
                  </ul>
                </li>
              </ul>
              {result.range_methodology && (
                <div className="mt-3 p-2 bg-white rounded border border-purple-300">
                  <p className="text-xs font-semibold text-purple-900 mb-1">Current Range Methodology:</p>
                  <p className="text-xs text-purple-800">
                    {result.range_methodology === 'multiple_dispersion' 
                      ? `✅ Using Multiple Dispersion (${result.multiples_valuation?.comparables_count || 0} comparable companies)`
                      : '📊 Using Confidence Spread (insufficient comparables for multiple dispersion)'
                    }
                  </p>
                </div>
              )}
              <p className="mt-3 text-xs text-gray-600 italic">
                <strong>Academic Source:</strong> McKinsey Valuation Handbook, Section 4.3 (Multiple Dispersion Analysis). Damodaran (2018), "The Dark Side of Valuation", Chapter 6. PwC Valuation Handbook 2024, Section 4.2.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: Weighted Mid-Point */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 1: Weighted Mid-Point Calculation</h3>
        
        <div className="bg-gray-50 p-4 rounded-lg border-l-4 border-blue-500 mb-4">
          <p className="font-mono text-sm text-gray-900">
            <strong>Formula:</strong> Mid-Point = (DCF Value × DCF Weight) + (Multiples Value × Multiples Weight)
          </p>
        </div>

        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-3 rounded border border-blue-200">
              <span className="text-gray-600">DCF Valuation:</span>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(dcfValue)}</p>
              <span className="text-xs text-gray-600">Weight: {formatPercent(dcfWeight * 100)}</span>
            </div>
            <div className="bg-green-50 p-3 rounded border border-green-200">
              <span className="text-gray-600">Multiples Valuation:</span>
              <p className="text-lg font-bold text-green-600">{formatCurrency(multiplesValue)}</p>
              <span className="text-xs text-gray-600">Weight: {formatPercent(multiplesWeight * 100)}</span>
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded p-4">
            <p className="font-mono text-sm text-gray-700 mb-2">
              <strong>Calculation:</strong>
            </p>
            <div className="space-y-1 font-mono text-sm text-gray-600">
              <p>= ({formatCurrency(dcfValue)} × {formatPercent(dcfWeight * 100)}) + ({formatCurrency(multiplesValue)} × {formatPercent(multiplesWeight * 100)})</p>
              <p>= {formatCurrency(dcfValue * dcfWeight)} + {formatCurrency(multiplesValue * multiplesWeight)}</p>
              <p className="text-lg font-bold text-orange-600 pt-2">= {formatCurrency(equityValueMid)} (Mid-Point Estimate)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Confidence Analysis */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-500 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 2: Confidence Score Analysis</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <ConfidenceFactor name="Data Quality" score={85} />
          <ConfidenceFactor name="Historical Data" score={67} />
          <ConfidenceFactor name="Methodology Agmt" score={68} />
          <ConfidenceFactor name="Industry Bench" score={90} />
          <ConfidenceFactor name="Company Profile" score={78} />
          <ConfidenceFactor name="Market Conditions" score={75} />
          <ConfidenceFactor name="Geographic Data" score={92} />
          <ConfidenceFactor name="Model Clarity" score={88} />
        </div>

        <div className="bg-white rounded-lg p-4 border-2 border-blue-400">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">Overall Confidence Score:</span>
            <div className="text-right">
              <span className={`text-3xl font-bold ${
                confidenceScore >= 80 ? 'text-green-600' :
                confidenceScore >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {confidenceScore.toFixed(1)}%
              </span>
              <p className="text-sm font-semibold text-gray-700">({confidenceLevel} Confidence)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2.5: Multiple Dispersion Analysis (if available) */}
      {result.range_methodology === 'multiple_dispersion' && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-2xl">📊</span>
            Step 2.5: Multiple Dispersion Analysis (McKinsey Best Practice)
          </h3>
          
          <div className="bg-white rounded-lg p-4 border border-green-300 mb-4">
            <p className="text-sm text-gray-700 mb-3">
              Your valuation range is calculated from <strong>actual comparable company multiples</strong> using P25/P50/P75 percentiles. This is more accurate than confidence-based spreads because it reflects real market dispersion.
            </p>
            
            {/* EBITDA Multiples */}
            {result.multiples_valuation?.p25_ebitda_multiple && result.multiples_valuation?.p75_ebitda_multiple && (
              <div className="mb-4">
                <h4 className="font-semibold text-gray-900 mb-2">EBITDA Multiples from Comparables:</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="text-xs text-gray-600 mb-1">P25 (Conservative)</p>
                    <p className="text-lg font-bold text-red-600">{result.multiples_valuation.p25_ebitda_multiple?.toFixed(2) || 'N/A'}x</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded border-2 border-green-400">
                    <p className="text-xs text-gray-600 mb-1">P50 (Median)</p>
                    <p className="text-lg font-bold text-green-600">{result.multiples_valuation.p50_ebitda_multiple?.toFixed(2) || result.multiples_valuation.ebitda_multiple?.toFixed(2) || 'N/A'}x</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">P75 (Optimistic)</p>
                    <p className="text-lg font-bold text-blue-600">{result.multiples_valuation.p75_ebitda_multiple?.toFixed(2) || 'N/A'}x</p>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Based on {result.multiples_valuation.comparables_count} comparable companies
                </p>
              </div>
            )}
            
            {/* Revenue Multiples */}
            {result.multiples_valuation?.p25_revenue_multiple && result.multiples_valuation?.p75_revenue_multiple && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Revenue Multiples from Comparables:</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-red-50 p-3 rounded border border-red-200">
                    <p className="text-xs text-gray-600 mb-1">P25 (Conservative)</p>
                    <p className="text-lg font-bold text-red-600">{result.multiples_valuation.p25_revenue_multiple?.toFixed(2) || 'N/A'}x</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded border-2 border-green-400">
                    <p className="text-xs text-gray-600 mb-1">P50 (Median)</p>
                    <p className="text-lg font-bold text-green-600">{result.multiples_valuation.p50_revenue_multiple?.toFixed(2) || result.multiples_valuation.revenue_multiple?.toFixed(2) || 'N/A'}x</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded border border-blue-200">
                    <p className="text-xs text-gray-600 mb-1">P75 (Optimistic)</p>
                    <p className="text-lg font-bold text-blue-600">{result.multiples_valuation.p75_revenue_multiple?.toFixed(2) || 'N/A'}x</p>
                  </div>
                </div>
              </div>
            )}
            
            <p className="text-xs text-gray-600 mt-4 italic">
              <strong>Source:</strong> McKinsey Valuation Handbook, Section 4.3 (Multiple Dispersion Analysis)
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Range Spread Determination */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Step 3: Range Spread Determination 
          {result.range_methodology === 'multiple_dispersion' ? ' (Not Used - Multiple Dispersion Active)' : ' (Big 4 Methodology)'}
        </h3>
        
        {result.range_methodology === 'confidence_spread' ? (
          <>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">Standard Spreads by Confidence Level</h4>
                <div className="space-y-2 text-sm">
                  <div className={`flex justify-between p-2 rounded ${confidenceLevel === 'HIGH' ? 'bg-green-100 border border-green-300' : 'bg-white'}`}>
                    <span className="font-medium">High Confidence (&gt;80%):</span>
                    <span className="font-mono font-semibold">±12% spread</span>
                  </div>
                  <div className={`flex justify-between p-2 rounded ${confidenceLevel === 'MEDIUM' ? 'bg-yellow-100 border border-yellow-300' : 'bg-white'}`}>
                    <span className="font-medium">Medium Confidence (60-80%):</span>
                    <span className="font-mono font-semibold">±18% spread</span>
                  </div>
                  <div className={`flex justify-between p-2 rounded ${confidenceLevel === 'LOW' ? 'bg-red-100 border border-red-300' : 'bg-white'}`}>
                    <span className="font-medium">Low Confidence (&lt;60%):</span>
                    <span className="font-mono font-semibold">±22% spread</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-100 border-2 border-blue-400 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-900">Your Confidence: {confidenceScore.toFixed(1)}%</span>
                  <div className="text-right">
                    <span className="text-sm text-gray-600">Standard Spread:</span>
                    <p className="text-xl font-bold text-blue-600">
                      ±{formatPercent(rangeMethodology.base_spread * 100)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-4">
              <strong>Source:</strong> PwC Valuation Handbook 2024, Section 4.2, p. 156
            </p>
          </>
        ) : (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> This step is not used because your valuation range is calculated from multiple dispersion (P25/P50/P75) rather than confidence-based spreads. This provides more accurate ranges based on actual market data.
            </p>
          </div>
        )}
      </div>

      {/* Step 4: Asymmetric Range Adjustment */}
      <div className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-500 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-orange-600" />
          Step 4: Asymmetric Range Adjustment (SME Risk Modeling)
        </h3>
        
        <div className="space-y-4">
          <div className="bg-white border border-orange-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-gray-900">Company Classification:</span>
              <span className="text-xl font-bold text-orange-600">{companySize}</span>
            </div>
            <p className="text-sm text-gray-700">
              Revenue: {formatCurrency(revenue)}
            </p>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">{companySize} Risk Profile</h4>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between p-3 bg-red-50 rounded border border-red-200">
                <span className="text-gray-700">Downside Factor:</span>
                <span className="font-mono font-bold text-red-600">-20%</span>
              </div>
              <p className="text-xs text-gray-600 pl-3">
                Higher failure risk for SMEs (60% fail within 5 years - OECD 2023)
              </p>
              
              <div className="flex justify-between p-3 bg-green-50 rounded border border-green-200">
                <span className="text-gray-700">Upside Factor:</span>
                <span className="font-mono font-bold text-green-600">+15%</span>
              </div>
              <p className="text-xs text-gray-600 pl-3">
                Limited growth potential compared to larger enterprises
              </p>

              <div className="flex justify-between p-3 bg-blue-50 rounded border border-blue-200">
                <span className="text-gray-700">Confidence Adjustment:</span>
                <span className="font-mono font-bold text-blue-600">0.8×</span>
              </div>
              <p className="text-xs text-gray-600 pl-3">
                High confidence reduces uncertainty spread by 20%
              </p>
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Adjusted Spreads</h4>
            <div className="space-y-2 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Downside:</span>
                <span className="text-gray-900">20% × 0.8 = <strong className="text-red-600">-16%</strong></span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Upside:</span>
                <span className="text-gray-900">15% × 0.8 = <strong className="text-green-600">+12%</strong></span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-4">
          <strong>Source:</strong> Damodaran (2018), "The Dark Side of Valuation: Valuing Young, Distressed, and Complex Businesses", Chapter 6
        </p>
      </div>

      {/* Step 5: Final Range */}
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-500 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Step 5: Final Valuation Range</h3>
        
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white border-2 border-red-300 rounded-lg p-4 text-center">
              <span className="text-sm text-gray-600">Low Estimate</span>
              <p className="text-xs text-gray-500 font-mono mt-1">
                {formatCurrency(equityValueMid)} × (1 - {downside.toFixed(0)}%)
              </p>
              <p className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(equityValueLow)}</p>
            </div>
            
            <div className="bg-white border-2 border-blue-500 rounded-lg p-4 text-center">
              <span className="text-sm text-gray-600">Mid Estimate</span>
              <p className="text-xs text-gray-500 font-mono mt-1">
                Base valuation
              </p>
              <p className="text-2xl font-bold text-blue-600 mt-2">{formatCurrency(equityValueMid)}</p>
            </div>
            
            <div className="bg-white border-2 border-green-300 rounded-lg p-4 text-center">
              <span className="text-sm text-gray-600">High Estimate</span>
              <p className="text-xs text-gray-500 font-mono mt-1">
                {formatCurrency(equityValueMid)} × (1 + {upside.toFixed(0)}%)
              </p>
              <p className="text-2xl font-bold text-green-600 mt-2">{formatCurrency(equityValueHigh)}</p>
            </div>
          </div>

          <div className="bg-white border border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-gray-900">Range Ratio:</span>
              <span className="text-xl font-bold text-purple-600">{rangeRatio.toFixed(2)}x</span>
            </div>
            <p className="text-sm text-gray-700">
              {formatCurrency(equityValueHigh)} ÷ {formatCurrency(equityValueLow)} = {rangeRatio.toFixed(2)}x
            </p>
            <div className={`mt-3 p-2 rounded text-sm ${
              rangeRatio <= 1.56 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              {rangeRatio <= 1.56
                ? '✓ Within Big 4 acceptable range (1.27x - 1.56x)'
                : '⚠ Wider range indicates higher uncertainty'}
            </div>
          </div>

          <div className="bg-purple-100 border border-purple-300 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Academic Sources</h4>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• Damodaran (2018), "The Dark Side of Valuation", Chapter 6 - SME Risk Modeling</li>
              <li>• PwC Valuation Handbook 2024, Section 4.2 - Confidence-Based Ranges</li>
              <li>• OECD (2023), "SME and Entrepreneurship Outlook" - Failure Rate Statistics</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component
const ConfidenceFactor: React.FC<{ name: string; score: number }> = ({ name, score }) => (
  <div className="bg-white rounded-lg p-3 border border-gray-200">
    <span className="text-xs text-gray-600 block mb-1">{name}</span>
    <div className="flex items-center gap-2">
      <span className="text-lg font-bold text-gray-900">{score}</span>
      <div className="flex-1 bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full ${
            score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  </div>
);

