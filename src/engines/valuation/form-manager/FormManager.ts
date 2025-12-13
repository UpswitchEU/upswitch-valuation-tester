/**
 * FormManager Engine - Form Data Management & Validation
 *
 * Single Responsibility: Manage form data, validation, and business card integration
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/valuation/form-manager/FormManager
 */

import { useCallback, useMemo } from 'react';
import type { ValuationFormData } from '../../../types/valuation';
import { storeLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface BusinessCardData {
  company_name: string;
  industry: string;
  business_model: string;
  founding_year: number;
  country_code: string;
  employee_count?: number;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
  warnings: Record<string, string>;
  completeness: number; // 0-100 percentage
}

export interface FormUpdate {
  field: keyof ValuationFormData;
  value: any;
  source: 'user_input' | 'business_card' | 'auto_fill' | 'reset';
  timestamp: number;
}

export interface FormManager {
  // Form data management
  getFormData(): ValuationFormData;
  updateFormData(updates: Partial<ValuationFormData>): void;
  resetFormData(): void;

  // Business card integration
  prefillFromBusinessCard(businessCard: BusinessCardData): void;
  mergeBusinessCardData(businessCard: BusinessCardData): void;

  // Validation
  validateForm(): FormValidationResult;
  validateField(field: keyof ValuationFormData, value: any): { isValid: boolean; error?: string };

  // Form state queries
  isDirty(): boolean;
  getCompleteness(): number;
  getRequiredFields(): (keyof ValuationFormData)[];
  getOptionalFields(): (keyof ValuationFormData)[];

  // Form utilities
  getDefaultValues(): ValuationFormData;
  exportFormData(): ValuationFormData;
  importFormData(data: ValuationFormData): void;

  // Change tracking
  getChangeHistory(): FormUpdate[];
  clearChangeHistory(): void;
}

// ============================================================================
// DEFAULT FORM VALUES
// ============================================================================

const getSafeCurrentYear = () => Math.min(new Date().getFullYear(), 2100);

const DEFAULT_FORM_DATA: ValuationFormData = {
  company_name: '',
  country_code: 'BE',
  industry: 'services',
  business_model: 'services',
  founding_year: getSafeCurrentYear() - 5,
  business_type: 'company',
  shares_for_sale: 100,
  number_of_owners: 1,
  revenue: undefined,
  ebitda: undefined,
  current_year_data: {
    year: getSafeCurrentYear(),
    revenue: 0,
    ebitda: 0,
  },
};

// ============================================================================
// REQUIRED AND OPTIONAL FIELDS
// ============================================================================

const REQUIRED_FIELDS: (keyof ValuationFormData)[] = [
  'company_name',
  'industry',
  'business_model',
  'country_code',
  'founding_year',
  'business_type',
  'shares_for_sale',
  'number_of_owners',
];

const OPTIONAL_FIELDS: (keyof ValuationFormData)[] = [
  'revenue',
  'ebitda',
];

// ============================================================================
// VALIDATION RULES
// ============================================================================

const VALIDATION_RULES: Record<string, (value: any) => { isValid: boolean; error?: string }> = {
  company_name: (value: any) => {
    if (!value || typeof value !== 'string' || value.trim().length === 0) {
      return { isValid: false, error: 'Company name is required' };
    }
    if (value.trim().length < 2) {
      return { isValid: false, error: 'Company name must be at least 2 characters' };
    }
    if (value.trim().length > 100) {
      return { isValid: false, error: 'Company name must be less than 100 characters' };
    }
    return { isValid: true };
  },

  country_code: (value: any) => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, error: 'Country code is required' };
    }
    if (value.length !== 2) {
      return { isValid: false, error: 'Country code must be 2 characters' };
    }
    // Could add country code validation against a list
    return { isValid: true };
  },

  industry: (value: any) => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, error: 'Industry is required' };
    }
    // Could validate against allowed industry list
    return { isValid: true };
  },

  business_model: (value: any) => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, error: 'Business model is required' };
    }
    // Could validate against allowed business model list
    return { isValid: true };
  },

  founding_year: (value: any) => {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { isValid: false, error: 'Founding year must be a number' };
    }
    const currentYear = getSafeCurrentYear();
    if (numValue < 1800) {
      return { isValid: false, error: 'Founding year must be after 1800' };
    }
    if (numValue > currentYear) {
      return { isValid: false, error: 'Founding year cannot be in the future' };
    }
    return { isValid: true };
  },

  business_type: (value: any) => {
    if (!value || typeof value !== 'string') {
      return { isValid: false, error: 'Business type is required' };
    }
    const allowedTypes = ['company', 'partnership', 'sole_proprietorship'];
    if (!allowedTypes.includes(value)) {
      return { isValid: false, error: `Business type must be one of: ${allowedTypes.join(', ')}` };
    }
    return { isValid: true };
  },

  shares_for_sale: (value: any) => {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { isValid: false, error: 'Shares for sale must be a number' };
    }
    if (numValue <= 0) {
      return { isValid: false, error: 'Shares for sale must be greater than 0' };
    }
    if (numValue > 100) {
      return { isValid: false, error: 'Shares for sale cannot exceed 100%' };
    }
    return { isValid: true };
  },

  number_of_owners: (value: any) => {
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { isValid: false, error: 'Number of owners must be a number' };
    }
    if (numValue < 1) {
      return { isValid: false, error: 'Must have at least 1 owner' };
    }
    if (numValue > 50) {
      return { isValid: false, error: 'Cannot have more than 50 owners' };
    }
    return { isValid: true };
  },

  revenue: (value: any) => {
    if (value === undefined || value === null) {
      return { isValid: true }; // Optional field
    }
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { isValid: false, error: 'Revenue must be a number' };
    }
    if (numValue < 0) {
      return { isValid: false, error: 'Revenue cannot be negative' };
    }
    if (numValue > 1000000000) { // €1B
      return { isValid: false, error: 'Revenue seems unreasonably high' };
    }
    return { isValid: true };
  },

  ebitda: (value: any) => {
    if (value === undefined || value === null) {
      return { isValid: true }; // Optional field
    }
    const numValue = Number(value);
    if (isNaN(numValue)) {
      return { isValid: false, error: 'EBITDA must be a number' };
    }
    if (numValue < -1000000000) { // -€1B
      return { isValid: false, error: 'EBITDA seems unreasonably low' };
    }
    if (numValue > 1000000000) { // €1B
      return { isValid: false, error: 'EBITDA seems unreasonably high' };
    }
    return { isValid: true };
  },
};

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class FormManagerImpl implements FormManager {
  private formData: ValuationFormData;
  private originalData: ValuationFormData;
  private changeHistory: FormUpdate[] = [];
  private maxHistorySize = 50;

  constructor(initialData?: Partial<ValuationFormData>) {
    this.formData = { ...DEFAULT_FORM_DATA, ...initialData };
    this.originalData = { ...this.formData };
  }

  /**
   * Get current form data
   */
  getFormData(): ValuationFormData {
    return { ...this.formData };
  }

  /**
   * Update form data with change tracking
   */
  updateFormData(updates: Partial<ValuationFormData>): void {
    const previousData = { ...this.formData };

    this.formData = { ...this.formData, ...updates };

    // Track changes
    Object.entries(updates).forEach(([field, value]) => {
      const change: FormUpdate = {
        field: field as keyof ValuationFormData,
        value,
        source: 'user_input',
        timestamp: Date.now(),
      };
      this.changeHistory.push(change);
    });

    // Maintain history size
    if (this.changeHistory.length > this.maxHistorySize) {
      this.changeHistory = this.changeHistory.slice(-this.maxHistorySize);
    }

    storeLogger.debug('[FormManager] Form data updated', {
      fields: Object.keys(updates),
      isDirty: this.isDirty(),
      completeness: this.getCompleteness(),
    });
  }

  /**
   * Reset form data to defaults
   */
  resetFormData(): void {
    this.formData = { ...DEFAULT_FORM_DATA };
    this.changeHistory = [];

    storeLogger.info('[FormManager] Form data reset to defaults');
  }

  /**
   * Prefill form data from business card (complete replacement)
   */
  prefillFromBusinessCard(businessCard: BusinessCardData): void {
    const mappedData: Partial<ValuationFormData> = {
      company_name: businessCard.company_name,
      industry: businessCard.industry,
      business_model: businessCard.business_model,
      founding_year: businessCard.founding_year,
      country_code: businessCard.country_code,
    };

    // Add employee count if available (could map to other fields)
    if (businessCard.employee_count) {
      // Could add logic to estimate other fields based on employee count
    }

    this.updateFormData(mappedData);

    // Track this as business card source
    this.changeHistory.forEach(change => {
      if (Object.keys(mappedData).includes(change.field)) {
        change.source = 'business_card';
      }
    });

    storeLogger.info('[FormManager] Form prefills from business card', {
      companyName: businessCard.company_name,
      fieldsUpdated: Object.keys(mappedData),
    });
  }

  /**
   * Merge business card data (only fill empty fields)
   */
  mergeBusinessCardData(businessCard: BusinessCardData): void {
    const updates: Partial<ValuationFormData> = {};

    // Only update fields that are empty or default
    if (!this.formData.company_name || this.formData.company_name === '') {
      updates.company_name = businessCard.company_name;
    }

    if (!this.formData.industry || this.formData.industry === 'services') {
      updates.industry = businessCard.industry;
    }

    if (!this.formData.business_model || this.formData.business_model === 'services') {
      updates.business_model = businessCard.business_model;
    }

    if (!this.formData.founding_year || this.formData.founding_year === DEFAULT_FORM_DATA.founding_year) {
      updates.founding_year = businessCard.founding_year;
    }

    if (!this.formData.country_code || this.formData.country_code === 'BE') {
      updates.country_code = businessCard.country_code;
    }

    if (Object.keys(updates).length > 0) {
      this.updateFormData(updates);

      // Mark as business card merges
      this.changeHistory.slice(-Object.keys(updates).length).forEach(change => {
        change.source = 'business_card';
      });

      storeLogger.info('[FormManager] Business card data merged', {
        fieldsMerged: Object.keys(updates),
      });
    }
  }

  /**
   * Validate entire form
   */
  validateForm(): FormValidationResult {
    const errors: Record<string, string> = {};
    const warnings: Record<string, string> = {};
    let validFields = 0;
    const totalFields = REQUIRED_FIELDS.length + OPTIONAL_FIELDS.length;

    // Validate required fields
    REQUIRED_FIELDS.forEach(field => {
      const validation = this.validateField(field, this.formData[field]);
      if (!validation.isValid && validation.error) {
        errors[field] = validation.error;
      } else {
        validFields++;
      }
    });

    // Validate optional fields
    OPTIONAL_FIELDS.forEach(field => {
      const validation = this.validateField(field, this.formData[field]);
      if (!validation.isValid && validation.error) {
        errors[field] = validation.error;
      } else if (this.formData[field] !== undefined && this.formData[field] !== null) {
        validFields++;
      }
    });

    // Business logic warnings
    if (this.formData.revenue && this.formData.ebitda) {
      const margin = this.formData.ebitda / this.formData.revenue;
      if (margin > 0.5) {
        warnings.ebitda = 'EBITDA margin seems unusually high (>50%)';
      } else if (margin < -0.2) {
        warnings.ebitda = 'EBITDA margin is negative - please verify calculations';
      }
    }

    if (this.formData.founding_year) {
      const age = getSafeCurrentYear() - this.formData.founding_year;
      if (age > 100) {
        warnings.founding_year = 'Company age seems unusually high (>100 years)';
      }
    }

    const completeness = Math.round((validFields / totalFields) * 100);

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings,
      completeness,
    };
  }

  /**
   * Validate single field
   */
  validateField(field: keyof ValuationFormData, value: any): { isValid: boolean; error?: string } {
    const validator = VALIDATION_RULES[field];
    if (validator) {
      return validator(value);
    }

    // Default validation for unknown fields
    return { isValid: true };
  }

  /**
   * Check if form has unsaved changes
   */
  isDirty(): boolean {
    return JSON.stringify(this.formData) !== JSON.stringify(this.originalData);
  }

  /**
   * Get form completeness percentage
   */
  getCompleteness(): number {
    return this.validateForm().completeness;
  }

  /**
   * Get required fields list
   */
  getRequiredFields(): (keyof ValuationFormData)[] {
    return [...REQUIRED_FIELDS];
  }

  /**
   * Get optional fields list
   */
  getOptionalFields(): (keyof ValuationFormData)[] {
    return [...OPTIONAL_FIELDS];
  }

  /**
   * Get default form values
   */
  getDefaultValues(): ValuationFormData {
    return { ...DEFAULT_FORM_DATA };
  }

  /**
   * Export current form data
   */
  exportFormData(): ValuationFormData {
    return { ...this.formData };
  }

  /**
   * Import form data
   */
  importFormData(data: ValuationFormData): void {
    this.formData = { ...data };
    this.changeHistory = [];

    storeLogger.info('[FormManager] Form data imported', {
      fields: Object.keys(data),
    });
  }

  /**
   * Get change history
   */
  getChangeHistory(): FormUpdate[] {
    return [...this.changeHistory];
  }

  /**
   * Clear change history
   */
  clearChangeHistory(): void {
    this.changeHistory = [];
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseFormManagerResult {
  manager: FormManager;
  formData: ValuationFormData;
  actions: {
    updateFormData: (updates: Partial<ValuationFormData>) => void;
    resetFormData: () => void;
    prefillFromBusinessCard: (businessCard: BusinessCardData) => void;
    mergeBusinessCardData: (businessCard: BusinessCardData) => void;
    importFormData: (data: ValuationFormData) => void;
  };
  validation: {
    validateForm: () => FormValidationResult;
    validateField: (field: keyof ValuationFormData, value: any) => { isValid: boolean; error?: string };
  };
  queries: {
    isDirty: boolean;
    completeness: number;
    requiredFields: (keyof ValuationFormData)[];
    optionalFields: (keyof ValuationFormData)[];
    changeHistory: FormUpdate[];
  };
}

/**
 * useFormManager Hook
 *
 * React hook interface for FormManager engine
 * Provides reactive form data management and validation
 */
export const useFormManager = (
  initialData?: Partial<ValuationFormData>
): UseFormManagerResult => {
  const manager = useMemo(() => new FormManagerImpl(initialData), [initialData]);

  // For React integration, we'd typically use useState here
  // For now, this is a simplified interface
  const formData = manager.getFormData();

  const actions = {
    updateFormData: useCallback(
      (updates: Partial<ValuationFormData>) => manager.updateFormData(updates),
      [manager]
    ),
    resetFormData: useCallback(() => manager.resetFormData(), [manager]),
    prefillFromBusinessCard: useCallback(
      (businessCard: BusinessCardData) => manager.prefillFromBusinessCard(businessCard),
      [manager]
    ),
    mergeBusinessCardData: useCallback(
      (businessCard: BusinessCardData) => manager.mergeBusinessCardData(businessCard),
      [manager]
    ),
    importFormData: useCallback(
      (data: ValuationFormData) => manager.importFormData(data),
      [manager]
    ),
  };

  const validation = {
    validateForm: useCallback(() => manager.validateForm(), [manager]),
    validateField: useCallback(
      (field: keyof ValuationFormData, value: any) => manager.validateField(field, value),
      [manager]
    ),
  };

  const queries = {
    isDirty: manager.isDirty(),
    completeness: manager.getCompleteness(),
    requiredFields: manager.getRequiredFields(),
    optionalFields: manager.getOptionalFields(),
    changeHistory: manager.getChangeHistory(),
  };

  return {
    manager,
    formData,
    actions,
    validation,
    queries,
  };
};
