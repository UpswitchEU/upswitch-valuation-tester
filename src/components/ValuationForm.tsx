import React, { useCallback, useEffect, useState } from 'react';
import { useValuationStore } from '../store/useValuationStore';
// import { useReportsStore } from '../store/useReportsStore'; // Deprecated: Now saving to database
import toast from 'react-hot-toast';
import { TARGET_COUNTRIES } from '../config/countries';
import {
  getIndustryGuidance,
  getRevenuePerEmployeeAnalysis,
  getRevenueRangeGuidance,
  validateEbitdaMargin,
  validateRevenue
} from '../config/industryGuidance';
import { useAuth } from '../hooks/useAuth';
import { useBusinessTypes } from '../hooks/useBusinessTypes';
import { suggestionService } from '../services/businessTypeSuggestionApi';
import { industriesApi } from '../services/industriesApi';
import { debounce } from '../utils/debounce';
import { generalLogger } from '../utils/logger';
import { safePreference } from '../utils/numberUtils';
import { CustomBusinessTypeSearch, CustomDropdown, CustomInputField, CustomNumberInputField, HistoricalDataInputs } from './forms';

/**
 * ValuationForm Component
 * 
 * Main form for entering business valuation data.
 */
export const ValuationForm: React.FC = () => {
  const { formData, updateFormData, calculateValuation, quickValuation, isCalculating, error, prefillFromBusinessCard } = useValuationStore();
  const { businessTypes, loading: businessTypesLoading, error: businessTypesError } = useBusinessTypes();
  // const { addReport } = useReportsStore(); // Deprecated: Now saving to database
  const { businessCard, isAuthenticated, user } = useAuth();
  
  // Local state for historical data inputs
  const [historicalInputs, setHistoricalInputs] = useState<{[key: string]: string}>({});
  const [hasPrefilledOnce, setHasPrefilledOnce] = useState(false);
  
  // Industry validation state
  const [industryValidationError, setIndustryValidationError] = useState<string | null>(null);
  const [isValidatingIndustry, setIsValidatingIndustry] = useState(false);
  
  // Employee count validation state
  const [employeeCountError, setEmployeeCountError] = useState<string | null>(null);

  // Debounced quick calculation for live preview
  const debouncedQuickCalc = useCallback(
    debounce((data: typeof formData) => {
      if (data.revenue && data.ebitda && data.industry && data.country_code) {
        quickValuation();
      }
    }, 500),
    []
  );


  // Validate industry field
  const validateIndustry = useCallback(async (industry: string) => {
    if (!industry) {
      setIndustryValidationError(null);
      return;
    }

    setIsValidatingIndustry(true);
    setIndustryValidationError(null);

    try {
      const isValid = await industriesApi.isValidIndustry(industry);
      if (!isValid) {
        setIndustryValidationError(`"${industry}" is not a recognized industry classification. This may affect valuation accuracy.`);
      }
    } catch (error) {
      console.error('Industry validation error:', error);
      // Don't show error to user, just log it
    } finally {
      setIsValidatingIndustry(false);
    }
  }, []);

  // Validate industry when it changes
  useEffect(() => {
    if (formData.industry) {
      validateIndustry(formData.industry);
    }
  }, [formData.industry, validateIndustry]);

  // Trigger live preview on field changes
  useEffect(() => {
    debouncedQuickCalc(formData);
  }, [formData.revenue, formData.ebitda, formData.industry, formData.country_code]);

  // Convert historicalInputs to formData.historical_years_data
  // Backend requires chronological order (oldest first), but UI shows most recent first
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const historicalYears: { year: number; revenue: number; ebitda: number }[] = [];
    
    // Extract all years from historicalInputs
    const yearSet = new Set<number>();
    Object.keys(historicalInputs).forEach(key => {
      const match = key.match(/^(\d{4})_(revenue|ebitda)$/);
      if (match) {
        const year = parseInt(match[1]);
        if (year >= 2000 && year <= currentYear) {
          yearSet.add(year);
        }
      }
    });
    
    // Build historical_years_data array
    yearSet.forEach(year => {
      const revenueKey = `${year}_revenue`;
      const ebitdaKey = `${year}_ebitda`;
      const revenue = historicalInputs[revenueKey];
      const ebitda = historicalInputs[ebitdaKey];
      
      // Only include if at least one field has a value
      if (revenue || ebitda) {
        historicalYears.push({
          year,
          revenue: revenue ? parseFloat(revenue.replace(/,/g, '')) || 0 : 0,
          ebitda: ebitda ? parseFloat(ebitda.replace(/,/g, '')) || 0 : 0,
        });
      }
    });
    
    // Sort chronologically (oldest first) for backend compatibility
    historicalYears.sort((a, b) => a.year - b.year);
    
    // Update formData with sorted historical data
    updateFormData({
      historical_years_data: historicalYears.length > 0 ? historicalYears : undefined
    });
  }, [historicalInputs, updateFormData]);

  // Clear owner concentration fields when switching to sole-trader
  // Set defaults when switching to company
  useEffect(() => {
    if (formData.business_type === 'sole-trader') {
      // Clear owner concentration fields (not applicable for sole traders)
      // Sole traders are inherently 100% owner-operated - no owner concentration analysis needed
      // Only update if values are currently set (avoid unnecessary updates)
      if (formData.number_of_employees !== undefined || formData.number_of_owners !== undefined) {
        updateFormData({
          number_of_employees: undefined,
          number_of_owners: undefined,
        });
      }
    } else if (formData.business_type === 'company') {
      // Set default number_of_owners if not already set (minimum 1 for companies)
      // Only update if value is missing or invalid (avoid unnecessary updates)
      if (!formData.number_of_owners || formData.number_of_owners < 1) {
        updateFormData({ number_of_owners: 1 });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.business_type]); // Only depend on business_type to avoid loops

  // businessTypes now comes directly from useBusinessTypes() hook with full PostgreSQL metadata
  // No conversion needed - preserves dcfPreference, multiplesPreference, keywords, etc.

  // Pre-fill form with business card data when authenticated
  useEffect(() => {
    generalLogger.debug('Pre-fill check', { 
      isAuthenticated, 
      hasBusinessCard: !!businessCard, 
      hasPrefilledOnce,
      businessCard 
    });
    
    if (isAuthenticated && businessCard && !hasPrefilledOnce && businessTypes.length > 0) {
      generalLogger.info('Pre-filling form with business card data', {
        ...businessCard,
        employee_count: businessCard.employee_count ? `${businessCard.employee_count} employees` : 'not available'
      });
      
      // First, use standard prefill
      prefillFromBusinessCard(businessCard);
      
      // Then, try to match business_type_id if available
      if ((businessCard as any).business_type_id) {
        const matchingType = businessTypes.find(
          bt => bt.id === (businessCard as any).business_type_id
        );
        
        if (matchingType) {
          generalLogger.info('Found matching business type from profile', {
            id: matchingType.id,
            title: matchingType.title
          });
          
          updateFormData({
            business_type_id: matchingType.id,
            business_model: matchingType.id,
            industry: matchingType.industry || matchingType.industryMapping || businessCard.industry,
            subIndustry: matchingType.category,
          });
        }
      } else if (businessCard.industry) {
        // Fallback: Try to find matching business type by industry
        const matchingType = businessTypes.find(
          bt => bt.industry === businessCard.industry || bt.industryMapping === businessCard.industry
        );
        
        if (matchingType) {
          generalLogger.info('Found matching business type by industry', {
            id: matchingType.id,
            title: matchingType.title,
            industry: businessCard.industry
          });
          
          updateFormData({
            business_type_id: matchingType.id,
            business_model: matchingType.id,
          });
        }
      }
      
      setHasPrefilledOnce(true);
    }
  }, [isAuthenticated, businessCard, hasPrefilledOnce, prefillFromBusinessCard, businessTypes]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate employee count when owner count is provided
    // NOTE: 0 employees is valid when there are only owner-managers (no other staff)
    if (formData.business_type === 'company' && 
        formData.number_of_owners && 
        formData.number_of_owners > 0 && 
        formData.number_of_employees === undefined) {
      setEmployeeCountError("Employee count is required when owner count is provided to calculate owner concentration risk. Enter 0 if there are no employees besides the owner-managers.");
      toast.error("Please provide employee count (0 is valid if only owner-managers)");
      return;
    }
    
    // Clear validation error if validation passes
    setEmployeeCountError(null);
    
    await calculateValuation();
    
    // Auto-save report to localStorage (will show inline below the form)
    // Results component will appear automatically in App.tsx when result is set
  }, [calculateValuation, formData.business_type, formData.number_of_owners, formData.number_of_employees]);

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
      <div className="space-y-6">
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

          {/* Business Type Selector - replaces Industry, Sub-Industry, and Business Model */}
          <div className="@4xl:col-span-2">
            <CustomBusinessTypeSearch
              value={formData.business_type_id}
              businessTypes={businessTypes}
              onChange={(businessType) => {
                // DIAGNOSTIC: Log selected business type with full details
                console.log('[DIAGNOSTIC-FORM] Business type selected:', {
                  id: businessType.id,
                  title: businessType.title,
                  dcfPreference: businessType.dcfPreference,
                  multiplesPreference: businessType.multiplesPreference,
                  ownerDependencyImpact: businessType.ownerDependencyImpact,
                  keyMetrics: businessType.keyMetrics,
                  hasPreferences: !!(businessType.dcfPreference !== undefined && businessType.multiplesPreference !== undefined),
                  allKeys: Object.keys(businessType)
                });
                
                generalLogger.info('Business type selected', {
                  id: businessType.id,
                  title: businessType.title,
                  industryMapping: businessType.industryMapping,
                  industry: businessType.industry,
                  metadata: {
                    dcfPreference: businessType.dcfPreference,
                    multiplesPreference: businessType.multiplesPreference,
                    ownerDependencyImpact: businessType.ownerDependencyImpact
                  }
                });
                
                // Validate that business type has industry classification
                if (!businessType.industry && !businessType.industryMapping) {
                  console.error('Business type missing industry classification:', businessType);
                  toast.error('Selected business type has no industry classification. Please contact support.');
                  return;
                }

                updateFormData({
                  business_type_id: businessType.id,
                  business_model: businessType.id, // Use business type id as business model
                  industry: businessType.industry || businessType.industryMapping,
                  subIndustry: businessType.category || undefined,
                  // Store metadata for business context (convert to numbers with validation)
                  _internal_dcf_preference: safePreference(businessType.dcfPreference),
                  _internal_multiples_preference: safePreference(businessType.multiplesPreference),
                  _internal_owner_dependency_impact: safePreference(businessType.ownerDependencyImpact),
                  _internal_key_metrics: businessType.keyMetrics,
                  _internal_typical_employee_range: businessType.typicalEmployeeRange,
                  _internal_typical_revenue_range: businessType.typicalRevenueRange,
                });
              }}
              onSuggest={async (suggestion) => {
                generalLogger.info('Business type suggested', { suggestion });
                
                try {
                  await suggestionService.submitSuggestion({
                    suggestion,
                    user_id: user?.id,
                    context: {
                      industry: formData.industry,
                      search_query: suggestion,
                      description: `User searched for: ${suggestion}`
                    }
                  });
                  
                  toast.success(
                    `Thanks! We'll review "${suggestion}" and add it to our database soon.`,
                    { duration: 5000 }
                  );
                } catch (error) {
                  generalLogger.error('Failed to submit suggestion', { error });
                  toast.success(
                    `Thanks for the suggestion! We've logged "${suggestion}" for review.`,
                    { duration: 5000 }
                  );
                }
              }}
              placeholder="Search for your business type..."
              required
              loading={businessTypesLoading}
              disabled={businessTypesLoading}
            />
            {businessTypesError && (
              <p className="mt-2 text-sm text-yellow-400">
                ⚠️ Using offline business types. Some options may be limited.
              </p>
            )}
          </div>

          {/* Founding Year */}
          <CustomNumberInputField
            label="Year Business Commenced Trading"
            placeholder="e.g., 2018 (first commercial revenue)"
            value={formData.founding_year || new Date().getFullYear() - 5}
            onChange={(e) => updateFormData({ founding_year: parseInt(e.target.value) || new Date().getFullYear() - 5 })}
            onBlur={() => {}}
            name="founding_year"
            min={1900}
            max={new Date().getFullYear()}
            showArrows={true}
            helpText="Year the company first generated revenue from operations. For restructured businesses, use original trading start date, not incorporation date."
            required
          />

          {/* Country */}
          <CustomDropdown
            label="Primary Operating Country"
            placeholder="Select country..."
            options={TARGET_COUNTRIES.map((country) => ({
              value: country.code,
              label: `${country.flag} ${country.name} (${country.currencySymbol})`,
            }))}
            value={formData.country_code || ''}
            onChange={(value) => updateFormData({ country_code: value })}
            helpText="Country where majority of operations and revenue occur. For multi-country businesses, select headquarters location. Affects market multiples, risk-free rates, and tax assumptions."
            required
          />
        </div>
      </div>

      {/* Ownership Structure */}
      <div className="space-y-6">
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
              label="Equity Stake for Sale (%)"
              placeholder="e.g., 51 (majority control) or 25 (minority stake)"
              value={formData.shares_for_sale || 100}
              onChange={(e) => updateFormData({ shares_for_sale: parseFloat(e.target.value) || 100 })}
              onBlur={() => {}}
              name="shares_for_sale"
              min={0}
              max={100}
              step={0.1}
              suffix="%"
              helpText="Percentage of company ownership being valued for transaction. Minority stakes (<50%) may include control discount of 15-30%. Full sale (100%) maximizes strategic premium."
            />
          )}
        </div>

        {/* Owner Concentration Fields - Only for Companies */}
        {formData.business_type === 'company' && (
          <div className="grid grid-cols-1 @4xl:grid-cols-2 gap-6">
            <CustomNumberInputField
              label="Active Owner-Managers"
              placeholder="e.g., 2 (founder + COO who owns equity)"
              value={formData.number_of_owners !== undefined ? String(formData.number_of_owners) : ''}
              onChange={(e) => {
                // Allow empty string during editing
                if (e.target.value === '') {
                  updateFormData({ number_of_owners: undefined });
                  return;
                }
                const parsedValue = parseInt(e.target.value);
                if (!isNaN(parsedValue)) {
                  // Apply min/max constraints only when there's a valid number
                  const value = Math.max(1, Math.min(100, parsedValue));
                  updateFormData({ number_of_owners: value });
                }
              }}
              onBlur={(e) => {
                // Apply default value of 1 only on blur if field is empty
                if (e.target.value === '' || !e.target.value) {
                  updateFormData({ number_of_owners: 1 });
                }
              }}
              name="number_of_owners"
              min={1}
              max={100}
              step={1}
              showArrows={true}
              helpText="Shareholders who actively work in the business in executive or management roles. Include: C-suite shareholders, working directors, founder-operators. Exclude: passive investors, silent partners, external board members. Only applicable for companies with shareholders. High owner concentration (>25% of workforce) typically reduces valuation by 7-20%."
            />
            
            <CustomNumberInputField
              label="Full-Time Equivalent (FTE) Employees"
              placeholder="e.g., 12 (include part-time as FTE)"
              value={formData.number_of_employees !== undefined ? formData.number_of_employees.toString() : ''}
              onChange={(e) => {
                const inputValue = e.target.value;
                // Allow empty string, 0, or positive numbers
                // Use nullish coalescing to preserve 0 as a valid value
                const value = inputValue === '' 
                  ? undefined 
                  : (inputValue === '0' 
                      ? 0 
                      : (parseInt(inputValue) > 0 ? parseInt(inputValue) : undefined));
                updateFormData({ number_of_employees: value });
                // Clear error when user provides a valid value (including 0)
                if (employeeCountError && value !== undefined) {
                  setEmployeeCountError(null);
                }
              }}
              onBlur={() => {}}
              name="number_of_employees"
              min={0}
              step={1}
              error={employeeCountError || undefined}
              touched={!!employeeCountError}
              required={formData.business_type === 'company' && !!(formData.number_of_owners && formData.number_of_owners > 0)}
              helpText={`Total workforce converted to full-time equivalents. Part-time employees count proportionally (e.g., 2 half-time = 1 FTE). Excludes contractors and external consultants. Enter 0 if there are no employees besides the owner-managers. Used to assess operational scale and key person risk.${formData.business_type === 'company' && formData.number_of_owners && formData.number_of_owners > 0 ? ' Required when owner count is provided. Owner concentration risk (7-20% discount) cannot be calculated without this data. 0 is a valid value when there are only owner-managers.' : ''}`}
            />
            
            {/* Owner Concentration Risk Warning */}
            {formData.business_type === 'company' && 
             formData.number_of_owners !== undefined && 
             formData.number_of_employees !== undefined && (() => {
              const ownerRatio = formData.number_of_employees === 0 
                ? 1.0 
                : formData.number_of_owners / formData.number_of_employees;
              
              if (ownerRatio >= 0.5) {
                const riskLevel = ownerRatio >= 0.5 ? 'CRITICAL' : 'HIGH';
                const discount = ownerRatio >= 0.5 ? '-20%' : '-12%';
                const isCritical = formData.number_of_employees === 0;
                
                return (
                  <div className={`p-3 rounded-lg border-l-4 ${isCritical ? 'bg-red-50 border-red-500' : 'bg-yellow-50 border-yellow-500'}`}>
                    <div className="flex items-start gap-2">
                      <svg className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isCritical ? 'text-red-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1">
                        <h4 className={`font-semibold text-sm ${isCritical ? 'text-red-900' : 'text-yellow-900'}`}>
                          ⚠️ {riskLevel} Key Person Risk - Valuation Impact: {discount}
                        </h4>
                        <p className={`text-xs mt-1 ${isCritical ? 'text-red-800' : 'text-yellow-800'}`}>
                          {isCritical ? (
                            <>
                              This business is <strong>100% owner-operated</strong> with no non-owner employees. 
                              This represents maximum key person risk and will reduce your valuation multiple by <strong>20%</strong>.
                            </>
                          ) : (
                            <>
                              Owner ratio of <strong>{(ownerRatio * 100).toFixed(0)}%</strong> indicates high key person dependency. 
                              This will reduce your valuation multiple by <strong>{discount}</strong>.
                            </>
                          )}
                        </p>
                        {isCritical && (
                          <p className="text-xs mt-2 text-green-700 bg-green-50 border border-green-200 rounded p-2">
                            💡 <strong>Tip:</strong> Hiring 2-3 employees could increase your business value by €150K-200K
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }
              return null;
            })()}
          </div>
        )}
      </div>

      {/* Financial Data */}
      <div className="space-y-6">
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
            {(() => {
              const revenueGuidance = getIndustryGuidance(formData.industry || 'other', 'revenue');
              const validation = formData.revenue && formData.industry
                ? validateRevenue(
                    formData.revenue,
                    formData.industry,
                    formData.subIndustry,
                    formData.number_of_employees,
                    formData.founding_year,
                    formData.country_code
                  )
                : null;
              
              const rangeGuidance = formData.subIndustry && formData.industry
                ? getRevenueRangeGuidance(formData.industry, formData.subIndustry, formData.number_of_employees)
                : null;
              
              return (
                <div className="mt-2 text-xs text-zinc-400 space-y-1">
                  <div>💡 <strong>Tip:</strong> {revenueGuidance.tip}</div>
                  <div>ℹ️ <strong>Why:</strong> {revenueGuidance.why}</div>
                  {revenueGuidance.warning && (
                    <div className="text-yellow-400">⚠️ {revenueGuidance.warning}</div>
                  )}
                  
                  {/* Sub-industry range guidance */}
                  {rangeGuidance && (
                    <div className="text-blue-400">
                      📊 <strong>{rangeGuidance.message}</strong>
                    </div>
                  )}
                  
                  {/* Revenue validation */}
                  {validation && (
                    <div className={
                      validation.severity === 'success' ? 'text-green-400' :
                      validation.severity === 'warning' ? 'text-yellow-400' :
                      validation.severity === 'error' ? 'text-red-400' :
                      'text-blue-400'
                    }>
                      {validation.severity === 'success' ? '✓' :
                       validation.severity === 'warning' ? '⚠️' :
                       validation.severity === 'error' ? '❌' : 'ℹ️'} 
                      {validation.message}
                    </div>
                  )}
                  
                  {/* Revenue per employee analysis */}
                  {formData.number_of_employees && formData.revenue && (
                    <div className="text-zinc-400">
                      👥 <strong>Revenue per employee:</strong> 
                      €{Math.round(formData.revenue / formData.number_of_employees).toLocaleString()}
                      {getRevenuePerEmployeeAnalysis(
                        formData.revenue / formData.number_of_employees,
                        formData.industry || 'other',
                        formData.subIndustry
                      )}
                    </div>
                  )}
                  
                  {/* Suggestion if validation fails */}
                  {validation?.suggestion && (
                    <div className="text-blue-400">
                      💡 {validation.suggestion}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* EBITDA */}
          <div>
            <CustomNumberInputField
              label="EBITDA (Required)"
              placeholder="e.g., 500,000"
              value={formData.ebitda !== undefined && formData.ebitda !== null ? formData.ebitda : ''}
              onChange={(e) => {
                const cleanedValue = e.target.value.replace(/,/g, '');
                const numValue = parseFloat(cleanedValue);
                // Preserve negative values: only set undefined if NaN, not if value is 0 or negative
                updateFormData({ ebitda: isNaN(numValue) ? undefined : numValue });
              }}
              onBlur={() => {}}
              name="ebitda"
              step={1000}
              prefix="€"
              formatAsCurrency
              required
            />
            {(() => {
              const ebitdaGuidance = getIndustryGuidance(formData.industry || 'other', 'ebitda');
              const validation = formData.revenue && formData.ebitda
                ? validateEbitdaMargin(formData.revenue, formData.ebitda, formData.industry || 'other')
                : null;
              
              return (
                <div className="mt-2 text-xs text-zinc-400 space-y-1">
                  <div>💡 <strong>Tip:</strong> {ebitdaGuidance.tip}</div>
                  <div>ℹ️ <strong>Why:</strong> {ebitdaGuidance.why}</div>
                  {validation && (
                    <div className={
                      validation.severity === 'success' ? 'text-green-400' :
                      validation.severity === 'warning' ? 'text-yellow-400' :
                      'text-blue-400'
                    }>
                      {validation.severity === 'success' ? '✓' :
                       validation.severity === 'warning' ? '⚠️' : 'ℹ️'} {validation.message}
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Data Quality Progress */}
      <div className="space-y-6">
        <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
          <div className="flex items-center justify-between mb-4">
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
          {formData.industry && (
            <div className="text-green-400">
              ✓ Industry selected
              {isValidatingIndustry && <span className="ml-2 text-yellow-400">(validating...)</span>}
            </div>
          )}
          {industryValidationError && (
            <div className="text-yellow-400">
              ⚠️ {industryValidationError}
            </div>
          )}
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
      </div>

      {/* Historical Data (3 Years) */}
      <div className="space-y-6">
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
          foundingYear={formData.founding_year}
          currentYear={new Date().getFullYear()}
        />
      </div>

      {/* Submit Button */}
      <div className="flex flex-col justify-end gap-4">
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
      
      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-red-800">Calculation Failed</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    useValuationStore.getState().setError(null);
                  }}
                  className="text-sm font-medium text-red-800 hover:text-red-900 underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};

