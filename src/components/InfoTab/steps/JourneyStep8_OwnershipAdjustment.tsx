import { Percent } from 'lucide-react';
import React, { useEffect, useRef } from 'react';
import type { ValuationResponse } from '../../../types/valuation';
import { normalizeCalculationSteps } from '../../../utils/calculationStepsNormalizer';
import { getStepResultData } from '../../../utils/stepDataMapper';
import { getStepData } from '../../../utils/valuationDataExtractor';
import { StepMetadata } from '../../shared/StepMetadata';
import { BeforeAfterTable } from '../shared/BeforeAfterTable';
import { FormulaBox } from '../shared/FormulaBox';
import { StepCard } from '../shared/StepCard';
import { ValueGrid } from '../shared/ValueGrid';
import { stepLogger, createPerformanceLogger } from '../../../utils/logger';

interface JourneyStep8Props {
  result: ValuationResponse;
  beforeValues: { low: number; mid: number; high: number };
}

const formatCurrency = (value: number): string => `€${Math.round(value).toLocaleString()}`;

export const JourneyStep8_OwnershipAdjustment: React.FC<JourneyStep8Props> = ({ result, beforeValues }) => {
  const renderPerfLogger = useRef(createPerformanceLogger('JourneyStep8_OwnershipAdjustment.render', 'step'));
  
  // Component mount logging
  useEffect(() => {
    const step8Data = getStepData(result, 8);
    const step8Result = getStepResultData(result, 8);
    
    stepLogger.info('JourneyStep8_OwnershipAdjustment mounted', {
      component: 'JourneyStep8_OwnershipAdjustment',
      step: 8,
      hasStepData: !!step8Data,
      hasStepResult: !!step8Result,
      valuationId: result.valuation_id
    });
    
    return () => {
      stepLogger.debug('JourneyStep8_OwnershipAdjustment unmounting', { step: 8 });
    };
  }, [result.valuation_id]);
  
  // Extract backend step data (using new utilities)
  const step8Data = getStepData(result, 8);
  const step8Result = getStepResultData(result, 8);
  
  // Extract ownership adjustment data with fallback to old logic
  const normalizedSteps = result.transparency?.calculation_steps 
    ? normalizeCalculationSteps(result.transparency.calculation_steps)
    : [];
  const sharesForSale = step8Result?.shares_for_sale || step8Result?.ownership_percentage || 
                        normalizedSteps.find((step: any) => step.step_number === 8)?.outputs?.ownership_percentage || 100;
  const ownershipPercentage = sharesForSale / 100.0;
  
  const adjustmentType = step8Result?.adjustment_type || 'none';
  const adjustmentPercentage = step8Result?.adjustment_percentage || 0;
  
  // Render performance logging
  useEffect(() => {
    const renderTime = renderPerfLogger.current.end({
      step: 8,
      hasStepData: !!step8Data,
      hasStepResult: !!step8Result,
      ownershipPercentage,
      adjustmentType
    });
    
    stepLogger.debug('JourneyStep8_OwnershipAdjustment rendered', {
      step: 8,
      renderTime: Math.round(renderTime * 100) / 100
    });
    
    renderPerfLogger.current = createPerformanceLogger('JourneyStep8_OwnershipAdjustment.render', 'step');
  });
  const calibrationType = step8Result?.calibration_type;
  const adjustmentFactor = 1.0 + (adjustmentPercentage / 100.0);
  
  // Calculate adjusted equity values
  const afterValues = {
    low: beforeValues.low * ownershipPercentage * adjustmentFactor,
    mid: beforeValues.mid * ownershipPercentage * adjustmentFactor,
    high: beforeValues.high * ownershipPercentage * adjustmentFactor
  };
  
  // Determine adjustment label and color
  let adjustmentLabel = 'Ownership Adjustment';
  let adjustmentColor = 'blue';
  const hasNoAdjustment = sharesForSale === 100 && adjustmentPercentage === 0;
  
  if (adjustmentType === 'control_premium') {
    adjustmentLabel = 'Control Premium';
    adjustmentColor = 'green';
  } else if (adjustmentType === 'minority_discount') {
    adjustmentLabel = 'Minority Discount';
    adjustmentColor = 'red';
  } else if (adjustmentType === 'deadlock_discount') {
    adjustmentLabel = 'Deadlock Risk Discount';
    adjustmentColor = 'orange';
  } else if (hasNoAdjustment) {
    adjustmentLabel = 'No Adjustment';
    adjustmentColor = 'gray';
  }
  
  return (
    <StepCard
      id="step-8-ownership"
      stepNumber={8}
      title="Ownership Adjustment"
      subtitle={hasNoAdjustment ? `No adjustment (100% ownership sale)` : `${adjustmentLabel} - ${sharesForSale}% Ownership`}
      icon={<Percent className="w-5 h-5" />}
      color={adjustmentColor as any}
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* Step Metadata */}
        {step8Data && (
          <StepMetadata
            stepData={step8Data}
            stepNumber={8}
            showExecutionTime={true}
            showStatus={true}
            calibrationType={calibrationType}
          />
        )}

        {/* No Adjustment Message */}
        {hasNoAdjustment && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-blue-800">No Adjustment Applied</h4>
                <p className="mt-1 text-sm text-blue-700">
                  Since this is a 100% ownership sale, no control premium or minority discount is applied. 
                  The equity value remains unchanged from Step 7.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formula */}
        <FormulaBox
          formula="Adjusted Equity = Equity × Ownership % × (1 + Adjustment)"
          description="Ownership percentage and control/minority adjustments applied to equity value"
        />
        
        {/* Ownership Details */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Ownership Details</h4>
          <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-200">
            <div className="flex justify-between items-center px-4 py-3">
              <span className="text-sm text-gray-600">Shares for Sale</span>
              <span className="text-base font-bold text-gray-900">{sharesForSale}%</span>
            </div>
            <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
              <span className="text-sm text-gray-600">Ownership Multiplier</span>
              <span className="text-base font-semibold text-gray-900">{ownershipPercentage.toFixed(2)}x</span>
            </div>
            {adjustmentPercentage !== 0 && (
              <>
                <div className="flex justify-between items-center px-4 py-3">
                  <span className="text-sm text-gray-600">Adjustment Type</span>
                  <span className="text-base font-semibold text-gray-900 capitalize">{adjustmentType.replace('_', ' ')}</span>
                </div>
                <div className={`flex justify-between items-center px-4 py-3 ${adjustmentPercentage > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                  <span className="text-sm font-semibold text-gray-900">Adjustment Percentage</span>
                  <span className={`text-xl font-bold ${adjustmentPercentage > 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {adjustmentPercentage > 0 ? '+' : ''}{adjustmentPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between items-center px-4 py-3 bg-gray-50">
                  <span className="text-sm text-gray-600">Adjustment Factor</span>
                  <span className="text-base font-semibold text-gray-900">{adjustmentFactor.toFixed(4)}x</span>
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* Calculation */}
        {!hasNoAdjustment && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Calculation</h4>
            <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 space-y-2 font-mono text-sm">
              <div>
                Low: {formatCurrency(beforeValues.low)} × {ownershipPercentage.toFixed(2)} × {adjustmentFactor.toFixed(4)} = <strong>{formatCurrency(afterValues.low)}</strong>
              </div>
              <div className="text-blue-700 font-semibold">
                Mid: {formatCurrency(beforeValues.mid)} × {ownershipPercentage.toFixed(2)} × {adjustmentFactor.toFixed(4)} = <strong>{formatCurrency(afterValues.mid)}</strong>
              </div>
              <div>
                High: {formatCurrency(beforeValues.high)} × {ownershipPercentage.toFixed(2)} × {adjustmentFactor.toFixed(4)} = <strong>{formatCurrency(afterValues.high)}</strong>
              </div>
            </div>
          </div>
        )}
        
        {/* Before/After Comparison */}
        {!hasNoAdjustment && (
          <BeforeAfterTable
            before={beforeValues}
            after={afterValues}
            adjustmentLabel={adjustmentLabel}
            adjustmentPercent={adjustmentPercentage / 100.0}
          />
        )}
        
        {/* Results */}
        <ValueGrid
          low={afterValues.low}
          mid={afterValues.mid}
          high={afterValues.high}
          label={hasNoAdjustment ? "Equity Value (Unchanged)" : "Ownership-Adjusted Equity Value"}
          highlightMid={true}
        />
        
        {/* Explanation */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Understanding Ownership Adjustments</h4>
          <div className="text-sm text-gray-700 space-y-2">
            <p>
              <strong>Control Premium:</strong> Applied for majority stakes (&gt;50%) to reflect the value of operational control and strategic decision-making ability.
            </p>
            <p>
              <strong>Minority Discount:</strong> Applied for minority stakes (&lt;50%) to reflect limited control and influence over company decisions.
            </p>
            <p>
              <strong>Deadlock Risk:</strong> Applied for 50% ownership to reflect the risk of decision-making deadlocks.
            </p>
            <p className="pt-2 border-t border-gray-200">
              <strong>Standards:</strong> Based on McKinsey Valuation (2015) and Bain Private Equity Guide (2020) methodologies.
            </p>
          </div>
        </div>
        
        {/* Academic Source */}
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
          <p className="text-sm text-blue-900">
            <strong>Academic Sources:</strong> Control premiums typically range from 10-30% for majority stakes, 
            while minority discounts range from 15-30% for &lt;50% stakes (McKinsey Valuation, 2015; Mergerstat Review, 2020; 
            Pratt &amp; Niculita, 2008).
          </p>
        </div>
      </div>
    </StepCard>
  );
};

