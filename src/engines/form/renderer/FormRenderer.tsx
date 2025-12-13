/**
 * FormRenderer Engine - Form UI Rendering & Component Orchestration
 *
 * Single Responsibility: Render form components, handle UI state, coordinate user interactions
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/form/renderer/FormRenderer
 */

import React, { useCallback, useMemo } from 'react';
import type { BusinessTypeOption } from '../../../config/businessTypes';
import type { FormData } from '../data-manager/FormDataManager';
import type { ValidationResult } from '../data-manager/FormDataManager';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface RenderConfig {
  theme?: 'light' | 'dark';
  showValidationErrors?: boolean;
  showValidationWarnings?: boolean;
  enableAnimations?: boolean;
  compactLayout?: boolean;
  showProgressIndicator?: boolean;
  maxSuggestions?: number;
}

export interface FormRenderer {
  // Main form rendering
  renderForm(config?: RenderConfig): React.ReactElement;

  // Field rendering
  renderCompanyNameField(formData: FormData, validation: ValidationResult, onChange: (value: string) => void): React.ReactElement;
  renderBusinessTypeField(
    formData: FormData,
    validation: ValidationResult,
    businessTypes: BusinessTypeOption[],
    onChange: (value: string) => void,
    onSearch?: (query: string) => void
  ): React.ReactElement;
  renderCountryField(formData: FormData, validation: ValidationResult, onChange: (value: string) => void): React.ReactElement;
  renderFoundingYearField(formData: FormData, validation: ValidationResult, onChange: (value: number | null) => void): React.ReactElement;
  renderFinancialFields(formData: FormData, validation: ValidationResult, onChange: (field: string, value: number | null) => void): React.ReactElement;
  renderHistoricalDataFields(formData: FormData, validation: ValidationResult, onChange: (data: any) => void): React.ReactElement;

  // Action rendering
  renderActionButtons(
    canCalculate: boolean,
    canQuickValuate: boolean,
    isCalculating: boolean,
    onCalculate: () => void,
    onQuickValuate: () => void
  ): React.ReactElement;

  // Utility rendering
  renderValidationSummary(validation: ValidationResult): React.ReactElement;
  renderProgressIndicator(currentStep: number, totalSteps: number): React.ReactElement;
  renderErrorMessage(error: string, onRetry?: () => void): React.ReactElement;
  renderSuccessMessage(message: string): React.ReactElement;
}

// ============================================================================
// COMPONENT CONFIGURATIONS
// ============================================================================

const FORM_SECTIONS = [
  { id: 'company', label: 'Company Information', fields: ['company_name', 'business_type', 'country_code', 'founding_year'] },
  { id: 'financial', label: 'Financial Information', fields: ['revenue', 'ebitda'] },
  { id: 'historical', label: 'Historical Data', fields: ['current_year_data', 'historical_years_data'] },
] as const;

const VALIDATION_STYLES = {
  error: 'border-red-500 bg-red-50 text-red-900',
  warning: 'border-yellow-500 bg-yellow-50 text-yellow-700',
  success: 'border-green-500 bg-green-50 text-green-900',
  default: 'border-gray-300 bg-white text-gray-900',
} as const;

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class FormRendererImpl implements FormRenderer {
  private defaultConfig: RenderConfig = {
    theme: 'dark',
    showValidationErrors: true,
    showValidationWarnings: true,
    enableAnimations: true,
    compactLayout: false,
    showProgressIndicator: true,
    maxSuggestions: 5,
  };

  // Main form rendering
  renderForm(config: RenderConfig = {}): React.ReactElement {
    const mergedConfig = { ...this.defaultConfig, ...config };

    return React.createElement(
      'div',
      {
        className: `valuation-form ${mergedConfig.theme === 'dark' ? 'dark' : 'light'} ${mergedConfig.compactLayout ? 'compact' : ''}`,
      },
      mergedConfig.showProgressIndicator && this.renderFormHeader(mergedConfig),
      React.createElement(
        'div',
        { className: 'form-sections' },
        ...FORM_SECTIONS.map(section =>
          React.createElement(
            'div',
            { key: section.id, className: 'form-section' },
            React.createElement(
              'h3',
              { className: 'section-title' },
              section.label
            ),
            React.createElement(
              'div',
              { className: 'section-content' },
              // Section content will be filled by parent component
              React.createElement('div', { className: 'section-placeholder', 'data-section': section.id })
            )
          )
        )
      )
    );
  }

  // Field rendering
  renderCompanyNameField(
    formData: FormData,
    validation: ValidationResult,
    onChange: (value: string) => void
  ): React.ReactElement {
    const fieldErrors = validation.fieldErrors.company_name || [];
    const hasErrors = fieldErrors.length > 0;

    return React.createElement(
      'div',
      { className: 'form-field' },
      React.createElement(
        'label',
        { className: 'field-label', htmlFor: 'company_name' },
        'Company Name *'
      ),
      React.createElement(
        'input',
        {
          id: 'company_name',
          type: 'text',
          value: formData.company_name,
          onChange: (e) => onChange(e.target.value),
          className: `field-input ${hasErrors ? 'error' : ''}`,
          placeholder: 'Enter company name',
          maxLength: 100,
        }
      ),
      hasErrors && React.createElement(
        'div',
        { className: 'field-errors' },
        ...fieldErrors.map((error, index) =>
          React.createElement('div', { key: index, className: 'error-message' }, error)
        )
      )
    );
  }

  renderBusinessTypeField(
    formData: FormData,
    validation: ValidationResult,
    businessTypes: BusinessTypeOption[],
    onChange: (value: string) => void,
    onSearch?: (query: string) => void
  ): React.ReactElement {
    const fieldErrors = validation.fieldErrors.business_type || [];
    const hasErrors = fieldErrors.length > 0;

    // Create options for select
    const options = businessTypes.map(bt =>
      React.createElement(
        'option',
        { key: bt.value, value: bt.value },
        bt.label
      )
    );

    return React.createElement(
      'div',
      { className: 'form-field' },
      React.createElement(
        'label',
        { className: 'field-label', htmlFor: 'business_type' },
        'Business Type *'
      ),
      React.createElement(
        'select',
        {
          id: 'business_type',
          value: formData.business_type,
          onChange: (e) => onChange(e.target.value),
          className: `field-select ${hasErrors ? 'error' : ''}`,
        },
        React.createElement('option', { value: '' }, 'Select business type...'),
        ...options
      ),
      onSearch && React.createElement(
        'input',
        {
          type: 'text',
          placeholder: 'Search business types...',
          onChange: (e) => onSearch(e.target.value),
          className: 'field-search',
        }
      ),
      hasErrors && React.createElement(
        'div',
        { className: 'field-errors' },
        ...fieldErrors.map((error, index) =>
          React.createElement('div', { key: index, className: 'error-message' }, error)
        )
      )
    );
  }

  renderCountryField(
    formData: FormData,
    validation: ValidationResult,
    onChange: (value: string) => void
  ): React.ReactElement {
    const fieldErrors = validation.fieldErrors.country_code || [];
    const hasErrors = fieldErrors.length > 0;

    // Simplified country options
    const countries = [
      { value: 'BE', label: 'Belgium' },
      { value: 'NL', label: 'Netherlands' },
      { value: 'FR', label: 'France' },
      { value: 'DE', label: 'Germany' },
      { value: 'US', label: 'United States' },
      { value: 'GB', label: 'United Kingdom' },
    ];

    const options = countries.map(country =>
      React.createElement(
        'option',
        { key: country.value, value: country.value },
        country.label
      )
    );

    return React.createElement(
      'div',
      { className: 'form-field' },
      React.createElement(
        'label',
        { className: 'field-label', htmlFor: 'country_code' },
        'Country *'
      ),
      React.createElement(
        'select',
        {
          id: 'country_code',
          value: formData.country_code,
          onChange: (e) => onChange(e.target.value),
          className: `field-select ${hasErrors ? 'error' : ''}`,
        },
        ...options
      ),
      hasErrors && React.createElement(
        'div',
        { className: 'field-errors' },
        ...fieldErrors.map((error, index) =>
          React.createElement('div', { key: index, className: 'error-message' }, error)
        )
      )
    );
  }

  renderFoundingYearField(
    formData: FormData,
    validation: ValidationResult,
    onChange: (value: number | null) => void
  ): React.ReactElement {
    const fieldErrors = validation.fieldErrors.founding_year || [];
    const hasErrors = fieldErrors.length > 0;

    return React.createElement(
      'div',
      { className: 'form-field' },
      React.createElement(
        'label',
        { className: 'field-label', htmlFor: 'founding_year' },
        'Founding Year'
      ),
      React.createElement(
        'input',
        {
          id: 'founding_year',
          type: 'number',
          value: formData.founding_year || '',
          onChange: (e) => onChange(e.target.value ? parseInt(e.target.value) : null),
          className: `field-input ${hasErrors ? 'error' : ''}`,
          placeholder: 'e.g. 2020',
          min: 1800,
          max: new Date().getFullYear(),
        }
      ),
      hasErrors && React.createElement(
        'div',
        { className: 'field-errors' },
        ...fieldErrors.map((error, index) =>
          React.createElement('div', { key: index, className: 'error-message' }, error)
        )
      )
    );
  }

  renderFinancialFields(
    formData: FormData,
    validation: ValidationResult,
    onChange: (field: string, value: number | null) => void
  ): React.ReactElement {
    const revenueErrors = validation.fieldErrors.revenue || [];
    const ebitdaErrors = validation.fieldErrors.ebitda || [];
    const hasRevenueErrors = revenueErrors.length > 0;
    const hasEbitdaErrors = ebitdaErrors.length > 0;

    return React.createElement(
      'div',
      { className: 'financial-fields' },
      // Revenue field
      React.createElement(
        'div',
        { className: 'form-field' },
        React.createElement(
          'label',
          { className: 'field-label', htmlFor: 'revenue' },
          'Annual Revenue (€)'
        ),
        React.createElement(
          'input',
          {
            id: 'revenue',
            type: 'number',
            value: formData.revenue || '',
            onChange: (e) => onChange('revenue', e.target.value ? parseFloat(e.target.value) : null),
            className: `field-input ${hasRevenueErrors ? 'error' : ''}`,
            placeholder: 'e.g. 1000000',
            min: 0,
            step: 1000,
          }
        ),
        hasRevenueErrors && React.createElement(
          'div',
          { className: 'field-errors' },
          ...revenueErrors.map((error, index) =>
            React.createElement('div', { key: index, className: 'error-message' }, error)
          )
        )
      ),

      // EBITDA field
      React.createElement(
        'div',
        { className: 'form-field' },
        React.createElement(
          'label',
          { className: 'field-label', htmlFor: 'ebitda' },
          'EBITDA (€)'
        ),
        React.createElement(
          'input',
          {
            id: 'ebitda',
            type: 'number',
            value: formData.ebitda || '',
            onChange: (e) => onChange('ebitda', e.target.value ? parseFloat(e.target.value) : null),
            className: `field-input ${hasEbitdaErrors ? 'error' : ''}`,
            placeholder: 'e.g. 200000',
            step: 1000,
          }
        ),
        hasEbitdaErrors && React.createElement(
          'div',
          { className: 'field-errors' },
          ...ebitdaErrors.map((error, index) =>
            React.createElement('div', { key: index, className: 'error-message' }, error)
          )
        )
      )
    );
  }

  renderHistoricalDataFields(
    formData: FormData,
    validation: ValidationResult,
    onChange: (data: any) => void
  ): React.ReactElement {
    // Simplified historical data rendering
    return React.createElement(
      'div',
      { className: 'historical-data-fields' },
      React.createElement(
        'h4',
        { className: 'subsection-title' },
        'Current Year Data'
      ),
      React.createElement(
        'div',
        { className: 'current-year-fields' },
        React.createElement(
          'input',
          {
            type: 'number',
            placeholder: 'Current year revenue',
            value: formData.current_year_data.revenue || '',
            onChange: (e) => onChange({
              ...formData.current_year_data,
              revenue: e.target.value ? parseFloat(e.target.value) : null,
            }),
          }
        ),
        React.createElement(
          'input',
          {
            type: 'number',
            placeholder: 'Current year EBITDA',
            value: formData.current_year_data.ebitda || '',
            onChange: (e) => onChange({
              ...formData.current_year_data,
              ebitda: e.target.value ? parseFloat(e.target.value) : null,
            }),
          }
        )
      )
    );
  }

  // Action rendering
  renderActionButtons(
    canCalculate: boolean,
    canQuickValuate: boolean,
    isCalculating: boolean,
    onCalculate: () => void,
    onQuickValuate: () => void
  ): React.ReactElement {
    return React.createElement(
      'div',
      { className: 'form-actions' },
      canQuickValuate && React.createElement(
        'button',
        {
          className: 'btn-secondary',
          onClick: onQuickValuate,
          disabled: isCalculating,
        },
        isCalculating ? 'Processing...' : 'Quick Valuation'
      ),
      React.createElement(
        'button',
        {
          className: 'btn-primary',
          onClick: onCalculate,
          disabled: !canCalculate || isCalculating,
        },
        isCalculating ? 'Calculating...' : 'Calculate Valuation'
      )
    );
  }

  // Utility rendering
  renderValidationSummary(validation: ValidationResult): React.ReactElement {
    if (!validation.hasErrors && !validation.hasWarnings) {
      return React.createElement('div', { style: { display: 'none' } });
    }

    return React.createElement(
      'div',
      { className: 'validation-summary' },
      validation.hasErrors && React.createElement(
        'div',
        { className: 'validation-errors' },
        React.createElement('h4', null, 'Errors:'),
        React.createElement(
          'ul',
          null,
          ...validation.formErrors.map((error, index) =>
            React.createElement('li', { key: index }, error)
          )
        )
      ),
      validation.hasWarnings && React.createElement(
        'div',
        { className: 'validation-warnings' },
        React.createElement('h4', null, 'Warnings:'),
        React.createElement('p', null, 'Some warnings detected')
      )
    );
  }

  renderProgressIndicator(currentStep: number, totalSteps: number): React.ReactElement {
    const progress = (currentStep / totalSteps) * 100;

    return React.createElement(
      'div',
      { className: 'progress-indicator' },
      React.createElement(
        'div',
        { className: 'progress-bar' },
        React.createElement('div', {
          className: 'progress-fill',
          style: { width: `${progress}%` },
        })
      ),
      React.createElement(
        'span',
        { className: 'progress-text' },
        `Step ${currentStep} of ${totalSteps}`
      )
    );
  }

  renderErrorMessage(error: string, onRetry?: () => void): React.ReactElement {
    return React.createElement(
      'div',
      { className: 'error-message-banner' },
      React.createElement(
        'div',
        { className: 'error-content' },
        React.createElement('span', { className: 'error-icon' }, '⚠️'),
        React.createElement('span', { className: 'error-text' }, error),
        onRetry && React.createElement(
          'button',
          { className: 'error-retry', onClick: onRetry },
          'Retry'
        )
      )
    );
  }

  renderSuccessMessage(message: string): React.ReactElement {
    return React.createElement(
      'div',
      { className: 'success-message-banner' },
      React.createElement(
        'div',
        { className: 'success-content' },
        React.createElement('span', { className: 'success-icon' }, '✅'),
        React.createElement('span', { className: 'success-text' }, message)
      )
    );
  }

  private renderFormHeader(config: RenderConfig): React.ReactElement {
    return React.createElement(
      'div',
      { className: 'form-header' },
      React.createElement('h2', { className: 'form-title' }, 'Business Valuation'),
      React.createElement('p', { className: 'form-subtitle' }, 'Enter your business information for accurate valuation')
    );
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseFormRendererResult {
  renderer: FormRenderer;
  components: {
    Form: (config?: RenderConfig) => React.ReactElement;
    CompanyNameField: (props: {
      formData: FormData;
      validation: ValidationResult;
      onChange: (value: string) => void;
    }) => React.ReactElement;
    BusinessTypeField: (props: {
      formData: FormData;
      validation: ValidationResult;
      businessTypes: BusinessTypeOption[];
      onChange: (value: string) => void;
      onSearch?: (query: string) => void;
    }) => React.ReactElement;
    ActionButtons: (props: {
      canCalculate: boolean;
      canQuickValuate: boolean;
      isCalculating: boolean;
      onCalculate: () => void;
      onQuickValuate: () => void;
    }) => React.ReactElement;
    ValidationSummary: (props: { validation: ValidationResult }) => React.ReactElement;
    ErrorMessage: (props: { error: string; onRetry?: () => void }) => React.ReactElement;
    SuccessMessage: (props: { message: string }) => React.ReactElement;
  };
}

/**
 * useFormRenderer Hook
 *
 * React hook interface for FormRenderer engine
 * Provides reactive form UI rendering
 */
export const useFormRenderer = (
  config: RenderConfig = {}
): UseFormRendererResult => {
  const renderer = useMemo(() => new FormRendererImpl(), []);
  const mergedConfig = useMemo(() => ({ ...renderer['defaultConfig'], ...config }), [config]);

  const components = {
    Form: useCallback((config?: RenderConfig) =>
      renderer.renderForm({ ...mergedConfig, ...config }),
      [renderer, mergedConfig]
    ),

    CompanyNameField: useCallback((props) =>
      renderer.renderCompanyNameField(props.formData, props.validation, props.onChange),
      [renderer]
    ),

    BusinessTypeField: useCallback((props) =>
      renderer.renderBusinessTypeField(
        props.formData,
        props.validation,
        props.businessTypes,
        props.onChange,
        props.onSearch
      ),
      [renderer]
    ),

    ActionButtons: useCallback((props) =>
      renderer.renderActionButtons(
        props.canCalculate,
        props.canQuickValuate,
        props.isCalculating,
        props.onCalculate,
        props.onQuickValuate
      ),
      [renderer]
    ),

    ValidationSummary: useCallback((props) =>
      renderer.renderValidationSummary(props.validation),
      [renderer]
    ),

    ErrorMessage: useCallback((props) =>
      renderer.renderErrorMessage(props.error, props.onRetry),
      [renderer]
    ),

    SuccessMessage: useCallback((props) =>
      renderer.renderSuccessMessage(props.message),
      [renderer]
    ),
  };

  return {
    renderer,
    components,
  };
};
