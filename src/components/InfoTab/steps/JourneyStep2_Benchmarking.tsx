import { BarChart3 } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import { stepLogger, createPerformanceLogger } from '../../../utils/logger';
import type { ValuationResponse } from '../../../types/valuation';
import { getStepResultData } from '../../../utils/stepDataMapper';
import { getStepData } from '../../../utils/valuationDataExtractor';
import { StepMetadata } from '../../shared/StepMetadata';
import { StepCard } from '../shared/StepCard';

interface JourneyStep2Props {
  result: ValuationResponse;
}

export const JourneyStep2_Benchmarking: React.FC<JourneyStep2Props> = ({ result }) => {
  const renderPerfLogger = useRef(createPerformanceLogger('JourneyStep2_Benchmarking.render', 'step'));
  
  // Component mount logging
  useEffect(() => {
    const step2Data = getStepData(result, 2);
    const step2Result = getStepResultData(result, 2);
    
    stepLogger.info('JourneyStep2_Benchmarking mounted', {
      component: 'JourneyStep2_Benchmarking',
      step: 2,
      hasStepData: !!step2Data,
      hasStepResult: !!step2Result,
      hasMultiples: !!result.multiples_valuation,
      valuationId: result.valuation_id
    });
    
    return () => {
      stepLogger.debug('JourneyStep2_Benchmarking unmounting', { step: 2 });
    };
  }, [result.valuation_id]);
  
  const multiples = result.multiples_valuation;
  
  // Extract step data from backend
  const step2Data = getStepData(result, 2);
  const step2Result = getStepResultData(result, 2);
  
  // CRITICAL FIX: Use primary_method from Step 2 transparency data (e.g., "EV/EBITDA" or "EV/Revenue")
  // Priority: Step 2 transparency data > legacy multiples_valuation > fallback
  const primaryMethod = step2Result?.primary_method || 
                       multiples?.primary_method || 
                       (multiples?.primary_multiple_method === 'ebitda_multiple' ? 'EV/EBITDA' : 'EV/Revenue');
  const isPrimaryEBITDA = primaryMethod === 'EV/EBITDA';
  
  const dcfWeight = result.dcf_weight || 0;
  const revenue = result.current_year_data?.revenue || 0;
  const isDCFExcluded = dcfWeight === 0;
  
  // Extract methodology decision and suitability score
  const methodologyDecision = step2Result?.methodology_decision || 
    (isDCFExcluded ? 'MULTIPLES_ONLY' : dcfWeight > 0.5 ? 'HYBRID_DCF_PRIMARY' : 'HYBRID_MULTIPLES_PRIMARY');
  const suitabilityScore = step2Result?.suitability_score || {};
  const dataSource = step2Result?.data_source || multiples?.comparables_quality || 'estimated';
  
  // Render performance logging
  useEffect(() => {
    const renderTime = renderPerfLogger.current.end({
      step: 2,
      hasStepData: !!step2Data,
      hasStepResult: !!step2Result,
      isPrimaryEBITDA,
      methodologyDecision
    });
    
    stepLogger.debug('JourneyStep2_Benchmarking rendered', {
      step: 2,
      renderTime: Math.round(renderTime * 100) / 100
    });
    
    renderPerfLogger.current = createPerformanceLogger('JourneyStep2_Benchmarking.render', 'step');
  });
  
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
              {step2Result?.primary_method_reason || 
               multiples?.primary_multiple_reason || 
               multiples?.primary_method_reason ||
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
                      {multiples.p25_revenue_multiple?.toFixed(2) ?? 'N/A'}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">P50 (Median):</span>
                    <span className="font-mono font-bold text-green-700">
                      {multiples.p50_revenue_multiple?.toFixed(2) ?? multiples.revenue_multiple?.toFixed(2) ?? 'N/A'}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">P75 (High):</span>
                    <span className="font-mono font-semibold">
                      {multiples.p75_revenue_multiple?.toFixed(2) ?? 'N/A'}x
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

        {/* SME Calibration Notice (NEW) */}
        {step2Result?.sme_calibration?.applied && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              📊 SME Multiple Calibration Applied
            </h4>
            <p className="text-sm text-blue-800 mb-3">
              Database multiples are biased toward larger companies (€50M+ revenue). 
              For SMEs, McKinsey standards require systematic calibration to avoid overvaluation.
            </p>
            
            {step2Result.sme_calibration.ebitda_multiple && step2Result.sme_calibration.ebitda_multiple.calibrated && (
              <div className="bg-white rounded p-3 mb-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 font-semibold">EBITDA Multiple:</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Database (Raw):</span>
                    <span className="font-mono font-semibold text-gray-400 line-through">
                      {step2Result.sme_calibration.ebitda_multiple.raw?.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Calibration Factor:</span>
                    <span className="font-mono font-semibold text-blue-700">
                      {(step2Result.sme_calibration.ebitda_multiple.calibration_factor * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                    <span className="text-gray-900 font-semibold">SME Baseline:</span>
                    <span className="font-mono font-bold text-blue-900 text-lg">
                      {step2Result.sme_calibration.ebitda_multiple.calibrated.toFixed(2)}x
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            {step2Result.sme_calibration.revenue_multiple && step2Result.sme_calibration.revenue_multiple.calibrated && (
              <div className="bg-white rounded p-3">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600 font-semibold">Revenue Multiple:</span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Database (Raw):</span>
                    <span className="font-mono font-semibold text-gray-400 line-through">
                      {step2Result.sme_calibration.revenue_multiple.raw?.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Calibration Factor:</span>
                    <span className="font-mono font-semibold text-blue-700">
                      {(step2Result.sme_calibration.revenue_multiple.calibration_factor * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between border-t border-gray-200 pt-1 mt-1">
                    <span className="text-gray-900 font-semibold">SME Baseline:</span>
                    <span className="font-mono font-bold text-blue-900 text-lg">
                      {step2Result.sme_calibration.revenue_multiple.calibrated.toFixed(2)}x
                    </span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="mt-3 text-xs text-blue-700">
              <p><strong>Revenue:</strong> €{(step2Result.sme_calibration.revenue || 0).toLocaleString()}</p>
              {step2Result.sme_calibration.calibration_tier && (
                <p><strong>Tier:</strong> {step2Result.sme_calibration.calibration_tier}</p>
              )}
              {step2Result.sme_calibration.ebitda_multiple?.explanation && (
                <p className="mt-1"><strong>Rationale:</strong> {step2Result.sme_calibration.ebitda_multiple.explanation}</p>
              )}
            </div>
          </div>
        )}

        {/* Step Metadata */}
        {step2Data && (
          <StepMetadata
            stepData={step2Data}
            stepNumber={2}
            dataSource={dataSource === 'fmp_api' || dataSource === 'cache' ? 'real' : 'estimated'}
            calibrationType={step2Result?.calibration_type || null}
          />
        )}

        {/* Methodology Decision */}
        {methodologyDecision && (
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <h4 className="font-semibold text-purple-900 mb-2">Methodology Decision</h4>
            <p className="text-sm text-purple-800">
              <strong>Selected:</strong> {methodologyDecision.replace(/_/g, ' ')}
            </p>
            {Object.keys(suitabilityScore).length > 0 && (
              <div className="mt-2 text-xs text-purple-700">
                <strong>Suitability Score Breakdown:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {Object.entries(suitabilityScore).map(([key, value]: [string, any]) => (
                    <li key={key}>
                      {key.replace(/_/g, ' ')}: {typeof value === 'number' ? value.toFixed(1) : value}
                    </li>
                  ))}
                </ul>
              </div>
            )}
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

