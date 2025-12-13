/**
 * DataCollectionEngine - AI Response Parsing & Data Extraction
 *
 * Single Responsibility: Parse AI responses, extract structured data, validate and normalize
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/data-collection/DataCollectionEngine
 */

import { useCallback, useMemo } from 'react';
import { chatLogger } from '../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CollectedData {
  field: string;
  value: string | number | boolean;
  timestamp: number;
  source: 'user_input' | 'suggestion' | 'validation' | 'ai_extraction';
  confidence: number;
  metadata?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface NormalizedData extends CollectedData {
  normalizedValue: any;
  dataType: 'string' | 'number' | 'boolean' | 'currency' | 'percentage' | 'date';
  validation: ValidationResult;
}

export interface AIResponse {
  content: string;
  metadata?: {
    extracted_data?: any[];
    business_type?: string;
    company_name?: string;
    registration_number?: string;
    legal_form?: string;
    suggestions?: any[];
    [key: string]: any;
  };
}

export interface DataCollectionEngine {
  // Core parsing
  parseResponse(response: AIResponse): CollectedData[];

  // Validation
  validateData(data: CollectedData): ValidationResult;

  // Normalization
  normalizeData(data: CollectedData): NormalizedData;

  // Bulk operations
  parseAndValidate(response: AIResponse): NormalizedData[];
}

// ============================================================================
// FIELD DEFINITIONS
// ============================================================================

interface FieldDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'currency' | 'percentage' | 'date';
  validation: {
    required?: boolean;
    min?: number;
    max?: number;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
  };
  normalization?: {
    transform: (value: any) => any;
    format?: (value: any) => string;
  };
}

const FIELD_DEFINITIONS: Record<string, FieldDefinition> = {
  company_name: {
    name: 'company_name',
    type: 'string',
    validation: {
      required: true,
      min: 2,
      max: 100,
      pattern: /^[a-zA-Z0-9\s\-\.&()]+$/,
    },
  },
  revenue: {
    name: 'revenue',
    type: 'currency',
    validation: {
      required: false,
      min: 0,
      max: 1000000000, // 1B max
    },
    normalization: {
      transform: (value: any) => {
        if (typeof value === 'string') {
          // Remove currency symbols and convert to number
          return parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
        }
        return Number(value);
      },
    },
  },
  ebitda: {
    name: 'ebitda',
    type: 'currency',
    validation: {
      required: false,
      min: -1000000000,
      max: 1000000000,
    },
    normalization: {
      transform: (value: any) => {
        if (typeof value === 'string') {
          return parseFloat(value.replace(/[^\d.,\-]/g, '').replace(',', '.'));
        }
        return Number(value);
      },
    },
  },
  founding_year: {
    name: 'founding_year',
    type: 'number',
    validation: {
      required: false,
      min: 1800,
      max: new Date().getFullYear(),
    },
  },
  business_type: {
    name: 'business_type',
    type: 'string',
    validation: {
      required: false,
      pattern: /^[a-z_]+$/,
    },
  },
};

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class DataCollectionEngineImpl implements DataCollectionEngine {
  private fieldDefinitions: Record<string, FieldDefinition>;

  constructor(customFields?: Record<string, FieldDefinition>) {
    this.fieldDefinitions = { ...FIELD_DEFINITIONS, ...(customFields || {}) };
  }

  /**
   * Parse AI response and extract structured data
   */
  parseResponse(response: AIResponse): CollectedData[] {
    const collectedData: CollectedData[] = [];

    try {
      // Extract from metadata first (structured data)
      if (response.metadata?.extracted_data) {
        const metadataData = this.parseMetadataData(response.metadata.extracted_data);
        collectedData.push(...metadataData);
      }

      // Extract from content (unstructured text parsing)
      const contentData = this.parseContentData(response.content);
      collectedData.push(...contentData);

      // Extract business information from metadata
      if (response.metadata) {
        const businessData = this.extractBusinessInfo(response.metadata);
        collectedData.push(...businessData);
      }

      chatLogger.debug('[DataCollectionEngine] Parsed response', {
        contentLength: response.content.length,
        dataPoints: collectedData.length,
        fields: collectedData.map(d => d.field),
      });

    } catch (error) {
      chatLogger.error('[DataCollectionEngine] Failed to parse response', {
        error: error instanceof Error ? error.message : 'Unknown error',
        contentLength: response.content.length,
      });
    }

    return collectedData;
  }

  /**
   * Parse structured data from metadata
   */
  private parseMetadataData(extractedData: any[]): CollectedData[] {
    return extractedData.map(item => ({
      field: item.field || item.name || 'unknown',
      value: item.value,
      timestamp: Date.now(),
      source: 'ai_extraction' as const,
      confidence: item.confidence || 0.8,
      metadata: item.metadata || {},
    }));
  }

  /**
   * Parse unstructured data from content
   */
  private parseContentData(content: string): CollectedData[] {
    const data: CollectedData[] = [];

    // Simple pattern matching for common fields
    const patterns = {
      revenue: /(?:revenue|sales|turnover)[\s:]+(?:€|EUR)?\s*([\d,]+\.?\d*)/i,
      ebitda: /(?:ebitda|profit)[\s:]+(?:€|EUR)?\s*([\d,]+\.?\d*)/i,
      founding_year: /(?:founded|established|started)[\s:]+(\d{4})/i,
    };

    Object.entries(patterns).forEach(([field, pattern]) => {
      const match = content.match(pattern);
      if (match && match[1]) {
        data.push({
          field,
          value: match[1].replace(/,/g, ''),
          timestamp: Date.now(),
          source: 'ai_extraction',
          confidence: 0.6, // Lower confidence for pattern matching
        });
      }
    });

    return data;
  }

  /**
   * Extract business information from metadata
   */
  private extractBusinessInfo(metadata: any): CollectedData[] {
    const data: CollectedData[] = [];

    if (metadata.company_name) {
      data.push({
        field: 'company_name',
        value: metadata.company_name,
        timestamp: Date.now(),
        source: 'ai_extraction',
        confidence: 0.9,
      });
    }

    if (metadata.business_type) {
      data.push({
        field: 'business_type',
        value: metadata.business_type,
        timestamp: Date.now(),
        source: 'ai_extraction',
        confidence: 0.8,
      });
    }

    if (metadata.registration_number) {
      data.push({
        field: 'registration_number',
        value: metadata.registration_number,
        timestamp: Date.now(),
        source: 'ai_extraction',
        confidence: 0.95,
      });
    }

    return data;
  }

  /**
   * Validate collected data against field definitions
   */
  validateData(data: CollectedData): ValidationResult {
    const fieldDef = this.fieldDefinitions[data.field];

    if (!fieldDef) {
      return {
        isValid: true, // Unknown fields are valid by default
        errors: [],
        warnings: [`Unknown field: ${data.field}`],
        suggestions: [],
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Type validation
    if (!this.validateType(data.value, fieldDef.type)) {
      errors.push(`Invalid type for ${data.field}: expected ${fieldDef.type}`);
    }

    // Required validation
    if (fieldDef.validation.required && (data.value === null || data.value === undefined || data.value === '')) {
      errors.push(`${data.field} is required`);
    }

    // Range validation
    if (typeof data.value === 'number' && fieldDef.validation.min !== undefined && data.value < fieldDef.validation.min) {
      errors.push(`${data.field} must be at least ${fieldDef.validation.min}`);
    }

    if (typeof data.value === 'number' && fieldDef.validation.max !== undefined && data.value > fieldDef.validation.max) {
      errors.push(`${data.field} must be at most ${fieldDef.validation.max}`);
    }

    // Pattern validation
    if (typeof data.value === 'string' && fieldDef.validation.pattern && !fieldDef.validation.pattern.test(data.value)) {
      errors.push(`${data.field} format is invalid`);
    }

    // Custom validation
    if (fieldDef.validation.custom && !fieldDef.validation.custom(data.value)) {
      errors.push(`${data.field} failed custom validation`);
    }

    // Confidence warnings
    if (data.confidence < 0.5) {
      warnings.push(`Low confidence in ${data.field} extraction (${(data.confidence * 100).toFixed(0)}%)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions,
    };
  }

  /**
   * Normalize data according to field definitions
   */
  normalizeData(data: CollectedData): NormalizedData {
    const validation = this.validateData(data);
    const fieldDef = this.fieldDefinitions[data.field];

    let normalizedValue = data.value;

    // Apply normalization transform
    if (fieldDef?.normalization?.transform) {
      try {
        normalizedValue = fieldDef.normalization.transform(data.value);
      } catch (error) {
        chatLogger.warn('[DataCollectionEngine] Normalization failed', {
          field: data.field,
          value: data.value,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      ...data,
      normalizedValue,
      dataType: fieldDef?.type || 'string',
      validation,
    };
  }

  /**
   * Parse and validate in one operation
   */
  parseAndValidate(response: AIResponse): NormalizedData[] {
    const collectedData = this.parseResponse(response);
    return collectedData.map(data => this.normalizeData(data));
  }

  /**
   * Validate value type
   */
  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'currency':
      case 'percentage':
        return typeof value === 'number' || (typeof value === 'string' && !isNaN(Number(value)));
      case 'date':
        return value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)));
      default:
        return true;
    }
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseDataCollectionEngineResult {
  engine: DataCollectionEngine;
  actions: {
    parseResponse: (response: AIResponse) => CollectedData[];
    validateData: (data: CollectedData) => ValidationResult;
    normalizeData: (data: CollectedData) => NormalizedData;
    parseAndValidate: (response: AIResponse) => NormalizedData[];
  };
}

/**
 * useDataCollectionEngine Hook
 *
 * React hook interface for DataCollectionEngine
 * Provides reactive data collection and validation
 */
export const useDataCollectionEngine = (
  customFields?: Record<string, FieldDefinition>
): UseDataCollectionEngineResult => {
  const engine = useMemo(() => new DataCollectionEngineImpl(customFields), [customFields]);

  const actions = {
    parseResponse: useCallback((response: AIResponse) => engine.parseResponse(response), [engine]),
    validateData: useCallback((data: CollectedData) => engine.validateData(data), [engine]),
    normalizeData: useCallback((data: CollectedData) => engine.normalizeData(data), [engine]),
    parseAndValidate: useCallback((response: AIResponse) => engine.parseAndValidate(response), [engine]),
  };

  return {
    engine,
    actions,
  };
};
