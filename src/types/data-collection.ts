/**
 * Data Collection Types
 *
 * Defines the shared data collection system used by both manual and conversational flows.
 * Ensures consistent data structures, validation, and collection mechanisms across all flows.
 */

// ============================================================================
// CORE DATA FIELD TYPES
// ============================================================================

export type DataFieldType =
  | 'text'
  | 'number'
  | 'currency'
  | 'percentage'
  | 'boolean'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'textarea'

export type DataCollectionMethod =
  | 'manual_form' // Traditional form input
  | 'conversational' // AI chat extraction
  | 'suggestion' // Click-based selection
  | 'fuzzy_search' // Search and select
  | 'file_upload' // Future: file parsing

export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: string | number | boolean | RegExp | ((value: unknown) => boolean)
  message: string
  severity: ValidationSeverity
}

// More specific field value types
export type FieldValue = string | number | boolean | null | undefined
export type ParsedFieldValue = string | number | boolean | null

// Currency value type for financial fields
export type CurrencyValue = number

// Number value type for numeric fields
export type NumberValue = number

// Boolean value type
export type BooleanValue = boolean

// Text value type
export type TextValue = string

export interface DataField {
  id: string
  label: string
  description?: string
  type: DataFieldType
  required: boolean
  validation?: ValidationRule[]
  placeholder?: string
  options?: { value: string; label: string; description?: string }[] // For select/multiselect
  suggestions?: string[] // For suggestion-based collection
  dependsOn?: string[] // Field IDs this field depends on
  group?: string // Logical grouping
  priority: number // Collection priority (lower = asked first)
  collectionMethods: DataCollectionMethod[] // Supported collection methods
}

// ============================================================================
// QUESTION & RESPONSE SYSTEM
// ============================================================================

export interface DataQuestion {
  id: string
  fieldId: string
  question: string
  context?: string // Additional context for AI
  examples?: string[] // Example answers
  followUp?: string[] // Follow-up questions based on answer
  suggestions?: string[] // Quick-select suggestions
}

export interface DataResponse {
  fieldId: string
  value: FieldValue
  method: DataCollectionMethod
  confidence: number // 0-1, how confident we are in this value
  source: string // Where this data came from (user, AI, suggestion, etc.)
  timestamp: Date
  metadata?: Record<string, unknown>
}

// ============================================================================
// COLLECTION SESSION & STATE
// ============================================================================

export interface CollectionSession {
  id: string
  fields: DataField[]
  responses: Map<string, DataResponse>
  currentFieldId?: string
  completedFieldIds: Set<string>
  method: DataCollectionMethod
  startedAt: Date
  lastActivity: Date
  isComplete: boolean
  validationErrors: Map<string, ValidationRule[]>
}

export interface CollectionProgress {
  totalFields: number
  completedFields: number
  requiredFields: number
  completedRequiredFields: number
  overallProgress: number // 0-1
  currentField?: DataField
  nextField?: DataField
  blockingErrors: ValidationRule[]
}

// ============================================================================
// DATA COLLECTOR INTERFACE
// ============================================================================

export interface DataCollector {
  // Core collection methods
  collect(field: DataField, context?: CollectionContext): Promise<DataResponse>
  validate(field: DataField, value: string | number | boolean | null | undefined): ValidationRule[]

  // Batch operations
  collectMultiple(fields: DataField[], context?: CollectionContext): Promise<DataResponse[]>
  validateMultiple(responses: DataResponse[]): Map<string, ValidationRule[]>

  // Method-specific capabilities
  supportsMethod(method: DataCollectionMethod): boolean
  getCapabilities(): DataCollectionMethod[]
}

export interface CollectionContext {
  session: CollectionSession
  previousResponses: DataResponse[]
  userProfile?: Record<string, unknown>
  conversationHistory?: string[]
  method: DataCollectionMethod
}

// ============================================================================
// ADAPTIVE UI COMPONENTS
// ============================================================================

export interface FieldRendererProps {
  field: DataField
  value?: FieldValue
  onChange: (value: FieldValue, method?: DataCollectionMethod) => void
  errors?: ValidationRule[]
  context: CollectionContext
  disabled?: boolean
  autoFocus?: boolean
}

export interface QuestionRendererProps {
  question: DataQuestion
  onResponse: (response: DataResponse) => void
  context: CollectionContext
  suggestions?: string[]
}

// ============================================================================
// DATA FIELD DEFINITIONS
// ============================================================================

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
        severity: 'error',
      },
      {
        type: 'custom',
        value: (val: string) => val.length >= 2 && val.length <= 100,
        message: 'Company name must be between 2 and 100 characters',
        severity: 'error',
      },
    ],
    placeholder: 'Enter your company name',
    suggestions: [
      'TechCorp Inc.',
      'Green Energy Solutions',
      'Consulting Partners',
      'Manufacturing Ltd',
    ],
    priority: 1,
    collectionMethods: ['manual_form', 'conversational', 'suggestion'],
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
      { value: 'GB', label: 'United Kingdom' },
    ],
    priority: 2,
    collectionMethods: ['manual_form', 'conversational', 'suggestion'],
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
      { value: 'finance', label: 'Finance' },
    ],
    priority: 3,
    collectionMethods: ['manual_form', 'conversational', 'fuzzy_search', 'suggestion'],
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
      { value: 'services', label: 'Services' },
    ],
    priority: 4,
    collectionMethods: ['manual_form', 'conversational', 'suggestion'],
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
        severity: 'error',
      },
      {
        type: 'max',
        value: new Date().getFullYear(),
        message: 'Founding year cannot be in the future',
        severity: 'error',
      },
    ],
    placeholder: 'e.g., 2020',
    priority: 5,
    collectionMethods: ['manual_form', 'conversational'],
  },

  current_year_data: {
    id: 'current_year_data',
    label: 'Current Year Financials',
    group: 'financial',
    type: 'currency',
    required: true,
    priority: 6,
    collectionMethods: ['manual_form', 'conversational'],
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
        severity: 'error',
      },
      {
        type: 'max',
        value: 1000000000,
        message: 'Please contact us for valuations over €1B',
        severity: 'warning',
      },
    ],
    placeholder: '€500,000',
    suggestions: ['Under €100K', '€100K - €500K', '€500K - €1M', '€1M - €5M', 'Over €5M'],
    priority: 7,
    collectionMethods: ['manual_form', 'conversational', 'suggestion'],
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
    collectionMethods: ['manual_form', 'conversational'],
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
        severity: 'error',
      },
      {
        type: 'max',
        value: 10000,
        message: 'For companies with 10,000+ employees, please contact us',
        severity: 'warning',
      },
    ],
    placeholder: '25',
    suggestions: ['1-5', '6-20', '21-50', '51-100', '100+'],
    priority: 9,
    collectionMethods: ['manual_form', 'conversational', 'suggestion'],
  },
}

// ============================================================================
// QUESTION MAPPINGS
// ============================================================================

export const FIELD_QUESTIONS: Record<string, DataQuestion> = {
  company_name: {
    id: 'q_company_name',
    fieldId: 'company_name',
    question: 'What is the name of your business?',
    examples: ['TechCorp Inc.', 'Green Energy Solutions', 'Global Manufacturing Ltd'],
    suggestions: ['SaaS Company', 'Consulting Firm', 'E-commerce Store'],
  },

  revenue: {
    id: 'q_revenue',
    fieldId: 'revenue',
    question: 'What was your annual revenue for the most recent year?',
    context: 'This helps us understand your business size and growth potential.',
    examples: ['€500,000', '£2.3 million', '$1.2M'],
    suggestions: ['Under €100K', '€100K - €500K', '€500K - €1M', '€1M - €5M', 'Over €5M'],
  },

  number_of_employees: {
    id: 'q_employees',
    fieldId: 'number_of_employees',
    question: 'How many employees does your business have?',
    context: 'This includes full-time, part-time, and contract workers.',
    suggestions: ['1-5', '6-20', '21-50', '51-100', '100+'],
  },
}
