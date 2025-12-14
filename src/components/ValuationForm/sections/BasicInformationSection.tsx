/**
 * BasicInformationSection Component
 *
 * Single Responsibility: Render Basic Information form section
 * Extracted from ValuationForm to follow SRP
 *
 * @module components/ValuationForm/sections/BasicInformationSection
 */

import React from 'react'
import { TARGET_COUNTRIES } from '../../../config/countries'
import type { BusinessType } from '../../../services/businessTypesApi'
import { suggestionService } from '../../../services/businessTypeSuggestionApi'
import type { ValuationFormData } from '../../../types/valuation'
import { generalLogger } from '../../../utils/logger'
import {
    CustomBusinessTypeSearch,
    CustomDropdown,
    CustomNumberInputField,
} from '../../forms'
import CompanyNameInput from '../../forms/CompanyNameInput'

interface BasicInformationSectionProps {
  formData: ValuationFormData
  updateFormData: (data: Partial<ValuationFormData>) => void
  businessTypes: BusinessType[]
  businessTypesLoading: boolean
  businessTypesError: string | null
}

/**
 * BasicInformationSection Component
 *
 * Renders Basic Information section with:
 * - Business Type Search
 * - Company Name
 * - Founding Year
 * - Country
 */
export const BasicInformationSection: React.FC<BasicInformationSectionProps> = ({
  formData,
  updateFormData,
  businessTypes,
  businessTypesLoading,
  businessTypesError,
}) => {
  return (
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
                hasPreferences:
                  !!(
                    businessType.dcfPreference !== undefined &&
                    businessType.multiplesPreference !== undefined
                  ),
                allKeys: Object.keys(businessType),
              })

              generalLogger.info('Business type selected', {
                id: businessType.id,
                title: businessType.title,
                industryMapping: businessType.industryMapping,
                industry: businessType.industry,
                metadata: {
                  dcfPreference: businessType.dcfPreference,
                  multiplesPreference: businessType.multiplesPreference,
                  ownerDependencyImpact: businessType.ownerDependencyImpact,
                },
              })

              // Validate that business type has industry classification
              if (!businessType.industry && !businessType.industryMapping) {
                console.error('Business type missing industry classification:', businessType)
                return
              }

              updateFormData({
                business_type_id: businessType.id,
                business_model: businessType.id,
                industry: businessType.industry || businessType.industryMapping || 'services',
                subIndustry: businessType.category,
                // Store internal metadata for backend
                _internal_dcf_preference: businessType.dcfPreference,
                _internal_multiples_preference: businessType.multiplesPreference,
                _internal_owner_dependency_impact: businessType.ownerDependencyImpact,
                _internal_key_metrics: businessType.keyMetrics,
                _internal_typical_employee_range: businessType.typicalEmployeeRange,
                _internal_typical_revenue_range: businessType.typicalRevenueRange,
              } as any)
            }}
            onSuggest={async (suggestion) => {
              try {
                await suggestionService.submitSuggestion({
                  suggestion,
                  context: {
                    industry: formData.industry,
                    search_query: suggestion,
                    description: `User searched for: ${suggestion}`,
                  },
                })

                generalLogger.info('Business type suggestion submitted', { suggestion })
              } catch (error) {
                generalLogger.error('Failed to submit suggestion', { error })
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

        {/* Company Name with KBO Registry Check */}
        {/* MOVED AFTER BUSINESS TYPE: Enables context-aware KBO validation */}
        <CompanyNameInput
          label="Company Name"
          type="text"
          name="company_name"
          value={formData.company_name || ''}
          onChange={(value) => updateFormData({ company_name: value })}
          onBlur={() => {}}
          placeholder="e.g., Acme GmbH"
          countryCode={formData.country_code || 'BE'}
          required
          onCompanySelect={(company) => {
            generalLogger.info('Company selected from KBO registry', {
              company_name: company.company_name,
              registration_number: company.registration_number,
            })
            // Optionally update form data with registry information
            updateFormData({
              company_name: company.company_name,
              // Could add more fields if needed from registry data
            })
          }}
        />

        {/* Founding Year */}
        <CustomNumberInputField
          label="Year Business Commenced Trading"
          placeholder="e.g., 2018 (first commercial revenue)"
          value={formData.founding_year || new Date().getFullYear() - 5}
          onChange={(e) =>
            updateFormData({
              founding_year: parseInt(e.target.value) || new Date().getFullYear() - 5,
            })
          }
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
  )
}
