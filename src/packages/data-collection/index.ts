/**
 * @package @upswitch/data-collection
 *
 * Unified data collection engine for business valuation workflows.
 * Provides extensible framework for collecting business data via multiple methods.
 *
 * @version 1.0.0
 */

// Core types and interfaces
export type {
  DataCollectionMethod,
  DataField,
  DataResponse,
  CollectionProgress,
  CollectionSession,
  FieldRendererProps,
} from './types';

// Data collection engine
export { DataCollector } from './engine/DataCollector';

// Collectors
export { ManualFormCollector } from './collectors/ManualFormCollector';
export { ConversationalCollector } from './collectors/ConversationalCollector';
export { SuggestionCollector } from './collectors/SuggestionCollector';
export { FuzzySearchCollector } from './collectors/FuzzySearchCollector';
export { FileUploadCollector } from './collectors/FileUploadCollector';

// Field renderers
export { ManualFormFieldRenderer } from './renderers/ManualFormFieldRenderer';
export { ConversationalFieldRenderer } from './renderers/ConversationalFieldRenderer';
export { SuggestionFieldRenderer } from './renderers/SuggestionFieldRenderer';
export { FuzzySearchFieldRenderer } from './renderers/FuzzySearchFieldRenderer';
export { FileUploadFieldRenderer } from './renderers/FileUploadFieldRenderer';

// Components
export { DataCollection } from './components/DataCollection';
export { FieldRenderer } from './components/FieldRenderer';

// Business data configuration
export { BUSINESS_DATA_FIELDS } from './config/businessDataFields';