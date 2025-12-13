import React, { useCallback, useEffect, useState } from 'react';
import { useValuationSessionStore } from '../store/useValuationSessionStore';
import { useValuationStore } from '../store/useValuationStore';
// import { useReportsStore } from '../store/useReportsStore'; // Deprecated: Now saving to database
import toast from 'react-hot-toast';
import type { BusinessType } from '../services/businessTypesApi';
import { TARGET_COUNTRIES } from '../config/countries';
import {
  getIndustryGuidance,
  validateEbitdaMargin,
  validateRevenue
} from '../config/industryGuidance';
import { useAuth } from '../hooks/useAuth';
import { useBusinessTypes } from '../hooks/useBusinessTypes';
import { suggestionService } from '../services/businessTypeSuggestionApi';
import type { ValuationRequest } from '../types/valuation';
import { debounce } from '../utils/debounce';
import { generalLogger } from '../utils/logger';
import { safePreference } from '../utils/numberUtils';
import { CompanyNameInput, CustomBusinessTypeSearch, CustomDropdown, CustomNumberInputField, HistoricalDataInputs } from './forms';
import { RegenerationWarningModal } from './RegenerationWarningModal';
import { InfoIcon } from './ui/InfoIcon';

/**
 * ValuationForm Component
 * 
 * Main form for entering business valuation data.
 */
export const ValuationForm: React.FC = () => {
  const { formData, updateFormData, calculateValuation, quickValuation, isCalculating, error, prefillFromBusinessCard, result } = useValuationStore();
  const { session, updateSessionData, getSessionData } = useValuationSessionStore();
  const { businessTypes, loading: businessTypesLoading, error: businessTypesError } = useBusinessTypes();
  // const { addReport } = useReportsStore(); // Deprecated: Now saving to database
  const { businessCard, isAuthenticated, user } = useAuth();
  
  // Track if we've loaded session data to prevent sync loop
  const [hasLoadedSessionData, setHasLoadedSessionData] = useState(false);
  
  // Regeneration warning modal state
  const [showRegenerationWarning, setShowRegenerationWarning] = useState(false);
  const [regenerateConfirmed, setRegenerateConfirmed] = useState(false);
  
  // Auto-focus logic removed - no automatic field jumping
  
  // Match business type string to business_type_id
  const matchBusinessType = useCallback((query: string, businessTypes: BusinessType[]): string | null => {
    if (!query || !businessTypes || businessTypes.length === 0) return null;
    
    const queryLower = query.toLowerCase().trim();
    
    // 1. Exact match on title (case-insensitive)
    const exactMatch = businessTypes.find(bt =>
      bt.title.toLowerCase() === queryLower
    );
    if (exactMatch) {
      generalLogger.info('Matched business type (exact)', { query, matched: exactMatch.title, value: exactMatch.id });
      return exactMatch.id;
    }
    
    // 2. Match on category
    const categoryMatch = businessTypes.find(bt =>
      bt.category.toLowerCase().includes(queryLower) ||
      queryLower.includes(bt.category.toLowerCase())
    );
    if (categoryMatch) {
      generalLogger.info('Matched business type (category)', { query, matched: categoryMatch.title, value: categoryMatch.id });
      return categoryMatch.id;
    }
    
    // 3. Partial match on title (contains)
    const partialMatch = businessTypes.find(bt =>
      bt.title.toLowerCase().includes(queryLower) ||
      queryLower.includes(bt.title.toLowerCase())
    );
    if (partialMatch) {
      generalLogger.info('Matched business type (partial)', { query, matched: partialMatch.title, value: partialMatch.id });
      return partialMatch.id;
    }
    
    // 4. Common variations mapping
    const variations: Record<string, string[]> = {
      'saas': ['saas', 'software as a service', 'software service'],
      'restaurant': ['restaurant', 'cafe', 'bistro', 'dining'],
      'e-commerce': ['e-commerce', 'ecommerce', 'online store', 'online shop'],
      'manufacturing': ['manufacturing', 'manufacturer', 'production'],
      'consulting': ['consulting', 'consultant', 'advisory'],
      'tech startup': ['tech startup', 'startup', 'tech company'],
    };
    
    for (const [key, variants] of Object.entries(variations)) {
      if (variants.some(v => queryLower.includes(v))) {
        const variationMatch = businessTypes.find(bt => 
          bt.title.toLowerCase().includes(key) ||
          bt.keywords?.some((k: string) => k.toLowerCase().includes(key))
        );
        if (variationMatch) {
          generalLogger.info('Matched business type (variation)', { query, matched: variationMatch.title, value: variationMatch.id });
          return variationMatch.id;
        }
      }
    }
    
    generalLogger.warn('No business type match found', { query });
    return null;
  }, []);

  // Load session data into form when switching to manual view (one-time)
  useEffect(() => {
    if (session && session.currentView === 'manual' && !hasLoadedSessionData) {
      const sessionData = getSessionData();
      const prefilledQuery = (session.partialData as any)?._prefilledQuery as string | undefined;
      
      // Convert ValuationRequest to ValuationFormData format
      const formDataUpdate: Partial<any> = {
        company_name: sessionData?.company_name,
        country_code: sessionData?.country_code,
        industry: sessionData?.industry,
        business_model: sessionData?.business_model,
        founding_year: sessionData?.founding_year,
        revenue: sessionData?.current_year_data?.revenue || (sessionData as any)?.revenue,
        ebitda: sessionData?.current_year_data?.ebitda || (sessionData as any)?.ebitda,
        current_year_data: sessionData?.current_year_data,
        historical_years_data: sessionData?.historical_years_data,
        number_of_employees: sessionData?.number_of_employees,
        number_of_owners: sessionData?.number_of_owners,
        recurring_revenue_percentage: sessionData?.recurring_revenue_percentage,
        comparables: sessionData?.comparables,
        business_type_id: sessionData?.business_type_id,
        business_type: sessionData?.business_type,
        shares_for_sale: sessionData?.shares_for_sale,
      };
      
      // If we have a prefilledQuery from homepage and no business_type_id yet, try to match it
      if (prefilledQuery && !formDataUpdate.business_type_id && businessTypes.length > 0) {
        const matchedBusinessTypeId = matchBusinessType(prefilledQuery, businessTypes);
        if (matchedBusinessTypeId) {
          const matchedBusinessType = businessTypes.find(bt => bt.id === matchedBusinessTypeId);
          if (matchedBusinessType) {
            formDataUpdate.business_type_id = matchedBusinessTypeId;
            formDataUpdate.business_model = matchedBusinessTypeId;
            formDataUpdate.industry = matchedBusinessType.industry || matchedBusinessType.industryMapping;
            generalLogger.info('Prefilled business type from homepage query', {
              query: prefilledQuery,
              businessTypeId: matchedBusinessTypeId,
              businessTypeTitle: matchedBusinessType.title
            });
          }
        }
      }
      
      // Remove undefined values
      Object.keys(formDataUpdate).forEach(key => {
        if (formDataUpdate[key] === undefined) {
          delete formDataUpdate[key];
        }
      });
      
      if (Object.keys(formDataUpdate).length > 0) {
        updateFormData(formDataUpdate);
        setHasLoadedSessionData(true);
        
        generalLogger.info('Loaded session data into form', { 
          hasCompanyName: !!formDataUpdate.company_name,
          hasRevenue: !!formDataUpdate.revenue,
          hasBusinessType: !!formDataUpdate.business_type_id,
          fieldsLoaded: Object.keys(formDataUpdate).length
        });
      }
    }
  }, [session?.currentView, session?.sessionId, session?.partialData, getSessionData, updateFormData, hasLoadedSessionData, businessTypes, matchBusinessType]);
  
  // Debounced sync form data to session store (500ms delay)
  const debouncedSyncToSession = useCallback(
    debounce(async (data: typeof formData) => {
      if (!session || !data || Object.keys(data).length === 0) {
        return;
      }
      
      try {
      // Convert ValuationFormData to Partial<ValuationRequest> for session
        const sessionUpdate: Partial<any> = {
          company_name: data.company_name,
          country_code: data.country_code,
          industry: data.industry,
          business_model: data.business_model,
          founding_year: data.founding_year,
          current_year_data: {
            year: data.current_year_data?.year || new Date().getFullYear(),
            revenue: data.revenue || data.current_year_data?.revenue || 0,
            ebitda: data.ebitda || data.current_year_data?.ebitda || 0,
            ...(data.current_year_data?.total_assets && { total_assets: data.current_year_data.total_assets }),
            ...(data.current_year_data?.total_debt && { total_debt: data.current_year_data.total_debt }),
            ...(data.current_year_data?.cash && { cash: data.current_year_data.cash }),
          },
          historical_years_data: data.historical_years_data,
          number_of_employees: data.number_of_employees,
          number_of_owners: data.number_of_owners,
          recurring_revenue_percentage: data.recurring_revenue_percentage,
          comparables: data.comparables,
          business_type_id: data.business_type_id,
          business_type: data.business_type,
          shares_for_sale: data.shares_for_sale,
          business_context: data.business_context,
        };
        
        // Remove undefined values
        Object.keys(sessionUpdate).forEach(key => {
          if (sessionUpdate[key] === undefined) {
            delete sessionUpdate[key];
          }
        });
        
        await updateSessionData(sessionUpdate);
        generalLogger.debug('Synced form data to session', {
          reportId: session.reportId,
          fieldsUpdated: Object.keys(sessionUpdate).length,
        });
      } catch (err) {
        generalLogger.warn('Failed to sync form data to session', { error: err });
      }
    }, 500),
    [session, updateSessionData]
  );
  
  // Sync form data to session store whenever it changes (debounced)
  useEffect(() => {
    if (hasLoadedSessionData && formData && Object.keys(formData).length > 0) {
      debouncedSyncToSession(formData);
    }
  }, [formData, debouncedSyncToSession, hasLoadedSessionData]);
  
  // Local state for historical data inputs
  const [historicalInputs, setHistoricalInputs] = useState<{[key: string]: string}>({});
  const [hasPrefilledOnce, setHasPrefilledOnce] = useState(false);
  
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
    
    // Check if there's an existing completed report with actual results
    // Only show warning if we have a real result, not just a stale session timestamp
    const hasExistingReport = result?.valuation_id && result?.html_report;
    
    if (hasExistingReport && !regenerateConfirmed) {
      setShowRegenerationWarning(true);
      return;
    }
    
    // Reset confirmation flag for next time
    setRegenerateConfirmed(false);
    
    await calculateValuation();
    
    // Auto-save report to localStorage (will show inline below the form)
    // Results component will appear automatically in App.tsx when result is set
  }, [calculateValuation, formData.business_type, formData.number_of_owners, formData.number_of_employees, result, session, regenerateConfirmed]);

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
    <form onSubmit={handleSubmit} className="space-y-12 @container">


      {/* Basic Information */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-white/10 tracking-tight">
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 @4xl:grid-cols-2 gap-6">
          {/* Business Type Selector - replaces Industry, Sub-Industry, and Business Model */}
          {/* MOVED TO TOP: Aligns with AI-guided flow & enables intelligent triage from question 1 */}
          <div className="@4xl:col-span-2">
            <CustomBusinessTypeSearch
              value={formData.business_type_id}
              businessTypes={businessTypes}
              onChange={(businessType) => {
                // Log selected business type for debugging
                generalLogger.debug('Business type selected', {
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
                  chatLogger.warn('Business type missing industry classification', { businessType });
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
              <p className="mt-2 text-sm text-harvest-500">
                ⚠️ Using offline business types. Some options may be limited.
              </p>
            )}
          </div>

          {/* Company Name */}
          {/* MOVED AFTER BUSINESS TYPE: Enables context-aware KBO validation */}
          <CompanyNameInput
            label="Company Name"
            type="text"
            name="company_name"
            value={formData.company_name || ''}
            onChange={(value) => updateFormData({ company_name: value })}
            countryCode={formData.country_code || 'BE'}
            placeholder="e.g., Acme GmbH"
            required
            onCompanySelect={(company) => {
              generalLogger.info('KBO Company Selected in Manual Flow', { 
                name: company.company_name, 
                id: company.company_id,
                registration: company.registration_number 
              });
              
              // Optional data enrichment (async/non-blocking)
              const updates: Partial<ValuationRequest> = {
                company_name: company.company_name,
                // Ensure country matches KBO result (usually BE)
                country_code: company.country_code || formData.country_code || 'BE',
              };

              // Extract City from address if possible (Format: "Street 123, 1000 City")
              if (company.address) {
                const cityMatch = company.address.match(/\d{4}\s+([^,]+)/);
                if (cityMatch && cityMatch[1]) {
                  updates.city = cityMatch[1].trim();
                }
              }

              // Store verified registration number in context for the report
              // We append it to business_highlights to ensure it appears in the "Business Overview" section
              const regInfo = `Verified Registration: ${company.registration_number}`;
              const currentHighlights = formData.business_highlights || '';
              if (!currentHighlights.includes(regInfo)) {
                updates.business_highlights = currentHighlights 
                  ? `${currentHighlights}\n${regInfo}`
                  : regInfo;
              }

              updateFormData(updates);
            }}
          />

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
            helpText="Start of commercial operations. Used to calculate track record length. Companies with <3 years of history typically attract a 'Startup Risk Premium' (higher discount rate) due to lack of proven stability."
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
            helpText="Primary economic environment. Determines the Risk-Free Rate and Equity Risk Premium used in the discount rate. For multi-jurisdiction entities, select the country with >50% of EBITDA contribution."
            required
          />
        </div>
      </div>

      {/* Ownership Structure */}
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-white/10 tracking-tight">
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
              helpText="Equity interest to be valued. Minority stakes (<50%) often incur a 'Discount for Lack of Control' (DLOC) of 15-30%. Majority stakes (>50%) may command a 'Control Premium' reflecting the value of strategic decision-making power."
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
              helpText="Number of equity holders with critical operational roles. Used to assess 'Key Person Risk'. High dependency on owner-operators (vs. professional management) increases the Specific Risk Premium, reducing the valuation multiple by 5-20%."
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
              helpText={`Normalized workforce count (Full-Time Equivalents). Critical for calculating Revenue/Employee efficiency ratios and assessing 'Key Person Dependency'. A higher ratio of employees to owners indicates transferable organizational value.${formData.business_type === 'company' && formData.number_of_owners && formData.number_of_owners > 0 ? ' Required for Key Person Risk calculation. 0 is valid for owner-only entities.' : ''}`}
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
                  <div className={`p-4 rounded-xl border ${isCritical ? 'bg-accent-50/90 border-accent-200 text-accent-900' : 'bg-harvest-tint/90 border-harvest-200 text-harvest-900'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${isCritical ? 'bg-accent-100 text-accent-600' : 'bg-harvest-100 text-harvest-600'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-sm mb-1">
                          {riskLevel} Key Person Risk - Valuation Impact: {discount}
                        </h4>
                        <p className="text-sm opacity-90 leading-relaxed">
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
                          <div className="mt-3 flex items-start gap-2 text-xs font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-lg p-2.5">
                            <span>💡</span>
                            <span><strong>Tip:</strong> Hiring 2-3 employees could increase your business value by €150K-200K</span>
                          </div>
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
        <h3 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-white/10 tracking-tight">
          Current Year Financials ({Math.min(new Date().getFullYear(), 2100)})
        </h3>
        
        <div className="grid grid-cols-1 @4xl:grid-cols-2 gap-6">
          {/* Revenue */}
          <div>
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
              
              // Construct unified help text for tooltip
              const helpText = [
                revenueGuidance.tip ? `Tip: ${revenueGuidance.tip}` : '',
                revenueGuidance.why ? `Why: ${revenueGuidance.why}` : '',
                validation?.message ? `Note: ${validation.message}` : '',
                (formData.number_of_employees && formData.revenue) 
                  ? `Revenue per employee: €${Math.round(formData.revenue / formData.number_of_employees).toLocaleString()}` 
                  : ''
              ].filter(Boolean).join(' ');

              return (
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
                  helpText={helpText}
                />
              );
            })()}
          </div>

          {/* EBITDA */}
          <div>
            {(() => {
              const ebitdaGuidance = getIndustryGuidance(formData.industry || 'other', 'ebitda');
              const validation = formData.revenue && formData.ebitda
                ? validateEbitdaMargin(formData.revenue, formData.ebitda, formData.industry || 'other')
                : null;
              
              const helpText = [
                ebitdaGuidance.tip ? `Tip: ${ebitdaGuidance.tip}` : '',
                ebitdaGuidance.why ? `Why: ${ebitdaGuidance.why}` : '',
                validation?.message ? `Note: ${validation.message}` : ''
              ].filter(Boolean).join(' ');

              return (
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
                  min={-1000000000} // Allow negative EBITDA
                  step={1000}
                  prefix="€"
                  formatAsCurrency
                  required
                  helpText={helpText}
                />
              );
            })()}
          </div>
        </div>
      </div>

      {/* Historical Data (3 Years) */}
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/10">
          <h3 className="text-xl font-semibold text-white tracking-tight flex items-center">
            Historical Data (Optional)
            <InfoIcon content="Historical financials allow for CAGR (Compound Annual Growth Rate) calculation and trend analysis. Demonstrating consistent growth and margin stability reduces perceived risk, directly supporting a higher valuation tier." position="top" size={20} className="ml-1.5" />
          </h3>
        </div>

        <HistoricalDataInputs
          historicalInputs={historicalInputs}
          onChange={setHistoricalInputs}
          onBlur={() => {}}
          foundingYear={formData.founding_year}
          currentYear={new Date().getFullYear()}
        />
      </div>

      {/* Submit Button */}
      <div className="pt-6 border-t border-zinc-700">
        <button
          type="submit"
          disabled={isCalculating || !formData.revenue || !formData.ebitda || !formData.industry || !formData.country_code}
          className={`
            w-full justify-center px-8 py-4 rounded-xl font-semibold text-lg shadow-lg
            transition-all duration-200 ease-out
            flex items-center gap-3
            active:scale-[0.98]
            ${(isCalculating || !formData.revenue || !formData.ebitda || !formData.industry || !formData.country_code)
              ? 'bg-zinc-800/30 text-zinc-500 border border-zinc-700 cursor-not-allowed' 
              : 'text-white bg-gradient-to-r from-accent-600 to-accent-500 hover:from-accent-500 hover:to-accent-400 hover:shadow-accent-500/20'
            }
          `}
        >
          {isCalculating ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Calculating...</span>
            </>
          ) : (
            <>
              <span>Calculate Valuation</span>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </>
          )}
        </button>
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mt-4 p-4 bg-accent-50/50 border-l-4 border-accent-400 rounded-r-lg animate-in fade-in slide-in-from-top-1">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-accent-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-accent-900 mb-1">Unable to calculate valuation</h3>
              <p className="text-sm text-accent-700 leading-relaxed mb-3">{error}</p>
              <button
                type="button"
                onClick={() => {
                  useValuationStore.getState().setError(null);
                }}
                className="text-sm font-medium text-accent-700 hover:text-accent-900 transition-colors underline decoration-accent-300 hover:decoration-accent-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Regeneration Warning Modal */}
      <RegenerationWarningModal
        isOpen={showRegenerationWarning}
        completedAt={session?.completedAt}
        onConfirm={() => {
          // Close modal first
          setShowRegenerationWarning(false);
          setRegenerateConfirmed(true);
          // Use setTimeout to ensure state is updated before re-triggering
          setTimeout(() => {
            const form = document.querySelector('form');
            if (form) {
              form.requestSubmit();
            }
          }, 0);
        }}
        onCancel={() => {
          setShowRegenerationWarning(false);
          setRegenerateConfirmed(false);
        }}
      />
    </form>
  );
};

