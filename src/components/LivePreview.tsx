import React from 'react';
import { useValuationStore } from '../store/useValuationStore';

/**
 * LivePreview Component
 * 
 * Shows real-time valuation estimate as the user fills out the form.
 * Updates every 500ms using the quick valuation endpoint.
 */
export const LivePreview: React.FC = () => {
  const { liveEstimate, isCalculatingLive, formData } = useValuationStore();

  // Don't show if no basic data entered
  const hasMinimumData = formData.revenue && formData.ebitda && formData.industry && formData.country_code;

  if (!hasMinimumData) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg p-6 border border-primary-200">
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">Start Entering Data</h3>
          <p className="mt-1 text-sm text-gray-500">
            Fill in the basic fields to see a live valuation estimate
          </p>
        </div>
      </div>
    );
  }

  if (isCalculatingLive) {
    return (
      <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg p-6 border border-primary-200 animate-pulse">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-600 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">Calculating...</p>
        </div>
      </div>
    );
  }

  if (!liveEstimate) {
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

  const confidenceColor = 
    liveEstimate.confidence >= 80 ? 'text-green-600' :
    liveEstimate.confidence >= 60 ? 'text-yellow-600' :
    'text-orange-600';

  const confidenceLabel = 
    liveEstimate.confidence >= 80 ? 'High' :
    liveEstimate.confidence >= 60 ? 'Medium' :
    'Low';

  return (
    <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-lg p-6 border-2 border-primary-300 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <svg className="h-5 w-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Live Estimate</h3>
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${confidenceColor} bg-white`}>
          {confidenceLabel} Confidence ({liveEstimate.confidence}%)
        </span>
      </div>

      {/* Valuation Range */}
      <div className="space-y-3">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">Estimated Business Value</p>
          <div className="text-4xl font-bold text-primary-600">
            {formatCurrency(liveEstimate.equity_value_mid)}
          </div>
        </div>

        {/* Range Bar */}
        <div className="relative pt-1">
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>{formatCurrency(liveEstimate.equity_value_low)}</span>
            <span>{formatCurrency(liveEstimate.equity_value_high)}</span>
          </div>
          <div className="overflow-hidden h-2 text-xs flex rounded-full bg-primary-200">
            <div 
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-primary-400 to-primary-600"
              style={{ width: '100%' }}
            ></div>
          </div>
        </div>

        {/* Method Used */}
        <div className="text-center pt-2 border-t border-primary-200">
          <p className="text-xs text-gray-500">
            Based on: {liveEstimate.primary_method === 'multiples' ? 'Market Multiples' : 'DCF Model'}
          </p>
        </div>
      </div>

      {/* CTA to Full Calculation */}
      <div className="mt-4 p-3 bg-white rounded border border-primary-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span className="text-sm font-medium text-gray-700">
              Add more data for +{Math.round((95 - liveEstimate.confidence))}% accuracy
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

