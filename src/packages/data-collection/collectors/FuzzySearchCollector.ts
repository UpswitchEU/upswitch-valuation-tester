/**
 * @package @upswitch/data-collection
 *
 * Fuzzy Search Data Collector - Handles search and select from large datasets.
 */

import type {
  CollectionContext,
  DataCollectionMethod,
  DataCollector,
  DataField,
  DataResponse,
  ValidationRule
} from '../types';

/**
 * FuzzySearchCollector handles data collection through search interfaces.
 * Users search and select from potentially large datasets.
 */
export class FuzzySearchCollector implements DataCollector {
  constructor() {
    // No dependencies required
  }

  async collect(field: DataField, context?: CollectionContext): Promise<DataResponse> {
    // In fuzzy search collection, we provide search capabilities
    // The actual search and selection happens in the UI

    return {
      fieldId: field.id,
      value: undefined, // Will be filled by search selection
      method: 'fuzzy_search',
      confidence: 1.0, // User selection is considered 100% confident
      source: 'search_selection',
      timestamp: new Date(),
      metadata: {
        requiresSearch: true,
        searchPlaceholder: field.placeholder || `Search ${field.label.toLowerCase()}...`,
        field: field
      }
    };
  }

  validate(field: DataField, value: any): ValidationRule[] {
    const errors: ValidationRule[] = [];

    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({
        type: 'required',
        message: `${field.label} is required`,
        severity: 'error'
      });
    }

    // For fuzzy search, basic validation - could be extended with search result validation
    return errors;
  }

  async collectMultiple(fields: DataField[], context?: CollectionContext): Promise<DataResponse[]> {
    const responses: DataResponse[] = [];

    for (const field of fields) {
      const response = await this.collect(field, context);
      responses.push(response);
    }

    return responses;
  }

  validateMultiple(responses: DataResponse[]): Map<string, ValidationRule[]> {
    const errors = new Map<string, ValidationRule[]>();

    for (const response of responses) {
      const field = response.metadata?.field as DataField;
      if (field) {
        const fieldErrors = this.validate(field, response.value);
        if (fieldErrors.length > 0) {
          errors.set(response.fieldId, fieldErrors);
        }
      }
    }

    return errors;
  }

  supportsMethod(method: DataCollectionMethod): boolean {
    return method === 'fuzzy_search';
  }

  getCapabilities(): DataCollectionMethod[] {
    return ['fuzzy_search'];
  }
}