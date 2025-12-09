import React, { useState } from 'react';
import type { ValuationResponse } from '../../types/valuation';
import { ConfidenceScoreModal } from './ConfidenceScoreModal';
import { formatCurrency, formatCurrencyCompact } from './utils/formatters';

interface ResultsHeaderProps {
  result: ValuationResponse;
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({ result }) => {
  const [showConfidenceModal, setShowConfidenceModal] = useState(false);

  // Helper function: Determine if EBITDA is the primary method with enhanced fallback logic
  const isPrimaryEBITDA = () => {
    const multiples = result.multiples_valuation;
    
    // Priority 1: Check primary_multiple_method (most authoritative)
    if (multiples?.primary_multiple_method) {
      return multiples.primary_multiple_method === 'ebitda_multiple';
    }
    
    // Priority 2: Check primary_method field (string format)
    if (multiples?.primary_method) {
      return multiples.primary_method === 'EV/EBITDA';
    }
    
    // Priority 3: Check top-level primary_method
    if (result.primary_method) {
      return result.primary_method === 'EV/EBITDA';
    }
    
    // Priority 4: Infer from available data
    // If we have positive EBITDA and an EBITDA multiple, assume EBITDA is primary
    const currentData = result.current_year_data;
    if (currentData?.ebitda && currentData.ebitda > 0 && multiples?.ebitda_multiple && multiples.ebitda_multiple > 0) {
      return true;
    }
    
    // Default to Revenue if cannot determine
    return false;
  };

  // Dynamic methodology description based on actual weights
  const getMethodologyDescription = () => {
    const dcfWeight = result.dcf_weight || 0;
    const multiplesWeight = result.multiples_weight || 0;
    const methodology = result.methodology || '';
    const dcfExcluded = !!(result.dcf_exclusion_reason || (dcfWeight < 0.01 && multiplesWeight > 0.99));
    
    // Use methodology field as authoritative source
    if (methodology === 'Multiples' || dcfExcluded || (dcfWeight < 0.01 && multiplesWeight > 0.99)) {
      return "Based on Market Multiples methodology";
    } else if (methodology === 'Hybrid' || (dcfWeight > 0.01 && multiplesWeight > 0.01)) {
      return `Based on DCF and Market Multiples methodology (${Math.round(dcfWeight * 100)}% / ${Math.round(multiplesWeight * 100)}%)`;
    } else if (dcfWeight > 0.99 && multiplesWeight < 0.01) {
      return "Based on DCF methodology";
    }
    return "Based on valuation methodology";
  };

  // Calculate spread percentage for range explanation
  const calculateSpread = () => {
    const mid = result.equity_value_mid || 0;
    const low = result.equity_value_low || 0;
    const high = result.equity_value_high || 0;
    
    if (mid <= 0) return 0;
    
    const downside = ((mid - low) / mid) * 100;
    const upside = ((high - mid) / mid) * 100;
    
    // Return average spread (they should be similar)
    return Math.round((downside + upside) / 2);
  };

  const spreadPercentage = calculateSpread();
  const confidenceScore = result.confidence_score || 0;
  const dcfWeight = result.dcf_weight || 0;

  // Note: Methodology information is available in server-generated HTML report
  // Diagnostic logging removed - details in html_report

  return (
    <>
      <div className="space-y-4 sm:space-y-6">
        {/* Main Valuation */}
        <div className="bg-white rounded-lg border-2 border-gray-200 p-4 sm:p-6 shadow-lg transition-shadow hover:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-ink">Valuation Report</h2>
              <p className="text-sm text-gray-600">{getMethodologyDescription()}</p>
              {/* CRITICAL FIX: Display methodology downgrade warning */}
              {result.methodology_downgrade_reason && (
                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded mt-2">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-orange-900 mb-1">Methodology Changed</h4>
                      <p className="text-sm text-orange-800">
                        {result.methodology_downgrade_reason}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {result.dcf_exclusion_reason && !result.methodology_downgrade_reason && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded mt-2">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-amber-900 mb-1">DCF Methodology Excluded</h4>
                      <p className="text-sm text-amber-800">
                        {result.dcf_exclusion_reason} Market Multiples methodology is more reliable for businesses of this size.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* SME Calibration Notice (NEW: McKinsey standard for SME multiples) */}
              {/* Note: Detailed SME calibration information is available in info_tab_html */}
              {false && (
                <div className="bg-primary-50 border-l-4 border-primary-500 p-4 rounded mt-2">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold text-primary-900 mb-1">SME Multiple Calibration Applied</h4>
                      <p className="text-sm text-primary-800">
                        Database multiples have been calibrated for SME size. Raw multiples (from large company databases) were scaled down{' '}
                        {/* SME calibration percentage now available in info_tab_html */}
                        <span className="font-semibold">10-12%</span>
                        {' '}to reflect realistic SME valuations. This follows McKinsey/Bain standards for SME valuation accuracy.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              {/* Confidence Score - Enhanced Design - Clickable */}
              <div
                onClick={() => setShowConfidenceModal(true)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setShowConfidenceModal(true);
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={`View detailed confidence score breakdown${result.confidence_score !== undefined && result.confidence_score !== null ? ` for ${result.confidence_score}% confidence` : ''}`}
                aria-expanded={showConfidenceModal}
                aria-controls="modal-content"
                className={`
                  relative inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border-2 shadow-sm cursor-pointer
                  ${result.confidence_score !== undefined && result.confidence_score !== null
                    ? result.confidence_score >= 80 
                      ? 'bg-gradient-to-br from-primary-50 to-primary-50/50 border-primary-300 hover:from-primary-100 hover:to-primary-100/50'
                      : result.confidence_score >= 60
                      ? 'bg-gradient-to-br from-accent-50 to-accent-50/50 border-accent-300 hover:from-accent-100 hover:to-accent-100/50'
                      : 'bg-gradient-to-br from-accent-50/70 to-accent-50/40 border-accent-300 hover:from-accent-100/70 hover:to-accent-100/40'
                    : 'bg-gray-50 border-gray-300 hover:bg-gray-100'
                  }
                  transition-all duration-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2
                  ${result.confidence_score !== undefined && result.confidence_score !== null
                    ? result.confidence_score >= 80 
                      ? 'focus:ring-primary-500'
                      : result.confidence_score >= 60
                      ? 'focus:ring-accent-500'
                      : 'focus:ring-accent-500'
                    : 'focus:ring-gray-500'
                  }
                `}
              >
                {/* Visual indicator circle */}
                <div className={`
                  flex items-center justify-center w-12 h-12 rounded-full border-2
                  ${result.confidence_score !== undefined && result.confidence_score !== null
                    ? result.confidence_score >= 80 
                      ? 'bg-primary-100 border-primary-400'
                      : result.confidence_score >= 60
                      ? 'bg-accent-100 border-accent-400'
                      : 'bg-accent-100 border-accent-400'
                    : 'bg-gray-100 border-gray-400'
                  }
                `}>
                  <span className={`
                    text-xl font-bold
                    ${result.confidence_score !== undefined && result.confidence_score !== null
                      ? result.confidence_score >= 80 
                        ? 'text-primary-700'
                        : result.confidence_score >= 60
                        ? 'text-accent-700'
                        : 'text-accent-700'
                      : 'text-gray-600'
                    }
                  `}>
                    {result.confidence_score !== undefined && result.confidence_score !== null
                      ? result.confidence_score
                      : '—'}
                  </span>
                </div>
                
                {/* Score and label */}
                <div className="flex flex-col items-end">
                  <div className={`
                    text-2xl font-bold leading-none
                    ${result.confidence_score !== undefined && result.confidence_score !== null
                      ? result.confidence_score >= 80 
                        ? 'text-primary-700'
                        : result.confidence_score >= 60
                        ? 'text-accent-700'
                        : 'text-accent-700'
                      : 'text-gray-600'
                    }
                  `}>
                    {result.confidence_score !== undefined && result.confidence_score !== null
                      ? `${result.confidence_score}%`
                      : 'N/A'}
                  </div>
                  <div className="text-xs font-medium text-gray-600 mt-0.5">
                    Confidence
                  </div>
                </div>
              </div>
            </div>
          </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-slate-ink">Valuation Range</h3>
          <p className="text-xs text-gray-500 mt-1">
            Equity value after all adjustments (size, liquidity, owner concentration)
          </p>
        </div>
        
        {/* Final Multiples Used (if applicable) */}
        {result.multiples_valuation && (
          <div className="bg-gradient-to-r from-primary-50 to-canvas border-2 border-primary-300 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📐</span>
              <h4 className="text-sm font-bold text-primary-900">Final Multiples Used</h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Primary Multiple */}
              <div className="bg-white rounded-lg p-3 border-2 border-accent-500">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-accent-700 uppercase">Primary Method ⭐</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900">
                    {isPrimaryEBITDA() ? 'EBITDA Multiple' : 'Revenue Multiple'}
                  </p>
                  <p className="text-2xl font-bold text-accent-700">
                    {isPrimaryEBITDA()
                      ? `${result.multiples_valuation.ebitda_multiple?.toFixed(2) ?? 'N/A'}x`
                      : `${result.multiples_valuation.revenue_multiple?.toFixed(2) ?? 'N/A'}x`
                    }
                  </p>
                  <p className="text-xs text-gray-600">
                    {isPrimaryEBITDA() ? (
                      result.current_year_data?.ebitda != null && result.current_year_data.ebitda > 0 ? (
                        `${formatCurrencyCompact(result.current_year_data.ebitda)} × ${result.multiples_valuation.ebitda_multiple?.toFixed(2) ?? 'N/A'}x`
                      ) : (
                        <span className="text-yellow-600 font-medium" title="Please enter EBITDA to calculate enterprise value">EBITDA: Required</span>
                      )
                    ) : (
                      result.current_year_data?.revenue != null && result.current_year_data.revenue > 0 ? (
                        `${formatCurrencyCompact(result.current_year_data.revenue)} × ${result.multiples_valuation.revenue_multiple?.toFixed(2) ?? 'N/A'}x`
                      ) : (
                        <span className="text-yellow-600 font-medium" title="Please enter revenue to calculate enterprise value">Revenue: Required</span>
                      )
                    )}
                  </p>
                </div>
              </div>

              {/* Secondary Multiple (when available) */}
              {((isPrimaryEBITDA() && result.multiples_valuation.revenue_multiple && result.multiples_valuation.revenue_multiple > 0) ||
                (!isPrimaryEBITDA() && result.multiples_valuation.ebitda_multiple && result.multiples_valuation.ebitda_multiple > 0 && 
                 result.current_year_data?.ebitda && result.current_year_data.ebitda > 0)) && (
                <div className="bg-white rounded-lg p-3 border border-gray-300">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-gray-700 uppercase">Alternative Method</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-gray-900">
                      {isPrimaryEBITDA() ? 'Revenue Multiple' : 'EBITDA Multiple'}
                    </p>
                    <p className="text-2xl font-bold text-gray-700">
                      {isPrimaryEBITDA()
                        ? `${result.multiples_valuation.revenue_multiple?.toFixed(2) ?? 'N/A'}x`
                        : `${result.multiples_valuation.ebitda_multiple?.toFixed(2) ?? 'N/A'}x`
                      }
                    </p>
                    <p className="text-xs text-gray-600">
                      {isPrimaryEBITDA() ? (
                        result.current_year_data?.revenue != null && result.current_year_data.revenue > 0 ? (
                          `${formatCurrencyCompact(result.current_year_data.revenue)} × ${result.multiples_valuation.revenue_multiple?.toFixed(2) ?? 'N/A'}x`
                        ) : null
                      ) : (
                        result.current_year_data?.ebitda != null && result.current_year_data.ebitda > 0 ? (
                          `${formatCurrencyCompact(result.current_year_data.ebitda)} × ${result.multiples_valuation.ebitda_multiple?.toFixed(2) ?? 'N/A'}x`
                        ) : null
                      )}
                    </p>
                  </div>
                </div>
              )}

              {/* Range Calculation */}
              <div className="bg-white rounded-lg p-3 border border-gray-300">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold text-gray-700 uppercase">Range Calculation</span>
                </div>
                <div className="space-y-2 text-xs">
                  {result.range_methodology === 'multiple_dispersion' ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Low (P25):</span>
                        <span className="font-bold text-gray-900">
                          {isPrimaryEBITDA()
                            ? `${result.multiples_valuation.p25_ebitda_multiple?.toFixed(2) ?? 'N/A'}x`
                            : `${result.multiples_valuation.p25_revenue_multiple?.toFixed(2) ?? 'N/A'}x`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Mid (P50):</span>
                        <span className="font-bold text-primary-700">
                          {isPrimaryEBITDA()
                            ? `${result.multiples_valuation.p50_ebitda_multiple?.toFixed(2) ?? 'N/A'}x`
                            : `${result.multiples_valuation.p50_revenue_multiple?.toFixed(2) ?? 'N/A'}x`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">High (P75):</span>
                        <span className="font-bold text-gray-900">
                          {isPrimaryEBITDA()
                            ? `${result.multiples_valuation.p75_ebitda_multiple?.toFixed(2) ?? 'N/A'}x`
                            : `${result.multiples_valuation.p75_revenue_multiple?.toFixed(2) ?? 'N/A'}x`
                          }
                        </span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-primary-700 font-semibold">✓ Market-based range from {result.multiples_valuation.comparables_count} comparables</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Base Multiple:</span>
                        <span className="font-bold text-primary-700">
                          {isPrimaryEBITDA()
                            ? `${result.multiples_valuation.ebitda_multiple?.toFixed(2) ?? 'N/A'}x`
                            : `${result.multiples_valuation.revenue_multiple?.toFixed(2) ?? 'N/A'}x`
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Range Spread:</span>
                        <span className="font-bold text-gray-900">±{spreadPercentage}%</span>
                      </div>
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-blue-700">Based on {confidenceScore}% confidence & company size</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* DCF Exclusion Note (if applicable) */}
            {dcfWeight === 0 && result.dcf_exclusion_reason && (
              <div className="mt-3 pt-3 border-t border-primary-200">
                <p className="text-xs text-primary-800">
                  <span className="font-semibold">Note:</span> DCF methodology was excluded for this valuation. {result.dcf_exclusion_reason} Market Multiples methodology is more reliable for businesses of this size.
                </p>
              </div>
            )}
            
            {/* Primary Method Selection Note (EBITDA-First Logic - 2025) */}
            {!isPrimaryEBITDA() && result.multiples_valuation.ebitda_multiple && result.multiples_valuation.ebitda_multiple > 0 && 
             result.current_year_data?.ebitda && result.current_year_data.ebitda > 0 && (
              <div className="mt-3 pt-3 border-t border-primary-200">
                <p className="text-xs text-primary-800">
                  <span className="font-semibold">Primary Method Selection:</span> Revenue multiple was selected as primary because: (1) Company is loss-making (EBITDA ≤ €0), (2) EBITDA margin is critically low (&lt;3%, unreliable for valuation), or (3) Revenue-driven industry (SaaS, marketplaces, early-stage tech) where revenue scale is the primary value driver. EBITDA multiple ({result.multiples_valuation.ebitda_multiple.toFixed(2)}x) is shown above as an alternative reference point.
                </p>
              </div>
            )}
            {isPrimaryEBITDA() && result.multiples_valuation.revenue_multiple && result.multiples_valuation.revenue_multiple > 0 && (
              <div className="mt-3 pt-3 border-t border-primary-200">
                <p className="text-xs text-primary-800">
                  <span className="font-semibold">Primary Method Selection:</span> EBITDA multiple was selected as primary following McKinsey/Bain best practices. Profitability (EBITDA) is the most reliable value driver for established businesses with positive, stable margins. Revenue multiple ({result.multiples_valuation.revenue_multiple.toFixed(2)}x) is shown as an alternative reference. Company size and data quality concerns are reflected in confidence scoring, not methodology selection.
                </p>
              </div>
            )}
            
            {/* Adjustments Applied Note */}
            {(result.multiples_valuation.owner_concentration != null || 
              result.multiples_valuation.size_discount != null || 
              result.multiples_valuation.liquidity_discount != null) && (
              <div className="mt-3 pt-3 border-t border-purple-200">
                <p className="text-xs text-purple-800">
                  <span className="font-semibold">Note:</span> Multiples shown above reflect <strong>industry benchmarks</strong>. Valuation adjustments for
                  {result.multiples_valuation.owner_concentration && (
                    <span className="ml-1">
                      owner concentration ({(result.multiples_valuation.owner_concentration.adjustment_factor * 100).toFixed(0)}%)
                    </span>
                  )}
                  {result.multiples_valuation.size_discount && (
                    <span className="ml-1">
                      {result.multiples_valuation.owner_concentration ? ', ' : ''}
                      size ({(result.multiples_valuation.size_discount * 100).toFixed(0)}%)
                    </span>
                  )}
                  {result.multiples_valuation.liquidity_discount && (
                    <span className="ml-1">
                      {(result.multiples_valuation.owner_concentration || result.multiples_valuation.size_discount) ? ', and ' : ''}
                      liquidity ({(result.multiples_valuation.liquidity_discount * 100).toFixed(0)}%)
                    </span>
                  )}
                  {' '}are applied to <strong>enterprise value</strong>, not the multiples themselves. See calculation breakdown below for details.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
          <div className="text-center p-3 sm:p-4 bg-canvas rounded">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Low Estimate</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-ink break-words">
              {formatCurrencyCompact(result.equity_value_low)}
            </p>
            <p className="text-xs text-gray-500 mt-1 hidden sm:block">
              {formatCurrency(result.equity_value_low)}
            </p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-primary-50 rounded border-2 border-primary-500">
            <p className="text-xs sm:text-sm text-primary-600 mb-1">Mid-Point</p>
            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-600 break-words">
              {formatCurrencyCompact(result.equity_value_mid)}
            </p>
            <p className="text-xs text-primary-500 mt-1 hidden sm:block">
              {formatCurrency(result.equity_value_mid)}
            </p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-canvas rounded">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">High Estimate</p>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-slate-ink break-words">
              {formatCurrencyCompact(result.equity_value_high)}
            </p>
            <p className="text-xs text-gray-500 mt-1 hidden sm:block">
              {formatCurrency(result.equity_value_high)}
            </p>
          </div>
        </div>

        {/* Range Explanation */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-primary-900 mb-2">Understanding the Valuation Range</h4>
              
              {/* Methodology Indicator */}
              {result.range_methodology && (
                <div className="mb-3 p-2 bg-white rounded border border-primary-300">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary-900">Range Methodology:</span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      result.range_methodology === 'multiple_dispersion' 
                        ? 'bg-primary-100 text-primary-800' 
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {result.range_methodology === 'multiple_dispersion' 
                        ? '📊 Multiple Dispersion (P25/P50/P75 from comparables)'
                        : '📈 Confidence Spread (size-adjusted)'
                      }
                    </span>
                    {result.range_methodology === 'multiple_dispersion' && result.multiples_valuation?.comparables_count != null && result.multiples_valuation.comparables_count > 0 && (
                      <span className="text-xs text-gray-600">
                        ({result.multiples_valuation.comparables_count} comparable companies)
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <p className="text-sm text-primary-800 mb-2">
                The <strong>Mid-Point (€{formatCurrency(result.equity_value_mid)})</strong> is our best estimate of your company's value, calculated as a weighted average of the valuation methodologies used.
              </p>
              <p className="text-sm text-primary-800 mb-2">
                {result.range_methodology === 'multiple_dispersion' ? (
                  <>
                    The <strong>Low</strong> and <strong>High</strong> estimates are calculated from the <strong>25th and 75th percentile multiples</strong> of comparable companies. This reflects actual market dispersion, making it more accurate than confidence-based spreads (McKinsey best practice).
                  </>
                ) : (
                  <>
                    The <strong>Low</strong> and <strong>High</strong> estimates reflect <strong>valuation uncertainty</strong> based on data quality and market conditions. The range width of <strong>±{spreadPercentage}%</strong> is determined by your confidence score of <strong>{confidenceScore}%</strong> and company size (small companies get wider spreads ±25%).
                  </>
                )}
              </p>
              <p className="text-xs text-primary-700 mt-2 italic">
                {result.range_methodology === 'multiple_dispersion' 
                  ? 'Multiple dispersion ranges use actual comparable company data (P25/P50/P75 percentiles), providing more accurate valuation ranges than confidence-based spreads.'
                  : 'Higher confidence scores and larger companies result in tighter ranges (±12%), while lower scores and smaller companies result in wider ranges (±25%) to account for greater uncertainty.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    {/* Confidence Score Modal */}
    <ConfidenceScoreModal
      isOpen={showConfidenceModal}
      onClose={() => setShowConfidenceModal(false)}
      result={result}
    />
    </>
  );
};
