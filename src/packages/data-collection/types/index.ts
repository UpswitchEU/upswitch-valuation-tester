/**
 * @package @upswitch/data-collection
 *
 * Type definitions for the unified data collection system.
 * Provides consistent interfaces across manual and conversational flows.
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
  | 'textarea';

export type DataCollectionMethod =
  | 'manual_form'      // Traditional form input
  | 'conversational'   // AI chat extraction
  | 'suggestion'       // Click-based selection
  | 'fuzzy_search'     // Search and select
  | 'file_upload';     // Future: file parsing

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  value?: string | number | boolean | RegExp | ((value: unknown) => boolean);
  message: string;
  severity: ValidationSeverity;
}

export interface DataField {
  id: string;
  label: string;
  description?: string;
  type: DataFieldType;
  required: boolean;
  validation?: ValidationRule[];
  placeholder?: string;
  options?: { value: string; label: string; description?: string }[]; // For select/multiselect
  suggestions?: string[]; // For suggestion-based collection
  dependsOn?: string[]; // Field IDs this field depends on
  group?: string; // Logical grouping
  priority: number; // Collection priority (lower = asked first)
  collectionMethods: DataCollectionMethod[]; // Supported collection methods
}

// ============================================================================
// QUESTION & RESPONSE SYSTEM
// ============================================================================

export interface DataQuestion {
  id: string;
  fieldId: string;
  question: string;
  context?: string; // Additional context for AI
  examples?: string[]; // Example answers
  followUp?: string[]; // Follow-up questions based on answer
  suggestions?: string[]; // Quick-select suggestions
}

export interface DataResponse {
  fieldId: string;
  value: string | number | boolean | null | undefined;
  method: DataCollectionMethod;
  confidence: number; // 0-1, how confident we are in this value
  source: string; // Where this data came from (user, AI, suggestion, etc.)
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// COLLECTION SESSION & STATE
// ============================================================================

export interface CollectionSession {
  id: string;
  fields: DataField[];
  responses: Map<string, DataResponse>;
  currentFieldId?: string;
  completedFieldIds: Set<string>;
  method: DataCollectionMethod;
  startedAt: Date;
  lastActivity: Date;
  isComplete: boolean;
  validationErrors: Map<string, ValidationRule[]>;
}

export interface CollectionProgress {
  totalFields: number;
  completedFields: number;
  requiredFields: number;
  completedRequiredFields: number;
  overallProgress: number; // 0-1
  currentField?: DataField;
  nextField?: DataField;
  blockingErrors: ValidationRule[];
}

// ============================================================================
// DATA COLLECTOR INTERFACE
// ============================================================================

export interface DataCollector {
  // Core collection methods
  collect(field: DataField, context?: CollectionContext): Promise<DataResponse>;
  validate(field: DataField, value: string | number | boolean | null | undefined): ValidationRule[];

  // Batch operations
  collectMultiple(fields: DataField[], context?: CollectionContext): Promise<DataResponse[]>;
  validateMultiple(responses: DataResponse[]): Map<string, ValidationRule[]>;

  // Method-specific capabilities
  supportsMethod(method: DataCollectionMethod): boolean;
  getCapabilities(): DataCollectionMethod[];
}

export interface CollectionContext {
  session: CollectionSession;
  previousResponses: DataResponse[];
  userProfile?: Record<string, unknown>;
  conversationHistory?: string[];
  method: DataCollectionMethod;
}

// ============================================================================
// ADAPTIVE UI COMPONENTS
// ============================================================================

export interface FieldRendererProps {
  field: DataField;
  value?: string | number | boolean | null | undefined;
  onChange: (value: string | number | boolean | null | undefined, method?: DataCollectionMethod) => void;
  errors?: ValidationRule[];
  context: CollectionContext;
  disabled?: boolean;
  autoFocus?: boolean;
}

export interface QuestionRendererProps {
  question: DataQuestion;
  onResponse: (response: DataResponse) => void;
  context: CollectionContext;
  suggestions?: string[];
}