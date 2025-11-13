import React, { useEffect, useRef } from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { StepCard } from '../shared/StepCard';
import { StepMetadata } from '../../shared/StepMetadata';
import { FormulaBox } from '../shared/FormulaBox';
import { ValueGrid } from '../shared/ValueGrid';
import { getStepData } from '../../../utils/valuationDataExtractor';
import { getStepResultData } from '../../../utils/stepDataMapper';
import type { ValuationResponse } from '../../../types/valuation';
import { stepLogger, createPerformanceLogger } from '../../../utils/logger';

interface JourneyStep3Props {
  result: ValuationResponse;
}

const formatCurrency = (value: number): string => `€${Math.round(value).toLocaleString()}`;

export const JourneyStep3_BaseEV: React.FC<JourneyStep3Props> = ({ result }) => {
  const renderPerfLogger = useRef(createPerformanceLogger('JourneyStep3_BaseEV.render', 'step'));
  
  // Component mount logging
  useEffect(() => {
    const step3Data = getStepData(result, 3);
    const step3Result = getStepResultData(result, 3);
    
    stepLogger.info('JourneyStep3_BaseEV mounted', {
      component: 'JourneyStep3_BaseEV',
      step: 3,
      hasStepData: !!step3Data,
      hasStepResult: !!step3Result,
      hasMultiples: !!result.multiples_valuation,
      hasCurrentData: !!result.current_year_data,
      valuationId: result.valuation_id
    });
    
    return () => {
      stepLogger.debug('JourneyStep3_BaseEV unmounting', { step: 3 });
    };
  }, [result.valuation_id]);
  
  // Extract backend step data
  const step3Data = getStepData(result, 3);
  const step3Result = getStepResultData(result, 3);
  
  const multiples = result.multiples_valuation;
  const currentData = result.current_year_data;
  
  if (!multiples || !currentData) {
    stepLogger.warn('JourneyStep3_BaseEV missing required data', {
      step: 3,
      hasMultiples: !!multiples,
      hasCurrentData: !!currentData
    });
    return null;
  }

  // CRITICAL FIX: Use extracted step3Result values instead of recomputing
  // This ensures consistency with the fixed primary method detection in stepDataMapper.ts
  const isPrimaryEBITDA = step3Result?.metric_used === 'EBITDA' || step3Result?.primary_method === 'EV/EBITDA' || multiples.primary_multiple_method === 'ebitda_multiple';
  const autoCorrection = step3Result?.auto_corrected || false;
  
  // Render performance logging
  useEffect(() => {
    const renderTime = renderPerfLogger.current.end({
      step: 3,
      hasStepData: !!step3Data,
      hasStepResult: !!step3Result,
      isPrimaryEBITDA,
      autoCorrection
    });
    
    stepLogger.debug('JourneyStep3_BaseEV rendered', {
      step: 3,
      renderTime: Math.round(renderTime * 100) / 100
    });
    
    // Reset for next render
    renderPerfLogger.current = createPerformanceLogger('JourneyStep3_BaseEV.render', 'step');
  });
  
  // CRITICAL FIX: Use values from step3Result if available (from fixed extraction function)
  // Only recompute if step3Result is not available (fallback)
  const baseEV_low = step3Result?.enterprise_value_low ?? (() => {
    // Fallback computation (should rarely be needed)
    const baseMultiple_mid = isPrimaryEBITDA 
      ? (multiples.unadjusted_ebitda_multiple || multiples.ebitda_multiple)
      : (multiples.unadjusted_revenue_multiple || multiples.revenue_multiple);
    const baseMultiple_low = isPrimaryEBITDA
      ? (multiples.p25_ebitda_multiple || baseMultiple_mid * 0.8)
      : (multiples.p25_revenue_multiple || baseMultiple_mid * 0.8);
    const primaryMetric = isPrimaryEBITDA ? currentData.ebitda : currentData.revenue;
    return primaryMetric * baseMultiple_low;
  })();
  
  const baseEV_mid = step3Result?.enterprise_value_mid ?? (() => {
    // Fallback computation (should rarely be needed)
    const baseMultiple_mid = isPrimaryEBITDA 
      ? (multiples.unadjusted_ebitda_multiple || multiples.ebitda_multiple)
      : (multiples.unadjusted_revenue_multiple || multiples.revenue_multiple);
    const primaryMetric = isPrimaryEBITDA ? currentData.ebitda : currentData.revenue;
    return primaryMetric * baseMultiple_mid;
  })();
  
  const baseEV_high = step3Result?.enterprise_value_high ?? (() => {
    // Fallback computation (should rarely be needed)
    const baseMultiple_mid = isPrimaryEBITDA 
      ? (multiples.unadjusted_ebitda_multiple || multiples.ebitda_multiple)
      : (multiples.unadjusted_revenue_multiple || multiples.revenue_multiple);
    const baseMultiple_high = isPrimaryEBITDA
      ? (multiples.p75_ebitda_multiple || baseMultiple_mid * 1.2)
      : (multiples.p75_revenue_multiple || baseMultiple_mid * 1.2);
    const primaryMetric = isPrimaryEBITDA ? currentData.ebitda : currentData.revenue;
    return primaryMetric * baseMultiple_high;
  })();
  
  // Extract metric info from step3Result if available
  const metricName = step3Result?.metric_used || (isPrimaryEBITDA ? 'EBITDA' : 'Revenue');
  const baseMultiple_mid = step3Result?.multiple_mid ?? (isPrimaryEBITDA 
    ? (multiples.unadjusted_ebitda_multiple || multiples.ebitda_multiple)
    : (multiples.unadjusted_revenue_multiple || multiples.revenue_multiple));
  const baseMultiple_low = step3Result?.multiple_low ?? (isPrimaryEBITDA
    ? (multiples.p25_ebitda_multiple || baseMultiple_mid * 0.8)
    : (multiples.p25_revenue_multiple || baseMultiple_mid * 0.8));
  const baseMultiple_high = step3Result?.multiple_high ?? (isPrimaryEBITDA
    ? (multiples.p75_ebitda_multiple || baseMultiple_mid * 1.2)
    : (multiples.p75_revenue_multiple || baseMultiple_mid * 1.2));
  const primaryMetric = step3Result?.metric_value ?? (isPrimaryEBITDA ? currentData.ebitda : currentData.revenue);

  return (
    <StepCard
      id="step-3-base-ev"
      stepNumber={3}
      title="Base Enterprise Value Calculation"
      subtitle="Unadjusted enterprise value before risk adjustments"
      icon={<TrendingUp className="w-5 h-5" />}
      color="purple"
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* Step Metadata */}
        {step3Data && (
          <StepMetadata
            stepData={step3Data}
            stepNumber={3}
            showExecutionTime={true}
            showStatus={true}
          />
        )}

        {/* Auto-Correction Notice */}
        {autoCorrection && (
          <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <h4 className="font-semibold text-yellow-900">Range Auto-Corrected</h4>
            </div>
            <p className="text-sm text-yellow-800">
              The calculated valuation range was inverted or invalid and has been auto-corrected 
              to ensure low ≤ mid ≤ high. This may occur due to extreme multiples or negative values.
            </p>
          </div>
        )}

        {/* Formula */}
        <FormulaBox
          formula={`${metricName} × ${metricName} Multiple = Enterprise Value`}
          description="This is the base enterprise value before any adjustments for size, liquidity, or owner concentration"
        />

        {/* Inputs */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Calculation Inputs</h4>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-gray-600">{metricName}</span>
              <span className="text-base font-bold text-gray-900">{formatCurrency(primaryMetric)}</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-gray-600">Low Multiple (P25)</span>
              <span className="text-base font-bold text-gray-900">{baseMultiple_low.toFixed(2)}x</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-purple-50">
              <span className="text-sm text-purple-700 font-semibold">Mid Multiple (P50 / Median)</span>
              <span className="text-base font-bold text-purple-700">{baseMultiple_mid.toFixed(2)}x</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-gray-600">High Multiple (P75)</span>
              <span className="text-base font-bold text-gray-900">{baseMultiple_high.toFixed(2)}x</span>
            </div>
          </div>
        </div>

        {/* Calculation Steps */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Calculation</h4>
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 space-y-2 font-mono text-sm">
            <div>Low: {formatCurrency(primaryMetric)} × {baseMultiple_low.toFixed(2)}x = <strong>{formatCurrency(baseEV_low)}</strong></div>
            <div className="text-purple-700 font-semibold">
              Mid: {formatCurrency(primaryMetric)} × {baseMultiple_mid.toFixed(2)}x = <strong>{formatCurrency(baseEV_mid)}</strong>
            </div>
            <div>High: {formatCurrency(primaryMetric)} × {baseMultiple_high.toFixed(2)}x = <strong>{formatCurrency(baseEV_high)}</strong></div>
          </div>
        </div>

        {/* Results */}
        <ValueGrid
          low={baseEV_low}
          mid={baseEV_mid}
          high={baseEV_high}
          label="Base Enterprise Value (Before Adjustments)"
          highlightMid={true}
        />

        {/* Note */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded">
          <p className="text-sm text-yellow-900">
            <strong>Important:</strong> This is the <strong>unadjusted</strong> enterprise value. 
            In the following steps, we'll apply adjustments for owner concentration, company size, and liquidity to arrive at the final equity value.
          </p>
        </div>
      </div>
    </StepCard>
  );
};

