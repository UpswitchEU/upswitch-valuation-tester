/**
 * DataExtractor Engine - Extract Structured Data from Streaming Responses
 *
 * Single Responsibility: Parse AI responses, extract structured business data, validate and normalize
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/stream/data-extractor/DataExtractor
 */

import { useCallback, useMemo } from 'react';
import { chatLogger } from '../../../utils/logger';
import type { CollectedData } from '../../data-collection/DataCollectionEngine';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ExtractionRule {
  field: string;
  patterns: RegExp[];
  type: 'string' | 'number' | 'currency' | 'percentage' | 'boolean';
  required: boolean;
  validation?: (value: any) => boolean;
  transform?: (value: any) => any;
  confidence: number;
}

export interface ExtractionContext {
  messageContent: string;
  metadata?: Record<string, any>;
  previousExtractions?: CollectedData[];
  conversationHistory?: string[];
}

export interface ExtractionResult {
  field: string;
  value: any;
  confidence: number;
  source: 'pattern_match' | 'metadata' | 'semantic_analysis' | 'fallback';
  validationErrors: string[];
  isValid: boolean;
  metadata?: Record<string, any>;
}

export interface DataExtractor {
  // Core extraction
  extractFromMessage(message: string, context?: Partial<ExtractionContext>): ExtractionResult[];
  extractFromMetadata(metadata: Record<string, any>): ExtractionResult[];

  // Advanced extraction
  extractWithContext(context: ExtractionContext): ExtractionResult[];

  // Validation and normalization
  validateExtraction(result: ExtractionResult): boolean;
  normalizeValue(value: any, type: ExtractionRule['type']): any;

  // Rule management
  addExtractionRule(rule: ExtractionRule): void;
  removeExtractionRule(field: string): void;
  getExtractionRules(): Record<string, ExtractionRule>;

  // Bulk operations
  extractMultiple(messages: string[], context?: Partial<ExtractionContext>): ExtractionResult[];
}

// ============================================================================
// EXTRACTION RULES DEFINITION
// ============================================================================

const DEFAULT_EXTRACTION_RULES: Record<string, ExtractionRule> = {
  company_name: {
    field: 'company_name',
    patterns: [
      /(?:company|business|organization|firm)[\s]*(?:name|called)[\s]*[:\-]?\s*["']?([^"'\n]{2,50})["']?/i,
      /(?:we|I|our)[\s]*(?:are|represent|work for)[\s]+([^,\n]{2,50})/i,
      /(?:^|[.!?]\s+)([A-Z][a-zA-Z\s&]{1,49})(?:\s+(?:is|are|was|were|has|have)\s|$)/i,
    ],
    type: 'string',
    required: true,
    validation: (value) => typeof value === 'string' && value.length >= 2 && value.length <= 100,
    confidence: 0.8,
  },

  revenue: {
    field: 'revenue',
    patterns: [
      /(?:revenue|sales|turnover|income)[\s]*(?:of|is|was|were|are)[\s]*[:\-]?\s*(?:€|EUR)?\s*([\d,]+(?:\.\d{1,2})?)/i,
      /€?\s*([\d,]+(?:\.\d{1,2})?)[\s]*(?:in|of)[\s]*(?:revenue|sales|turnover)/i,
      /(?:annual|yearly|monthly)[\s]*(?:revenue|sales)[\s]*[:\-]?\s*(?:€|EUR)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    ],
    type: 'currency',
    required: false,
    validation: (value) => typeof value === 'number' && value >= 0 && value <= 1000000000,
    transform: (value) => {
      if (typeof value === 'string') {
        return parseFloat(value.replace(/[€,\s]/g, ''));
      }
      return Number(value);
    },
    confidence: 0.7,
  },

  ebitda: {
    field: 'ebitda',
    patterns: [
      /(?:ebitda|profit|earnings)[\s]*(?:of|is|was|were|are)[\s]*[:\-]?\s*(?:€|EUR)?\s*([\d,]+(?:\.\d{1,2})?)/i,
      /€?\s*([\d,]+(?:\.\d{1,2})?)[\s]*(?:ebitda|profit)/i,
      /(?:operating|net)[\s]*(?:profit|income)[\s]*[:\-]?\s*(?:€|EUR)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    ],
    type: 'currency',
    required: false,
    validation: (value) => typeof value === 'number' && value >= -1000000000 && value <= 1000000000,
    transform: (value) => {
      if (typeof value === 'string') {
        const cleaned = value.replace(/[€,\s]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? null : parsed;
      }
      return Number(value);
    },
    confidence: 0.7,
  },

  founding_year: {
    field: 'founding_year',
    patterns: [
      /(?:founded|established|started|created)[\s]*(?:in|on)[\s]*(\d{4})/i,
      /(?:since|from)[\s]*(\d{4})/i,
      /(\d{4})[\s]*(?:founded|established|started)/i,
    ],
    type: 'number',
    required: false,
    validation: (value) => {
      const num = Number(value);
      const currentYear = new Date().getFullYear();
      return num >= 1800 && num <= currentYear + 1;
    },
    confidence: 0.8,
  },

  business_type: {
    field: 'business_type',
    patterns: [
      /(?:business|company|organization)[\s]*(?:type|category|sector|industry)[\s]*[:\-]?\s*([^,\n]{2,50})/i,
      /(?:we|I|our)[\s]*(?:are|is)[\s]*(?:a|an)[\s]+([^,\n]{2,50})/i,
      /(?:specialize|focus)[\s]*(?:in|on)[\s]+([^,\n]{2,50})/i,
    ],
    type: 'string',
    required: false,
    validation: (value) => typeof value === 'string' && value.length >= 2 && value.length <= 100,
    confidence: 0.6,
  },

  employee_count: {
    field: 'employee_count',
    patterns: [
      /(?:employees?|staff|team|people)[\s]*[:\-]?\s*(\d{1,5})/i,
      /(\d{1,5})[\s]*(?:employees?|staff|team members?)/i,
      /(?:workforce|headcount)[\s]*(?:of|is)[\s]*(\d{1,5})/i,
    ],
    type: 'number',
    required: false,
    validation: (value) => {
      const num = Number(value);
      return num >= 1 && num <= 100000;
    },
    confidence: 0.7,
  },
};

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class DataExtractorImpl implements DataExtractor {
  private extractionRules: Record<string, ExtractionRule>;

  constructor(customRules?: Record<string, ExtractionRule>) {
    this.extractionRules = { ...DEFAULT_EXTRACTION_RULES, ...(customRules || {}) };
  }

  /**
   * Extract structured data from a single message
   */
  extractFromMessage(message: string, context?: Partial<ExtractionContext>): ExtractionResult[] {
    const results: ExtractionResult[] = [];
    const normalizedMessage = message.toLowerCase().trim();

    for (const [fieldName, rule] of Object.entries(this.extractionRules)) {
      for (const pattern of rule.patterns) {
        const matches = normalizedMessage.match(pattern);
        if (matches && matches[1]) {
          const rawValue = matches[1].trim();
          const transformedValue = rule.transform ? rule.transform(rawValue) : rawValue;

          const result: ExtractionResult = {
            field: fieldName,
            value: transformedValue,
            confidence: rule.confidence,
            source: 'pattern_match',
            validationErrors: [],
            isValid: rule.validation ? rule.validation(transformedValue) : true,
            metadata: {
              pattern: pattern.source,
              match: matches[0],
              rawValue,
            },
          };

          // Validate the extraction
          if (rule.validation) {
            result.isValid = rule.validation(transformedValue);
            if (!result.isValid) {
              result.validationErrors.push(`Value failed validation for ${fieldName}`);
            }
          }

          results.push(result);

          chatLogger.debug('[DataExtractor] Extracted data from message', {
            field: fieldName,
            value: transformedValue,
            confidence: result.confidence,
            isValid: result.isValid,
          });

          break; // Only extract first match for each field
        }
      }
    }

    return results;
  }

  /**
   * Extract structured data from event metadata
   */
  extractFromMetadata(metadata: Record<string, any>): ExtractionResult[] {
    const results: ExtractionResult[] = [];

    // Handle structured extracted_data
    if (metadata.extracted_data && Array.isArray(metadata.extracted_data)) {
      for (const item of metadata.extracted_data) {
        if (item.field && item.value !== undefined) {
          const result: ExtractionResult = {
            field: item.field,
            value: item.value,
            confidence: item.confidence || 0.9,
            source: 'metadata',
            validationErrors: [],
            isValid: true,
            metadata: {
              source: 'structured_metadata',
              ...item.metadata,
            },
          };

          // Apply rule validation if rule exists
          const rule = this.extractionRules[item.field];
          if (rule?.validation) {
            result.isValid = rule.validation(item.value);
            if (!result.isValid) {
              result.validationErrors.push(`Value failed validation for ${item.field}`);
            }
          }

          results.push(result);
        }
      }
    }

    // Handle direct metadata fields
    const directFields = ['company_name', 'business_type', 'founding_year'];
    for (const field of directFields) {
      if (metadata[field] !== undefined && metadata[field] !== null) {
        const result: ExtractionResult = {
          field,
          value: metadata[field],
          confidence: 0.95,
          source: 'metadata',
          validationErrors: [],
          isValid: true,
          metadata: { source: 'direct_metadata' },
        };

        // Apply rule validation
        const rule = this.extractionRules[field];
        if (rule?.validation) {
          result.isValid = rule.validation(metadata[field]);
          if (!result.isValid) {
            result.validationErrors.push(`Value failed validation for ${field}`);
          }
        }

        results.push(result);
      }
    }

    chatLogger.debug('[DataExtractor] Extracted data from metadata', {
      itemCount: results.length,
      fields: results.map(r => r.field),
    });

    return results;
  }

  /**
   * Extract data with full context awareness
   */
  extractWithContext(context: ExtractionContext): ExtractionResult[] {
    let results: ExtractionResult[] = [];

    // Extract from message content
    results.push(...this.extractFromMessage(context.messageContent, context));

    // Extract from metadata
    if (context.metadata) {
      results.push(...this.extractFromMetadata(context.metadata));
    }

    // Apply context-aware validation and deduplication
    results = this.deduplicateResults(results);
    results = this.applyContextValidation(results, context);
    results = this.adjustConfidenceWithContext(results, context);

    return results;
  }

  /**
   * Validate a single extraction result
   */
  validateExtraction(result: ExtractionResult): boolean {
    const rule = this.extractionRules[result.field];
    if (!rule) return true; // No rule means always valid

    return rule.validation ? rule.validation(result.value) : true;
  }

  /**
   * Normalize value according to type rules
   */
  normalizeValue(value: any, type: ExtractionRule['type']): any {
    switch (type) {
      case 'string':
        return typeof value === 'string' ? value.trim() : String(value);
      case 'number':
        const num = Number(value);
        return isNaN(num) ? null : num;
      case 'currency':
        if (typeof value === 'string') {
          const cleaned = value.replace(/[^\d.,-]/g, '');
          return parseFloat(cleaned.replace(',', '.'));
        }
        return Number(value);
      case 'percentage':
        if (typeof value === 'string') {
          const cleaned = value.replace(/[^\d.,]/g, '');
          return parseFloat(cleaned.replace(',', '.')) / 100;
        }
        return Number(value) / 100;
      case 'boolean':
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          return ['yes', 'true', '1', 'on'].includes(lower);
        }
        return Boolean(value);
      default:
        return value;
    }
  }

  /**
   * Add custom extraction rule
   */
  addExtractionRule(rule: ExtractionRule): void {
    this.extractionRules[rule.field] = rule;
    chatLogger.info('[DataExtractor] Added extraction rule', {
      field: rule.field,
      patternCount: rule.patterns.length,
    });
  }

  /**
   * Remove extraction rule
   */
  removeExtractionRule(field: string): void {
    delete this.extractionRules[field];
    chatLogger.info('[DataExtractor] Removed extraction rule', { field });
  }

  /**
   * Get all extraction rules
   */
  getExtractionRules(): Record<string, ExtractionRule> {
    return { ...this.extractionRules };
  }

  /**
   * Extract from multiple messages
   */
  extractMultiple(messages: string[], context?: Partial<ExtractionContext>): ExtractionResult[] {
    const allResults: ExtractionResult[] = [];

    messages.forEach((message, index) => {
      const messageContext: ExtractionContext = {
        messageContent: message,
        metadata: context?.metadata,
        previousExtractions: allResults,
        conversationHistory: messages.slice(0, index),
      };

      allResults.push(...this.extractWithContext(messageContext));
    });

    return this.deduplicateResults(allResults);
  }

  // Private helper methods
  private deduplicateResults(results: ExtractionResult[]): ExtractionResult[] {
    const seen = new Map<string, ExtractionResult>();

    for (const result of results) {
      const key = `${result.field}:${JSON.stringify(result.value)}`;
      const existing = seen.get(key);

      if (!existing || result.confidence > existing.confidence) {
        seen.set(key, result);
      }
    }

    return Array.from(seen.values());
  }

  private applyContextValidation(results: ExtractionResult[], context: ExtractionContext): ExtractionResult[] {
    return results.map(result => {
      const validationErrors = [...result.validationErrors];

      // Context-aware validation
      if (result.field === 'founding_year' && context.metadata?.company_name) {
        // Could add company-specific validation here
      }

      if (result.field === 'revenue' && context.previousExtractions) {
        // Check for consistency with previous extractions
        const previousRevenue = context.previousExtractions.find(r => r.field === 'revenue');
        if (previousRevenue && Math.abs(result.value - previousRevenue.value) > previousRevenue.value * 0.5) {
          validationErrors.push('Revenue value significantly different from previous extraction');
          result.confidence *= 0.8;
        }
      }

      return {
        ...result,
        validationErrors,
        isValid: validationErrors.length === 0 && result.isValid,
      };
    });
  }

  private adjustConfidenceWithContext(results: ExtractionResult[], context: ExtractionContext): ExtractionResult[] {
    return results.map(result => {
      let adjustedConfidence = result.confidence;

      // Boost confidence for metadata sources
      if (result.source === 'metadata') {
        adjustedConfidence = Math.min(1.0, adjustedConfidence * 1.2);
      }

      // Boost confidence for repeated extractions
      if (context.previousExtractions?.some(prev => prev.field === result.field && prev.value === result.value)) {
        adjustedConfidence = Math.min(1.0, adjustedConfidence * 1.1);
      }

      // Reduce confidence for conflicting extractions
      const conflicts = context.previousExtractions?.filter(prev =>
        prev.field === result.field && prev.value !== result.value
      ) || [];

      if (conflicts.length > 0) {
        adjustedConfidence *= Math.pow(0.9, conflicts.length);
      }

      return {
        ...result,
        confidence: Math.max(0.1, Math.min(1.0, adjustedConfidence)),
      };
    });
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseDataExtractorResult {
  extractor: DataExtractor;
  actions: {
    extractFromMessage: (message: string, context?: Partial<ExtractionContext>) => ExtractionResult[];
    extractFromMetadata: (metadata: Record<string, any>) => ExtractionResult[];
    extractWithContext: (context: ExtractionContext) => ExtractionResult[];
    extractMultiple: (messages: string[], context?: Partial<ExtractionContext>) => ExtractionResult[];
  };
  utilities: {
    validateExtraction: (result: ExtractionResult) => boolean;
    normalizeValue: (value: any, type: ExtractionRule['type']) => any;
  };
  rules: {
    addRule: (rule: ExtractionRule) => void;
    removeRule: (field: string) => void;
    getRules: () => Record<string, ExtractionRule>;
  };
}

/**
 * useDataExtractor Hook
 *
 * React hook interface for DataExtractor engine
 * Provides reactive data extraction from streaming responses
 */
export const useDataExtractor = (
  customRules?: Record<string, ExtractionRule>
): UseDataExtractorResult => {
  const extractor = useMemo(() => new DataExtractorImpl(customRules), [customRules]);

  const actions = {
    extractFromMessage: useCallback(
      (message: string, context?: Partial<ExtractionContext>) =>
        extractor.extractFromMessage(message, context),
      [extractor]
    ),
    extractFromMetadata: useCallback(
      (metadata: Record<string, any>) => extractor.extractFromMetadata(metadata),
      [extractor]
    ),
    extractWithContext: useCallback(
      (context: ExtractionContext) => extractor.extractWithContext(context),
      [extractor]
    ),
    extractMultiple: useCallback(
      (messages: string[], context?: Partial<ExtractionContext>) =>
        extractor.extractMultiple(messages, context),
      [extractor]
    ),
  };

  const utilities = {
    validateExtraction: useCallback(
      (result: ExtractionResult) => extractor.validateExtraction(result),
      [extractor]
    ),
    normalizeValue: useCallback(
      (value: any, type: ExtractionRule['type']) => extractor.normalizeValue(value, type),
      [extractor]
    ),
  };

  const rules = {
    addRule: useCallback((rule: ExtractionRule) => extractor.addExtractionRule(rule), [extractor]),
    removeRule: useCallback((field: string) => extractor.removeExtractionRule(field), [extractor]),
    getRules: useCallback(() => extractor.getExtractionRules(), [extractor]),
  };

  return {
    extractor,
    actions,
    utilities,
    rules,
  };
};

