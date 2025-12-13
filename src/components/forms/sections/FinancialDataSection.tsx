/**
 * FinancialDataSection Component
 * 
 * Single Responsibility: Render financial data form fields
 * Extracted from ValuationForm to follow SRP
 * 
 * @module components/forms/sections/FinancialDataSection
 */

import React from 'react';
import { getIndustryGuidance, validateEbitdaMargin, validateRevenue } from '../../../config/industryGuidance';
import { CustomNumberInputField } from '../index';

interface FinancialDataSectionProps {
  formData: any;
  updateFormData: (data: Partial<any>) => void;
}

/**
 * Financial Data Section
 * 
 * Renders: Revenue, EBITDA with industry guidance and validation
 */
export const FinancialDataSection: React.FC<FinancialDataSectionProps> = ({
  formData,
  updateFormData,
}) => {
  return (
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
  );
};

