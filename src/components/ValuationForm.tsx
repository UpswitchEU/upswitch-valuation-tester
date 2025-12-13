/**
 * ValuationForm Component
 * 
 * Main orchestrator for business valuation data entry form.
 * Single Responsibility: Form orchestration and submission handling.
 * 
 * Refactored to use modular section components and hooks following SRP.
 * 
 * @module components/ValuationForm
 */

import React, { useCallback, useEffect, useState } from 'react';
import { useValuationSessionStore } from '../store/useValuationSessionStore';
import { useValuationStore } from '../store/useValuationStore';
import toast from 'react-hot-toast';
import { debounce } from '../utils/debounce';
import { generalLogger } from '../utils/logger';
import { useAuth } from '../hooks/useAuth';
import { useBusinessTypes } from '../hooks/useBusinessTypes';
import { useBusinessTypeMatching } from '../hooks/useBusinessTypeMatching';
import { useFormSessionSync } from '../hooks/useFormSessionSync';
import { HistoricalDataInputs } from './forms';
import { RegenerationWarningModal } from './RegenerationWarningModal';
import { InfoIcon } from './ui/InfoIcon';
import { BasicInformationSection, OwnershipStructureSection, FinancialDataSection } from './forms/sections';

/**
 * ValuationForm Component
 * 
 * Main form for entering business valuation data.
 */
export const ValuationForm: React.FC = () => {
  const { formData, updateFormData, calculateValuation, quickValuation, isCalculating, error, prefillFromBusinessCard, result } = useValuationStore();
  const { session, updateSessionData, getSessionData } = useValuationSessionStore();
  const { businessTypes, loading: businessTypesLoading, error: businessTypesError } = useBusinessTypes();
  const { businessCard, isAuthenticated } = useAuth();
  
  // Use extracted hooks for business logic
  const { matchBusinessType } = useBusinessTypeMatching();
  const { hasLoadedSessionData } = useFormSessionSync({
    session,
    formData,
    updateSessionData,
    getSessionData,
    updateFormData,
    businessTypes,
    matchBusinessType,
  });
  
  // Regeneration warning modal state
  const [showRegenerationWarning, setShowRegenerationWarning] = useState(false);
  const [regenerateConfirmed, setRegenerateConfirmed] = useState(false);
  
  // Local state for historical data inputs
  const [historicalInputs, setHistoricalInputs] = useState<{[key: string]: string}>({});
  const [hasPrefilledOnce, setHasPrefilledOnce] = useState(false);
  
  // Employee count validation state (for submit validation)
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


      {/* Basic Information Section */}
      <BasicInformationSection
        formData={formData}
        updateFormData={updateFormData}
        businessTypes={businessTypes}
        businessTypesLoading={businessTypesLoading}
        businessTypesError={!!businessTypesError}
      />

      {/* Ownership Structure Section */}
      <OwnershipStructureSection
        formData={formData}
        updateFormData={updateFormData}
        employeeCountError={employeeCountError}
      />

      {/* Financial Data Section */}
      <FinancialDataSection
        formData={formData}
        updateFormData={updateFormData}
      />

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

