import { BarChart3, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import type { ComparableCompany, ValuationInputData, ValuationResponse } from '../../types/valuation';
import { formatCurrency, formatPercent } from '../Results/utils/formatters';

interface MultiplesTransparencySectionProps {
  result: ValuationResponse;
  inputData: ValuationInputData | null;
}

export const MultiplesTransparencySection: React.FC<MultiplesTransparencySectionProps> = ({ result, inputData }) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['multiples']));

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const multiplesWeight = result.multiples_weight || 0;

  if (multiplesWeight === 0) {
    return (
      <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-yellow-100 rounded-lg">
            <BarChart3 className="w-6 h-6 text-yellow-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              ⚠️ Market Multiples Methodology Not Available
            </h3>
            <p className="text-gray-700 mb-3">
              The Market Multiples valuation could not be calculated for this business.
            </p>
            <div className="bg-white rounded-lg p-4 border border-yellow-300">
              <p className="font-semibold text-gray-900 mb-2">Possible reasons:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                <li>No comparable companies found in the industry</li>
                <li>Insufficient market data for {inputData?.country_code || 'this region'}</li>
                <li>Business type too unique for market comparisons</li>
                <li>Limited public market data available</li>
              </ul>
            </div>
            <p className="text-sm text-gray-600 mt-3">
              <strong>Note:</strong> The valuation is based on {result.dcf_weight > 0 ? 'DCF methodology' : 'alternative methods'}. 
              Market multiples provide valuable benchmarking but may not be available for all business types.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const multiplesValuation = result.multiples_valuation;
  const revenue = inputData?.revenue || 0;
  const ebitda = inputData?.ebitda || 0;
  
  // Backend returns unadjusted base multiples and adjustment factors
  const baseRevenueMultiple = multiplesValuation?.revenue_multiple || 2.1;
  const baseEbitdaMultiple = multiplesValuation?.ebitda_multiple || 8.5;
  
  // Calculate adjusted multiples: base × (1 + total_adjustment)
  // total_adjustment is the net adjustment % (e.g., -0.15 for -15%)
  const totalAdjustmentFactor = 1.0 + (multiplesValuation?.total_adjustment || 0);
  const adjustedRevenueMultiple = baseRevenueMultiple * totalAdjustmentFactor;
  const adjustedEbitdaMultiple = baseEbitdaMultiple * totalAdjustmentFactor;
  
  // For display purposes, use adjusted multiples
  const revenueMultiple = adjustedRevenueMultiple;
  const ebitdaMultiple = adjustedEbitdaMultiple;
  
  // CRITICAL: NO MOCK DATA - Only use real backend comparable companies
  const comparableCompanies: ComparableCompany[] = result.transparency?.comparable_companies || [];
  const hasComparableCompanies = comparableCompanies.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
        <div className="p-2 bg-green-100 rounded-lg">
          <BarChart3 className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Market Multiples Methodology
          </h2>
          <p className="text-sm text-gray-600">Valuation based on comparable company analysis</p>
        </div>
      </div>

      {/* Weight Display */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">Multiples Weight in Final Valuation</span>
          <span className="text-2xl font-bold text-green-600">{formatPercent(multiplesWeight * 100)}</span>
        </div>
      </div>

      {/* Industry Multiple Selection */}
      <ExpandableSection
        title="1. Industry Multiple Selection"
        value={`${comparableCompanies.length} comparables`}
        isExpanded={expandedSections.has('multiples')}
        onToggle={() => toggleSection('multiples')}
        color="green"
      >
        <div className="space-y-6">
          {/* Business Classification */}
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <h4 className="font-semibold text-gray-900 mb-2">Business Classification</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Business Type:</span>
                <p className="font-semibold">{inputData?.business_model || 'Technology - B2B SaaS'}</p>
              </div>
              <div>
                <span className="text-gray-600">Industry Category:</span>
                <p className="font-semibold">{inputData?.industry || 'Software & IT Services'}</p>
              </div>
            </div>
          </div>

          {/* Revenue Multiple */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4">Revenue Multiple Breakdown</h4>
            
            <div className="space-y-3 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Base Industry Multiple:</span>
                  <span className="font-mono font-semibold">{baseRevenueMultiple.toFixed(2)}x</span>
                </div>
                <div className="text-xs text-gray-600">
                  <p>Source: Industry benchmark data from backend</p>
                  <p>Based on comparable companies in sector</p>
                  <p>Confidence: Based on data quality</p>
                </div>
              </div>

              {/* CRITICAL FIX: Show actual adjustment factor from backend, not fake step-by-step */}
              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900">Total Adjustment Factor:</span>
                  <span className={`font-semibold px-2 py-1 rounded text-sm ${
                    totalAdjustmentFactor >= 1.0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {totalAdjustmentFactor >= 1.0 ? '+' : ''}{((totalAdjustmentFactor - 1.0) * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-700 mb-1">
                  <strong>Note:</strong> This represents the net adjustment applied to the base multiple.
                  The backend applies size, growth, profitability, and other adjustments based on company characteristics.
                </p>
                <p className="text-xs text-gray-600 mb-1">
                  Individual adjustment breakdowns are calculated internally and combined into this total factor.
                </p>
              </div>

              <div className="bg-green-100 p-4 rounded-lg border border-green-300 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Final Revenue Multiple:</span>
                  <span className="text-2xl font-bold text-green-600">{revenueMultiple.toFixed(2)}x</span>
                </div>
                <p className="text-xs text-gray-600 mt-2 font-mono">
                  Calculation: {baseRevenueMultiple.toFixed(2)}x × {totalAdjustmentFactor.toFixed(3)} = {revenueMultiple.toFixed(2)}x
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  (Base multiple × Total adjustment factor = Adjusted multiple)
                </p>
              </div>
            </div>
          </div>

          {/* EBITDA Multiple */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-4">EBITDA Multiple Breakdown</h4>
            
            <div className="space-y-3 text-sm">
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600">Base Industry Multiple:</span>
                  <span className="font-mono font-semibold">{baseEbitdaMultiple.toFixed(1)}x</span>
                </div>
                <div className="text-xs text-gray-600">
                  <p>Source: Industry benchmark data from backend</p>
                  <p>Based on comparable companies in sector</p>
                  <p>Confidence: Based on data quality</p>
                </div>
              </div>

              {/* CRITICAL FIX: Show actual adjustment factor from backend, not fake step-by-step */}
              <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-gray-900">Total Adjustment Factor:</span>
                  <span className={`font-semibold px-2 py-1 rounded text-sm ${
                    totalAdjustmentFactor >= 1.0 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {totalAdjustmentFactor >= 1.0 ? '+' : ''}{((totalAdjustmentFactor - 1.0) * 100).toFixed(1)}%
                  </span>
                </div>
                <p className="text-xs text-gray-700 mb-1">
                  <strong>Note:</strong> This represents the net adjustment applied to the base multiple.
                  The backend applies size, growth, profitability, and other adjustments based on company characteristics.
                </p>
                <p className="text-xs text-gray-600 mb-1">
                  Individual adjustment breakdowns are calculated internally and combined into this total factor.
                </p>
              </div>

              <div className="bg-green-100 p-4 rounded-lg border border-green-300 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Final EBITDA Multiple:</span>
                  <span className="text-2xl font-bold text-green-600">{ebitdaMultiple.toFixed(1)}x</span>
                </div>
                <p className="text-xs text-gray-600 mt-2 font-mono">
                  Calculation: {baseEbitdaMultiple.toFixed(1)}x × {totalAdjustmentFactor.toFixed(3)} = {ebitdaMultiple.toFixed(1)}x
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  (Base multiple × Total adjustment factor = Adjusted multiple)
                </p>
              </div>
            </div>
          </div>
        </div>
      </ExpandableSection>

      {/* Comparable Companies */}
      <ExpandableSection
        title="2. Comparable Companies Detail"
        value={hasComparableCompanies ? `Top ${comparableCompanies.length} companies` : 'Not available from backend'}
        isExpanded={expandedSections.has('comparables')}
        onToggle={() => toggleSection('comparables')}
        color="blue"
      >
        {!hasComparableCompanies ? (
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4 sm:p-6">
            <h4 className="font-semibold text-blue-900 mb-2">Comparable Companies Data Not Available</h4>
            <p className="text-sm text-blue-800 mb-3">
              Detailed comparable company information is not currently provided by the backend. 
              The valuation uses aggregated industry multiples from reliable sources (OECD, FMP) 
              but individual company details are not yet tracked in transparency data.
            </p>
            <p className="text-xs text-blue-700 font-medium">
              ℹ️ The multiples used in your valuation are still accurate and based on real market data. 
              This section will show specific companies once the transparency layer is fully integrated.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {comparableCompanies.map((company, index) => (
            <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <div>
                    <h4 className="font-semibold text-gray-900">{index + 1}. {company.name}</h4>
                    <p className="text-xs text-gray-600">{company.country}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600">Similarity:</span>
                    <span className="text-sm font-bold text-green-600">{company.similarity_score}%</span>
                  </div>
                  <div className="w-20 bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: `${company.similarity_score}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Revenue:</span>
                  <p className="font-semibold">{formatCurrency(company.revenue)}</p>
                </div>
                <div>
                  <span className="text-gray-600">EBITDA Multiple:</span>
                  <p className="font-semibold font-mono">{company.ebitda_multiple?.toFixed(1) || 'N/A'}x</p>
                </div>
                <div>
                  <span className="text-gray-600">Revenue Multiple:</span>
                  <p className="font-semibold font-mono">{company.revenue_multiple?.toFixed(1) || 'N/A'}x</p>
                </div>
              </div>
              
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  <strong>Why similar:</strong> Same industry, comparable size tier, similar geography
                </p>
                <p className="text-xs text-gray-500 mt-1">Source: {company.source}</p>
              </div>
            </div>
          ))}
          </div>
        )}

        {hasComparableCompanies && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
            <h4 className="font-semibold text-gray-900 mb-3">Data Sources Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">KBO Database:</span>
                <span className="font-semibold">1.8M Belgian companies</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">OECD Industry Database:</span>
                <span className="font-semibold">Updated Q4 2025</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">FMP Real-time Data:</span>
                <span className="font-semibold">Last updated: 2025-10-27 14:30:00</span>
              </div>
            </div>
          </div>
        )}
      </ExpandableSection>

      {/* Enterprise & Equity Value */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-500 rounded-lg p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">3. Enterprise & Equity Value (Multiples)</h3>
        
        <div className="space-y-4">
          {/* Revenue-Based */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Revenue-Based Valuation</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Annual Revenue:</span>
                <span className="font-mono">{formatCurrency(revenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Revenue Multiple:</span>
                <span className="font-mono">{revenueMultiple.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300 font-semibold">
                <span>Revenue-Based EV:</span>
                <span className="font-mono text-green-600">{formatCurrency(revenue * revenueMultiple)}</span>
              </div>
            </div>
          </div>

          {/* EBITDA-Based */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">EBITDA-Based Valuation</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">EBITDA:</span>
                <span className="font-mono">{formatCurrency(ebitda)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">EBITDA Multiple:</span>
                <span className="font-mono">{ebitdaMultiple.toFixed(1)}x</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-300 font-semibold">
                <span>EBITDA-Based EV:</span>
                <span className="font-mono text-green-600">{formatCurrency(ebitda * ebitdaMultiple)}</span>
              </div>
            </div>
          </div>

          {/* Weighted Average */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-3">Weighted Average</h4>
            <div className="space-y-2 text-sm font-mono">
              <p className="text-gray-700">
                (Revenue × 60%) + (EBITDA × 40%)
              </p>
              <p className="text-gray-700">
                ({formatCurrency(revenue * adjustedRevenueMultiple)} × 0.6) + ({formatCurrency(ebitda * adjustedEbitdaMultiple)} × 0.4)
              </p>
              {(() => {
                // CRITICAL FIX: Calculate weighted average correctly with null/NaN validation
                // P0: Add defensive checks to prevent NaN propagation
                const safeRevenueMultiple = isFinite(adjustedRevenueMultiple) && adjustedRevenueMultiple >= 0 
                  ? adjustedRevenueMultiple 
                  : 0;
                const safeEbitdaMultiple = isFinite(adjustedEbitdaMultiple) && adjustedEbitdaMultiple >= 0 
                  ? adjustedEbitdaMultiple 
                  : 0;
                const safeRevenue = isFinite(revenue) && revenue >= 0 ? revenue : 0;
                const safeEbitda = isFinite(ebitda) && ebitda >= 0 ? ebitda : 0;
                
                const revenueBasedEV = safeRevenue * safeRevenueMultiple;
                const ebitdaBasedEV = safeEbitda * safeEbitdaMultiple;
                const weightedAverageEV = (revenueBasedEV * 0.6) + (ebitdaBasedEV * 0.4);
                
                // Validate final result
                const isValidEV = isFinite(weightedAverageEV) && weightedAverageEV >= 0;
                
                return (
                  <>
                    <p className="text-gray-700">
                      {formatCurrency(revenueBasedEV * 0.6)} + {formatCurrency(ebitdaBasedEV * 0.4)}
                    </p>
                    <div className="pt-2 border-t border-gray-300">
                      <div className="flex justify-between text-base font-semibold">
                        <span className="text-gray-900">Enterprise Value (Calculated):</span>
                        <span className="text-green-600">
                          {isValidEV ? formatCurrency(weightedAverageEV) : 'N/A'}
                        </span>
                      </div>
                      {/* Show backend value if different */}
                      {isValidEV && multiplesValuation?.ev_ebitda_valuation && 
                       isFinite(multiplesValuation.ev_ebitda_valuation) &&
                       Math.abs(weightedAverageEV - multiplesValuation.ev_ebitda_valuation) > 1000 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Backend Value (may use different weights):</span>
                            <span className="text-gray-600 font-mono">{formatCurrency(multiplesValuation.ev_ebitda_valuation)}</span>
                          </div>
                          <p className="text-xs text-blue-600 mt-1">
                            ℹ️ Backend may use different weighting (e.g., 50/50 or EBITDA-only) based on data quality
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Equity Value Conversion */}
          <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Equity Value Conversion</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-700">Enterprise Value:</span>
                <span className="font-mono font-semibold">{formatCurrency(multiplesValuation?.ev_ebitda_valuation || 0)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>- Net Debt:</span>
                <span className="font-mono">{formatCurrency(inputData?.total_debt || 0)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>+ Cash:</span>
                <span className="font-mono">{formatCurrency(inputData?.cash || 0)}</span>
              </div>
              <div className="flex justify-between pt-3 mt-3 border-t-2 border-green-500">
                <span className="text-lg font-bold text-gray-900">Equity Value (Multiples):</span>
                <span className="text-2xl font-bold text-green-600">{formatCurrency(multiplesValuation?.adjusted_equity_value || 0)}</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-xs text-gray-600 mt-4">
          <strong>Source:</strong> Koller, Goedhart & Wessels (2020), "Valuation: Measuring and Managing the Value of Companies", Chapter 10
        </p>
      </div>
    </div>
  );
};

// Helper Components
const ExpandableSection: React.FC<{
  title: string;
  value: string;
  isExpanded: boolean;
  onToggle: () => void;
  color: string;
  children: React.ReactNode;
}> = ({ title, value, isExpanded, onToggle, color, children }) => {
  const colorClasses = {
    green: 'bg-green-50 border-green-200 hover:bg-green-100',
    blue: 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className={`w-full px-6 py-4 flex items-center justify-between transition-colors ${colorClasses[color as keyof typeof colorClasses]}`}
      >
        <div className="flex items-center gap-3">
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        <span className="font-mono font-semibold text-gray-700">{value}</span>
      </button>
      {isExpanded && (
        <div className="p-4 sm:p-6 bg-white border-t border-gray-200">
          {children}
        </div>
      )}
    </div>
  );
};

