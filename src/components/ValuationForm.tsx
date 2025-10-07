import React, { useEffect, useCallback } from 'react';
import { useValuationStore } from '../store/useValuationStore';
import { useReportsStore } from '../store/useReportsStore';
import { debounce } from '../utils/debounce';
import { TARGET_COUNTRIES } from '../config/countries';
import { IndustryCode, BusinessModel } from '../types/valuation';
import { CustomInputField, CustomNumberInputField, CustomDropdown } from './forms';

/**
 * ValuationForm Component
 * 
 * Main form for entering business valuation data.
 * Supports 3 tiers: Quick, Standard, and Professional.
 */
export const ValuationForm: React.FC = () => {
  const { formData, updateFormData, calculateValuation, quickValuation, isCalculating, result } = useValuationStore();
  const { addReport } = useReportsStore();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await calculateValuation();
    
    // Auto-save report to localStorage (will show inline below the form)
    // Results component will appear automatically in App.tsx when result is set
  };

  // Auto-save to reports when calculation completes
  useEffect(() => {
    if (result && formData.company_name) {
      // Only save once per result
      addReport({
        company_name: formData.company_name,
        source: 'manual',
        result: result,
        form_data: formData,
      });
    }
  }, [result?.valuation_id]); // Only run when result ID changes

  // Calculate data quality score
  const calculateDataQuality = () => {
    let score = 0;
    let total = 0;
    
    // Basic required fields (40 points)
    if (formData.company_name) { score += 5; total += 5; }
    if (formData.country_code) { score += 5; total += 5; }
    if (formData.industry) { score += 10; total += 10; }
    if (formData.business_model) { score += 10; total += 10; }
    if (formData.founding_year) { score += 5; total += 5; }
    if (formData.revenue && formData.revenue > 0) { score += 5; total += 5; }
    
    // Current year financials (30 points)
    if (formData.ebitda) { score += 10; total += 10; }
    if (formData.current_year_data?.net_income) { score += 5; total += 5; }
    if (formData.current_year_data?.total_assets) { score += 5; total += 5; }
    if (formData.current_year_data?.total_debt) { score += 5; total += 5; }
    if (formData.current_year_data?.cash) { score += 5; total += 5; }
    
    // Historical data (30 points)
    const hasHistorical = formData.historical_years_data && formData.historical_years_data.length > 0;
    if (hasHistorical) {
      const years = formData.historical_years_data?.length || 0;
      score += Math.min(years * 10, 30);
      total += 30;
    } else {
      total += 30;
    }
    
    return total > 0 ? Math.round((score / total) * 100) : 0;
  };

  const dataQuality = calculateDataQuality();
  const hasMinimumData = formData.revenue && formData.ebitda && formData.industry && formData.country_code;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Data Quality Tip */}
      <div className="bg-gradient-to-r from-blue-900/30 to-indigo-900/30 rounded-lg border border-blue-700/50 p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-semibold text-blue-300">💡 Maximize Accuracy</h3>
            <p className="text-sm text-blue-200 mt-1">
              More complete data leads to higher valuation accuracy. Add historical years and complete financial details for professional-grade results.
            </p>
          </div>
        </div>
      </div>

      {/* Data Quality Indicator */}
      {hasMinimumData && (
        <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-zinc-300">Data Completeness</span>
            <span className={`text-lg font-bold ${
              dataQuality >= 80 ? 'text-green-400' : 
              dataQuality >= 60 ? 'text-blue-400' : 
              dataQuality >= 40 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {dataQuality}%
            </span>
          </div>
          <div className="w-full bg-zinc-700 rounded-full h-2.5 mb-3">
            <div 
              className={`h-2.5 rounded-full transition-all duration-500 ${
                dataQuality >= 80 ? 'bg-gradient-to-r from-green-400 to-green-600' : 
                dataQuality >= 60 ? 'bg-gradient-to-r from-blue-400 to-blue-600' : 
                dataQuality >= 40 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' : 
                'bg-gradient-to-r from-red-400 to-red-600'
              }`}
              style={{ width: `${dataQuality}%` }}
            />
          </div>
          
          {/* Contextual Tips */}
          <div className="text-xs text-zinc-400 space-y-1">
            {dataQuality < 60 && !formData.historical_years_data?.length && (
              <p className="flex items-start">
                <span className="text-yellow-400 mr-1.5">⚠️</span>
                <span><strong>Add historical data</strong> (3-5 years) to improve accuracy by up to 20%</span>
              </p>
            )}
            {!formData.current_year_data?.total_assets && dataQuality < 80 && (
              <p className="flex items-start">
                <span className="text-blue-400 mr-1.5">💡</span>
                <span><strong>Add balance sheet data</strong> (assets, debt, cash) for full DCF analysis</span>
              </p>
            )}
            {!formData.current_year_data?.net_income && dataQuality < 80 && (
              <p className="flex items-start">
                <span className="text-blue-400 mr-1.5">💡</span>
                <span><strong>Add net income</strong> to enable complete financial metrics</span>
              </p>
            )}
            {dataQuality >= 80 && (
              <p className="flex items-start">
                <span className="text-green-400 mr-1.5">✅</span>
                <span><strong>Excellent data quality!</strong> Ready for professional-grade valuation.</span>
              </p>
            )}
            {dataQuality >= 60 && dataQuality < 80 && (
              <p className="flex items-start">
                <span className="text-blue-400 mr-1.5">👍</span>
                <span><strong>Good data quality.</strong> Add more historical years for even better results.</span>
              </p>
            )}
          </div>
        </div>
      )}

      {/* Basic Information */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Company Name */}
          <CustomInputField
            label="Company Name"
            type="text"
            value={formData.company_name || ''}
            onChange={(e) => updateFormData({ company_name: e.target.value })}
            onBlur={() => {}}
            placeholder="e.g., Acme GmbH"
            required
          />

          {/* Industry */}
          <CustomDropdown
            label="Industry"
            placeholder="Select industry..."
            options={[
              { value: IndustryCode.TECHNOLOGY, label: 'Technology' },
              { value: IndustryCode.MANUFACTURING, label: 'Manufacturing' },
              { value: IndustryCode.RETAIL, label: 'Retail' },
              { value: IndustryCode.SERVICES, label: 'Services' },
              { value: IndustryCode.HEALTHCARE, label: 'Healthcare' },
              { value: IndustryCode.FINANCE, label: 'Finance' },
              { value: IndustryCode.REAL_ESTATE, label: 'Real Estate' },
              { value: IndustryCode.HOSPITALITY, label: 'Hospitality' },
              { value: IndustryCode.CONSTRUCTION, label: 'Construction' },
              { value: IndustryCode.OTHER, label: 'Other' },
            ]}
            value={formData.industry || ''}
            onChange={(value) => updateFormData({ industry: value })}
            required
          />

          {/* Business Model */}
          <CustomDropdown
            label="Business Model"
            placeholder="Select business model..."
            options={[
              { value: BusinessModel.B2B_SAAS, label: 'B2B SaaS' },
              { value: BusinessModel.B2C, label: 'B2C' },
              { value: BusinessModel.MARKETPLACE, label: 'Marketplace' },
              { value: BusinessModel.ECOMMERCE, label: 'E-commerce' },
              { value: BusinessModel.MANUFACTURING, label: 'Manufacturing' },
              { value: BusinessModel.SERVICES, label: 'Services' },
              { value: BusinessModel.OTHER, label: 'Other' },
            ]}
            value={formData.business_model || 'other'}
            onChange={(value) => updateFormData({ business_model: value })}
            required
          />

          {/* Founding Year */}
          <CustomNumberInputField
            label="Founding Year"
            placeholder="e.g., 2018"
            value={formData.founding_year || new Date().getFullYear() - 5}
            onChange={(e) => updateFormData({ founding_year: parseInt(e.target.value) || new Date().getFullYear() - 5 })}
            onBlur={() => {}}
            name="founding_year"
            min={1900}
            max={new Date().getFullYear()}
            required
          />

          {/* Country */}
          <CustomDropdown
            label="Country"
            placeholder="Select country..."
            options={TARGET_COUNTRIES.map((country) => ({
              value: country.code,
              label: `${country.flag} ${country.name} (${country.currencySymbol})`,
            }))}
            value={formData.country_code || ''}
            onChange={(value) => updateFormData({ country_code: value })}
            required
          />
        </div>
      </div>

      {/* Ownership Structure */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Ownership Structure</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Business Type */}
          <CustomDropdown
            label="Business Structure"
            placeholder="Select structure..."
            options={[
              { value: 'sole-trader', label: 'Sole Trader (100% owned)' },
              { value: 'company', label: 'Company (with shareholders)' },
            ]}
            value={formData.business_type || 'company'}
            onChange={(value) => updateFormData({ business_type: value as 'sole-trader' | 'company' })}
          />

          {/* Shares for Sale */}
          {formData.business_type === 'company' && (
            <CustomNumberInputField
              label="% Shares for Sale"
              placeholder="e.g., 50"
              value={formData.shares_for_sale || 100}
              onChange={(e) => updateFormData({ shares_for_sale: parseFloat(e.target.value) || 100 })}
              onBlur={() => {}}
              name="shares_for_sale"
              min={0}
              max={100}
              step={0.1}
              suffix="%"
            />
          )}
        </div>
      </div>

      {/* Financial Data */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Current Year Financials ({Math.min(new Date().getFullYear(), 2100)})</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Revenue */}
          <CustomNumberInputField
            label="Revenue"
            placeholder="e.g., 2,500,000"
            value={formData.revenue || ''}
            onChange={(e) => updateFormData({ revenue: parseFloat(e.target.value.replace(/,/g, '')) || undefined })}
            onBlur={() => {}}
            name="revenue"
            min={0}
            step={1000}
            prefix="€"
            formatAsCurrency
            required
          />

          {/* EBITDA */}
          <div>
            <CustomNumberInputField
              label="EBITDA"
              placeholder="e.g., 500,000"
              value={formData.ebitda || ''}
              onChange={(e) => updateFormData({ ebitda: parseFloat(e.target.value.replace(/,/g, '')) || undefined })}
              onBlur={() => {}}
              name="ebitda"
              step={1000}
              prefix="€"
              formatAsCurrency
              required
            />
            <p className="mt-1 text-xs text-zinc-400">
              Earnings Before Interest, Taxes, Depreciation & Amortization
            </p>
          </div>
        </div>
      </div>

      {/* Historical Data (3 Years) */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Historical Data (Optional)</h3>
          <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded border border-green-700/50">+20% Accuracy</span>
        </div>
        
        <p className="text-sm text-zinc-300 mb-4">
          Adding 3 years of historical data enables growth rate calculation and improves valuation accuracy
        </p>

        <div className="space-y-3">
          {[2023, 2024].map((year) => (
            <div key={year} className="grid grid-cols-3 gap-4 p-3 bg-zinc-900 border border-zinc-700 rounded">
              <div>
                <CustomInputField
                  label="Year"
                  type="text"
                  value={year.toString()}
                  onChange={() => {}}
                  onBlur={() => {}}
                  disabled={true}
                  placeholder=""
                />
              </div>
              <div>
                <CustomNumberInputField
                  label="Revenue (€)"
                  placeholder="Optional"
                  value=""
                  onChange={() => {}}
                  onBlur={() => {}}
                  name={`historical_revenue_${year}`}
                  min={0}
                  step={1000}
                  prefix="€"
                  formatAsCurrency
                />
              </div>
              <div>
                <CustomNumberInputField
                  label="EBITDA (€)"
                  placeholder="Optional"
                  value=""
                  onChange={() => {}}
                  onBlur={() => {}}
                  name={`historical_ebitda_${year}`}
                  step={1000}
                  prefix="€"
                  formatAsCurrency
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
          className="px-6 py-3 border border-zinc-600 rounded-md text-zinc-300 font-medium hover:bg-zinc-700 transition-colors"
        >
          Reset Form
        </button>
        <button
          type="submit"
          disabled={isCalculating || !formData.revenue || !formData.ebitda || !formData.industry || !formData.country_code}
          className="px-6 py-3 bg-primary-600 text-white rounded-md font-medium hover:bg-primary-700 disabled:bg-zinc-700 disabled:text-zinc-500 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
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

