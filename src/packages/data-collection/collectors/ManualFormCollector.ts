/**
 * @package @upswitch/data-collection
 *
 * Manual Form Data Collector - Handles traditional form-based data collection.
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
 * ManualFormCollector handles data collection through traditional form inputs.
 * In practice, this collector acts as a placeholder since actual data collection
 * happens in the UI components. It provides validation and metadata.
 */
export class ManualFormCollector implements DataCollector {
  constructor() {
    // No dependencies required - can be used standalone
  }

  async collect(field: DataField, context?: CollectionContext): Promise<DataResponse> {
    // In manual form collection, we don't actually "collect" data here
    // Instead, we return a placeholder that indicates the field needs manual input
    // The actual data collection happens in the UI components

    return {
      fieldId: field.id,
      value: undefined, // Will be filled by form input
      method: 'manual_form',
      confidence: 1.0, // User input is considered 100% confident
      source: 'manual_form',
      timestamp: new Date(),
      metadata: {
        requiresUserInput: true,
        field: field
      }
    };
  }

  validate(field: DataField, value: any): ValidationRule[] {
    // Basic validation - more detailed validation happens in form components
    const errors: ValidationRule[] = [];

    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({
        type: 'required',
        message: `${field.label} is required`,
        severity: 'error'
      });
    }

    // Additional type-specific validation could be added here
    if (value !== undefined && value !== null && value !== '') {
      switch (field.type) {
        case 'number':
        case 'currency':
          if (isNaN(Number(value))) {
            errors.push({
              type: 'custom',
              message: `${field.label} must be a valid number`,
              severity: 'error'
            });
          }
          break;
        case 'text':
        case 'textarea':
          if (typeof value !== 'string') {
            errors.push({
              type: 'custom',
              message: `${field.label} must be text`,
              severity: 'error'
            });
          }
          break;
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
      // For manual forms, we need the field definition to validate
      // In a real implementation, this would be passed in context
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
    return method === 'manual_form';
  }

  getCapabilities(): DataCollectionMethod[] {
    return ['manual_form'];
  }
}