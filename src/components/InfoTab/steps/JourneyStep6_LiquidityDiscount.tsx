import React, { useEffect, useRef } from 'react';
import { Droplets } from 'lucide-react';
import { StepCard } from '../shared/StepCard';
import { StepMetadata } from '../../shared/StepMetadata';
import { FormulaBox } from '../shared/FormulaBox';
import { BeforeAfterTable } from '../shared/BeforeAfterTable';
import { DiscountBreakdownAccordion } from '../shared/DiscountBreakdownAccordion';
import { getStepData } from '../../../utils/valuationDataExtractor';
import { getStepResultData } from '../../../utils/stepDataMapper';
import type { ValuationResponse } from '../../../types/valuation';
import { normalizeMarginFormat } from '../../Results/utils/valuationCalculations';
import { stepLogger, createPerformanceLogger } from '../../../utils/logger';

interface JourneyStep6Props {
  result: ValuationResponse;
  beforeValues: { low: number; mid: number; high: number };
}

const formatCurrency = (value: number): string => `€${Math.round(value).toLocaleString()}`;

export const JourneyStep6_LiquidityDiscount: React.FC<JourneyStep6Props> = ({ result, beforeValues }) => {
  const renderPerfLogger = useRef(createPerformanceLogger('JourneyStep6_LiquidityDiscount.render', 'step'));
  
  // Component mount logging
  useEffect(() => {
    const step6Data = getStepData(result, 6);
    const step6Result = getStepResultData(result, 6);
    
    stepLogger.info('JourneyStep6_LiquidityDiscount mounted', {
      component: 'JourneyStep6_LiquidityDiscount',
      step: 6,
      hasStepData: !!step6Data,
      hasStepResult: !!step6Result,
      valuationId: result.valuation_id
    });
    
    return () => {
      stepLogger.debug('JourneyStep6_LiquidityDiscount unmounting', { step: 6 });
    };
  }, [result.valuation_id]);
  
  // Extract backend step data
  const step6Data = getStepData(result, 6);
  const step6Result = getStepResultData(result, 6);
  
  const liquidityDiscount = result.multiples_valuation?.liquidity_discount || 0;
  // Normalize margin format (handles both decimal 0-1 and percentage 0-100 from backend)
  const ebitdaMarginRaw = result.financial_metrics?.ebitda_margin;
  const ebitdaMargin = normalizeMarginFormat(ebitdaMarginRaw) || 0;
  
  // Render performance logging
  useEffect(() => {
    const renderTime = renderPerfLogger.current.end({
      step: 6,
      hasStepData: !!step6Data,
      hasStepResult: !!step6Result,
      liquidityDiscount
    });
    
    stepLogger.debug('JourneyStep6_LiquidityDiscount rendered', {
      step: 6,
      renderTime: Math.round(renderTime * 100) / 100
    });
    
    renderPerfLogger.current = createPerformanceLogger('JourneyStep6_LiquidityDiscount.render', 'step');
  });
  
  const afterValues = {
    low: beforeValues.low * (1 + liquidityDiscount),
    mid: beforeValues.mid * (1 + liquidityDiscount),
    high: beforeValues.high * (1 + liquidityDiscount)
  };

  // Calculate components
  const baseLiquidityDiscount = -0.15; // Typical base for private companies
  const marginBonus = liquidityDiscount - baseLiquidityDiscount;

  return (
    <StepCard
      id="step-6-liquidity"
      stepNumber={6}
      title="Liquidity Discount Application"
      subtitle={`Private Company Illiquidity - ${(liquidityDiscount * 100).toFixed(0)}% Adjustment`}
      icon={<Droplets className="w-5 h-5" />}
      color="orange"
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* Step Metadata */}
        {step6Data && (
          <StepMetadata
            stepData={step6Data}
            stepNumber={6}
            showExecutionTime={true}
            showStatus={true}
          />
        )}

        {/* Formula */}
        <FormulaBox
          formula="Value × (1 + Liquidity Discount)"
          description="Private companies are less liquid than public markets, requiring a discount"
        />

        {/* Discount Breakdown */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Liquidity Discount Components</h4>
          <div className="space-y-3">
            <div className="bg-red-50 border border-red-300 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Base Private Company Discount</span>
                <span className="text-lg font-bold text-red-600">{(baseLiquidityDiscount * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">Standard discount for private company shares</p>
            </div>

            <div className="bg-green-50 border border-green-300 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">EBITDA Margin Bonus</span>
                <span className="text-lg font-bold text-green-600">+{(marginBonus * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Current margin: {(ebitdaMargin * 100).toFixed(1)}% - Higher profitability reduces illiquidity risk
              </p>
            </div>

            <div className="bg-orange-50 border-2 border-orange-500 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Liquidity Discount</span>
                <span className="text-2xl font-bold text-orange-600">{(liquidityDiscount * 100).toFixed(0)}%</span>
              </div>
              <p className="text-xs text-gray-600 mt-2 font-mono">
                {(baseLiquidityDiscount * 100).toFixed(0)}% + {(marginBonus * 100).toFixed(0)}% = {(liquidityDiscount * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        {/* Calculation */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Calculation</h4>
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 space-y-2 font-mono text-sm">
            <div>Formula: Previous Value × (1 + {(liquidityDiscount * 100).toFixed(0)}%)</div>
            <div>Example (Mid): {formatCurrency(beforeValues.mid)} × {(1 + liquidityDiscount).toFixed(3)} = {formatCurrency(afterValues.mid)}</div>
          </div>
        </div>

        {/* Multiple Adjustment (NEW: Multiple-First Discounting) */}
        {step6Result?.multiple_before_mid && step6Result?.multiple_after_mid && (
          <div className="bg-purple-50 border-l-4 border-purple-500 p-4 rounded">
            <h4 className="text-sm font-semibold text-purple-900 mb-2">Multiple Adjustment</h4>
            <div className="space-y-2 text-sm text-purple-800">
              <div className="flex justify-between">
                <span>Multiple Before:</span>
                <span className="font-semibold">{step6Result.multiple_before_mid.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between">
                <span>Discount Applied:</span>
                <span className="font-semibold text-red-600">{(liquidityDiscount * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between border-t border-purple-200 pt-2">
                <span>Multiple After:</span>
                <span className="font-bold text-lg">{step6Result.multiple_after_mid.toFixed(2)}x</span>
              </div>
            </div>
            <p className="text-xs text-purple-700 mt-2">
              Discount applied to the multiple itself, not just the final price. This ensures transparent traceability of valuation adjustments.
            </p>
          </div>
        )}

        {/* SME Calibration Interaction Notice (NEW - Phase 2 Recalibration) */}
        {step6Result?.sme_calibration_interaction?.sme_calibration_applied && (
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded mt-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              🚫 Step 6 REMOVED for SME (&lt;€5M Revenue)
            </h4>
            <p className="text-sm text-blue-800 mb-2">
              Liquidity discount completely removed for SME valuations to eliminate triple-counting. 
              Illiquidity is <strong>fully captured</strong> in earlier steps:
            </p>
            
            <div className="bg-white rounded p-3 mb-2">
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Step 2:</strong> Baseline market liquidity (18-20%)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-600 mr-2">✓</span>
                  <span><strong>Step 4:</strong> SOLE_TRADER tier includes incremental illiquidity (5-10%)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-red-600 mr-2">✗</span>
                  <span className="line-through"><strong>Step 6:</strong> Would triple-count illiquidity</span>
                </div>
              </div>
            </div>
            
            <p className="text-xs text-blue-700 mt-2">
              <strong>Academic Standard:</strong> {step6Result.sme_calibration_interaction.adjustment_rationale}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              <strong>References:</strong> {step6Result.sme_calibration_interaction.academic_reference}
            </p>
          </div>
        )}

        {/* Show "Step Skipped" message when discount is 0 */}
        {step6Result?.liquidity_discount_percentage === 0 && step6Result?.sme_calibration_interaction?.sme_calibration_applied && (
          <div className="text-center py-8 bg-gray-50 rounded">
            <p className="text-lg font-semibold text-gray-700">Step 6: Liquidity Discount = 0%</p>
            <p className="text-sm text-gray-600 mt-2">Illiquidity fully captured in Steps 2 + 4</p>
          </div>
        )}

        {/* Discount Breakdown with Academic Sources (McKinsey-level transparency) */}
        {step6Result?.pipeline_stage?.discount_breakdown && (
          <DiscountBreakdownAccordion
            breakdown={step6Result.pipeline_stage.discount_breakdown}
            stepNumber={6}
            stepName="Liquidity Discount"
          />
        )}

        {/* Before/After Comparison */}
        <BeforeAfterTable
          before={beforeValues}
          after={afterValues}
          adjustmentLabel="Liquidity Discount"
          adjustmentPercent={liquidityDiscount}
        />

        {/* Explanation */}
        <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <h4 className="font-semibold text-gray-900 mb-2">Why Liquidity Matters</h4>
          <ul className="text-sm text-gray-700 space-y-2 list-disc list-inside">
            <li>Private company shares cannot be easily sold like public stock</li>
            <li>Limited buyer pool and longer transaction times</li>
            <li>Higher profitability makes companies more attractive, reducing discount</li>
            <li>Typical range: -10% to -25% depending on company characteristics</li>
          </ul>
        </div>

        {/* Academic Source */}
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
          <p className="text-sm text-orange-900">
            <strong>Academic Sources:</strong> Illiquidity discounts for private companies range from 10-35% 
            (Damodaran, 2005; Koeplin, Sarin & Shapiro, 2000). Higher quality companies command smaller discounts.
          </p>
        </div>
      </div>
    </StepCard>
  );
};

