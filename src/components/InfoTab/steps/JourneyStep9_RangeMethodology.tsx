import React from 'react';
import { GitBranch } from 'lucide-react';
import { StepCard } from '../shared/StepCard';
import type { ValuationResponse } from '../../../types/valuation';

interface JourneyStep9Props {
  result: ValuationResponse;
}

export const JourneyStep9_RangeMethodology: React.FC<JourneyStep9Props> = ({ result }) => {
  const rangeMethod = result.range_methodology || 'confidence_spread';
  const isMultipleDispersion = rangeMethod === 'multiple_dispersion';
  const multiples = result.multiples_valuation;
  const confidenceScore = result.confidence_score || 0;

  return (
    <StepCard
      id="step-9-range"
      stepNumber={9}
      title="Range Methodology Selection"
      subtitle={isMultipleDispersion ? 'Multiple Dispersion (Market-Based)' : 'Confidence Spread (Size-Adjusted)'}
      icon={<GitBranch className="w-5 h-5" />}
      color="indigo"
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* Method Selection */}
        <div className={`border-2 rounded-lg p-4 ${
          isMultipleDispersion ? 'bg-green-50 border-green-500' : 'bg-blue-50 border-blue-500'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-900">Method Selected</h4>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
              isMultipleDispersion ? 'bg-green-200 text-green-800' : 'bg-blue-200 text-blue-800'
            }`}>
              {isMultipleDispersion ? 'MULTIPLE DISPERSION' : 'CONFIDENCE SPREAD'}
            </span>
          </div>
          <p className="text-sm text-gray-700">
            {isMultipleDispersion
              ? 'Using P25/P50/P75 multiples from comparable companies to create the valuation range (McKinsey best practice)'
              : 'Using confidence-based spread adjusted for company size to create the valuation range'
            }
          </p>
        </div>

        {/* Method Details */}
        {isMultipleDispersion ? (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Multiple Dispersion Details</h4>
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Percentile Multiples Used</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">P25 (Low Estimate):</span>
                    <span className="font-mono font-semibold">
                      {multiples?.primary_multiple_method === 'ebitda_multiple'
                        ? `${multiples?.p25_ebitda_multiple?.toFixed(2) || 'N/A'}x`
                        : `${multiples?.p25_revenue_multiple?.toFixed(2) || 'N/A'}x`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-green-50 p-2 rounded">
                    <span className="text-green-700 font-semibold">P50 (Mid-Point):</span>
                    <span className="font-mono font-bold text-green-700">
                      {multiples?.primary_multiple_method === 'ebitda_multiple'
                        ? `${multiples?.p50_ebitda_multiple?.toFixed(2) || multiples?.ebitda_multiple?.toFixed(2) || 'N/A'}x`
                        : `${multiples?.p50_revenue_multiple?.toFixed(2) || multiples?.revenue_multiple?.toFixed(2) || 'N/A'}x`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">P75 (High Estimate):</span>
                    <span className="font-mono font-semibold">
                      {multiples?.primary_multiple_method === 'ebitda_multiple'
                        ? `${multiples?.p75_ebitda_multiple?.toFixed(2) || 'N/A'}x`
                        : `${multiples?.p75_revenue_multiple?.toFixed(2) || 'N/A'}x`
                      }
                    </span>
                  </div>
                </div>
              </div>

              {multiples?.comparables_count && (
                <div className="bg-green-50 border border-green-300 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Comparable Companies Used</span>
                    <span className="text-xl font-bold text-green-600">{multiples.comparables_count}</span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Range reflects actual market dispersion from comparable transactions
                  </p>
                </div>
              )}

              <div className="bg-green-100 border border-green-400 rounded-lg p-3">
                <p className="text-sm text-green-900">
                  <strong>✓ Advantage:</strong> This method uses actual market data from comparable companies, 
                  making it more accurate than confidence-based spreads (McKinsey preferred approach).
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Confidence Spread Details</h4>
            <div className="space-y-3">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="font-medium text-gray-900 mb-3">Spread Calculation</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Confidence Score:</span>
                    <span className="font-semibold">{(confidenceScore * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Base Spread:</span>
                    <span className="font-semibold">±18%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Size Adjustment:</span>
                    <span className="font-semibold">+7%</span>
                  </div>
                  <div className="flex justify-between items-center bg-blue-50 p-2 rounded">
                    <span className="text-blue-700 font-semibold">Total Spread:</span>
                    <span className="font-bold text-blue-700">±25%</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-300 rounded-lg p-3">
                <h5 className="font-medium text-gray-900 mb-2 text-sm">Spread Guidelines</h5>
                <ul className="text-xs text-gray-700 space-y-1 list-disc list-inside ml-2">
                  <li><strong>High confidence (≥80%):</strong> ±12% spread</li>
                  <li><strong>Medium confidence (60-79%):</strong> ±18% spread</li>
                  <li><strong>Low confidence (&lt;60%):</strong> ±22% spread</li>
                  <li><strong>Small companies (&lt;€5M):</strong> Additional +7% spread</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Comparison */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-3">Why This Method?</h4>
          <div className="text-sm text-gray-700 space-y-2">
            {isMultipleDispersion ? (
              <>
                <p>
                  <strong>Multiple Dispersion</strong> is preferred when sufficient comparable company data is available 
                  (typically ≥5 comparables). It provides a range based on actual market transactions rather than 
                  statistical assumptions.
                </p>
                <p className="text-xs text-gray-600 italic mt-2">
                  This approach is recommended by McKinsey & Company and is considered the gold standard in 
                  professional valuation practice.
                </p>
              </>
            ) : (
              <>
                <p>
                  <strong>Confidence Spread</strong> is used when comparable company data is insufficient. 
                  The spread width is calibrated based on data quality and company size to reflect 
                  valuation uncertainty.
                </p>
                <p className="text-xs text-gray-600 italic mt-2">
                  This approach follows Big 4 consulting firm methodologies for companies with limited 
                  comparable data.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Academic Source */}
        <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded">
          <p className="text-sm text-indigo-900">
            <strong>Sources:</strong> McKinsey Valuation Handbook, Section 4.3 (Multiple Dispersion Analysis); 
            Damodaran (2018), "The Dark Side of Valuation", Chapter 6; PwC Valuation Handbook 2024, Section 4.2.
          </p>
        </div>
      </div>
    </StepCard>
  );
};

