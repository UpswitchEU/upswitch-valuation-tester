/**
 * BasicInformationSection Component
 * 
 * Single Responsibility: Render basic information form fields
 * Extracted from ValuationForm to follow SRP
 * 
 * @module components/forms/sections/BasicInformationSection
 */

import React from 'react';
import toast from 'react-hot-toast';
import { TARGET_COUNTRIES } from '../../../config/countries';
import { useAuth } from '../../../hooks/useAuth';
import { suggestionService } from '../../../services/businessTypeSuggestionApi';
import type { ValuationRequest } from '../../../types/valuation';
import { generalLogger, chatLogger } from '../../../utils/logger';
import { safePreference } from '../../../utils/numberUtils';
import { CompanyNameInput, CustomBusinessTypeSearch, CustomDropdown, CustomNumberInputField } from '../index';
import type { BusinessType } from '../../../services/businessTypesApi';

interface BasicInformationSectionProps {
  formData: any;
  updateFormData: (data: Partial<any>) => void;
  businessTypes: BusinessType[];
  businessTypesLoading: boolean;
  businessTypesError: boolean | null;
}

/**
 * Basic Information Section
 * 
 * Renders: Business Type, Company Name, Founding Year, Country
 */
export const BasicInformationSection: React.FC<BasicInformationSectionProps> = ({
  formData,
  updateFormData,
  businessTypes,
  businessTypesLoading,
  businessTypesError,
}) => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-white mb-6 pb-2 border-b border-white/10 tracking-tight">
        Basic Information
      </h3>
      
      <div className="grid grid-cols-1 @4xl:grid-cols-2 gap-6">
        {/* Business Type Selector */}
        <div className="@4xl:col-span-2">
          <CustomBusinessTypeSearch
            value={formData.business_type_id}
            businessTypes={businessTypes}
            onChange={(businessType) => {
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
                business_model: businessType.id,
                industry: businessType.industry || businessType.industryMapping,
                subIndustry: businessType.category || undefined,
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
            
            const updates: Partial<ValuationRequest> = {
              company_name: company.company_name,
              country_code: company.country_code || formData.country_code || 'BE',
            };

            if (company.address) {
              const cityMatch = company.address.match(/\d{4}\s+([^,]+)/);
              if (cityMatch && cityMatch[1]) {
                updates.city = cityMatch[1].trim();
              }
            }

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
  );
};

