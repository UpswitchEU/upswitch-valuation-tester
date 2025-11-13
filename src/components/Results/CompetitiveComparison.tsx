import React from 'react';
import type { ValuationResponse } from '../../types/valuation';

interface CompetitiveComparisonProps {
  result: ValuationResponse;
}

export const CompetitiveComparison: React.FC<CompetitiveComparisonProps> = ({ result }) => {
  const dcfWeight = result.dcf_weight || 0;
  const multiplesWeight = result.multiples_weight || 0;

  const hasDCFValuation = !!result.dcf_valuation && dcfWeight > 0;
  const hasMultiplesValuation = !!result.multiples_valuation && multiplesWeight > 0;

  const dcfExcluded = !!result.dcf_exclusion_reason || !hasDCFValuation;
  const usesHybrid = hasDCFValuation && hasMultiplesValuation && dcfWeight > 0.01 && multiplesWeight > 0.01;
  const usesMultiplesOnly =
    hasMultiplesValuation &&
    (!hasDCFValuation || dcfWeight < 0.01 || dcfExcluded) &&
    multiplesWeight > 0;
  const usesDCFOnly =
    hasDCFValuation &&
    (!hasMultiplesValuation || multiplesWeight < 0.01) &&
    !dcfExcluded;

  // Check if we have real comparable data or just placeholders
  // Note: comparables_list is returned by backend but not in type definition
  const comparablesListRaw = (result.multiples_valuation as any)?.comparables_list || [];
  const hasPlaceholderOnly = comparablesListRaw.length > 0 && comparablesListRaw.every((comp: any) => comp.is_placeholder === true);
  const comparablesCount = result.multiples_valuation?.comparables_count || 0;
  const hasRealComparables = comparablesCount > 0 && !hasPlaceholderOnly;
  const sufficientComparables = (result.multiples_valuation as any)?.sufficient_comparables !== false; // Default to true if not specified
  const dataSource = (result.multiples_valuation as any)?.data_source || 'unknown';
  const isDatabaseSource = dataSource === 'business_type_db' || dataSource === 'database';

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Methodology & Data Sources</h3>
      
      {/* CRITICAL FIX: Prominent warning for insufficient comparables or placeholder data */}
      {(!sufficientComparables || hasPlaceholderOnly || comparablesCount < 5) && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 mb-1">Limited Comparable Data Available</h4>
              <p className="text-sm text-red-800 mb-2">
                {hasPlaceholderOnly 
                  ? "Placeholder comparables detected. Real market data not available. FMP API key required for accurate comparable company analysis."
                  : comparablesCount < 5
                  ? `Only ${comparablesCount} comparable${comparablesCount !== 1 ? 's' : ''} found (minimum 5 recommended for reliable multiples). Valuation range may be less accurate.`
                  : "Insufficient comparable companies for reliable multiple dispersion analysis. Using confidence spread methodology instead."
                }
              </p>
              {isDatabaseSource && (
                <p className="text-xs text-red-700 mt-1">
                  <strong>Data Source:</strong> Database benchmarks (not live market data). For more accurate valuations, FMP API integration is required.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        {/* Calculation Approach */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Valuation Approach</h4>
          {usesHybrid && (
            <>
          <p className="text-sm text-gray-600 mb-2">
            This valuation combines two industry-standard methodologies:
          </p>
          <ul className="space-y-1 text-sm text-gray-600">
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
                  <span>
                    <strong>Discounted Cash Flow (DCF)</strong>: Projects future cash flows and discounts to present value using WACC
                    {' '}({(dcfWeight * 100).toFixed(1)}% weight)
                  </span>
            </li>
            <li className="flex items-start">
              <span className="text-blue-600 mr-2">•</span>
                  <span>
                    <strong>Market Multiples</strong>: Compares to similar companies using revenue and EBITDA multiples
                    {' '}({(multiplesWeight * 100).toFixed(1)}% weight)
                  </span>
                </li>
              </ul>
            </>
          )}

          {usesMultiplesOnly && (
            <>
              <p className="text-sm text-gray-600 mb-2">
                This valuation uses <strong>Market Multiples only</strong> for the final value, because comparable company analysis is most reliable for your business type and size.
              </p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>
                    <strong>Market Multiples</strong>: Compares to similar companies using revenue and EBITDA multiples, adjusted for size, liquidity and owner concentration.
                  </span>
                </li>
              </ul>
              {result.dcf_exclusion_reason && (
                <p className="text-xs text-amber-700 mt-2">
                  DCF was evaluated but excluded for this case: {result.dcf_exclusion_reason}
                </p>
              )}
            </>
          )}

          {usesDCFOnly && (
            <>
              <p className="text-sm text-gray-600 mb-2">
                This valuation uses <strong>Discounted Cash Flow (DCF) only</strong> as the primary methodology.
              </p>
              <ul className="space-y-1 text-sm text-gray-600">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span>
                    <strong>Discounted Cash Flow (DCF)</strong>: Projects future cash flows and discounts to present value using WACC.
                  </span>
            </li>
          </ul>
            </>
          )}

          {!usesHybrid && !usesMultiplesOnly && !usesDCFOnly && (
            <p className="text-sm text-gray-600 mb-2">
              This valuation uses a data-driven combination of DCF and Market Multiples based on your company profile and data quality.
            </p>
          )}
        </div>

        {/* Data Sources */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Data Sources</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Risk-Free Rate</span>
              <span className="text-sm font-medium text-gray-900">ECB 10-year bond (2.5%)</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Industry Multiples</span>
              <span className="text-sm font-medium text-gray-900">OECD sector benchmarks</span>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Market Data</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${hasRealComparables && sufficientComparables ? 'text-green-700' : 'text-amber-700'}`}>
                  {hasRealComparables 
                    ? `FMP comparable companies (${comparablesCount} found)` 
                    : isDatabaseSource
                    ? 'Database benchmarks (not live market data)'
                    : 'Calibrated benchmark multiples (live comparables pending FMP API integration)'
                  }
                </span>
                {!hasRealComparables || !sufficientComparables ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                    Limited Data
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                    Live Data
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <span className="text-sm text-gray-700">Company Registry</span>
              <span className="text-sm font-medium text-gray-900">KBO/BCE (1.8M companies)</span>
            </div>
          </div>
        </div>

        {/* Accuracy & Validation */}
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Validation</h4>
          <p className="text-sm text-gray-600">
            Methodology validated against academic research (Damodaran, Brealey-Myers) 
            and professional standards (CFA Institute, IFRS 13). Calculations follow 
            industry best practices used by leading valuation firms.
          </p>
        </div>
      </div>
    </div>
  );
};
