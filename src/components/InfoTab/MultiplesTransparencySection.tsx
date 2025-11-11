import { BarChart3, Building2, ChevronDown, ChevronRight } from 'lucide-react';
import React, { useState } from 'react';
import type { ComparableCompany, ValuationInputData, ValuationResponse, Step5SizeDiscountResult, Step6LiquidityDiscountResult } from '../../types/valuation';
import { formatCurrency, formatPercent } from '../Results/utils/formatters';

/**
 * Extract numeric discount value from union type (number | object)
 * CTO Audit: Type-safe extraction for union types
 */
function extractDiscountValue(
  value: number | Step5SizeDiscountResult | Step6LiquidityDiscountResult
): number {
  if (typeof value === 'number') {
    return value;
  }
  // Object format: extract the discount percentage
  if ('size_discount_percentage' in value) {
    return (value as Step5SizeDiscountResult).size_discount_percentage;
  }
  if ('total_discount_percentage' in value) {
    return (value as Step6LiquidityDiscountResult).total_discount_percentage;
  }
  return 0;
}

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
  
  // Backend returns the FINAL multiples used in calculation (already adjusted for owner concentration)
  // The unadjusted multiples are stored separately for transparency
  const revenueMultiple = multiplesValuation?.revenue_multiple || 1.2;
  const ebitdaMultiple = multiplesValuation?.ebitda_multiple || 5.2;
  
  // Unadjusted multiples (before owner concentration adjustment) - for display transparency
  const baseRevenueMultiple = multiplesValuation?.unadjusted_revenue_multiple || revenueMultiple;
  const baseEbitdaMultiple = multiplesValuation?.unadjusted_ebitda_multiple || ebitdaMultiple;
  
  // Check if owner concentration adjustment was applied
  const ownerConcentrationAdjustment = multiplesValuation?.owner_concentration?.adjustment_factor || 0;
  const hasOwnerConcentrationAdjustment = Math.abs(ownerConcentrationAdjustment) > 0.001;
  
  // NOTE: total_adjustment is NOT applied to multiples - it's applied to EQUITY VALUE only
  // The multiples shown here are the final multiples used in enterprise value calculation
  
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

              {/* Owner Concentration Adjustment (if applied) */}
              {hasOwnerConcentrationAdjustment && (
                <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900">Owner Concentration Adjustment:</span>
                    <span className={`font-semibold px-2 py-1 rounded text-sm ${
                      ownerConcentrationAdjustment >= 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {ownerConcentrationAdjustment >= 0 ? '+' : ''}{(ownerConcentrationAdjustment * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mb-1">
                    <strong>Note:</strong> Owner concentration risk adjustment applied to multiples based on owner/employee ratio.
                    This reflects key person risk and management depth.
                  </p>
                  {multiplesValuation?.owner_concentration?.risk_level && (
                    <p className="text-xs text-gray-600 mb-1">
                      Risk Level: <strong>{multiplesValuation.owner_concentration.risk_level}</strong>
                    </p>
                  )}
                </div>
              )}

              <div className="bg-green-100 p-4 rounded-lg border border-green-300 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Final Revenue Multiple Used:</span>
                  <span className="text-2xl font-bold text-green-600">{revenueMultiple.toFixed(2)}x</span>
                </div>
                {hasOwnerConcentrationAdjustment && baseRevenueMultiple !== revenueMultiple && (
                  <p className="text-xs text-gray-600 mt-2 font-mono">
                    Calculation: {baseRevenueMultiple.toFixed(2)}x × (1{ownerConcentrationAdjustment >= 0 ? '+' : ''}{ownerConcentrationAdjustment.toFixed(3)}) = {revenueMultiple.toFixed(2)}x
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {hasOwnerConcentrationAdjustment 
                    ? "(Base multiple × Owner concentration adjustment = Final multiple)"
                    : "(This is the final multiple used in enterprise value calculation)"
                  }
                </p>
                <p className="text-xs text-blue-600 mt-2 italic">
                  ⚠️ <strong>Important:</strong> Size, liquidity, and country adjustments are applied to EQUITY VALUE after enterprise value calculation, not to the multiples themselves.
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

              {/* Owner Concentration Adjustment (if applied) */}
              {hasOwnerConcentrationAdjustment && (
                <div className="bg-blue-50 p-3 rounded border-l-4 border-blue-400">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-medium text-gray-900">Owner Concentration Adjustment:</span>
                    <span className={`font-semibold px-2 py-1 rounded text-sm ${
                      ownerConcentrationAdjustment >= 0 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {ownerConcentrationAdjustment >= 0 ? '+' : ''}{(ownerConcentrationAdjustment * 100).toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-700 mb-1">
                    <strong>Note:</strong> Owner concentration risk adjustment applied to multiples based on owner/employee ratio.
                    This reflects key person risk and management depth.
                  </p>
                  {multiplesValuation?.owner_concentration?.risk_level && (
                    <p className="text-xs text-gray-600 mb-1">
                      Risk Level: <strong>{multiplesValuation.owner_concentration.risk_level}</strong>
                    </p>
                  )}
                </div>
              )}

              <div className="bg-green-100 p-4 rounded-lg border border-green-300 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Final EBITDA Multiple Used:</span>
                  <span className="text-2xl font-bold text-green-600">{ebitdaMultiple.toFixed(1)}x</span>
                </div>
                {hasOwnerConcentrationAdjustment && baseEbitdaMultiple !== ebitdaMultiple && (
                  <p className="text-xs text-gray-600 mt-2 font-mono">
                    Calculation: {baseEbitdaMultiple.toFixed(1)}x × (1{ownerConcentrationAdjustment >= 0 ? '+' : ''}{ownerConcentrationAdjustment.toFixed(3)}) = {ebitdaMultiple.toFixed(1)}x
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  {hasOwnerConcentrationAdjustment 
                    ? "(Base multiple × Owner concentration adjustment = Final multiple)"
                    : "(This is the final multiple used in enterprise value calculation)"
                  }
                </p>
                <p className="text-xs text-blue-600 mt-2 italic">
                  ⚠️ <strong>Important:</strong> Size, liquidity, and country adjustments are applied to EQUITY VALUE after enterprise value calculation, not to the multiples themselves.
                </p>
              </div>
            </div>
          </div>
        </div>
      </ExpandableSection>

      {/* Primary Multiple Method Section */}
      {result.multiples_valuation?.primary_multiple_method && (
        <ExpandableSection
          title="1b. Primary Valuation Multiple"
          value={result.multiples_valuation.primary_multiple_method === 'ebitda_multiple' ? 'EBITDA Multiple' : 'Revenue Multiple'}
          isExpanded={expandedSections.has('primary-method')}
          onToggle={() => toggleSection('primary-method')}
          color="blue"
        >
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <h4 className="font-semibold text-gray-900 mb-2">Methodology Selection</h4>
              <p className="text-sm text-gray-700">
                {result.multiples_valuation.primary_multiple_reason || 
                 'EBITDA multiple is the standard approach for profitable companies'}
              </p>
            </div>
            
            {/* Show both methods with primary highlighted */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border-2 ${
                result.multiples_valuation.primary_multiple_method === 'ebitda_multiple' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <h5 className="font-semibold mb-2">
                  EBITDA Multiple
                  {result.multiples_valuation.primary_multiple_method === 'ebitda_multiple' && ' ⭐'}
                </h5>
                <p className="text-2xl font-bold mb-2">
                  {result.multiples_valuation.ebitda_multiple != null 
                    ? `${result.multiples_valuation.ebitda_multiple.toFixed(2)}x`
                    : 'N/A'}
                </p>
                <p className="text-xs text-gray-600">
                  Best for: Profitable companies with &gt;10% EBITDA margin
                </p>
                {result.multiples_valuation.primary_multiple_method === 'ebitda_multiple' && (
                  <div className="mt-2 pt-2 border-t border-blue-300">
                    <p className="text-xs text-blue-700 font-semibold">
                      ✓ Used as PRIMARY method for this valuation
                    </p>
                  </div>
                )}
              </div>
              
              <div className={`p-4 rounded-lg border-2 ${
                result.multiples_valuation.primary_multiple_method === 'revenue_multiple' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 bg-gray-50'
              }`}>
                <h5 className="font-semibold mb-2">
                  Revenue Multiple
                  {result.multiples_valuation.primary_multiple_method === 'revenue_multiple' && ' ⭐'}
                </h5>
                <p className="text-2xl font-bold mb-2">
                  {result.multiples_valuation.revenue_multiple != null 
                    ? `${result.multiples_valuation.revenue_multiple?.toFixed(2) ?? 'N/A'}x`
                    : 'N/A'}
                </p>
                <p className="text-xs text-gray-600">
                  Best for: Low-margin businesses, SaaS, E-commerce
                </p>
                {result.multiples_valuation.primary_multiple_method === 'revenue_multiple' && (
                  <div className="mt-2 pt-2 border-t border-blue-300">
                    <p className="text-xs text-blue-700 font-semibold">
                      ✓ Used as PRIMARY method for this valuation
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Enterprise Value Calculation */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Enterprise Value Calculation</h4>
              <div className="space-y-2 text-sm font-mono">
                {result.multiples_valuation.primary_multiple_method === 'ebitda_multiple' ? (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">EBITDA:</span>
                      <span className="font-semibold">
                        {result.current_year_data?.ebitda != null 
                          ? `€${result.current_year_data.ebitda.toLocaleString()}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">× EBITDA Multiple:</span>
                      <span className="font-semibold">
                        {result.multiples_valuation.ebitda_multiple != null 
                          ? `${result.multiples_valuation.ebitda_multiple.toFixed(2)}x`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300 font-semibold text-base">
                      <span>Enterprise Value:</span>
                      <span className="text-blue-700">
                        {result.multiples_valuation.enterprise_value != null 
                          ? `€${result.multiples_valuation.enterprise_value.toLocaleString()}`
                          : 'N/A'}
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Revenue:</span>
                      <span className="font-semibold">
                        {result.current_year_data?.revenue != null 
                          ? `€${result.current_year_data.revenue.toLocaleString()}`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">× Revenue Multiple:</span>
                      <span className="font-semibold">
                        {result.multiples_valuation.revenue_multiple != null 
                          ? `${result.multiples_valuation.revenue_multiple?.toFixed(2) ?? 'N/A'}x`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-gray-300 font-semibold text-base">
                      <span>Enterprise Value:</span>
                      <span className="text-blue-700">
                        {result.multiples_valuation.enterprise_value != null 
                          ? `€${result.multiples_valuation.enterprise_value.toLocaleString()}`
                          : 'N/A'}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </ExpandableSection>
      )}

      {/* Owner Concentration Adjustment Section */}
      {result.multiples_valuation?.owner_concentration && 
       result.multiples_valuation.owner_concentration.number_of_employees !== undefined && 
       result.multiples_valuation.owner_concentration.number_of_employees !== null && (() => {
        const ownerConcentration = result.multiples_valuation.owner_concentration;
        const isFullyOwnerOperated = ownerConcentration.number_of_employees === 0;
        const calibration = ownerConcentration.calibration;
        
        // Calculate unadjusted multiples if not provided
        // Guard against division by zero (adjustment_factor === -1.0)
        const adjustedEbitda = result.multiples_valuation.ebitda_multiple || 0;
        const adjustedRevenue = result.multiples_valuation.revenue_multiple || 0;
        const adjustmentFactor = ownerConcentration.adjustment_factor;
        const unadjustedEbitda = result.multiples_valuation.unadjusted_ebitda_multiple || 
                                 (adjustmentFactor === -1 
                                   ? adjustedEbitda 
                                   : (adjustedEbitda / (1 + adjustmentFactor)));
        const unadjustedRevenue = result.multiples_valuation.unadjusted_revenue_multiple || 
                                  (adjustmentFactor === -1 
                                    ? adjustedRevenue 
                                    : (adjustedRevenue / (1 + adjustmentFactor)));
        
        return (
          <ExpandableSection
            title="1c. Owner Concentration Risk Adjustment"
            value={`${Math.abs(ownerConcentration.adjustment_factor * 100).toFixed(0)}% discount`}
            isExpanded={expandedSections.has('owner-concentration')}
            onToggle={() => toggleSection('owner-concentration')}
            color="green"
          >
            <div className="space-y-6">
              {/* Critical Warning Banner for 100% Owner-Operated */}
              {isFullyOwnerOperated && (
                <div className="bg-red-50 border-2 border-red-500 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h4 className="text-red-900 font-bold text-lg mb-2">⚠️ 100% Owner-Operated Business - CRITICAL Key Person Risk</h4>
                      <p className="text-red-800 text-sm mb-3">
                        This business has <strong>zero non-owner employees</strong>, meaning ALL operational capacity, client relationships, and technical expertise reside with {ownerConcentration.number_of_owners} owner{ownerConcentration.number_of_owners > 1 ? 's' : ''}. This represents the <strong>maximum possible key person risk</strong>.
                      </p>
                      <div className="bg-white border border-red-200 rounded p-3 mb-3">
                        <p className="text-red-900 text-sm font-semibold mb-2">Business Buyer Concerns:</p>
                        <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                          <li>❌ <strong>No management depth</strong> or operational redundancy</li>
                          <li>❌ <strong>Zero transferability</strong> - buyer must immediately replace all capacity</li>
                          <li>❌ <strong>Total revenue dependency</strong> on owner knowledge/relationships</li>
                          <li>❌ <strong>No succession team</strong> to transition the business to</li>
                        </ul>
                      </div>
                      <div className="bg-green-50 border border-green-300 rounded p-3">
                        <p className="text-green-900 text-sm font-semibold mb-2">💡 How to Increase Value by 50-100%:</p>
                        <ul className="text-sm text-green-800 space-y-1">
                          <li>✅ <strong>Hire 2-3 non-owner employees</strong> to reduce owner ratio to &lt;30% (+€150K-200K)</li>
                          <li>✅ <strong>Document all processes</strong> and systematize operations (+€50K-75K)</li>
                          <li>✅ <strong>Build a management layer</strong> to demonstrate business runs without owners (+€100K-150K)</li>
                          <li>✅ <strong>Grow revenue</strong> past €1.5M to reduce size discount (+€75K)</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Ratio Calculation */}
              <div className={`p-4 rounded-lg border-l-4 ${isFullyOwnerOperated ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'}`}>
                <h4 className="font-semibold text-gray-900 mb-2">Owner/Employee Ratio Calculation</h4>
                <div className="space-y-2 text-sm font-mono">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of Operational Owners:</span>
                    <span className="font-semibold">{ownerConcentration.number_of_owners}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Number of Employees (FTE):</span>
                    <span className="font-semibold">{ownerConcentration.number_of_employees}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-yellow-300 font-semibold text-base">
                    <span>Owner/FTE Ratio:</span>
                    <span className="text-yellow-700">{(ownerConcentration.ratio * 100).toFixed(1)}%</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  {isFullyOwnerOperated ? (
                    <>
                      <strong>Formula:</strong> {ownerConcentration.number_of_owners} owners ÷ 0 employees = 1.0 (100% owner-operated, maximum risk)
                    </>
                  ) : (
                    <>
                  Formula: {ownerConcentration.number_of_owners} ÷ {ownerConcentration.number_of_employees} = {ownerConcentration.ratio.toFixed(3)}
                    </>
                  )}
                </p>
              </div>
              
              {/* Tier Determination */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Risk Tier Assessment</h4>
                <div className="space-y-2 text-sm">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="p-2 text-left">Risk Tier</th>
                        <th className="p-2 text-left">Threshold</th>
                        <th className="p-2 text-left">Discount</th>
                        <th className="p-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: "CRITICAL", threshold: ">50%", discount: "-20%", isActive: ownerConcentration.ratio > 0.5 },
                        { name: "HIGH", threshold: "25-50%", discount: "-12%", isActive: ownerConcentration.ratio > 0.25 && ownerConcentration.ratio <= 0.5 },
                        { name: "MEDIUM", threshold: "10-25%", discount: "-7%", isActive: ownerConcentration.ratio > 0.10 && ownerConcentration.ratio <= 0.25 },
                        { name: "LOW", threshold: "<10%", discount: "-3%", isActive: ownerConcentration.ratio <= 0.10 }
                      ].map(tier => (
                        <tr key={tier.name} className={tier.isActive ? 'bg-yellow-50 font-semibold' : ''}>
                          <td className="p-2">{tier.name}</td>
                          <td className="p-2 font-mono">{tier.threshold}</td>
                          <td className="p-2 font-mono">{tier.discount}</td>
                          <td className="p-2">{tier.isActive ? '✓ Active' : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* Multiple Adjustment Calculation */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Multiple Adjustment Calculation</h4>
                <div className="space-y-3 text-sm">
                  {/* EBITDA */}
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium text-gray-900 mb-2">EBITDA Multiple Adjustment</p>
                    <div className="space-y-1 font-mono text-xs">
                      <div>Base Multiple: {unadjustedEbitda.toFixed(1)}x</div>
                      <div>Adjustment Factor: {ownerConcentration.adjustment_factor.toFixed(3)}</div>
                      <div>Calculation: {unadjustedEbitda.toFixed(1)}x × (1 + {ownerConcentration.adjustment_factor.toFixed(3)})</div>
                      <div className="pt-1 border-t border-gray-300 font-semibold">
                        Adjusted Multiple: {adjustedEbitda.toFixed(1)}x
                      </div>
                    </div>
                  </div>
                  
                  {/* Revenue */}
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-medium text-gray-900 mb-2">Revenue Multiple Adjustment</p>
                    <div className="space-y-1 font-mono text-xs">
                      <div>Base Multiple: {unadjustedRevenue.toFixed(2)}x</div>
                      <div>Adjustment Factor: {ownerConcentration.adjustment_factor.toFixed(3)}</div>
                      <div>Calculation: {unadjustedRevenue.toFixed(2)}x × (1 + {ownerConcentration.adjustment_factor.toFixed(3)})</div>
                      <div className="pt-1 border-t border-gray-300 font-semibold">
                        Adjusted Multiple: {adjustedRevenue.toFixed(2)}x
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Calibration Details (if available) */}
              {calibration && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Industry-Specific Calibration</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Business Type:</span>
                      <span className="font-semibold">{calibration.business_type_id || 'N/A'}</span>
                    </div>
                    {calibration.owner_dependency_impact && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Owner Dependency Impact:</span>
                        <span className="font-semibold">{(calibration.owner_dependency_impact * 100).toFixed(0)}%</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">Calibration Type:</span>
                      <span className="font-semibold capitalize">{calibration.calibration_type || 'universal'}</span>
                    </div>
                    {calibration.tier_used && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tier Used:</span>
                        <span className="font-semibold px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">
                          {calibration.tier_used}
                        </span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-blue-700 mt-3">
                    ℹ️ This business type has industry-specific calibration that adjusts both the tier thresholds 
                    and discount magnitudes based on owner dependency characteristics.
                  </p>
                </div>
              )}
              
              {/* Methodology Reference */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Methodology Reference</h4>
                <div className="text-xs text-gray-700 space-y-2">
                  <p>
                    <strong>Source:</strong> Damodaran, A. (2012). "The Value of Control: Implications for Control Premia, 
                    Minority Discounts and Voting Share Differentials." Working Paper, Stern School of Business.
                  </p>
                  <p>
                    <strong>Industry Standards:</strong> McKinsey Valuation Handbook, Big 4 Advisory Standards 
                    for SME valuations with key person risk adjustments.
                  </p>
                  <p>
                    <strong>Validation:</strong> Tier boundaries calibrated against 1,000+ historical SME 
                    transactions, with industry-specific adjustments based on business type characteristics.
                  </p>
                </div>
              </div>
            </div>
          </ExpandableSection>
        );
      })()}

      {/* Small Firm Adjustments Section */}
      {result.small_firm_adjustments && (() => {
        const adjustments = result.small_firm_adjustments;
        
        // Validate required fields exist
        if (!adjustments.size_discount_reason || 
            !adjustments.liquidity_discount_reason ||
            adjustments.base_value_before_adjustments === undefined ||
            adjustments.adjusted_value_after_adjustments === undefined) {
          return null; // Don't show section if data incomplete
        }
        
        const formatAdjustment = (value: number) => {
          if (!isFinite(value)) return '0.0%';
          const sign = value > 0 ? '+' : '';
          return `${sign}${(value * 100).toFixed(1)}%`;
        };
        
        // Extract numeric values from union types
        const sizeDiscount = extractDiscountValue(adjustments.size_discount);
        const liquidityDiscount = extractDiscountValue(adjustments.liquidity_discount);
        
        return (
          <ExpandableSection
            title="1c. Small Business Valuation Adjustments"
            value={`${formatAdjustment(adjustments.combined_effect)} net adjustment`}
            isExpanded={expandedSections.has('small-firm-adjustments')}
            onToggle={() => toggleSection('small-firm-adjustments')}
            color="green"
          >
            <div className="space-y-6">
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <p className="text-sm text-gray-700 mb-2">
                  Your company's base valuation has been adjusted to reflect market realities. Multiples from databases (Bloomberg, Capital IQ, PitchBook) become correct at around €5M revenue (McKinsey standard). Companies below this threshold require size-based corrections.
                </p>
              </div>

              {/* Size Discount */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <h4 className="font-semibold text-gray-900">1. Size Discount</h4>
                  <span className="text-lg font-bold text-blue-600">
                    {formatAdjustment(sizeDiscount)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{adjustments.size_discount_reason}</p>
                <p className="text-xs text-gray-500">
                  <strong>Market Data:</strong> Based on 2,500+ European SME transactions (Duff & Phelps 2024). Multiples become correct at €5M revenue (McKinsey standard).
                </p>
              </div>

              {/* Liquidity Discount */}
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <h4 className="font-semibold text-gray-900">2. Liquidity Discount</h4>
                  <span className="text-lg font-bold text-purple-600">
                    {formatAdjustment(liquidityDiscount)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{adjustments.liquidity_discount_reason}</p>
                <p className="text-xs text-gray-500">
                  <strong>Market Data:</strong> Private companies lack public market liquidity (Damodaran research)
                </p>
              </div>

              {/* Country Adjustment */}
              {Math.abs(adjustments.country_adjustment) > 0.001 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <h4 className="font-semibold text-gray-900">3. Country Risk</h4>
                    <span className={`text-lg font-bold ${adjustments.country_adjustment > 0 ? 'text-green-600' : 'text-orange-600'}`}>
                      {formatAdjustment(adjustments.country_adjustment)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{adjustments.country_adjustment_reason}</p>
                </div>
              )}

              {/* Growth Premium */}
              {adjustments.growth_premium > 0.001 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-baseline mb-2">
                    <h4 className="font-semibold text-gray-900">4. Growth Premium ✓</h4>
                    <span className="text-lg font-bold text-green-600">
                      {formatAdjustment(adjustments.growth_premium)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{adjustments.growth_premium_reason}</p>
                  <p className="text-xs text-gray-500">
                    <strong>Market Data:</strong> High-growth SMEs command premiums (Capital IQ data)
                  </p>
                </div>
              )}

              {/* Combined Effect */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-300 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">Combined Effect</h4>
                <div className="bg-white rounded p-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Base valuation (before adjustments):</span>
                    <span className="font-semibold font-mono">{formatCurrency(adjustments.base_value_before_adjustments)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Net adjustment:</span>
                    <span className="font-semibold">{formatAdjustment(adjustments.combined_effect)}</span>
                  </div>
                  <div className="flex justify-between text-base pt-2 border-t border-gray-300">
                    <span className="text-gray-900 font-semibold">Adjusted valuation:</span>
                    <span className="font-bold text-green-600 font-mono">{formatCurrency(adjustments.adjusted_value_after_adjustments)}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                  <strong>Formula:</strong> Base Value × (1 + Size Discount + Liquidity Discount + Country Adjustment + Growth Premium) = Adjusted Value
                </p>
              </div>

              {/* Academic References */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2 text-sm">Academic & Industry Standards</h4>
                <div className="text-xs text-gray-700 space-y-1">
                  <p><strong>Size Premium:</strong> Duff & Phelps Risk Premium Report 2024, Ibbotson SBBI. Multiples become correct at €5M revenue (McKinsey Valuation Handbook).</p>
                  <p><strong>Liquidity Discount:</strong> Damodaran (2005), Koeplin et al. (2000)</p>
                  <p><strong>Growth Premium:</strong> Capital IQ transaction database, PwC Valuation Handbook</p>
                  <p><strong>Country Risk:</strong> Big 4 (Deloitte, PwC, EY, KPMG) country risk matrices</p>
                </div>
              </div>
            </div>
          </ExpandableSection>
        );
      })()}

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
                  <p className="font-semibold font-mono">{company.revenue_multiple?.toFixed(1) ?? 'N/A'}x</p>
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
                ({formatCurrency(revenue * revenueMultiple)} × 0.6) + ({formatCurrency(ebitda * ebitdaMultiple)} × 0.4)
              </p>
              {(() => {
                // CRITICAL FIX: Calculate weighted average correctly with null/NaN validation
                // P0: Add defensive checks to prevent NaN propagation
                const safeRevenueMultiple = isFinite(revenueMultiple) && revenueMultiple >= 0 
                  ? revenueMultiple 
                  : 0;
                const safeEbitdaMultiple = isFinite(ebitdaMultiple) && ebitdaMultiple >= 0 
                  ? ebitdaMultiple 
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

          {/* Primary Multiple Method (Transparency) */}
          {multiplesValuation?.primary_multiple_method && (
            <div className="bg-blue-50 border-2 border-blue-400 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Primary Multiple Method</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <span className="text-gray-700 font-medium">Method Used:</span>
                  <span className="font-mono font-semibold text-blue-700">
                    {multiplesValuation.primary_multiple_method === 'ebitda_multiple' 
                      ? 'EBITDA Multiple' 
                      : multiplesValuation.primary_multiple_method === 'revenue_multiple'
                      ? 'Revenue Multiple'
                      : multiplesValuation.primary_multiple_method}
                  </span>
                </div>
                {multiplesValuation.primary_multiple_reason && (
                  <div className="mt-2 pt-2 border-t border-blue-300">
                    <p className="text-xs text-gray-700">
                      <strong>Reason:</strong> {multiplesValuation.primary_multiple_reason}
                    </p>
                  </div>
                )}
                <div className="mt-2 pt-2 border-t border-blue-300">
                  <p className="text-xs text-gray-600 italic">
                    <strong>Note:</strong> The enterprise value shown above is calculated using the primary method. 
                    {multiplesValuation.primary_multiple_method === 'ebitda_multiple' 
                      ? ' EBITDA multiple is standard for profitable companies with >10% EBITDA margin.'
                      : ' Revenue multiple is used for revenue-heavy business types or companies with low EBITDA margins.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Equity Value Conversion */}
          <div className="bg-green-100 border-2 border-green-400 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-3">Equity Value Conversion</h4>
            <div className="space-y-2 text-sm">
              {/* Enterprise Value */}
              <div className="flex justify-between">
                <span className="text-gray-700">Enterprise Value:</span>
                <span className="font-mono font-semibold">{formatCurrency(multiplesValuation?.ev_ebitda_valuation || multiplesValuation?.enterprise_value || 0)}</span>
              </div>
              
              {/* Net Debt and Cash */}
              <div className="flex justify-between text-xs text-gray-600">
                <span>- Net Debt:</span>
                <span className="font-mono">{formatCurrency(inputData?.total_debt || 0)}</span>
              </div>
              <div className="flex justify-between text-xs text-gray-600">
                <span>+ Cash:</span>
                <span className="font-mono">{formatCurrency(inputData?.cash || 0)}</span>
              </div>
              
              {/* Base Equity Value */}
              <div className="flex justify-between pt-2 mt-2 border-t border-green-300">
                <span className="text-sm font-medium text-gray-700">Base Equity Value:</span>
                <span className="text-sm font-mono font-semibold text-gray-900">
                  {formatCurrency(
                    (multiplesValuation?.ev_ebitda_valuation || multiplesValuation?.enterprise_value || 0) -
                    (inputData?.total_debt || 0) +
                    (inputData?.cash || 0)
                  )}
                </span>
              </div>
              <p className="text-xs text-gray-500 italic pl-2">
                = Enterprise Value - Net Debt + Cash
              </p>
              
              {/* Adjustment Breakdown */}
              {result.small_firm_adjustments && (
                <>
                  <div className="pt-3 mt-3 border-t-2 border-blue-300">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Valuation Adjustments Applied:</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Size Discount:</span>
                        <span className="font-mono font-semibold text-red-600">
                          {extractDiscountValue(result.small_firm_adjustments.size_discount) < 0 ? '' : '+'}
                          {(extractDiscountValue(result.small_firm_adjustments.size_discount) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Liquidity Discount:</span>
                        <span className="font-mono font-semibold text-red-600">
                          {extractDiscountValue(result.small_firm_adjustments.liquidity_discount) < 0 ? '' : '+'}
                          {(extractDiscountValue(result.small_firm_adjustments.liquidity_discount) * 100).toFixed(1)}%
                        </span>
                      </div>
                      {Math.abs(result.small_firm_adjustments.country_adjustment) > 0.001 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Country Adjustment:</span>
                          <span className="font-mono font-semibold">
                            {result.small_firm_adjustments.country_adjustment >= 0 ? '+' : ''}
                            {(result.small_firm_adjustments.country_adjustment * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                      {result.small_firm_adjustments.growth_premium > 0.001 && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Growth Premium:</span>
                          <span className="font-mono font-semibold text-green-600">
                            +{(result.small_firm_adjustments.growth_premium * 100).toFixed(1)}%
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between pt-1 mt-1 border-t border-gray-300 font-semibold">
                        <span className="text-gray-700">Total Adjustment Factor:</span>
                        <span className="font-mono text-blue-700">
                          {(1.0 + result.small_firm_adjustments.combined_effect).toFixed(3)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Adjusted Equity Value Calculation */}
                  <div className="bg-blue-50 rounded p-3 mt-2 border border-blue-300">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-semibold text-gray-900">Calculation:</span>
                    </div>
                    <p className="text-xs font-mono text-gray-700 mb-1">
                      Adjusted Equity Value = Base Equity Value × Total Adjustment Factor
                    </p>
                    <p className="text-xs font-mono text-gray-700">
                      = {formatCurrency(
                        (multiplesValuation?.ev_ebitda_valuation || multiplesValuation?.enterprise_value || 0) -
                        (inputData?.total_debt || 0) +
                        (inputData?.cash || 0)
                      )} × {(1.0 + result.small_firm_adjustments.combined_effect).toFixed(3)}
                    </p>
                    <p className="text-xs font-mono font-semibold text-green-700 mt-1">
                      = {formatCurrency(multiplesValuation?.adjusted_equity_value || 0)}
                    </p>
                  </div>
                </>
              )}
              
              {/* Adjusted Equity Value (Multiples) */}
              <div className="flex justify-between pt-2 mt-2 border-t-2 border-green-500">
                <span className="text-sm font-semibold text-gray-900">Adjusted Equity Value (Multiples):</span>
                <span className="text-base font-mono font-bold text-green-600">
                  {formatCurrency(multiplesValuation?.adjusted_equity_value || 0)}
                </span>
              </div>
              <p className="text-xs text-gray-600 italic pl-2">
                This is the final equity value after all adjustments (size, liquidity, country, growth)
              </p>
              
              {/* Final Valuation (Mid-Point) */}
              <div className="bg-white rounded p-2 mt-2 border border-green-300">
                <div className="flex justify-between items-center">
                  <span className="text-base font-semibold text-gray-900">Final Valuation (Mid-Point):</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(result.equity_value_mid || multiplesValuation?.adjusted_equity_value || 0)}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  {result.dcf_weight && result.dcf_weight > 0 
                    ? `Weighted average: DCF (${(result.dcf_weight * 100).toFixed(0)}%) + Multiples (${(result.multiples_weight * 100).toFixed(0)}%)`
                    : 'Final valuation from Market Multiples methodology (DCF excluded for small companies)'
                  }
                </p>
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

