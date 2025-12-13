/**
 * Unified Data Collection Engine
 *
 * Single Responsibility: Provide unified data collection across all methods
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * This engine provides a single interface for collecting business valuation data
 * regardless of whether the user is using forms, chat, suggestions, search, or file upload.
 */

// Core data collector
export { DataCollector } from './DataCollector';

// Individual collectors
export { ConversationalCollector } from './collectors/ConversationalCollector';
export { FileUploadCollector } from './collectors/FileUploadCollector';
export { FuzzySearchCollector } from './collectors/FuzzySearchCollector';
export { ManualFormCollector } from './collectors/ManualFormCollector';
export { SuggestionCollector } from './collectors/SuggestionCollector';

// Re-export types for convenience
export type {
    CollectionContext, CollectionProgress, CollectionSession, DataCollectionMethod, DataCollector, DataField,
    DataResponse, FieldRendererProps,
    QuestionRendererProps, ValidationRule,
    ValidationSeverity
} from '../../types/data-collection';

export {
    BUSINESS_DATA_FIELDS,
    FIELD_QUESTIONS
} from '../../types/data-collection';
