/**
 * BasicInformationSection Component
 *
 * Single Responsibility: Render Basic Information form section
 * Extracted from ValuationForm to follow SRP
 *
 * @module components/ValuationForm/sections/BasicInformationSection
 */

import React, { useState } from 'react'
import { TARGET_COUNTRIES } from '../../../config/countries'
import { suggestionService } from '../../../services/businessTypeSuggestionApi'
import type { BusinessType } from '../../../services/businessTypesApi'
import type { ValuationFormData } from '../../../types/valuation'
import { generalLogger } from '../../../utils/logger'
import { CustomBusinessTypeSearch, CustomDropdown, CustomNumberInputField } from '../../forms'
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
  // Track which fields were auto-filled from registry
  const [autoFilledFields, setAutoFilledFields] = useState<string[]>([])

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
                hasPreferences: !!(
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
          onCompanySelect={async (company) => {
            generalLogger.info('Company selected from KBO registry', {
              company_name: company.company_name,
              registration_number: company.registration_number,
              company_id: company.company_id,
            })

            // Update company name immediately
            const updates: Partial<ValuationFormData> = {
              company_name: company.company_name,
            }

            // Fetch financial data if company_id is available
            if (company.company_id && company.company_id.length > 3) {
              try {
                const { registryService } = await import(
                  '../../../services/registry/registryService'
                )
                const financialData = await registryService.getCompanyFinancials(
                  company.company_id,
                  formData.country_code || 'BE'
                )

                // Auto-fill founding_year if available and not already set
                if (financialData.founding_year && !formData.founding_year) {
                  updates.founding_year = financialData.founding_year
                }

                // Auto-fill industry if available and not already set
                // Only auto-fill if business type hasn't been selected (to avoid overwriting user choice)
                if (
                  financialData.industry_description &&
                  !formData.industry &&
                  !formData.business_type_id
                ) {
                  updates.industry = financialData.industry_description
                }

                // Auto-fill number_of_employees if available
                if (financialData.employees && !formData.number_of_employees) {
                  updates.number_of_employees = financialData.employees
                }

                // Track which fields were auto-filled
                const filledFields: string[] = []
                if (updates.founding_year) filledFields.push('Founding year')
                if (updates.industry) filledFields.push('Industry')
                if (updates.number_of_employees) filledFields.push('Employees')

                if (filledFields.length > 0) {
                  setAutoFilledFields(filledFields)
                  // Clear after 5 seconds
                  setTimeout(() => setAutoFilledFields([]), 5000)
                }

                generalLogger.info('Auto-filled fields from KBO registry', {
                  founding_year: updates.founding_year,
                  industry: updates.industry,
                  employees: updates.number_of_employees,
                  company_id: company.company_id,
                  filledFields,
                })
              } catch (error) {
                generalLogger.debug('Financial data not available for company', {
                  companyId: company.company_id,
                  error: error instanceof Error ? error.message : 'Unknown error',
                })
                // Continue without financial data - not critical
              }
            }

            updateFormData(updates)
          }}
        />

        {/* Registry Data Preview - Show auto-filled fields */}
        {autoFilledFields.length > 0 && (
          <div className="@4xl:col-span-2 mt-2 p-3 bg-primary-50/50 border border-primary-200/50 rounded-lg text-sm text-gray-700">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-primary-600 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="font-medium text-primary-900">Auto-filled from registry:</span>
              <span className="text-gray-600">{autoFilledFields.join(', ')}</span>
            </div>
          </div>
        )}

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
