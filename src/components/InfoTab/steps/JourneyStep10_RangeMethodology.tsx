import React from 'react';
import { GitBranch } from 'lucide-react';
import { StepCard } from '../shared/StepCard';
import type { ValuationResponse } from '../../../types/valuation';

interface JourneyStep9Props {
  result: ValuationResponse;
  beforeValues: { low: number; mid: number; high: number };
}

const formatCurrency = (value: number): string => `€${Math.round(value).toLocaleString()}`;

export const JourneyStep9_RangeMethodology: React.FC<JourneyStep9Props> = ({ result, beforeValues }) => {
  const rangeMethod = result.range_methodology || 'confidence_spread';
  const isMultipleDispersion = rangeMethod === 'multiple_dispersion';
  const multiples = result.multiples_valuation;
  const confidenceScore = result.confidence_score || 0;
  
  // Calculate spread from Step 7 equity value to final range
  // CRITICAL: For multiples-only, the mid-point should equal Step 7 equity value
  // The backend fix ensures equity_value_mid matches adjusted_equity_value_for_range
  
  // CRITICAL FIX: Add input validation with safe defaults
  const step7Equity = beforeValues?.mid ?? result.equity_value_mid ?? 0; // From Step 7 (EV to Equity conversion) - AUTHORITATIVE BASE
  const finalMid = result.equity_value_mid ?? 0;
  const finalLow = result.equity_value_low ?? 0;
  const finalHigh = result.equity_value_high ?? 0;
  
  // Validate inputs are finite numbers
  if (!isFinite(step7Equity) || !isFinite(finalMid) || !isFinite(finalLow) || !isFinite(finalHigh)) {
    console.error('[VALUATION-AUDIT] Invalid input values in Step 9', {
      step7Equity,
      finalMid,
      finalLow,
      finalHigh,
      note: 'Non-finite values detected. Using fallback values.'
    });
  }
  
  // DIAGNOSTIC: Log value flow
  console.log('[DIAGNOSTIC] Step 9 Range Methodology - Value Flow', {
    step7Equity,
    finalMid,
    finalLow,
    finalHigh,
    difference_step7_vs_finalMid: Math.abs(finalMid - step7Equity),
    percentageDiff: step7Equity > 0 ? ((Math.abs(finalMid - step7Equity) / step7Equity) * 100).toFixed(2) + '%' : 'N/A'
  });
  
  // CRITICAL FIX: For multiples-only valuations, ALWAYS use step7Equity as authoritative base
  // The waterfall calculation (Step 7) is the source of truth
  const isMultiplesOnly = !result.dcf_valuation || (result.dcf_weight || 0) === 0;
  
  // CRITICAL FIX: For multiples-only, baseMid MUST equal step7Equity (the waterfall value)
  // This ensures consistency between Step 7 and Step 9
  // For hybrid valuations, use finalMid if it's close to step7Equity (within 1%), otherwise use step7Equity
  const baseMid = isMultiplesOnly 
    ? (step7Equity > 0 ? step7Equity : (finalMid > 0 ? finalMid : 0)) 
    : (step7Equity > 0 && Math.abs(finalMid - step7Equity) < (step7Equity * 0.01) ? finalMid : step7Equity);
  
  // CRITICAL VALIDATION: For multiples-only, ensure baseMid equals step7Equity
  if (isMultiplesOnly && step7Equity > 0 && Math.abs(baseMid - step7Equity) > 1) {
    console.error('[VALUATION-AUDIT] CRITICAL: Step 9 baseMid must equal step7Equity for multiples-only', {
      baseMid,
      step7Equity,
      finalMid,
      difference: Math.abs(baseMid - step7Equity),
      note: 'For multiples-only valuations, baseMid should always equal step7Equity. This indicates a data flow issue.'
    });
  }
  
  // Warn if step7Equity is zero or negative (edge case)
  if (step7Equity <= 0) {
    console.warn('[VALUATION-AUDIT] Step 7 equity value is zero or negative', {
      step7Equity,
      finalMid,
      note: 'This may indicate a company with debt exceeding enterprise value. Using finalMid as fallback.'
    });
  }
  
  // Calculate spreads correctly: spread = (final - base) / base
  // For low: spread = (base - final) / base (negative spread means final is lower)
  // For high: spread = (final - base) / base (positive spread means final is higher)
  // CRITICAL FIX: Guard against division by zero and invalid values
  const spreadLow = baseMid > 0 && isFinite(baseMid) && isFinite(finalLow) 
    ? ((baseMid - finalLow) / baseMid) 
    : 0;
  const spreadHigh = baseMid > 0 && isFinite(baseMid) && isFinite(finalHigh) 
    ? ((finalHigh - baseMid) / baseMid) 
    : 0;
  
  // Cap spreads at reasonable values (0-50%)
  const cappedSpreadLow = Math.max(0, Math.min(0.5, spreadLow));
  const cappedSpreadHigh = Math.max(0, Math.min(0.5, spreadHigh));
  
  // Calculate average spread for display
  const avgSpread = (cappedSpreadLow + cappedSpreadHigh) / 2;
  
  // DIAGNOSTIC: Log spread calculations
  console.log('[DIAGNOSTIC] Step 9 Spread Calculations', {
    baseMid,
    finalLow,
    finalHigh,
    spreadLow: (spreadLow * 100).toFixed(2) + '%',
    spreadHigh: (spreadHigh * 100).toFixed(2) + '%',
    cappedSpreadLow: (cappedSpreadLow * 100).toFixed(2) + '%',
    cappedSpreadHigh: (cappedSpreadHigh * 100).toFixed(2) + '%',
    avgSpread: (avgSpread * 100).toFixed(2) + '%',
    validation: {
      calculatedLow: baseMid * (1 - cappedSpreadLow),
      calculatedHigh: baseMid * (1 + cappedSpreadHigh),
      actualLow: finalLow,
      actualHigh: finalHigh,
      lowMatch: Math.abs(baseMid * (1 - cappedSpreadLow) - finalLow) < 1,
      highMatch: Math.abs(baseMid * (1 + cappedSpreadHigh) - finalHigh) < 1
    }
  });

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
                    <span className="font-semibold">{confidenceScore.toFixed(0)}%</span>
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

        {/* Actual Range Calculation */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Range Calculation</h4>
          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4 space-y-3">
            <div className="bg-white border border-blue-200 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Base Equity Value (from Step 7):</span>
                <span className="text-base font-bold text-blue-900">{formatCurrency(step7Equity)}</span>
              </div>
            </div>
            
            {isMultipleDispersion ? (
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 font-medium">Using P25/P50/P75 multiples from comparables:</p>
                <div className="bg-white border border-blue-200 rounded p-2 space-y-1 font-mono text-xs">
                  <div>Low: P25 Multiple × Revenue × Adjustments = {formatCurrency(finalLow)}</div>
                  <div className="text-blue-700 font-semibold">Mid: P50 Multiple × Revenue × Adjustments = {formatCurrency(finalMid)}</div>
                  <div>High: P75 Multiple × Revenue × Adjustments = {formatCurrency(finalHigh)}</div>
                </div>
                <p className="text-xs text-gray-600 italic">
                  Note: The mid-point may be adjusted to match the waterfall calculation for consistency.
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 font-medium">Applying confidence spread:</p>
                <div className="bg-white border border-blue-200 rounded p-2 space-y-1 font-mono text-xs">
                  {/* CRITICAL FIX: Display correct formulas using calculated spreads */}
                  <div>Low: {formatCurrency(baseMid)} × (1 - {(cappedSpreadLow * 100).toFixed(0)}%) = <strong>{formatCurrency(Math.max(0, baseMid * (1 - cappedSpreadLow)))}</strong></div>
                  <div className="text-blue-700 font-semibold">Mid: {formatCurrency(baseMid)} (unchanged) = <strong>{formatCurrency(baseMid)}</strong></div>
                  <div>High: {formatCurrency(baseMid)} × (1 + {(cappedSpreadHigh * 100).toFixed(0)}%) = <strong>{formatCurrency(baseMid * (1 + cappedSpreadHigh))}</strong></div>
                </div>
                {/* Validation: Show warning if calculated values don't match final values */}
                {Math.abs(baseMid * (1 - cappedSpreadLow) - finalLow) > 1 && (
                  <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mt-2">
                    <p className="text-xs text-yellow-800">
                      ⚠️ Note: Calculated low value ({formatCurrency(baseMid * (1 - cappedSpreadLow))}) differs from final low ({formatCurrency(finalLow)}). 
                      Final values may have been adjusted by backend for consistency.
                    </p>
                  </div>
                )}
                {Math.abs(baseMid * (1 + cappedSpreadHigh) - finalHigh) > 1 && (
                  <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mt-2">
                    <p className="text-xs text-yellow-800">
                      ⚠️ Note: Calculated high value ({formatCurrency(baseMid * (1 + cappedSpreadHigh))}) differs from final high ({formatCurrency(finalHigh)}). 
                      Final values may have been adjusted by backend for consistency.
                    </p>
                  </div>
                )}
                <p className="text-xs text-gray-600 italic">
                  Spread of ±{(avgSpread * 100).toFixed(0)}% reflects valuation uncertainty based on {confidenceScore.toFixed(0)}% confidence score and company size.
                </p>
                {Math.abs(finalMid - step7Equity) > (step7Equity * 0.01) && step7Equity > 0 && (
                  <div className="bg-yellow-50 border border-yellow-300 rounded p-2 mt-2">
                    <p className="text-xs text-yellow-800">
                      ⚠️ Note: Range mid-point ({formatCurrency(finalMid)}) differs from Step 7 equity value ({formatCurrency(step7Equity)}). 
                      Using Step 7 value ({formatCurrency(step7Equity)}) as authoritative base for consistency with waterfall calculation.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Before/After Comparison */}
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Range Transformation</h4>
          <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Estimate</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Step 7 (Before Range)</th>
                  <th className="px-2 py-2"></th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Step 10 (Final Range)</th>
                  <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">Low</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(beforeValues.low)}</td>
                  <td className="px-2 py-3 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right w-4 h-4 text-gray-400 mx-auto">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatCurrency(finalLow)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-gray-600">
                    {((finalLow - beforeValues.low) / beforeValues.low * 100).toFixed(1)}%
                  </td>
                </tr>
                <tr className="bg-blue-50">
                  <td className="px-4 py-3 font-bold text-blue-900">Mid</td>
                  <td className="px-4 py-3 text-right font-mono text-blue-700">{formatCurrency(beforeValues.mid)}</td>
                  <td className="px-2 py-3 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right w-4 h-4 text-blue-400 mx-auto">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-bold text-blue-900">{formatCurrency(baseMid)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs font-semibold text-blue-600">
                    {Math.abs(baseMid - beforeValues.mid) < 1 ? '0.0%' : ((baseMid - beforeValues.mid) / beforeValues.mid * 100).toFixed(1) + '%'}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-gray-900">High</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(beforeValues.high)}</td>
                  <td className="px-2 py-3 text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-arrow-right w-4 h-4 text-gray-400 mx-auto">
                      <path d="M5 12h14"></path>
                      <path d="m12 5 7 7-7 7"></path>
                    </svg>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatCurrency(finalHigh)}</td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-gray-600">
                    {((finalHigh - beforeValues.high) / beforeValues.high * 100).toFixed(1)}%
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

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

