import React, { useEffect, useCallback } from 'react';
import { useValuationStore } from '../store/useValuationStore';
import { debounce } from '../utils/debounce';
import { TARGET_COUNTRIES } from '../config/countries';
import { IndustryCode, BusinessModel } from '../types/valuation';

/**
 * ValuationForm Component
 * 
 * Main form for entering business valuation data.
 * Supports 3 tiers: Quick, Standard, and Professional.
 */
export const ValuationForm: React.FC = () => {
  const { formData, updateFormData, calculateValuation, quickValuation, isCalculating } = useValuationStore();

  // Debounced quick calculation for live preview
  const debouncedQuickCalc = useCallback(
    debounce((data: typeof formData) => {
      if (data.revenue && data.ebitda && data.industry && data.country_code) {
        quickValuation();
      }
    }, 500),
    []
  );

  // Trigger live preview on field changes
  useEffect(() => {
    debouncedQuickCalc(formData);
  }, [formData.revenue, formData.ebitda, formData.industry, formData.country_code]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    calculateValuation();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Tier Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Data Tier</h3>
          <div className="flex space-x-2">
            <button
              type="button"
              className="px-3 py-1 rounded text-sm font-medium bg-primary-600 text-white"
            >
              Quick (30s)
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Standard (5min)
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Professional (15min)
            </button>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Company Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company Name
            </label>
            <input
              type="text"
              value={formData.company_name || ''}
              onChange={(e) => updateFormData({ company_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Acme GmbH"
            />
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.industry || ''}
              onChange={(e) => updateFormData({ industry: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Select industry...</option>
              <option value={IndustryCode.TECHNOLOGY}>Technology</option>
              <option value={IndustryCode.MANUFACTURING}>Manufacturing</option>
              <option value={IndustryCode.RETAIL}>Retail</option>
              <option value={IndustryCode.SERVICES}>Services</option>
              <option value={IndustryCode.HEALTHCARE}>Healthcare</option>
              <option value={IndustryCode.FINANCE}>Finance</option>
              <option value={IndustryCode.REAL_ESTATE}>Real Estate</option>
              <option value={IndustryCode.HOSPITALITY}>Hospitality</option>
              <option value={IndustryCode.CONSTRUCTION}>Construction</option>
              <option value={IndustryCode.OTHER}>Other</option>
            </select>
          </div>

          {/* Business Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Model <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.business_model || 'other'}
              onChange={(e) => updateFormData({ business_model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value={BusinessModel.B2B_SAAS}>B2B SaaS</option>
              <option value={BusinessModel.B2C}>B2C</option>
              <option value={BusinessModel.MARKETPLACE}>Marketplace</option>
              <option value={BusinessModel.ECOMMERCE}>E-commerce</option>
              <option value={BusinessModel.MANUFACTURING}>Manufacturing</option>
              <option value={BusinessModel.SERVICES}>Services</option>
              <option value={BusinessModel.OTHER}>Other</option>
            </select>
          </div>

          {/* Founding Year */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Founding Year <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={formData.founding_year || new Date().getFullYear() - 5}
              onChange={(e) => updateFormData({ founding_year: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., 2018"
              required
            />
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Country <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.country_code || ''}
              onChange={(e) => updateFormData({ country_code: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            >
              <option value="">Select country...</option>
              {TARGET_COUNTRIES.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.flag} {country.name} ({country.currencySymbol})
                </option>
              ))}
            </select>
          </div>

          {/* Business Model */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Model
            </label>
            <select
              value={formData.business_model || ''}
              onChange={(e) => updateFormData({ business_model: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select model...</option>
              <option value={BusinessModel.B2B_SAAS}>B2B SaaS</option>
              <option value={BusinessModel.B2C}>B2C</option>
              <option value={BusinessModel.MARKETPLACE}>Marketplace</option>
              <option value={BusinessModel.ECOMMERCE}>E-commerce</option>
              <option value={BusinessModel.MANUFACTURING}>Manufacturing</option>
              <option value={BusinessModel.SERVICES}>Services</option>
              <option value={BusinessModel.OTHER}>Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ownership Structure */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ownership Structure</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Business Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Business Structure
            </label>
            <select
              value={formData.business_type || 'company'}
              onChange={(e) => updateFormData({ business_type: e.target.value as 'sole-trader' | 'company' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="sole-trader">Sole Trader (100% owned)</option>
              <option value="company">Company (with shareholders)</option>
            </select>
          </div>

          {/* Shares for Sale */}
          {formData.business_type === 'company' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                % Shares for Sale
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.shares_for_sale || 100}
                onChange={(e) => updateFormData({ shares_for_sale: parseFloat(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="e.g., 50"
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter the percentage of the company you're selling (0-100%)
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Financial Data */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Year Financials ({Math.min(new Date().getFullYear(), 2100)})</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Revenue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Revenue (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.revenue || ''}
              onChange={(e) => updateFormData({ revenue: parseFloat(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., 2500000"
              required
            />
          </div>

          {/* EBITDA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              EBITDA (€) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="1000"
              value={formData.ebitda || ''}
              onChange={(e) => updateFormData({ ebitda: parseFloat(e.target.value) || undefined })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., 500000"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Earnings Before Interest, Taxes, Depreciation & Amortization
            </p>
          </div>
        </div>
      </div>

      {/* Historical Data (3 Years) */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Historical Data (Optional)</h3>
          <span className="text-xs text-gray-500 bg-green-100 px-2 py-1 rounded">+20% Accuracy</span>
        </div>
        
        <p className="text-sm text-gray-600 mb-4">
          Adding 3 years of historical data enables growth rate calculation and improves valuation accuracy
        </p>

        <div className="space-y-3">
          {[2023, 2024].map((year) => (
            <div key={year} className="grid grid-cols-3 gap-4 p-3 bg-gray-50 rounded">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">{year}</label>
                <input
                  type="text"
                  value={year}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Revenue (€)</label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">EBITDA (€)</label>
                <input
                  type="number"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500"
                  placeholder="Optional"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4">
        <button
          type="button"
          className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
        >
          Reset Form
        </button>
        <button
          type="submit"
          disabled={isCalculating || !formData.revenue || !formData.ebitda || !formData.industry || !formData.country_code}
          className="px-6 py-3 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isCalculating ? (
            <>
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Calculating...</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Calculate Comprehensive Valuation</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

