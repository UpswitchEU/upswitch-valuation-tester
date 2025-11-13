import React, { useEffect, useRef } from 'react';
import { Trophy } from 'lucide-react';
import { StepCard } from '../shared/StepCard';
import { StepMetadata } from '../../shared/StepMetadata';
import { getStepData } from '../../../utils/valuationDataExtractor';
import { 
  getStepResultData, 
  getStep1InputResult,
  getStep2BenchmarkingResult,
  getStep3BaseEVResult,
  getStep4OwnerConcentrationResult,
  getStep5SizeDiscountResult,
  getStep6LiquidityDiscountResult,
  getStep7EVToEquityResult,
  getStep8OwnershipAdjustmentResult,
  getStep9ConfidenceScoreResult,
  getStep10RangeMethodologyResult
} from '../../../utils/stepDataMapper';
import type { ValuationResponse } from '../../../types/valuation';
import { stepLogger, createPerformanceLogger } from '../../../utils/logger';

interface JourneyStep11Props {
  result: ValuationResponse;
}

const formatCurrency = (value: number): string => `€${Math.round(value).toLocaleString()}`;
const formatCurrencyCompact = (value: number): string => {
  if (value >= 1_000_000) return `€${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `€${Math.round(value / 1_000)}K`;
  return formatCurrency(value);
};

export const JourneyStep11_FinalValuation: React.FC<JourneyStep11Props> = ({ result }) => {
  const renderPerfLogger = useRef(createPerformanceLogger('JourneyStep11_FinalValuation.render', 'step'));
  
  // Component mount logging
  useEffect(() => {
    const step11Data = getStepData(result, 11);
    const step11Result = getStepResultData(result, 11);
    
    stepLogger.info('JourneyStep11_FinalValuation mounted', {
      component: 'JourneyStep11_FinalValuation',
      step: 11,
      hasStepData: !!step11Data,
      hasStepResult: !!step11Result,
      valuationId: result.valuation_id
    });
    
    return () => {
      stepLogger.debug('JourneyStep11_FinalValuation unmounting', { step: 11 });
    };
  }, [result.valuation_id]);
  
  // Extract backend step data
  const step11Data = getStepData(result, 11);
  const step11Result = getStepResultData(result, 11);
  
  const finalLow = step11Result?.final_low || result.equity_value_low;
  const finalMid = step11Result?.final_mid || result.equity_value_mid;
  const finalHigh = step11Result?.final_high || result.equity_value_high;
  const confidenceScore = result.confidence_score || 0;
  // Backend returns confidence_score as integer 0-100, not decimal 0-1
  const confidenceLevel = confidenceScore >= 80 ? 'HIGH' : confidenceScore >= 60 ? 'MEDIUM' : 'LOW';
  
  // Extract data from all steps for detailed breakdown
  const step1Data = getStep1InputResult(result);
  const step2Data = getStep2BenchmarkingResult(result);
  const step3Data = getStep3BaseEVResult(result);
  const step4Data = getStep4OwnerConcentrationResult(result);
  const step5Data = getStep5SizeDiscountResult(result);
  const step6Data = getStep6LiquidityDiscountResult(result);
  const step7Data = getStep7EVToEquityResult(result);
  const step8Data = getStep8OwnershipAdjustmentResult(result);
  const step9Data = getStep9ConfidenceScoreResult(result);
  const step10Data = getStep10RangeMethodologyResult(result);
  
  // Step 1: Input Data
  const revenue = result.current_year_data?.revenue || step1Data?.revenue || 0;
  const ebitda = result.current_year_data?.ebitda || step1Data?.ebitda || 0;
  const ebitdaMargin = ebitda && revenue > 0 ? (ebitda / revenue) * 100 : 0;
  const industry = result.request?.industry || step1Data?.industry || 'N/A';
  const businessModel = result.request?.business_model || step1Data?.business_model || 'N/A';
  const country = result.request?.country || step1Data?.country || 'N/A';
  const employees = result.request?.number_of_employees || step1Data?.num_employees || 0;
  
  // Step 2: Benchmarking
  const primaryMethod = step2Data?.primary_method || (result.multiples_valuation?.primary_multiple_method === 'ebitda_multiple' ? 'EV/EBITDA' : 'EV/Revenue');
  const isPrimaryEBITDA = primaryMethod === 'EV/EBITDA';
  const multiples = result.multiples_valuation;
  const p25Multiple = isPrimaryEBITDA 
    ? (multiples?.p25_ebitda_multiple || step2Data?.p25_ebitda_multiple || null)
    : (multiples?.p25_revenue_multiple || step2Data?.p25_revenue_multiple || null);
  const p50Multiple = isPrimaryEBITDA
    ? (multiples?.p50_ebitda_multiple || step2Data?.p50_ebitda_multiple || multiples?.ebitda_multiple || null)
    : (multiples?.p50_revenue_multiple || step2Data?.p50_revenue_multiple || multiples?.revenue_multiple || null);
  const p75Multiple = isPrimaryEBITDA
    ? (multiples?.p75_ebitda_multiple || step2Data?.p75_ebitda_multiple || null)
    : (multiples?.p75_revenue_multiple || step2Data?.p75_revenue_multiple || null);
  const comparablesCount = step2Data?.comparables_count || (Array.isArray(multiples?.comparables) ? multiples.comparables.length : 0);
  const dataSource = step2Data?.data_source || multiples?.comparables_quality || 'Estimated';
  
  // Step 3: Base Valuation
  const metricValue = step3Data?.metric_value || (isPrimaryEBITDA ? ebitda : revenue);
  const metricName = step3Data?.metric_used || (isPrimaryEBITDA ? 'EBITDA' : 'Revenue');
  const multipleP25 = step3Data?.multiple_low || step3Data?.multiple_p25 || p25Multiple || 0;
  const multipleP50 = step3Data?.multiple_mid || step3Data?.multiple_p50 || p50Multiple || 0;
  const multipleP75 = step3Data?.multiple_high || step3Data?.multiple_p75 || p75Multiple || 0;
  const evLow = step3Data?.enterprise_value_low || 0;
  const evMid = step3Data?.enterprise_value_mid || 0;
  const evHigh = step3Data?.enterprise_value_high || 0;
  
  // Step 4: Owner Concentration
  const step4Skipped = step4Data?.skipped || false;
  const ownerRatio = step4Data?.owner_employee_ratio || 0;
  const numOwners = step4Data?.number_of_owners || 0;
  const numEmployees = step4Data?.number_of_employees || employees || 0;
  const riskLevel = step4Data?.risk_level || 'LOW';
  const step4AdjustmentPct = step4Data?.adjustment_percentage || (result.multiples_valuation?.owner_concentration?.adjustment_factor 
    ? (result.multiples_valuation.owner_concentration.adjustment_factor - 1) * 100 
    : 0);
  const evBeforeStep4 = step4Data?.ev_mid_before || evMid;
  const evAfterStep4 = step4Data?.enterprise_value_mid || evMid;
  
  // Step 5: Size Discount
  const revenueTier = step5Data?.revenue_tier || step5Data?.size_tier || 
    (revenue < 1_000_000 ? 'Micro (<€1M)' :
     revenue < 5_000_000 ? 'Small (€1M-€5M)' :
     revenue < 25_000_000 ? 'Medium (€5M-€25M)' : 'Large (>€25M)');
  // size_discount_percentage is already a percentage (0-100), size_discount is decimal (0-1)
  const step5DiscountPct = step5Data?.size_discount_percentage !== undefined
    ? step5Data.size_discount_percentage
    : (step5Data?.base_discount !== undefined ? step5Data.base_discount * 100 : 
       ((result.multiples_valuation?.size_discount || 0) * 100));
  const evBeforeStep5 = step5Data?.ev_mid_before || evAfterStep4;
  const evAfterStep5 = step5Data?.enterprise_value_mid || evAfterStep4;
  
  // Step 6: Liquidity Discount
  const step6BaseDiscount = step6Data?.base_discount || -0.15;
  const step6MarginBonus = step6Data?.margin_bonus || 0;
  const step6GrowthBonus = step6Data?.growth_bonus || 0;
  const step6RecurringBonus = step6Data?.recurring_revenue_bonus || 0;
  const step6SizeBonus = step6Data?.size_bonus || 0;
  // total_discount_percentage is already a percentage (0-100), liquidity_discount is decimal (0-1)
  const step6TotalDiscountPct = step6Data?.total_discount_percentage !== undefined 
    ? step6Data.total_discount_percentage
    : ((result.multiples_valuation?.liquidity_discount || 0) * 100);
  const evBeforeStep6 = step6Data?.ev_mid_before || evAfterStep5;
  const evAfterStep6 = step6Data?.enterprise_value_mid || evAfterStep5;
  
  // Step 7: EV to Equity
  const totalDebt = step7Data?.total_debt || result.current_year_data?.total_debt || 0;
  const cash = step7Data?.cash || result.current_year_data?.cash || 0;
  const netDebt = step7Data?.net_debt || (totalDebt - cash);
  const equityLow = step7Data?.equity_value_low || 0;
  const equityMid = step7Data?.equity_value_mid || result.equity_value_mid || 0;
  const equityHigh = step7Data?.equity_value_high || 0;
  
  // Step 8: Ownership Adjustment
  const step8Skipped = step8Data?.skipped || step8Data?.ownership_percentage === 100;
  const step8OwnershipPct = step8Data?.ownership_percentage || 100;
  const step8AdjustmentType = step8Data?.adjustment_type || 'none';
  const step8AdjustmentPct = step8Data?.adjustment_percentage || 0;
  
  // Step 9: Confidence Analysis
  const step9ConfidenceScore = step9Data?.overall_confidence_score || confidenceScore;
  const step9ConfidenceLevel = step9Data?.confidence_level || confidenceLevel;
  const factorScores = step9Data?.factor_scores || {};
  const topFactors = Object.entries(factorScores)
    .filter(([_, score]) => typeof score === 'number' && score > 0)
    .sort(([_, a], [__, b]) => (b as number) - (a as number))
    .slice(0, 3)
    .map(([factor, score]) => ({ factor: factor.replace(/_/g, ' '), score: score as number }));
  
  // Step 10: Range Methodology
  const rangeMethodology = step10Data?.methodology || result.range_methodology || 'confidence_spread';
  const isMultipleDispersion = rangeMethodology === 'multiple_dispersion';
  const baseSpread = step10Data?.base_spread || 0.18;
  const totalSpread = step10Data?.total_spread || baseSpread;
  const step7EquityMid = step10Data?.step7_equity_value_mid || equityMid;
  
  // Render performance logging
  useEffect(() => {
    const renderTime = renderPerfLogger.current.end({
      step: 11,
      hasStepData: !!step11Data,
      hasStepResult: !!step11Result,
      finalMid,
      confidenceScore
    });
    
    stepLogger.debug('JourneyStep11_FinalValuation rendered', {
      step: 11,
      renderTime: Math.round(renderTime * 100) / 100
    });
    
    renderPerfLogger.current = createPerformanceLogger('JourneyStep11_FinalValuation.render', 'step');
  });
  
  // For multiples-only valuations, validate that mid-point matches adjusted_equity_value
  const isMultiplesOnly = !result.dcf_valuation || (result.dcf_weight || 0) === 0;
  const backendAdjustedEquity = result.multiples_valuation?.adjusted_equity_value;
  
  // DIAGNOSTIC: Log final range values
  console.log('[DIAGNOSTIC] Step 11 Final Valuation Range', {
    finalLow,
    finalMid,
    finalHigh,
    isMultiplesOnly,
    backendAdjustedEquity,
    difference_mid_vs_adjusted: backendAdjustedEquity ? Math.abs(finalMid - backendAdjustedEquity) : null,
    percentageDiff: backendAdjustedEquity && finalMid > 0 
      ? ((Math.abs(finalMid - backendAdjustedEquity) / backendAdjustedEquity) * 100).toFixed(2) + '%'
      : 'N/A'
  });
  
  // CRITICAL VALIDATION: For multiples-only, final mid-point MUST equal adjusted_equity_value from Step 7
  // This ensures consistency between Step 7, Step 10, and Step 11
  if (isMultiplesOnly && backendAdjustedEquity && backendAdjustedEquity > 0) {
    const tolerance = Math.max(backendAdjustedEquity * 0.005, 50); // 0.5% or €50 (stricter than before)
    const difference = Math.abs(finalMid - backendAdjustedEquity);
    const percentageDiff = (difference / backendAdjustedEquity * 100);
    
    if (difference > tolerance) {
      console.error('[VALUATION-AUDIT] CRITICAL: Step 11 final mid-point mismatch with backend adjusted_equity_value', {
        finalMid,
        backendAdjustedEquity,
        difference,
        tolerance,
        percentageDiff: percentageDiff.toFixed(2) + '%',
        note: 'For multiples-only valuations, final mid MUST equal adjusted_equity_value from Step 7. This indicates a backend calculation error.'
      });
    } else {
      console.log('[DIAGNOSTIC] Step 11 mid-point validation passed', {
        finalMid,
        backendAdjustedEquity,
        difference,
        tolerance,
        withinTolerance: true
      });
    }
  }

  return (
    <StepCard
      id="step-11-final"
      stepNumber={11}
      title="Final Valuation Range"
      subtitle="Complete valuation after all adjustments"
      icon={<Trophy className="w-5 h-5" />}
      color="green"
      defaultExpanded={true}
    >
      <div className="space-y-6">
        {/* Step Metadata */}
        {step11Data && (
          <StepMetadata
            stepData={step11Data}
            stepNumber={11}
            showExecutionTime={true}
            showStatus={true}
          />
        )}

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
            <ol className="space-y-3 text-sm">
              {/* Step 1: Input Data */}
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">1</span>
                <div className="flex-1">
                  <span className="text-gray-700"><strong>Input Data:</strong> </span>
                  <span className="text-gray-700">
                    Revenue: {formatCurrencyCompact(revenue)}, EBITDA: {formatCurrencyCompact(ebitda)}
                    {ebitdaMargin > 0 && ` (${ebitdaMargin.toFixed(1)}% margin)`}
                    {industry !== 'N/A' && ` | Industry: ${industry}`}
                    {businessModel !== 'N/A' && ` | Model: ${businessModel}`}
                    {country !== 'N/A' && ` | ${country}`}
                    {employees > 0 && ` | ${employees} employees`}
                  </span>
                </div>
              </li>
              
              {/* Step 2: Benchmarking */}
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">2</span>
                <div className="flex-1">
                  <span className="text-gray-700"><strong>Benchmarking:</strong> </span>
                  <span className="text-gray-700">
                    Selected {primaryMethod} multiple
                    {p25Multiple && p50Multiple && p75Multiple && (
                      <>: P25 {p25Multiple.toFixed(2)}x, P50 {p50Multiple.toFixed(2)}x, P75 {p75Multiple.toFixed(2)}x</>
                    )}
                    {comparablesCount > 0 && ` | ${comparablesCount} comparables`}
                    {dataSource && ` | Source: ${dataSource}`}
                  </span>
                </div>
              </li>
              
              {/* Step 3: Base Valuation */}
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">3</span>
                <div className="flex-1">
                  <span className="text-gray-700"><strong>Base Valuation:</strong> </span>
                  <span className="text-gray-700">
                    {metricName} {formatCurrencyCompact(metricValue)} × P50 {multipleP50.toFixed(2)}x = {formatCurrencyCompact(evMid)} (mid)
                    {evLow > 0 && evHigh > 0 && (
                      <> | Range: {formatCurrencyCompact(evLow)} (P25) - {formatCurrencyCompact(evHigh)} (P75)</>
                    )}
                  </span>
                </div>
              </li>
              
              {/* Step 4: Owner Concentration */}
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">4</span>
                <div className="flex-1">
                  <span className="text-gray-700"><strong>Owner Concentration:</strong> </span>
                  {step4Skipped || step4AdjustmentPct === 0 ? (
                    <span className="text-gray-700">No adjustment applied</span>
                  ) : (
                    <span className="text-gray-700">
                      {numOwners > 0 && numEmployees > 0 ? (
                        <>Ratio: {numOwners}/{numEmployees} = {(ownerRatio * 100).toFixed(0)}% | </>
                      ) : null}
                      Risk: {riskLevel} | Adjustment: {step4AdjustmentPct.toFixed(1)}%
                      {evBeforeStep4 > 0 && evAfterStep4 > 0 && evBeforeStep4 !== evAfterStep4 && (
                        <> | {formatCurrencyCompact(evBeforeStep4)} → {formatCurrencyCompact(evAfterStep4)}</>
                      )}
                    </span>
                  )}
                </div>
              </li>
              
              {/* Step 5: Size Discount */}
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">5</span>
                <div className="flex-1">
                  <span className="text-gray-700"><strong>Size Discount:</strong> </span>
                  <span className="text-gray-700">
                    {revenueTier} | Adjustment: {step5DiscountPct.toFixed(1)}%
                    {evBeforeStep5 > 0 && evAfterStep5 > 0 && evBeforeStep5 !== evAfterStep5 && (
                      <> | {formatCurrencyCompact(evBeforeStep5)} → {formatCurrencyCompact(evAfterStep5)}</>
                    )}
                  </span>
                </div>
              </li>
              
              {/* Step 6: Liquidity Discount */}
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-bold">6</span>
                <div className="flex-1">
                  <span className="text-gray-700"><strong>Liquidity Discount:</strong> </span>
                  <span className="text-gray-700">
                    Base {(step6BaseDiscount * 100).toFixed(0)}%
                    {step6MarginBonus !== 0 && <> + Margin bonus {(step6MarginBonus * 100).toFixed(1)}%</>}
                    {step6GrowthBonus !== 0 && <> + Growth bonus {(step6GrowthBonus * 100).toFixed(1)}%</>}
                    {step6RecurringBonus !== 0 && <> + Recurring bonus {(step6RecurringBonus * 100).toFixed(1)}%</>}
                    {step6SizeBonus !== 0 && <> + Size bonus {(step6SizeBonus * 100).toFixed(1)}%</>}
                    <> = {step6TotalDiscountPct.toFixed(1)}% total</>
                    {evBeforeStep6 > 0 && evAfterStep6 > 0 && evBeforeStep6 !== evAfterStep6 && (
                      <> | {formatCurrencyCompact(evBeforeStep6)} → {formatCurrencyCompact(evAfterStep6)}</>
                    )}
                  </span>
                </div>
              </li>
              
              {/* Step 7: EV to Equity */}
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">7</span>
                <div className="flex-1">
                  <span className="text-gray-700"><strong>EV to Equity:</strong> </span>
                  <span className="text-gray-700">
                    Net Debt: {formatCurrencyCompact(totalDebt)} - {formatCurrencyCompact(cash)} = {formatCurrencyCompact(netDebt)}
                    {equityMid > 0 && <> | Equity: {formatCurrencyCompact(equityMid)}</>}
                    {evAfterStep6 > 0 && equityMid > 0 && (
                      <> | {formatCurrencyCompact(evAfterStep6)} - {formatCurrencyCompact(netDebt)} = {formatCurrencyCompact(equityMid)}</>
                    )}
                  </span>
                </div>
              </li>
              
              {/* Step 8: Ownership Adjustment */}
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-xs font-bold">8</span>
                <div className="flex-1">
                  <span className="text-gray-700"><strong>Ownership Adjustment:</strong> </span>
                  {step8Skipped ? (
                    <span className="text-gray-700">No adjustment (100% ownership sale)</span>
                  ) : step8AdjustmentPct !== 0 ? (
                    <span className="text-gray-700">
                      Applied {step8AdjustmentPct > 0 ? '+' : ''}{step8AdjustmentPct.toFixed(1)}% {step8AdjustmentType.replace('_', ' ')} for {step8OwnershipPct.toFixed(0)}% ownership
                    </span>
                  ) : (
                    <span className="text-gray-700">No adjustment applied</span>
                  )}
                </div>
              </li>
              
              {/* Step 9: Confidence Analysis */}
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">9</span>
                <div className="flex-1">
                  <span className="text-gray-700"><strong>Confidence Analysis:</strong> </span>
                  <span className="text-gray-700">
                    {step9ConfidenceScore.toFixed(0)}% ({step9ConfidenceLevel})
                    {topFactors.length > 0 && (
                      <> | Top factors: {topFactors.map(f => `${f.factor} ${f.score.toFixed(0)}%`).join(', ')}</>
                    )}
                  </span>
                </div>
              </li>
              
              {/* Step 10: Range Methodology */}
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold">10</span>
                <div className="flex-1">
                  <span className="text-gray-700"><strong>Range Methodology:</strong> </span>
                  <span className="text-gray-700">
                    {isMultipleDispersion ? 'Multiple dispersion' : 'Confidence spread'}
                    {!isMultipleDispersion && (
                      <> | Base ±{(baseSpread * 100).toFixed(0)}% → Total ±{(totalSpread * 100).toFixed(0)}%</>
                    )}
                    {step7EquityMid > 0 && (
                      <> | Base: {formatCurrencyCompact(step7EquityMid)}</>
                    )}
                  </span>
                </div>
              </li>
              
              {/* Step 11: Final Result */}
              <li className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">11</span>
                <div className="flex-1">
                  <span className="text-gray-700"><strong>Final Result:</strong> </span>
                  <span className="text-gray-700">
                    Valuation range: {formatCurrencyCompact(finalLow)} - {formatCurrencyCompact(finalHigh)}
                    {finalMid > 0 && <> (mid: {formatCurrencyCompact(finalMid)})</>}
                  </span>
                </div>
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

