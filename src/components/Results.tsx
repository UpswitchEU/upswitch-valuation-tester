import React from 'react';
import { useValuationStore } from '../store/useValuationStore';
import type { ValuationResponse } from '../types/valuation';

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
          Comprehensive analysis using {result.methodology} methodology
        </p>
      </div>

      {/* Main Valuation */}
      <div className="bg-white rounded-lg border-2 border-primary-500 p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Enterprise Value</h3>
        
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
                style={{ width: `${result.confidence}%` }}
              ></div>
            </div>
            <span className="text-lg font-bold text-blue-600">{result.confidence}%</span>
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
            {result.ownership_adjustment.revenue_cagr !== undefined && (
              <div className="p-3 bg-blue-50 rounded">
                <p className="text-sm text-gray-600">Revenue Growth (CAGR)</p>
                <p className="text-xl font-bold text-blue-600">
                  {formatPercent(result.ownership_adjustment.revenue_cagr)}
                </p>
              </div>
            )}
            
            {result.ownership_adjustment.ebitda_cagr !== undefined && (
              <div className="p-3 bg-green-50 rounded">
                <p className="text-sm text-gray-600">EBITDA Growth (CAGR)</p>
                <p className="text-xl font-bold text-green-600">
                  {formatPercent(result.ownership_adjustment.ebitda_cagr)}
                </p>
              </div>
            )}
            
            {result.ownership_adjustment.growth_multiplier !== undefined && (
              <div className="p-3 bg-purple-50 rounded">
                <p className="text-sm text-gray-600">Growth Multiplier</p>
                <p className="text-xl font-bold text-purple-600">
                  {result.ownership_adjustment.growth_multiplier.toFixed(2)}x
                </p>
              </div>
            )}
            
            {result.ownership_adjustment.ownership_percentage !== undefined && (
              <div className="p-3 bg-yellow-50 rounded">
                <p className="text-sm text-gray-600">Shares for Sale</p>
                <p className="text-xl font-bold text-yellow-600">
                  {result.ownership_adjustment.ownership_percentage}%
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Value Drivers */}
      {result.value_drivers && result.value_drivers.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <svg className="h-5 w-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Key Value Drivers
          </h3>
          <ul className="space-y-2">
            {result.value_drivers.map((driver, index) => (
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Methodology</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 rounded">
            <p className="text-sm text-gray-600 mb-1">Primary Method</p>
            <p className="text-lg font-bold text-blue-600">
              {result.methodology === 'synthesized' ? 'DCF + Multiples' : 
               result.methodology === 'dcf' ? 'Discounted Cash Flow' : 
               'Market Multiples'}
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded">
            <p className="text-sm text-gray-600 mb-1">Data Points Used</p>
            <p className="text-lg font-bold text-purple-600">{result.confidence >= 80 ? '20+' : result.confidence >= 60 ? '10-15' : '5-10'}</p>
          </div>
        </div>
      </div>

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

