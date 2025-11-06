import React from 'react';
import { BarChart3 } from 'lucide-react';
import { StepCard } from '../shared/StepCard';
import type { ValuationResponse } from '../../../types/valuation';

interface JourneyStep2Props {
  result: ValuationResponse;
}

export const JourneyStep2_Benchmarking: React.FC<JourneyStep2Props> = ({ result }) => {
  const multiples = result.multiples_valuation;
  const isPrimaryEBITDA = multiples?.primary_multiple_method === 'ebitda_multiple';
  const dcfWeight = result.dcf_weight || 0;
  const revenue = result.current_year_data?.revenue || 0;
  const isDCFExcluded = dcfWeight === 0;
  
  return (
    <StepCard
      id="step-2-benchmarking"
      stepNumber={2}
      title="Industry Benchmarking & Multiple Selection"
      subtitle="Comparable company analysis and multiple selection"
      icon={<BarChart3 className="w-5 h-5" />}
      color="blue"
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* DCF Exclusion Notice (if applicable) */}
        {isDCFExcluded && result.dcf_exclusion_reason && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-semibold text-amber-900 mb-1">DCF Methodology Excluded</h4>
                <p className="text-sm text-amber-800">
                  {result.dcf_exclusion_reason} Market Multiples methodology is more reliable for businesses of this size 
                  (revenue: {revenue >= 1_000_000 ? `€${(revenue / 1_000_000).toFixed(1)}M` : `€${Math.round(revenue).toLocaleString()}`}). 
                  This approach aligns with McKinsey valuation standards and Big 4 consulting firm methodologies for small businesses.
                </p>
              </div>
            </div>
          </div>
        )}
        {/* Primary Multiple Selection */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Primary Multiple Method Selected</h4>
          <div className={`border-2 rounded-lg p-4 ${
            isPrimaryEBITDA ? 'bg-purple-50 border-purple-500' : 'bg-green-50 border-green-500'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-bold text-gray-900">
                {isPrimaryEBITDA ? 'EBITDA Multiple' : 'Revenue Multiple'} ⭐
              </span>
              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${
                isPrimaryEBITDA ? 'bg-purple-200 text-purple-800' : 'bg-green-200 text-green-800'
              }`}>
                PRIMARY METHOD
              </span>
            </div>
            <p className="text-sm text-gray-700">
              {multiples?.primary_multiple_reason || 
               (isPrimaryEBITDA 
                 ? 'EBITDA multiple is standard for profitable companies with stable margins'
                 : 'Revenue multiple is used for companies with low or negative EBITDA')}
            </p>
          </div>
        </div>

        {/* Market Multiples */}
        {multiples && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Market Multiples (From Comparables)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* EBITDA Multiples */}
              <div className={`border rounded-lg p-4 ${
                isPrimaryEBITDA ? 'bg-purple-50 border-purple-300 border-2' : 'bg-white border-gray-200'
              }`}>
                <h5 className="font-semibold text-gray-900 mb-3">EBITDA Multiples</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">P25 (Low):</span>
                    <span className="font-mono font-semibold">
                      {multiples.p25_ebitda_multiple?.toFixed(2) || 'N/A'}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">P50 (Median):</span>
                    <span className="font-mono font-bold text-purple-700">
                      {multiples.p50_ebitda_multiple?.toFixed(2) || multiples.ebitda_multiple?.toFixed(2) || 'N/A'}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">P75 (High):</span>
                    <span className="font-mono font-semibold">
                      {multiples.p75_ebitda_multiple?.toFixed(2) || 'N/A'}x
                    </span>
                  </div>
                </div>
              </div>

              {/* Revenue Multiples */}
              <div className={`border rounded-lg p-4 ${
                !isPrimaryEBITDA ? 'bg-green-50 border-green-300 border-2' : 'bg-white border-gray-200'
              }`}>
                <h5 className="font-semibold text-gray-900 mb-3">Revenue Multiples</h5>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">P25 (Low):</span>
                    <span className="font-mono font-semibold">
                      {multiples.p25_revenue_multiple?.toFixed(2) || 'N/A'}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">P50 (Median):</span>
                    <span className="font-mono font-bold text-green-700">
                      {multiples.p50_revenue_multiple?.toFixed(2) || multiples.revenue_multiple?.toFixed(2) || 'N/A'}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">P75 (High):</span>
                    <span className="font-mono font-semibold">
                      {multiples.p75_revenue_multiple?.toFixed(2) || 'N/A'}x
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Comparables Info */}
        {multiples?.comparables_count && (
          <div className="bg-green-50 border border-green-300 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-900">Comparable Companies</span>
              <span className="text-2xl font-bold text-green-600">{multiples.comparables_count}</span>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Quality: <span className="font-semibold">{multiples.comparables_quality || 'Good'}</span>
            </p>
          </div>
        )}

        {/* Explanation */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-900">
            <strong>Source:</strong> Market multiples are derived from comparable company analysis. 
            The P25/P50/P75 percentiles represent the distribution of multiples across similar companies, 
            providing a range for valuation rather than a single point estimate.
          </p>
        </div>
      </div>
    </StepCard>
  );
};

