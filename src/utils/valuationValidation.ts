/**
 * Valuation Data Validation Utilities
 *
 * Single Responsibility: Validate business rules for valuation data
 * SOLID Principles: SRP - Only handles validation logic
 *
 * @module utils/valuationValidation
 */

import type { ValuationFormData } from '../types/valuation'

export interface ValidationError {
  field: string
  message: string
  severity: 'error' | 'warning'
}

/**
 * Validate business rules for valuation data
 *
 * Catches common data quality issues before sending to Python backend
 * for better UX (immediate feedback instead of server error)
 *
 * @param data - Partial valuation form data to validate
 * @returns Array of validation errors (empty if all valid)
 */
export function validateBusinessRules(data: Partial<ValuationFormData>): ValidationError[] {
  const errors: ValidationError[] = []

  // EBITDA <= Revenue validation
  const revenue = data.revenue || data.current_year_data?.revenue
  const ebitda = data.ebitda || data.current_year_data?.ebitda

  if (revenue && ebitda && ebitda > revenue) {
    errors.push({
      field: 'ebitda',
      message: 'EBITDA cannot exceed revenue. Please check your financial data.',
      severity: 'error',
    })
  }

  // Historical years must be chronological
  if (data.historical_years_data && data.historical_years_data.length > 1) {
    const years = data.historical_years_data.map((y) => y.year)
    const isChronological = years.every((year, i) => {
      if (i === 0) return true
      return year > years[i - 1]
    })

    if (!isChronological) {
      errors.push({
        field: 'historical_years_data',
        message: 'Historical years must be in chronological order (oldest to newest).',
        severity: 'error',
      })
    }
  }

  // Historical years EBITDA should not exceed revenue
  if (data.historical_years_data) {
    data.historical_years_data.forEach((yearData, index) => {
      if (yearData.ebitda && yearData.revenue && yearData.ebitda > yearData.revenue) {
        errors.push({
          field: `historical_years_data.${index}.ebitda`,
          message: `EBITDA cannot exceed revenue for year ${yearData.year}. Please check your data.`,
          severity: 'error',
        })
      }
    })
  }

  // Founding year should be reasonable
  if (data.founding_year) {
    const currentYear = new Date().getFullYear()
    const companyAge = currentYear - data.founding_year

    if (companyAge < 0) {
      errors.push({
        field: 'founding_year',
        message: 'Founding year cannot be in the future.',
        severity: 'error',
      })
    }

    if (companyAge > 200) {
      errors.push({
        field: 'founding_year',
        message: 'Founding year seems unusually old. Please verify.',
        severity: 'warning',
      })
    }
  }

  // Number of employees should be reasonable for revenue
  if (data.number_of_employees && revenue) {
    const revenuePerEmployee = revenue / data.number_of_employees

    // Warn if revenue per employee is very high (> €10M per employee)
    if (revenuePerEmployee > 10000000) {
      errors.push({
        field: 'number_of_employees',
        message: `Revenue per employee (€${(revenuePerEmployee / 1000000).toFixed(1)}M) seems very high. Please verify employee count.`,
        severity: 'warning',
      })
    }

    // Warn if revenue per employee is very low (< €10K per employee)
    if (revenuePerEmployee < 10000) {
      errors.push({
        field: 'number_of_employees',
        message: `Revenue per employee (€${(revenuePerEmployee / 1000).toFixed(0)}K) seems very low. Please verify.`,
        severity: 'warning',
      })
    }
  }

  // Recurring revenue percentage should be 0-1
  if (
    data.recurring_revenue_percentage !== undefined &&
    data.recurring_revenue_percentage !== null
  ) {
    if (data.recurring_revenue_percentage < 0 || data.recurring_revenue_percentage > 1) {
      errors.push({
        field: 'recurring_revenue_percentage',
        message: 'Recurring revenue percentage must be between 0 and 1 (0% to 100%).',
        severity: 'error',
      })
    }
  }

  return errors
}

/**
 * Validate required fields are present
 *
 * @param data - Valuation form data
 * @returns Array of validation errors
 */
export function validateRequiredFields(data: Partial<ValuationFormData>): ValidationError[] {
  const errors: ValidationError[] = []

  if (!data.company_name || data.company_name.trim() === '') {
    errors.push({
      field: 'company_name',
      message: 'Company name is required.',
      severity: 'error',
    })
  }

  if (!data.industry) {
    errors.push({
      field: 'industry',
      message: 'Industry is required.',
      severity: 'error',
    })
  }

  const revenue = data.revenue || data.current_year_data?.revenue
  if (!revenue || revenue <= 0) {
    errors.push({
      field: 'revenue',
      message: 'Revenue must be greater than 0.',
      severity: 'error',
    })
  }

  return errors
}

/**
 * Check if data has any validation errors
 *
 * @param data - Valuation form data
 * @returns True if data is valid, false otherwise
 */
export function isValidValuationData(data: Partial<ValuationFormData>): boolean {
  const requiredErrors = validateRequiredFields(data)
  const businessRuleErrors = validateBusinessRules(data)

  return requiredErrors.length === 0 && businessRuleErrors.length === 0
}

/**
 * Get all validation errors for valuation data
 *
 * @param data - Valuation form data
 * @returns Combined array of all validation errors
 */
export function getValidationErrors(data: Partial<ValuationFormData>): ValidationError[] {
  return [...validateRequiredFields(data), ...validateBusinessRules(data)]
}
