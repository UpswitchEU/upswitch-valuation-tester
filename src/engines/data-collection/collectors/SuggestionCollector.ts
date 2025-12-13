/**
 * Suggestion Data Collector
 *
 * Single Responsibility: Handle data collection through suggestion clicks
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

export class SuggestionCollector implements DataCollector {
  private logger: ILogger;

  constructor() {
    this.logger = ServiceContainer.getInstance().resolve<ILogger>('ILogger');
  }

  async collect(field: DataField, context?: CollectionContext): Promise<DataResponse> {
    // For suggestions, we return a placeholder that indicates
    // the field can be filled by clicking suggestions
    // The actual value comes from user interaction

    return {
      fieldId: field.id,
      value: undefined, // Will be filled by suggestion click
      method: 'suggestion',
      confidence: 1.0, // User selection is considered 100% confident
      source: 'user_suggestion',
      timestamp: new Date(),
      metadata: {
        availableSuggestions: field.suggestions || [],
        requiresUserInteraction: true,
        field: field
      }
    };
  }

  validate(field: DataField, value: any): ValidationRule[] {
    // Basic validation for suggestion selections
    const errors: ValidationRule[] = [];

    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({
        type: 'required',
        message: `Please select a ${field.label.toLowerCase()}`,
        severity: 'error'
      });
    }

    // Validate that the selected value is in the allowed options (if options are defined)
    if (field.options && value !== undefined) {
      const validOption = field.options.find(option => option.value === value);
      if (!validOption) {
        errors.push({
          type: 'custom',
          message: `Selected value is not a valid option for ${field.label}`,
          severity: 'error'
        });
      }
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
    return method === 'suggestion';
  }

  getCapabilities(): DataCollectionMethod[] {
    return ['suggestion'];
  }

  // Additional methods specific to suggestion collection
  getSuggestionsForField(field: DataField): string[] {
    // Return field-specific suggestions
    return field.suggestions || [];
  }

  mapSuggestionToValue(field: DataField, suggestion: string): any {
    // Convert suggestion text to actual field value
    switch (field.id) {
      case 'number_of_employees':
        // Handle ranges like "1-5", "6-20", etc.
        if (suggestion.includes('-')) {
          const [min, max] = suggestion.split('-').map(s => parseInt(s.trim()));
          if (!isNaN(min) && !isNaN(max)) {
            return Math.round((min + max) / 2); // Use average
          }
        }
        // Handle single numbers
        const num = parseInt(suggestion);
        if (!isNaN(num)) {
          return num;
        }
        break;

      case 'revenue':
        // Handle ranges like "€100K - €500K"
        if (suggestion.includes('-')) {
          const parts = suggestion.split('-').map(s => s.trim());
          if (parts.length === 2) {
            const min = this.parseCurrencyValue(parts[0]);
            const max = this.parseCurrencyValue(parts[1]);
            if (min && max) {
              return Math.round((min + max) / 2);
            }
          }
        }
        // Handle single values
        return this.parseCurrencyValue(suggestion);

      default:
        // For other fields, use the suggestion as-is or map to options
        if (field.options) {
          const option = field.options.find(opt =>
            opt.label === suggestion || opt.value === suggestion
          );
          return option ? option.value : suggestion;
        }
        return suggestion;
    }

    return suggestion; // Fallback
  }

  private parseCurrencyValue(text: string): number | null {
    // Remove currency symbols and normalize
    const cleaned = text.replace(/[€£$]/g, '').trim();

    // Handle K/M suffixes
    if (cleaned.includes('K')) {
      const num = parseFloat(cleaned.replace('K', ''));
      return isNaN(num) ? null : num * 1000;
    }
    if (cleaned.includes('M')) {
      const num = parseFloat(cleaned.replace('M', ''));
      return isNaN(num) ? null : num * 1000000;
    }

    // Remove commas and parse
    const num = parseFloat(cleaned.replace(/,/g, ''));
    return isNaN(num) ? null : num;
  }
}