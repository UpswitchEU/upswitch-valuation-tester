/**
 * Manual Form Data Collector
 *
 * Single Responsibility: Handle data collection through traditional form inputs
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 */

import {
  DataField,
  DataResponse,
  DataCollector,
  CollectionContext,
  DataCollectionMethod,
  ValidationRule
} from '../../../types/data-collection';
import { ILogger } from '../../../services/container/interfaces/ILogger';
import { ServiceContainer } from '../../../services/container/ServiceContainer';

export class ManualFormCollector implements DataCollector {
  private logger: ILogger;

  constructor() {
    this.logger = ServiceContainer.getInstance().resolve<ILogger>('ILogger');
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

    return errors;
  }

  async collectMultiple(fields: DataField[], context?: CollectionContext): Promise<DataResponse[]> {
    return Promise.all(fields.map(field => this.collect(field, context)));
  }

  validateMultiple(responses: DataResponse[]): Map<string, ValidationRule[]> {
    const results = new Map<string, ValidationRule[]>();

    for (const response of responses) {
      // Note: In a real implementation, we'd need access to the fields
      // This is a simplified version - the UnifiedDataCollector handles this
      const errors: ValidationRule[] = [];
      if (errors.length > 0) {
        results.set(response.fieldId, errors);
      }
    }

    return results;
  }

  supportsMethod(method: DataCollectionMethod): boolean {
    return method === 'manual_form';
  }

  getCapabilities(): DataCollectionMethod[] {
    return ['manual_form'];
  }
}