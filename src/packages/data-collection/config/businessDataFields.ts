/**
 * @package @upswitch/data-collection
 *
 * Business data field definitions for valuation workflows.
 * Defines the data fields collected during business valuation processes.
 */

import type { DataField } from '../types';

export const BUSINESS_DATA_FIELDS: Record<string, DataField> = {
  company_name: {
    id: 'company_name',
    label: 'Company Name',
    description: 'The legal name of your business',
    type: 'text',
    required: true,
    validation: [
      {
        type: 'required',
        message: 'Company name is required',
        severity: 'error'
      },
      {
        type: 'custom',
        value: (val: string) => val.length >= 2 && val.length <= 100,
        message: 'Company name must be between 2 and 100 characters',
        severity: 'error'
      }
    ],
    placeholder: 'Enter your company name',
    suggestions: ['TechCorp Inc.', 'Green Energy Solutions', 'Consulting Partners', 'Manufacturing Ltd'],
    priority: 1,
    collectionMethods: ['manual_form', 'conversational', 'suggestion']
  },

  country_code: {
    id: 'country_code',
    label: 'Country',
    description: 'Where is your business headquartered?',
    type: 'select',
    required: true,
    options: [
      { value: 'BE', label: 'Belgium' },
      { value: 'NL', label: 'Netherlands' },
      { value: 'DE', label: 'Germany' },
      { value: 'FR', label: 'France' },
      { value: 'US', label: 'United States' },
      { value: 'GB', label: 'United Kingdom' }
    ],
    priority: 2,
    collectionMethods: ['manual_form', 'conversational', 'suggestion']
  },

  industry: {
    id: 'industry',
    label: 'Industry',
    description: 'What industry does your business operate in?',
    type: 'select',
    required: true,
    options: [
      { value: 'technology', label: 'Technology' },
      { value: 'manufacturing', label: 'Manufacturing' },
      { value: 'retail', label: 'Retail' },
      { value: 'services', label: 'Services' },
      { value: 'healthcare', label: 'Healthcare' },
      { value: 'finance', label: 'Finance' }
    ],
    priority: 3,
    collectionMethods: ['manual_form', 'conversational', 'fuzzy_search', 'suggestion']
  },

  business_model: {
    id: 'business_model',
    label: 'Business Model',
    description: 'How does your business generate revenue?',
    type: 'select',
    required: true,
    dependsOn: ['industry'],
    options: [
      { value: 'b2b_saas', label: 'B2B SaaS' },
      { value: 'b2c', label: 'B2C' },
      { value: 'marketplace', label: 'Marketplace' },
      { value: 'ecommerce', label: 'E-commerce' },
      { value: 'manufacturing', label: 'Manufacturing' },
      { value: 'services', label: 'Services' }
    ],
    priority: 4,
    collectionMethods: ['manual_form', 'conversational', 'suggestion']
  },

  founding_year: {
    id: 'founding_year',
    label: 'Founding Year',
    description: 'When was your business founded?',
    type: 'number',
    required: true,
    validation: [
      {
        type: 'min',
        value: 1900,
        message: 'Founding year must be after 1900',
        severity: 'error'
      },
      {
        type: 'max',
        value: new Date().getFullYear(),
        message: 'Founding year cannot be in the future',
        severity: 'error'
      }
    ],
    placeholder: 'e.g., 2020',
    priority: 5,
    collectionMethods: ['manual_form', 'conversational']
  },

  current_year_data: {
    id: 'current_year_data',
    label: 'Current Year Financials',
    group: 'financial',
    type: 'currency',
    required: true,
    priority: 6,
    collectionMethods: ['manual_form', 'conversational']
  },

  revenue: {
    id: 'revenue',
    label: 'Annual Revenue',
    description: 'Total revenue for the most recent complete year',
    group: 'financial',
    type: 'currency',
    required: false,
    validation: [
      {
        type: 'min',
        value: 0,
        message: 'Revenue cannot be negative',
        severity: 'error'
      },
      {
        type: 'max',
        value: 1000000000,
        message: 'Please contact us for valuations over €1B',
        severity: 'warning'
      }
    ],
    placeholder: '€500,000',
    suggestions: ['Under €100K', '€100K - €500K', '€500K - €1M', '€1M - €5M', 'Over €5M'],
    priority: 7,
    collectionMethods: ['manual_form', 'conversational', 'suggestion']
  },

  ebitda: {
    id: 'ebitda',
    label: 'EBITDA',
    description: 'Earnings Before Interest, Taxes, Depreciation, and Amortization',
    group: 'financial',
    type: 'currency',
    required: false,
    placeholder: '€150,000',
    priority: 8,
    collectionMethods: ['manual_form', 'conversational']
  },

  number_of_employees: {
    id: 'number_of_employees',
    label: 'Number of Employees',
    description: 'Total full-time equivalent employees',
    type: 'number',
    required: false,
    validation: [
      {
        type: 'min',
        value: 0,
        message: 'Employee count cannot be negative',
        severity: 'error'
      },
      {
        type: 'max',
        value: 10000,
        message: 'For companies with 10,000+ employees, please contact us',
        severity: 'warning'
      }
    ],
    placeholder: '25',
    suggestions: ['1-5', '6-20', '21-50', '51-100', '100+'],
    priority: 9,
    collectionMethods: ['manual_form', 'conversational', 'suggestion']
  }
};