/**
 * LivePreview Component
 * 
 * Shows real-time valuation estimate as user types in the Manual Entry form.
 * Features:
 * - 800ms debounce (as per architecture)
 * - Quick multiples-only calculation
 * - Displays in sticky sidebar
 * - Updates automatically
 */

import React, { useState, useEffect } from 'react';
import { TrendingUp, Zap, Info, Loader2 } from 'lucide-react';
import { useValuationStore } from '../store/useValuationStore';
import { api } from '../services/api';
import type { QuickValuationRequest, QuickValuationResponse } from '../types/valuation';

export const LivePreview: React.FC = () => {
  const { formData } = useValuationStore();
  const [estimate, setEstimate] = useState<QuickValuationResponse | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced calculation (800ms as per architecture)
  useEffect(() => {
    // Only calculate if we have minimum required data
    if (!formData.revenue || !formData.ebitda || formData.revenue === 0) {
      setEstimate(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsCalculating(true);
      setError(null);

      try {
        const quickRequest: QuickValuationRequest = {
          revenue: formData.revenue || 0,
          ebitda: formData.ebitda || 0,
          industry: formData.industry || 'technology',
          country_code: formData.country_code || 'BE',
        };

        const response = await api.quickValuation(quickRequest);
        setEstimate(response);
      } catch (err) {
        console.error('Quick valuation error:', err);
        setError('Unable to calculate estimate');
      } finally {
        setIsCalculating(false);
      }
    }, 800); // 800ms debounce as per architecture

    return () => clearTimeout(timer);
  }, [formData.revenue, formData.ebitda, formData.industry, formData.country_code]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Don't show if no data
  if (!formData.revenue || formData.revenue === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl shadow-lg border border-gray-200 p-6 sticky top-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Live Preview</h3>
            <p className="text-xs text-gray-500">Estimate updates as you type</p>
          </div>
        </div>

        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Zap className="w-8 h-8 text-gray-300" />
          </div>
          <p className="text-sm text-gray-500">
            Start entering your revenue and EBITDA to see a quick estimate
          </p>
        </div>

        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-700">
              <p className="font-medium mb-1">Real-time Estimates</p>
              <p>This preview uses quick multiples-only calculations. Submit the form for a full DCF + Multiples valuation.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-primary-50 to-blue-50 rounded-2xl shadow-lg border border-primary-200 p-6 sticky top-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center animate-pulse">
          <Zap className="w-5 h-5 text-primary-600" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-900">Live Estimate</h3>
          <p className="text-xs text-gray-600">Updates every 800ms</p>
        </div>
      </div>

      {/* Estimate Display */}
      {isCalculating ? (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-primary-600 mx-auto mb-3 animate-spin" />
          <p className="text-sm text-gray-600">Calculating...</p>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
            <Info className="w-8 h-8 text-red-600" />
          </div>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : estimate ? (
        <div>
          {/* Main Estimate */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-4">
            <p className="text-sm text-gray-600 mb-2 text-center">Estimated Business Value</p>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary-600 mb-1">
                {formatCurrency(estimate.equity_value_mid)}
              </div>
              {estimate.equity_value_low && estimate.equity_value_high && (
                <p className="text-sm text-gray-500">
                  Range: {formatCurrency(estimate.equity_value_low)} - {formatCurrency(estimate.equity_value_high)}
                </p>
              )}
            </div>
          </div>

          {/* Confidence */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Confidence</span>
              <span className="text-sm font-bold text-primary-600">{estimate.confidence || estimate.confidence_score || 70}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${estimate.confidence || estimate.confidence_score || 70}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Quick estimate based on multiples only</p>
          </div>

          {/* Methodology */}
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">Methodology</span>
            </div>
            <p className="text-xs text-gray-600 capitalize">{estimate.methodology || estimate.primary_method || 'Market Multiples'}</p>
          </div>
        </div>
      ) : null}

      {/* Info Box */}
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-xs text-blue-700">
            <p className="font-medium mb-1">Quick Estimate vs Full Valuation</p>
            <p>This is a fast estimate using market multiples only. Submit the form for a comprehensive valuation with DCF analysis, financial metrics, and detailed breakdowns.</p>
          </div>
        </div>
      </div>

      {/* Data Quality Tip */}
      {estimate && (estimate.confidence || estimate.confidence_score || 70) < 70 && (
        <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-yellow-700">
              <p className="font-medium">Improve Accuracy</p>
              <p className="mt-1">Add more financial data (net income, assets, debt, cash) for a +{Math.round((100 - (estimate.confidence || estimate.confidence_score || 70)) / 2)}% confidence boost</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};