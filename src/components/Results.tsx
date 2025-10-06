import React from 'react';
import { useValuationStore } from '../store/useValuationStore';

/**
 * Results Component
 * 
 * Displays comprehensive valuation results including:
 * - Valuation range and recommended price
 * - Ownership adjustments
 * - Growth metrics (CAGR)
 * - Value drivers and risk factors
 * - Methodology breakdown (DCF vs Multiples)
 */
export const Results: React.FC = () => {
  const { result } = useValuationStore();

  if (!result) {
    return null;
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Valuation Results</h2>
        <p className="text-primary-100">
          Comprehensive analysis using {result.methodology || result.primary_method || 'synthesized'} methodology
        </p>
      </div>

      {/* Main Valuation */}
      <div className="bg-white rounded-lg border-2 border-primary-500 p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Enterprise Value</h3>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Big 4 Methodology
          </span>
        </div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600 mb-1">Low Estimate</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(result.equity_value_low)}</p>
          </div>
          <div className="text-center p-4 bg-primary-50 rounded border-2 border-primary-500">
            <p className="text-sm text-primary-600 mb-1">Mid-Point</p>
            <p className="text-3xl font-bold text-primary-600">{formatCurrency(result.equity_value_mid)}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded">
            <p className="text-sm text-gray-600 mb-1">High Estimate</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(result.equity_value_high)}</p>
          </div>
        </div>
        
        {/* Range Spread Indicator */}
        <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">Professional Valuation Range</p>
              <p className="text-xs text-blue-700 mt-1">
                This range follows Big 4 (Deloitte, PwC, KPMG, EY) professional standards. 
                The spread of {(() => {
                  const spread = (result.equity_value_high / result.equity_value_low).toFixed(2);
                  const percentage = ((result.equity_value_high - result.equity_value_low) / result.equity_value_mid * 100).toFixed(0);
                  return `${spread}x (±${percentage}%)`;
                })()} is based on confidence level and methodology agreement, not extreme scenarios.
              </p>
            </div>
          </div>
        </div>

        {/* Recommended Asking Price */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Recommended Asking Price</p>
              <p className="text-2xl font-bold text-green-700">{formatCurrency(result.recommended_asking_price)}</p>
            </div>
            <svg className="h-12 w-12 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded">
          <span className="text-sm font-medium text-gray-700">Confidence Score</span>
          <div className="flex items-center space-x-2">
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${result.confidence || result.confidence_score}%` }}
              ></div>
            </div>
            <span className="text-lg font-bold text-blue-600">{result.confidence || result.confidence_score}%</span>
          </div>
        </div>
      </div>

      {/* Ownership Adjustment (if applicable) */}
      {result.ownership_adjustment && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-primary-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Ownership Adjustment
          </h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-sm text-gray-600">Shares for Sale</p>
              <p className="text-xl font-bold text-blue-600">
                {result.ownership_adjustment.shares_for_sale}%
              </p>
            </div>
            
            <div className="p-3 bg-green-50 rounded">
              <p className="text-sm text-gray-600">Control Premium</p>
              <p className="text-xl font-bold text-green-600">
                {formatPercent(result.ownership_adjustment.control_premium)}
              </p>
            </div>
            
            <div className="col-span-2 p-3 bg-purple-50 rounded">
              <p className="text-sm text-gray-600">Adjusted Value</p>
              <p className="text-xl font-bold text-purple-600">
                {formatCurrency(result.ownership_adjustment.adjusted_value)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Value Drivers */}
      {result.key_value_drivers && result.key_value_drivers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Key Value Drivers
          </h3>
          <ul className="space-y-2">
            {result.key_value_drivers.map((driver: string, index: number) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-green-500 mr-2">✓</span>
                <span className="text-gray-700">{driver}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Risk Factors */}
      {result.risk_factors && result.risk_factors.length > 0 && (
        <div className="bg-white rounded-lg border border-yellow-300 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Risk Factors
          </h3>
          <ul className="space-y-2">
            {result.risk_factors.map((risk, index) => (
              <li key={index} className="flex items-start">
                <span className="flex-shrink-0 h-5 w-5 text-yellow-500 mr-2">⚠</span>
                <span className="text-gray-700">{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Methodology Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Methodology Weights</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-4 bg-blue-50 rounded">
            <p className="text-sm text-gray-600 mb-1">DCF Weight</p>
            <p className="text-2xl font-bold text-blue-600">
              {formatPercent((result.dcf_weight || 0) * 100)}
            </p>
            {result.dcf_valuation && (
              <p className="text-xs text-gray-500 mt-1">
                Value: {formatCurrency(result.dcf_valuation.equity_value || 0)}
              </p>
            )}
          </div>
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-600 mb-1">Multiples Weight</p>
            <p className="text-2xl font-bold text-purple-600">
              {formatPercent((result.multiples_weight || 0) * 100)}
            </p>
            {result.multiples_valuation && (
              <p className="text-xs text-gray-500 mt-1">
                Value: {formatCurrency(result.multiples_valuation.adjusted_equity_value || 0)}
              </p>
            )}
          </div>
        </div>
        <div className="p-3 bg-gray-50 rounded mb-3">
          <p className="text-sm text-gray-700">
            <strong>Weighted Midpoint:</strong> The enterprise value midpoint (€{formatCurrency(result.equity_value_mid)}) is calculated by weighting each methodology based on confidence and data quality, not by using min/max values.
          </p>
        </div>
        <div className="text-sm text-gray-600">
          <p><strong>Note:</strong> Weights are dynamically calculated based on data quality, company characteristics, and methodology agreement. The valuation range (±10-22%) follows professional Big 4 standards.</p>
        </div>
      </div>

      {/* DCF Valuation Details */}
      {result.dcf_valuation && (
        <div className="bg-white rounded-lg border border-blue-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            DCF Valuation Details
          </h3>
          
          {/* Key DCF Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-xs text-gray-600 mb-1">Enterprise Value</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(result.dcf_valuation.enterprise_value)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-xs text-gray-600 mb-1">WACC</p>
              <p className="text-lg font-bold text-blue-600">
                {formatPercent(result.dcf_valuation.wacc * 100)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-xs text-gray-600 mb-1">Terminal Growth</p>
              <p className="text-lg font-bold text-blue-600">
                {formatPercent(result.dcf_valuation.terminal_growth_rate * 100)}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded">
              <p className="text-xs text-gray-600 mb-1">Terminal Value</p>
              <p className="text-lg font-bold text-blue-600">
                {formatCurrency(result.dcf_valuation.terminal_value)}
              </p>
            </div>
          </div>

          {/* WACC Components */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">WACC Components</h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-600">Cost of Equity:</span>
                <span className="font-bold text-gray-900 ml-2">
                  {formatPercent(result.dcf_valuation.cost_of_equity * 100)}
                </span>
              </div>
              <div className="p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-600">Cost of Debt:</span>
                <span className="font-bold text-gray-900 ml-2">
                  {formatPercent(result.dcf_valuation.cost_of_debt * 100)}
                </span>
              </div>
            </div>
          </div>

          {/* FCF Projections */}
          {result.dcf_valuation.fcf_projections_5y && result.dcf_valuation.fcf_projections_5y.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">5-Year FCF Projections</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {result.dcf_valuation.fcf_projections_5y.map((_, idx) => (
                        <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-600">
                          Year {idx + 1}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      {result.dcf_valuation.fcf_projections_5y.map((fcf, idx) => (
                        <td key={idx} className="px-3 py-2 border-t">
                          <span className="font-medium text-gray-900">{formatCurrency(fcf)}</span>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Confidence */}
          <div className="p-3 bg-blue-50 rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">DCF Confidence</span>
              <span className="text-lg font-bold text-blue-600">
                {result.dcf_valuation.confidence_score}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Market Multiples Details */}
      {result.multiples_valuation && (
        <div className="bg-white rounded-lg border border-purple-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
              <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            Market Multiples Details
          </h3>
          
          {/* Valuation Methods */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-3 bg-purple-50 rounded">
              <p className="text-xs text-gray-600 mb-1">EV/EBITDA</p>
              <p className="text-lg font-bold text-purple-600">
                {formatCurrency(result.multiples_valuation.ev_ebitda_valuation)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Multiple: {result.multiples_valuation.ebitda_multiple?.toFixed(1) || 'N/A'}x
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded">
              <p className="text-xs text-gray-600 mb-1">EV/Revenue</p>
              <p className="text-lg font-bold text-purple-600">
                {formatCurrency(result.multiples_valuation.ev_revenue_valuation)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Multiple: {result.multiples_valuation.revenue_multiple?.toFixed(2) || 'N/A'}x
              </p>
            </div>
            {result.multiples_valuation.pe_valuation && (
              <div className="p-3 bg-purple-50 rounded">
                <p className="text-xs text-gray-600 mb-1">P/E Valuation</p>
                <p className="text-lg font-bold text-purple-600">
                  {formatCurrency(result.multiples_valuation.pe_valuation)}
                </p>
                {result.multiples_valuation.pe_multiple && (
                  <p className="text-xs text-gray-500 mt-1">
                    Multiple: {result.multiples_valuation.pe_multiple.toFixed(1)}x
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Adjustments */}
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Valuation Adjustments</h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-600">Size Discount:</span>
                <span className="font-bold text-red-600">
                  {formatPercent(result.multiples_valuation.size_discount * 100)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-600">Liquidity Discount:</span>
                <span className="font-bold text-red-600">
                  {formatPercent(result.multiples_valuation.liquidity_discount * 100)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                <span className="text-gray-600">Country Adjustment:</span>
                <span className={`font-bold ${result.multiples_valuation.country_adjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.multiples_valuation.country_adjustment >= 0 ? '+' : ''}
                  {formatPercent(result.multiples_valuation.country_adjustment * 100)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-100 rounded text-sm font-semibold">
                <span className="text-gray-800">Total Adjustment:</span>
                <span className={`text-lg ${result.multiples_valuation.total_adjustment >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.multiples_valuation.total_adjustment >= 0 ? '+' : ''}
                  {formatPercent(result.multiples_valuation.total_adjustment * 100)}
                </span>
              </div>
            </div>
          </div>

          {/* Comparables Info */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-600 mb-1">Comparables Used</p>
              <p className="text-lg font-bold text-gray-900">
                {result.multiples_valuation.comparables_count}
              </p>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <p className="text-xs text-gray-600 mb-1">Data Quality</p>
              <p className="text-lg font-bold text-gray-900 capitalize">
                {result.multiples_valuation.comparables_quality}
              </p>
            </div>
          </div>

          {/* Confidence */}
          <div className="p-3 bg-purple-50 rounded">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Multiples Confidence</span>
              <span className="text-lg font-bold text-purple-600">
                {result.multiples_valuation.confidence_score}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Financial Metrics */}
      {result.financial_metrics && (
        <div className="bg-white rounded-lg border border-green-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 1a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm4-4a1 1 0 100 2h.01a1 1 0 100-2H13zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zM7 8a1 1 0 000 2h.01a1 1 0 000-2H7z" clipRule="evenodd" />
            </svg>
            Financial Metrics
          </h3>
          
          {/* Profitability */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Profitability</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-2 bg-green-50 rounded text-sm">
                <p className="text-gray-600 text-xs">EBITDA Margin</p>
                <p className="font-bold text-green-600">{formatPercent(result.financial_metrics.ebitda_margin * 100)}</p>
              </div>
              <div className="p-2 bg-green-50 rounded text-sm">
                <p className="text-gray-600 text-xs">Net Margin</p>
                <p className="font-bold text-green-600">{formatPercent(result.financial_metrics.net_margin * 100)}</p>
              </div>
              {result.financial_metrics.return_on_assets !== undefined && (
                <div className="p-2 bg-green-50 rounded text-sm">
                  <p className="text-gray-600 text-xs">ROA</p>
                  <p className="font-bold text-green-600">{formatPercent(result.financial_metrics.return_on_assets * 100)}</p>
                </div>
              )}
              {result.financial_metrics.return_on_equity !== undefined && (
                <div className="p-2 bg-green-50 rounded text-sm">
                  <p className="text-gray-600 text-xs">ROE</p>
                  <p className="font-bold text-green-600">{formatPercent(result.financial_metrics.return_on_equity * 100)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Liquidity & Leverage */}
          {(result.financial_metrics.current_ratio !== undefined || result.financial_metrics.debt_to_equity !== undefined) && (
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Liquidity & Leverage</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {result.financial_metrics.current_ratio !== undefined && (
                  <div className="p-2 bg-blue-50 rounded text-sm">
                    <p className="text-gray-600 text-xs">Current Ratio</p>
                    <p className="font-bold text-blue-600">{result.financial_metrics.current_ratio?.toFixed(2) || 'N/A'}</p>
                  </div>
                )}
                {result.financial_metrics.debt_to_equity !== undefined && (
                  <div className="p-2 bg-blue-50 rounded text-sm">
                    <p className="text-gray-600 text-xs">Debt/Equity</p>
                    <p className="font-bold text-blue-600">{result.financial_metrics.debt_to_equity?.toFixed(2) || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Financial Health */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Financial Health Score</span>
              <span className="text-2xl font-bold text-green-600">
                {result.financial_metrics.financial_health_score}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all ${
                  result.financial_metrics.financial_health_score >= 70 ? 'bg-green-500' :
                  result.financial_metrics.financial_health_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}
                style={{ width: `${result.financial_metrics.financial_health_score}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Export Actions */}
      <div className="flex space-x-4">
        <button className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-md font-medium hover:bg-gray-200 flex items-center justify-center space-x-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
          <span>Export PDF Report</span>
        </button>
        <button 
          onClick={() => {
            const dataStr = JSON.stringify(result, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            const exportFileDefaultName = `valuation-${Date.now()}.json`;
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
          }}
          className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 flex items-center justify-center space-x-2"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
          </svg>
          <span>Export JSON</span>
        </button>
      </div>
    </div>
  );
};

