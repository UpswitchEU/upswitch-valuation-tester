import React, { useState } from 'react';
import { BarChart3, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react';
import type { ValuationResponse, ValuationInputData } from '../../types/valuation';
import { DCFTransparencySection } from './DCFTransparencySection';
import { MultiplesTransparencySection } from './MultiplesTransparencySection';

interface ValuationMethodsSectionProps {
  result: ValuationResponse;
  inputData: ValuationInputData | null;
}

/**
 * Combined Valuation Methods Section
 * 
 * Consolidates DCF and Market Multiples into a single, streamlined section
 * following McKinsey/Bain consulting report structure.
 */
export const ValuationMethodsSection: React.FC<ValuationMethodsSectionProps> = ({ result, inputData }) => {
  const [expandedMethod, setExpandedMethod] = useState<'dcf' | 'multiples' | 'both'>('both');
  
  const dcfWeight = result.dcf_weight || 0;
  const multiplesWeight = result.multiples_weight || 0;
  
  const dcfValue = result.dcf_valuation?.equity_value || 0;
  const multiplesValue = result.multiples_valuation?.adjusted_equity_value || 0;

  const toggleMethod = (method: 'dcf' | 'multiples') => {
    if (expandedMethod === method) {
      setExpandedMethod('both');
    } else if (expandedMethod === 'both') {
      setExpandedMethod(method === 'dcf' ? 'multiples' : 'dcf');
    } else {
      setExpandedMethod('both');
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-4 border-b-2 border-gray-200">
        <div className="p-2 bg-gradient-to-r from-blue-100 to-green-100 rounded-lg">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <BarChart3 className="w-5 h-5 text-green-600" />
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Valuation Methods</h2>
          <p className="text-sm text-gray-600">Complete methodology breakdown: DCF and Market Multiples</p>
        </div>
      </div>

      {/* Methodology Overview */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 border-2 border-gray-300 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Dual Methodology Approach</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* DCF Summary Card */}
          <div className={`bg-white rounded-lg p-4 border-2 transition-all ${
            dcfWeight > 0 ? 'border-blue-500' : 'border-gray-300 opacity-50'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-gray-900">DCF Method</h4>
              </div>
              <span className="text-xl font-bold text-blue-600">{(dcfWeight * 100).toFixed(0)}%</span>
            </div>
            
            {dcfWeight > 0 ? (
              <>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  €{dcfValue.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Projects future cash flows and discounts to present value using WACC
                </p>
                <button
                  onClick={() => toggleMethod('dcf')}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  {expandedMethod === 'multiples' ? 'Show Details' : 'Hide Details'}
                  {expandedMethod === 'multiples' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500">Not available for this valuation</p>
            )}
          </div>

          {/* Market Multiples Summary Card */}
          <div className={`bg-white rounded-lg p-4 border-2 transition-all ${
            multiplesWeight > 0 ? 'border-green-500' : 'border-gray-300 opacity-50'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-gray-900">Market Multiples</h4>
              </div>
              <span className="text-xl font-bold text-green-600">{(multiplesWeight * 100).toFixed(0)}%</span>
            </div>
            
            {multiplesWeight > 0 ? (
              <>
                <div className="text-2xl font-bold text-gray-900 mb-2">
                  €{multiplesValue.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  Compares to similar companies using revenue and EBITDA multiples
                </p>
                <button
                  onClick={() => toggleMethod('multiples')}
                  className="text-sm text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
                >
                  {expandedMethod === 'dcf' ? 'Show Details' : 'Hide Details'}
                  {expandedMethod === 'dcf' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </>
            ) : (
              <p className="text-sm text-gray-500">Not available for this valuation</p>
            )}
          </div>
        </div>

        {/* Weighting Rationale */}
        <div className="bg-white rounded-lg p-4 border border-gray-300">
          <h4 className="font-medium text-gray-900 mb-2">Why These Weights?</h4>
          <p className="text-sm text-gray-700">
            {dcfWeight > multiplesWeight
              ? `DCF weighted higher (${(dcfWeight * 100).toFixed(0)}%) due to reliable historical cash flows and stable projections.`
              : multiplesWeight > dcfWeight
              ? `Market Multiples weighted higher (${(multiplesWeight * 100).toFixed(0)}%) due to strong comparable company data and industry benchmarks.`
              : 'Balanced weighting reflects equal confidence in both methodologies.'}
          </p>
        </div>
      </div>

      {/* Detailed Breakdowns */}
      <div className="space-y-6">
        {/* DCF Detailed Breakdown */}
        {dcfWeight > 0 && expandedMethod !== 'multiples' && (
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <DCFTransparencySection result={result} inputData={inputData} />
          </div>
        )}

        {/* Multiples Detailed Breakdown */}
        {multiplesWeight > 0 && expandedMethod !== 'dcf' && (
          <div className="bg-green-50 rounded-lg p-6 border border-green-200">
            <MultiplesTransparencySection result={result} inputData={inputData} />
          </div>
        )}
      </div>

      {/* Methodology Comparison (only if both methods used) */}
      {dcfWeight > 0 && multiplesWeight > 0 && (
        <div className="bg-white border-2 border-gray-300 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cross-Validation</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700">DCF Valuation:</span>
              <span className="font-mono font-semibold text-blue-600">
                €{dcfValue.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <span className="text-gray-700">Multiples Valuation:</span>
              <span className="font-mono font-semibold text-green-600">
                €{multiplesValue.toLocaleString('de-DE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-gray-400">
              <span className="font-semibold text-gray-900">Variance:</span>
              <span className="font-mono font-bold text-gray-900">
                {Math.abs(((dcfValue - multiplesValue) / ((dcfValue + multiplesValue) / 2)) * 100).toFixed(1)}%
              </span>
            </div>
            
            <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded">
              <strong>Note:</strong> Variance below 50% indicates strong methodological agreement. 
              Higher variance suggests data quality issues or unique business characteristics requiring additional analysis.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

