import React, { useCallback, useState, useEffect } from 'react';
import { useValuationStore } from '../store/useValuationStore';
// import { useReportsStore } from '../store/useReportsStore'; // Deprecated: Now saving to database
import { useAuth } from '../hooks/useAuth';
import { debounce } from '../utils/debounce';
import { TARGET_COUNTRIES } from '../config/countries';
import { useBusinessTypes } from '../hooks/useBusinessTypes';
import { IndustryCode } from '../types/valuation';
import { CustomInputField, CustomNumberInputField, CustomDropdown, HistoricalDataInputs } from './forms';
import { generalLogger } from '../utils/logger';

/**
 * ValuationForm Component
 * 
 * Main form for entering business valuation data.
 */
export const ValuationForm: React.FC = () => {
  const { formData, updateFormData, calculateValuation, quickValuation, isCalculating, prefillFromBusinessCard } = useValuationStore();
  const { businessTypeOptions, loading: businessTypesLoading, error: businessTypesError } = useBusinessTypes();
  // const { addReport } = useReportsStore(); // Deprecated: Now saving to database
  const { businessCard, isAuthenticated } = useAuth();
  
  // Local state for historical data inputs
  const [historicalInputs, setHistoricalInputs] = useState<{[key: string]: string}>({});
  const [hasPrefilledOnce, setHasPrefilledOnce] = useState(false);

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

  // Pre-fill form with business card data when authenticated
  useEffect(() => {
    generalLogger.debug('Pre-fill check', { 
      isAuthenticated, 
      hasBusinessCard: !!businessCard, 
      hasPrefilledOnce,
      businessCard 
    });
    
    if (isAuthenticated && businessCard && !hasPrefilledOnce) {
      generalLogger.info('Pre-filling form with business card data', {
        ...businessCard,
        employee_count: businessCard.employee_count ? `${businessCard.employee_count} employees` : 'not available'
      });
      prefillFromBusinessCard(businessCard);
      setHasPrefilledOnce(true);
    }
  }, [isAuthenticated, businessCard, hasPrefilledOnce, prefillFromBusinessCard]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    await calculateValuation();
    
    // Auto-save report to localStorage (will show inline below the form)
    // Results component will appear automatically in App.tsx when result is set
  }, [calculateValuation]);

  // 📝 DEPRECATED: Auto-save to localStorage
  // Now handled by calculateValuation() → saveToBackend()
  // useEffect(() => {
  //   if (result && formData.company_name) {
  //     addReport({
  //       company_name: formData.company_name,
  //       source: 'manual',
  //       result: result,
  //       form_data: formData,
  //     });
  //   }
  // }, [result?.valuation_id]);



  // Historical data is now handled by HistoricalDataInputs component

  return (
    <form onSubmit={handleSubmit} className="space-y-6">


      {/* Basic Information */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
        
        <div className="grid grid-cols-1 gap-6">
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
          <div>
            <CustomDropdown
              label="Business Model"
              placeholder={businessTypesLoading ? "Loading business types..." : "Select your business type..."}
              options={businessTypeOptions.map(type => ({
                value: type.value,
                label: type.label,
              }))}
              value={formData.business_model || 'other'}
              onChange={(value) => updateFormData({ business_model: value })}
              required
              disabled={businessTypesLoading}
            />
            {businessTypesError && (
              <p className="mt-1 text-sm text-yellow-600">
                ⚠️ Using offline business types. Some options may be limited.
              </p>
            )}
          </div>

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

          {/* Number of Employees */}
          <CustomNumberInputField
            label="Number of Employees"
            placeholder="e.g., 25"
            value={formData.number_of_employees || ''}
            onChange={(e) => {
              const value = parseInt(e.target.value) || undefined;
              updateFormData({ number_of_employees: value });
            }}
            onBlur={() => {}}
            name="number_of_employees"
            min={0}
            step={1}
          />
        </div>
      </div>

      {/* Ownership Structure */}
      <div className="bg-zinc-800 rounded-lg border border-zinc-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Ownership Structure</h3>
        
        <div className="grid grid-cols-1 gap-6">
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
        
        <div className="grid grid-cols-1 gap-6">
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

        <HistoricalDataInputs
          historicalInputs={historicalInputs}
          onChange={setHistoricalInputs}
          onBlur={() => {}}
        />
      </div>

      {/* Submit Button */}
      <div className="flex flex-col sm:flex-row justify-end gap-4">
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

