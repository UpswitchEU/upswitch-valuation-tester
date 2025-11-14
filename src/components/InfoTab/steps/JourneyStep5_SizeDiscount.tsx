import React, { useEffect, useRef } from 'react';
import { Ruler } from 'lucide-react';
import { StepCard } from '../shared/StepCard';
import { StepMetadata } from '../../shared/StepMetadata';
import { FormulaBox } from '../shared/FormulaBox';
import { BeforeAfterTable } from '../shared/BeforeAfterTable';
import { getStepData } from '../../../utils/valuationDataExtractor';
import { getStepResultData } from '../../../utils/stepDataMapper';
import type { ValuationResponse } from '../../../types/valuation';
import { stepLogger, createPerformanceLogger } from '../../../utils/logger';

interface JourneyStep5Props {
  result: ValuationResponse;
  beforeValues: { low: number; mid: number; high: number };
}

const formatCurrency = (value: number): string => `€${Math.round(value).toLocaleString()}`;

export const JourneyStep5_SizeDiscount: React.FC<JourneyStep5Props> = ({ result, beforeValues }) => {
  const renderPerfLogger = useRef(createPerformanceLogger('JourneyStep5_SizeDiscount.render', 'step'));
  
  // Component mount logging
  useEffect(() => {
    const step5Data = getStepData(result, 5);
    const step5Result = getStepResultData(result, 5);
    
    stepLogger.info('JourneyStep5_SizeDiscount mounted', {
      component: 'JourneyStep5_SizeDiscount',
      step: 5,
      hasStepData: !!step5Data,
      hasStepResult: !!step5Result,
      valuationId: result.valuation_id
    });
    
    return () => {
      stepLogger.debug('JourneyStep5_SizeDiscount unmounting', { step: 5 });
    };
  }, [result.valuation_id]);
  
  // Extract backend step data
  const step5Data = getStepData(result, 5);
  const step5Result = getStepResultData(result, 5);
  
  const sizeDiscount = result.multiples_valuation?.size_discount || 0;
  const revenue = result.current_year_data?.revenue || 0;
  
  // Extract backend-specific data
  // Note: revenueTier, baseDiscount, and soleTraderAdjustment available in step5Result for future use
  
  // Render performance logging
  useEffect(() => {
    const renderTime = renderPerfLogger.current.end({
      step: 5,
      hasStepData: !!step5Data,
      hasStepResult: !!step5Result,
      sizeDiscount
    });
    
    stepLogger.debug('JourneyStep5_SizeDiscount rendered', {
      step: 5,
      renderTime: Math.round(renderTime * 100) / 100
    });
    
    renderPerfLogger.current = createPerformanceLogger('JourneyStep5_SizeDiscount.render', 'step');
  });
  
  const afterValues = {
    low: beforeValues.low * (1 + sizeDiscount),
    mid: beforeValues.mid * (1 + sizeDiscount),
    high: beforeValues.high * (1 + sizeDiscount)
  };

  // Determine size category
  let sizeCategory = 'Unknown';
  let explanation = '';
  if (revenue < 1_000_000) {
    sizeCategory = 'Micro (<€1M)';
    explanation = 'Very small companies face higher risk, lower liquidity, and limited market access';
  } else if (revenue < 5_000_000) {
    sizeCategory = 'Small (€1M-€5M)';
    explanation = 'Small companies have moderate risk premium compared to mid-market firms';
  } else if (revenue < 25_000_000) {
    sizeCategory = 'Medium (€5M-€25M)';
    explanation = 'Mid-market companies receive smaller size discounts';
  } else {
    sizeCategory = 'Large (>€25M)';
    explanation = 'Larger companies typically receive minimal or no size discount';
  }

  return (
    <StepCard
      id="step-5-size"
      stepNumber={5}
      title="Size Discount Application"
      subtitle={`${sizeCategory} - ${(sizeDiscount * 100).toFixed(0)}% Adjustment`}
      icon={<Ruler className="w-5 h-5" />}
      color="orange"
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* Step Metadata */}
        {step5Data && (
          <StepMetadata
            stepData={step5Data}
            stepNumber={5}
            showExecutionTime={true}
            showStatus={true}
          />
        )}

        {/* Formula */}
        <FormulaBox
          formula="Enterprise Value × (1 + Size Discount)"
          description="Small company premium reflects higher risk and lower liquidity"
        />

        {/* Size Analysis */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Company Size Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <span className="text-sm text-gray-600">Annual Revenue</span>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(revenue)}</p>
            </div>
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4">
              <span className="text-sm text-gray-600">Size Category</span>
              <p className="text-xl font-bold text-orange-700 mt-1">{sizeCategory}</p>
            </div>
          </div>
        </div>

        {/* Discount Breakdown */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Why This Discount?</h4>
          <p className="text-sm text-gray-700 mb-3">{explanation}</p>
          <div className="bg-white border border-gray-200 rounded p-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Size Discount Applied</span>
              <span className="text-2xl font-bold text-orange-600">{(sizeDiscount * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Calculation */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Calculation</h4>
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 space-y-2 font-mono text-sm">
            <div>Formula: Previous Value × (1 + {(sizeDiscount * 100).toFixed(0)}%)</div>
            <div>Example (Mid): {formatCurrency(beforeValues.mid)} × {(1 + sizeDiscount).toFixed(3)} = {formatCurrency(afterValues.mid)}</div>
          </div>
        </div>

        {/* Multiple Adjustment (NEW: Multiple-First Discounting) */}
        {step5Result?.multiple_before_mid && step5Result?.multiple_after_mid && (
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <h4 className="text-sm font-semibold text-purple-900 mb-2">Multiple Adjustment</h4>
            <div className="space-y-2 text-sm text-purple-800">
              <div className="flex justify-between">
                <span>Multiple Before:</span>
                <span className="font-semibold">{step5Result.multiple_before_mid.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between">
                <span>Discount Applied:</span>
                <span className="font-semibold text-red-600">{(sizeDiscount * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between border-t border-purple-200 pt-2">
                <span>Multiple After:</span>
                <span className="font-bold text-lg">{step5Result.multiple_after_mid.toFixed(2)}x</span>
              </div>
            </div>
            <p className="text-xs text-purple-700 mt-2">
              Discount applied to the multiple itself, not just the final price. This ensures transparent traceability of valuation adjustments.
            </p>
          </div>
        )}

        {/* Before/After Comparison */}
        <BeforeAfterTable
          before={beforeValues}
          after={afterValues}
          adjustmentLabel="Size Discount"
          adjustmentPercent={sizeDiscount}
        />

        {/* Academic Source */}
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
          <p className="text-sm text-orange-900">
            <strong>Academic Source:</strong> The size premium is well-documented in academic literature. 
            Smaller companies historically generate lower returns and face higher failure rates 
            (Fama-French, 1992; Damodaran, 2012; Ibbotson SBBI Yearbook).
          </p>
        </div>
      </div>
    </StepCard>
  );
};

