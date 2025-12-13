/**
 * Fuzzy Search Data Collector
 *
 * Single Responsibility: Handle data collection through fuzzy search and selection
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 */

import { ILogger } from '../../../services/container/interfaces/ILogger';
import { ServiceContainer } from '../../../services/container/ServiceContainer';
import {
    CollectionContext,
    DataCollectionMethod,
    DataCollector,
    DataField,
    DataResponse,
    ValidationRule
} from '../../../types/data-collection';

export class FuzzySearchCollector implements DataCollector {
  private logger: ILogger;

  constructor() {
    this.logger = ServiceContainer.getInstance().resolve<ILogger>('ILogger');
  }

  async collect(field: DataField, context?: CollectionContext): Promise<DataResponse> {
    // For fuzzy search, we return a placeholder that indicates
    // the field can be filled by searching and selecting
    // The actual data collection happens in the search UI

    return {
      fieldId: field.id,
      value: undefined, // Will be filled by search selection
      method: 'fuzzy_search',
      confidence: 1.0, // User selection is considered 100% confident
      source: 'fuzzy_search',
      timestamp: new Date(),
      metadata: {
        requiresSearch: true,
        searchableOptions: field.options || [],
        field: field
      }
    };
  }

  validate(field: DataField, value: any): ValidationRule[] {
    const errors: ValidationRule[] = [];

    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({
        type: 'required',
        message: `Please search and select a ${field.label.toLowerCase()}`,
        severity: 'error'
      });
    }

    // Validate that the selected value exists in the searchable options
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
      // This is a simplified version - the DataCollector handles this
      const errors: ValidationRule[] = [];
      if (errors.length > 0) {
        results.set(response.fieldId, errors);
      }
    }

    return results;
  }

  supportsMethod(method: DataCollectionMethod): boolean {
    return method === 'fuzzy_search';
  }

  getCapabilities(): DataCollectionMethod[] {
    return ['fuzzy_search'];
  }

  // Additional methods specific to fuzzy search
  searchOptions(field: DataField, query: string): Array<{ value: string; label: string; score: number }> {
    if (!field.options) return [];

    const queryLower = query.toLowerCase();
    const results: Array<{ value: string; label: string; score: number }> = [];

    for (const option of field.options) {
      const labelLower = option.label.toLowerCase();
      const valueLower = option.value.toLowerCase();

      // Simple fuzzy matching - in practice, you'd use a proper fuzzy search library
      let score = 0;

      // Exact match gets highest score
      if (labelLower === queryLower || valueLower === queryLower) {
        score = 100;
      }
      // Starts with query gets high score
      else if (labelLower.startsWith(queryLower) || valueLower.startsWith(queryLower)) {
        score = 80;
      }
      // Contains query gets medium score
      else if (labelLower.includes(queryLower) || valueLower.includes(queryLower)) {
        score = 60;
      }
      // Fuzzy character matching (simplified)
      else {
        const queryChars = queryLower.split('');
        let matches = 0;
        for (const char of queryChars) {
          if (labelLower.includes(char) || valueLower.includes(char)) {
            matches++;
          }
        }
        score = (matches / queryChars.length) * 40;
      }

      if (score > 20) { // Only include reasonably good matches
        results.push({
          value: option.value,
          label: option.label,
          score
        });
      }
    }

    // Sort by score (highest first)
    return results.sort((a, b) => b.score - a.score);
  }

  getPopularOptions(field: DataField, limit = 5): Array<{ value: string; label: string }> {
    // Return most commonly used options (simplified - in practice, this would be based on usage data)
    if (!field.options) return [];

    // For now, just return the first few options
    return field.options.slice(0, limit).map(option => ({
      value: option.value,
      label: option.label
    }));
  }

  getRecentSelections(field: DataField, limit = 3): Array<{ value: string; label: string }> {
    // Return recently selected options (simplified - in practice, this would use user history)
    // For now, return a subset of options
    if (!field.options || field.options.length === 0) return [];

    const startIndex = Math.max(0, field.options.length - limit);
    return field.options.slice(startIndex).map(option => ({
      value: option.value,
      label: option.label
    }));
  }
}