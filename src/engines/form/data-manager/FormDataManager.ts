/**
 * FormDataManager Engine - Form State & Validation Management
 *
 * Single Responsibility: Manage form data state, validation, and data transformations
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/form/data-manager/FormDataManager
 */

import { useCallback, useMemo, useState } from 'react';
import type { ValuationRequest } from '../../../types/valuation';
import { generalLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FormField {
  name: string;
  value: any;
  isValid: boolean;
  errors: string[];
  touched: boolean;
  required: boolean;
}

export interface FormData {
  company_name: string;
  business_type: string;
  country_code: string;
  founding_year: number | null;
  revenue: number | null;
  ebitda: number | null;
  // Historical data
  current_year_data: {
    revenue: number | null;
    ebitda: number | null;
    net_income: number | null;
  };
  historical_years_data: Array<{
    year: number;
    revenue: number | null;
    ebitda: number | null;
    net_income: number | null;
  }>;
}

export interface ValidationResult {
  isValid: boolean;
  fieldErrors: Record<string, string[]>;
  formErrors: string[];
  hasErrors: boolean;
  hasWarnings: boolean;
}

export interface FormDataManager {
  // State management
  getFormData(): FormData;
  updateField(fieldName: string, value: any): void;
  updateFields(updates: Partial<FormData>): void;
  resetForm(): void;

  // Validation
  validateField(fieldName: string): ValidationResult;
  validateForm(): ValidationResult;
  isFieldValid(fieldName: string): boolean;
  getFieldErrors(fieldName: string): string[];

  // Data transformation
  toValuationRequest(): ValuationRequest;
  fromValuationRequest(request: ValuationRequest): void;

  // Utility
  isDirty(): boolean;
  getDirtyFields(): string[];
  touchField(fieldName: string): void;
  touchAllFields(): void;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

interface ValidationRule {
  required?: boolean;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any, formData: FormData) => string | null;
  dependsOn?: string[];
}

const VALIDATION_RULES: Record<keyof FormData, ValidationRule> = {
  company_name: {
    required: true,
    min: 2,
    max: 100,
    pattern: /^[a-zA-Z0-9\s\-\.&()]+$/,
  },
  business_type: {
    required: true,
  },
  country_code: {
    required: true,
  },
  founding_year: {
    min: 1800,
    max: new Date().getFullYear(),
    custom: (value) => {
      if (value && value > new Date().getFullYear()) {
        return 'Founding year cannot be in the future';
      }
      return null;
    },
  },
  revenue: {
    min: 0,
    max: 1000000000, // 1B max
  },
  ebitda: {
    min: -1000000000,
    max: 1000000000,
  },
  current_year_data: {
    custom: (value, formData) => {
      if (value?.revenue !== null && value?.revenue !== undefined) {
        if (value.revenue < 0) return 'Revenue cannot be negative';
        if (value.revenue > 1000000000) return 'Revenue seems unrealistically high';
      }
      return null;
    },
  },
  historical_years_data: {
    custom: (value, formData) => {
      if (Array.isArray(value) && value.length > 10) {
        return 'Maximum 10 years of historical data allowed';
      }
      return null;
    },
  },
};

// ============================================================================
// INITIAL FORM DATA
// ============================================================================

const INITIAL_FORM_DATA: FormData = {
  company_name: '',
  business_type: '',
  country_code: 'BE', // Default to Belgium
  founding_year: null,
  revenue: null,
  ebitda: null,
  current_year_data: {
    revenue: null,
    ebitda: null,
    net_income: null,
  },
  historical_years_data: [],
};

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class FormDataManagerImpl implements FormDataManager {
  private formData: FormData;
  private initialData: FormData;
  private touchedFields: Set<string> = new Set();

  constructor(initialFormData?: Partial<FormData>) {
    this.formData = { ...INITIAL_FORM_DATA, ...initialFormData };
    this.initialData = { ...this.formData };
  }

  // State Management
  getFormData(): FormData {
    return { ...this.formData };
  }

  updateField(fieldName: string, value: any): void {
    // Handle nested updates for current_year_data and historical_years_data
    if (fieldName.includes('.')) {
      const [parent, child] = fieldName.split('.');
      if (parent === 'current_year_data') {
        this.formData.current_year_data = {
          ...this.formData.current_year_data,
          [child]: value,
        };
      } else if (parent.startsWith('historical_years_data[')) {
        const match = parent.match(/historical_years_data\[(\d+)\]/);
        if (match) {
          const index = parseInt(match[1]);
          if (this.formData.historical_years_data[index]) {
            this.formData.historical_years_data[index] = {
              ...this.formData.historical_years_data[index],
              [child]: value,
            };
          }
        }
      }
    } else {
      (this.formData as any)[fieldName] = value;
    }

    this.touchField(fieldName);

    generalLogger.debug('[FormDataManager] Field updated', {
      field: fieldName,
      hasValue: value !== null && value !== undefined && value !== '',
    });
  }

  updateFields(updates: Partial<FormData>): void {
    this.formData = { ...this.formData, ...updates };

    // Touch all updated fields
    Object.keys(updates).forEach(field => this.touchField(field));

    generalLogger.debug('[FormDataManager] Multiple fields updated', {
      fields: Object.keys(updates),
    });
  }

  resetForm(): void {
    this.formData = { ...this.initialData };
    this.touchedFields.clear();

    generalLogger.info('[FormDataManager] Form reset to initial state');
  }

  // Validation
  validateField(fieldName: string): ValidationResult {
    const fieldErrors: Record<string, string[]> = {};
    const formErrors: string[] = [];

    const rule = VALIDATION_RULES[fieldName as keyof FormData];
    if (!rule) {
      return {
        isValid: true,
        fieldErrors,
        formErrors,
        hasErrors: false,
        hasWarnings: false,
      };
    }

    const value = (this.formData as any)[fieldName];
    const errors: string[] = [];

    // Required validation
    if (rule.required && (value === null || value === undefined || value === '')) {
      errors.push(`${fieldName.replace('_', ' ')} is required`);
    }

    // Skip other validations if field is empty and not required
    if ((value === null || value === undefined || value === '') && !rule.required) {
      fieldErrors[fieldName] = [];
    } else {
      // Type-specific validations
      if (typeof value === 'string') {
        if (rule.min && value.length < rule.min) {
          errors.push(`Minimum length is ${rule.min} characters`);
        }
        if (rule.max && value.length > rule.max) {
          errors.push(`Maximum length is ${rule.max} characters`);
        }
        if (rule.pattern && !rule.pattern.test(value)) {
          errors.push('Invalid format');
        }
      }

      if (typeof value === 'number') {
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`Minimum value is ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`Maximum value is ${rule.max}`);
        }
      }

      // Custom validation
      if (rule.custom) {
        const customError = rule.custom(value, this.formData);
        if (customError) {
          errors.push(customError);
        }
      }
    }

    fieldErrors[fieldName] = errors;

    return {
      isValid: errors.length === 0,
      fieldErrors,
      formErrors,
      hasErrors: errors.length > 0,
      hasWarnings: false, // Could be extended for warnings
    };
  }

  validateForm(): ValidationResult {
    const allFieldErrors: Record<string, string[]> = {};
    const allFormErrors: string[] = [];
    let hasErrors = false;

    // Validate all fields
    const fieldsToValidate: (keyof FormData)[] = [
      'company_name', 'business_type', 'country_code', 'founding_year',
      'revenue', 'ebitda', 'current_year_data', 'historical_years_data'
    ];

    fieldsToValidate.forEach(fieldName => {
      const fieldValidation = this.validateField(fieldName);
      allFieldErrors[fieldName] = fieldValidation.fieldErrors[fieldName] || [];

      if (fieldValidation.hasErrors) {
        hasErrors = true;
      }
    });

    // Cross-field validations
    if (this.formData.ebitda !== null && this.formData.revenue !== null) {
      if (Math.abs(this.formData.ebitda) > this.formData.revenue) {
        allFormErrors.push('EBITDA cannot be larger than revenue in absolute value');
        hasErrors = true;
      }
    }

    return {
      isValid: !hasErrors,
      fieldErrors: allFieldErrors,
      formErrors: allFormErrors,
      hasErrors,
      hasWarnings: false,
    };
  }

  isFieldValid(fieldName: string): boolean {
    return this.validateField(fieldName).isValid;
  }

  getFieldErrors(fieldName: string): string[] {
    return this.validateField(fieldName).fieldErrors[fieldName] || [];
  }

  // Data Transformation
  toValuationRequest(): ValuationRequest {
    const request: ValuationRequest = {
      company_name: this.formData.company_name,
      business_type: this.formData.business_type,
      country_code: this.formData.country_code,
      founding_year: this.formData.founding_year || undefined,
      revenue: this.formData.revenue || undefined,
      ebitda: this.formData.ebitda || undefined,
      current_year_data: {
        revenue: this.formData.current_year_data.revenue || undefined,
        ebitda: this.formData.current_year_data.ebitda || undefined,
        net_income: this.formData.current_year_data.net_income || undefined,
      },
      historical_years_data: this.formData.historical_years_data.map(year => ({
        year: year.year,
        revenue: year.revenue || undefined,
        ebitda: year.ebitda || undefined,
        net_income: year.net_income || undefined,
      })),
    };

    // Remove undefined values
    Object.keys(request).forEach(key => {
      if ((request as any)[key] === undefined) {
        delete (request as any)[key];
      }
    });

    if (request.current_year_data) {
      Object.keys(request.current_year_data).forEach(key => {
        if ((request.current_year_data as any)[key] === undefined) {
          delete (request.current_year_data as any)[key];
        }
      });
    }

    return request;
  }

  fromValuationRequest(request: ValuationRequest): void {
    this.formData = {
      company_name: request.company_name || '',
      business_type: request.business_type || '',
      country_code: request.country_code || 'BE',
      founding_year: request.founding_year || null,
      revenue: request.revenue || null,
      ebitda: request.ebitda || null,
      current_year_data: {
        revenue: request.current_year_data?.revenue || null,
        ebitda: request.current_year_data?.ebitda || null,
        net_income: request.current_year_data?.net_income || null,
      },
      historical_years_data: request.historical_years_data?.map(year => ({
        year: year.year,
        revenue: year.revenue || null,
        ebitda: year.ebitda || null,
        net_income: year.net_income || null,
      })) || [],
    };

    this.initialData = { ...this.formData };
    this.touchedFields.clear();

    generalLogger.info('[FormDataManager] Loaded data from valuation request');
  }

  // Utility Methods
  isDirty(): boolean {
    return JSON.stringify(this.formData) !== JSON.stringify(this.initialData);
  }

  getDirtyFields(): string[] {
    const dirtyFields: string[] = [];

    const compareObjects = (obj1: any, obj2: any, path: string = ''): void => {
      if (obj1 === obj2) return;

      if (typeof obj1 !== typeof obj2) {
        dirtyFields.push(path);
        return;
      }

      if (typeof obj1 === 'object' && obj1 !== null && obj2 !== null) {
        const keys = new Set([...Object.keys(obj1), ...Object.keys(obj2)]);
        for (const key of keys) {
          compareObjects(obj1[key], obj2[key], path ? `${path}.${key}` : key);
        }
      } else if (obj1 !== obj2) {
        dirtyFields.push(path);
      }
    };

    compareObjects(this.formData, this.initialData);
    return dirtyFields;
  }

  touchField(fieldName: string): void {
    this.touchedFields.add(fieldName);
  }

  touchAllFields(): void {
    const fields = this.getAllFieldNames();
    fields.forEach(field => this.touchedFields.add(field));
  }

  private getAllFieldNames(): string[] {
    return [
      'company_name', 'business_type', 'country_code', 'founding_year',
      'revenue', 'ebitda', 'current_year_data.revenue',
      'current_year_data.ebitda', 'current_year_data.net_income',
      ...this.formData.historical_years_data.flatMap((_, index) => [
        `historical_years_data[${index}].year`,
        `historical_years_data[${index}].revenue`,
        `historical_years_data[${index}].ebitda`,
        `historical_years_data[${index}].net_income`,
      ]),
    ];
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseFormDataManagerResult {
  manager: FormDataManager;
  formData: FormData;
  validation: ValidationResult;
  actions: {
    updateField: (fieldName: string, value: any) => void;
    updateFields: (updates: Partial<FormData>) => void;
    resetForm: () => void;
    validateField: (fieldName: string) => ValidationResult;
    validateForm: () => ValidationResult;
    toValuationRequest: () => ValuationRequest;
    fromValuationRequest: (request: ValuationRequest) => void;
  };
  helpers: {
    isDirty: boolean;
    dirtyFields: string[];
    isValid: boolean;
    hasErrors: boolean;
    canSubmit: boolean;
  };
}

/**
 * useFormDataManager Hook
 *
 * React hook interface for FormDataManager engine
 * Provides reactive form data management and validation
 */
export const useFormDataManager = (
  initialData?: Partial<FormData>
): UseFormDataManagerResult => {
  const [manager] = useState(() => new FormDataManagerImpl(initialData));
  const [formData, setFormData] = useState<FormData>(manager.getFormData);
  const [validation, setValidation] = useState<ValidationResult>(manager.validateForm());

  // Update local state when manager changes
  const updateLocalState = useCallback(() => {
    setFormData(manager.getFormData());
    setValidation(manager.validateForm());
  }, [manager]);

  const actions = {
    updateField: useCallback((fieldName: string, value: any) => {
      manager.updateField(fieldName, value);
      updateLocalState();
    }, [manager, updateLocalState]),

    updateFields: useCallback((updates: Partial<FormData>) => {
      manager.updateFields(updates);
      updateLocalState();
    }, [manager, updateLocalState]),

    resetForm: useCallback(() => {
      manager.resetForm();
      updateLocalState();
    }, [manager, updateLocalState]),

    validateField: useCallback((fieldName: string) => manager.validateField(fieldName), [manager]),
    validateForm: useCallback(() => manager.validateForm(), [manager]),

    toValuationRequest: useCallback(() => manager.toValuationRequest(), [manager]),
    fromValuationRequest: useCallback((request: ValuationRequest) => {
      manager.fromValuationRequest(request);
      updateLocalState();
    }, [manager, updateLocalState]),
  };

  const helpers = {
    isDirty: manager.isDirty(),
    dirtyFields: manager.getDirtyFields(),
    isValid: validation.isValid,
    hasErrors: validation.hasErrors,
    canSubmit: validation.isValid && manager.isDirty(),
  };

  return {
    manager,
    formData,
    validation,
    actions,
    helpers,
  };
};
