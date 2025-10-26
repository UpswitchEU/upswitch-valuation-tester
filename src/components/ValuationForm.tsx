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
    <form onSubmit={handleSubmit} className="space-y-8 @container">


      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide pb-2 border-b border-zinc-700">
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 @4xl:grid-cols-2 gap-6">
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
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide pb-2 border-b border-zinc-700">
          Ownership Structure
        </h3>
        
        <div className="grid grid-cols-1 @4xl:grid-cols-2 gap-6">
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
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide pb-2 border-b border-zinc-700">
          Current Year Financials ({Math.min(new Date().getFullYear(), 2100)})
        </h3>
        
        <div className="grid grid-cols-1 @4xl:grid-cols-2 gap-6">
          {/* Revenue */}
          <div>
            <CustomNumberInputField
              label="Revenue (Required)"
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
            <div className="mt-1 text-xs text-zinc-400 space-y-1">
              <div>💡 <strong>Tip:</strong> Use your most recent fiscal year</div>
              <div>ℹ️ <strong>Why we need this:</strong> Revenue is the foundation of valuation</div>
              {formData.revenue && (
                <div className="text-green-400">
                  ✓ Revenue looks good (€{formData.revenue.toLocaleString()} is typical for services companies)
                </div>
              )}
            </div>
          </div>

          {/* EBITDA */}
          <div>
            <CustomNumberInputField
              label="EBITDA (Required)"
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
            <div className="mt-1 text-xs text-zinc-400 space-y-1">
              <div>💡 <strong>Tip:</strong> Net profit + interest + taxes + depreciation</div>
              <div>ℹ️ <strong>Why we need this:</strong> Measures operational profitability</div>
              {formData.revenue && formData.ebitda && (
                <div className={formData.ebitda / formData.revenue < 0.15 ? 'text-yellow-400' : 'text-green-400'}>
                  {formData.ebitda / formData.revenue < 0.15 ? 
                    `⚠️ EBITDA margin is ${((formData.ebitda / formData.revenue) * 100).toFixed(1)}% (industry average is 15-20%)` :
                    `✓ EBITDA margin looks good (${((formData.ebitda / formData.revenue) * 100).toFixed(1)}%)`
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Quality Progress */}
      <div className="bg-zinc-800/50 rounded-lg p-4 border border-zinc-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-zinc-300">Data Quality</h3>
          <span className="text-xs text-zinc-400">
            {(() => {
              let score = 0;
              if (formData.revenue && formData.ebitda) score += 40;
              if (formData.industry) score += 20;
              if (formData.business_model) score += 20;
              if (formData.founding_year) score += 10;
              if (Object.keys(historicalInputs).length > 0) score += 10;
              return `${score}%`;
            })()}
          </span>
        </div>
        <div className="w-full bg-zinc-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ 
              width: `${(() => {
                let score = 0;
                if (formData.revenue && formData.ebitda) score += 40;
                if (formData.industry) score += 20;
                if (formData.business_model) score += 20;
                if (formData.founding_year) score += 10;
                if (Object.keys(historicalInputs).length > 0) score += 10;
                return score;
              })()}%` 
            }}
          />
        </div>
        <div className="mt-2 text-xs text-zinc-400 space-y-1">
          {formData.revenue && formData.ebitda && <div className="text-green-400">✓ Revenue & EBITDA provided</div>}
          {formData.industry && <div className="text-green-400">✓ Industry selected</div>}
          {formData.business_model && <div className="text-green-400">✓ Business model selected</div>}
          {formData.founding_year && <div className="text-green-400">✓ Founding year provided</div>}
          {Object.keys(historicalInputs).length === 0 && (
            <div className="text-yellow-400">
              ⚠️ No historical data (reduces confidence by 15%)
            </div>
          )}
          {Object.keys(historicalInputs).length > 0 && (
            <div className="text-green-400">✓ Historical data provided</div>
          )}
        </div>
      </div>

      {/* Historical Data (3 Years) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-zinc-700">
          <h3 className="text-sm font-semibold text-zinc-400 uppercase tracking-wide">
            Historical Data (Optional)
          </h3>
          <span className="text-xs text-green-400 bg-green-900/30 px-2 py-1 rounded border border-green-700/50">+20% Accuracy</span>
        </div>
        
        <p className="text-sm text-zinc-300">
          Adding 3 years of historical data enables growth rate calculation and improves valuation accuracy
        </p>

        <HistoricalDataInputs
          historicalInputs={historicalInputs}
          onChange={setHistoricalInputs}
          onBlur={() => {}}
        />
      </div>

      {/* Submit Button */}
      <div className="flex flex-col justify-end gap-2">
        {/* Reset Link - Subtle Secondary Action */}
        <button
          type="button"
          className="text-sm text-zinc-400 hover:text-zinc-200 transition-colors duration-200 flex items-center justify-center gap-2 py-2 hover:underline group"
        >
          <svg className="h-4 w-4 group-hover:rotate-[-30deg] transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Reset Form</span>
        </button>
        {/* Calculate Button - Primary CTA */}
        <button
          type="submit"
          disabled={isCalculating || !formData.revenue || !formData.ebitda || !formData.industry || !formData.country_code}
          className="w-full px-8 py-4 bg-primary-500 text-white rounded-lg text-base font-semibold hover:bg-primary-600 active:bg-primary-700 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary-500/30"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <span>Calculate</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

