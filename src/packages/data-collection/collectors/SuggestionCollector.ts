/**
 * @package @upswitch/data-collection
 *
 * Suggestion Data Collector - Handles click-based selection from predefined options.
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
 * SuggestionCollector handles data collection through predefined suggestion selection.
 * Users click on suggested values rather than typing them.
 */
export class SuggestionCollector implements DataCollector {
  constructor() {
    // No dependencies required
  }

  async collect(field: DataField, context?: CollectionContext): Promise<DataResponse> {
    // In suggestion collection, we don't actually "collect" data here
    // The UI presents suggestions and user clicks one
    // This collector provides metadata about available suggestions

    return {
      fieldId: field.id,
      value: undefined, // Will be filled by user selection
      method: 'suggestion',
      confidence: 1.0, // User selection is considered 100% confident
      source: 'suggestion_selection',
      timestamp: new Date(),
      metadata: {
        requiresUserSelection: true,
        availableSuggestions: field.suggestions || [],
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

    // For suggestions, validate that the value is in the allowed suggestions
    if (field.suggestions && value !== undefined && value !== null && value !== '') {
      if (!field.suggestions.includes(value)) {
        errors.push({
          type: 'custom',
          message: `${value} is not a valid suggestion for ${field.label}`,
          severity: 'error'
        });
      }
    }

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
    return method === 'suggestion';
  }

  getCapabilities(): DataCollectionMethod[] {
    return ['suggestion'];
  }
}