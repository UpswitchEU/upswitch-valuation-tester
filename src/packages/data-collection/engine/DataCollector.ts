/**
 * @package @upswitch/data-collection
 *
 * Data Collector Engine - Unified data collection orchestration.
 * Provides consistent interface for collecting business valuation data across all UI methods.
 */

import type {
  DataField,
  DataResponse,
  CollectionContext,
  CollectionSession,
  ValidationRule,
  DataCollectionMethod,
  DataCollector as BaseDataCollector
} from '../types';

// Import from config
import { BUSINESS_DATA_FIELDS } from '../config/businessDataFields';

/**
 * Main DataCollector implementation that orchestrates collection across all methods.
 * Follows Strategy pattern for different collection methods.
 */
export class DataCollector implements BaseDataCollector {
  private collectors = new Map<DataCollectionMethod, BaseDataCollector>();

  constructor() {
    // Initialize with no-op logger (can be injected later if needed)
    this.logger = {
      info: (message: string, data?: any) => console.log(message, data),
      error: (message: string, data?: any) => console.error(message, data),
      warn: (message: string, data?: any) => console.warn(message, data),
      debug: (message: string, data?: any) => console.debug(message, data)
    };
  }

  private logger: {
    info: (message: string, data?: any) => void;
    error: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    debug: (message: string, data?: any) => void;
  };

  // ============================================================================
  // COLLECTOR REGISTRATION
  // ============================================================================

  registerCollector(method: DataCollectionMethod, collector: BaseDataCollector): void {
    this.collectors.set(method, collector);
    this.logger.info(`Registered collector for method: ${method}`);
  }

  unregisterCollector(method: DataCollectionMethod): void {
    this.collectors.delete(method);
    this.logger.info(`Unregistered collector for method: ${method}`);
  }

  // ============================================================================
  // CORE DATA COLLECTION METHODS
  // ============================================================================

  async collect(field: DataField, context?: CollectionContext): Promise<DataResponse> {
    const method = context?.method || 'manual_form';

    if (!this.supportsMethod(method)) {
      throw new Error(`Unsupported collection method: ${method}`);
    }

    const collector = this.collectors.get(method);
    if (!collector) {
      throw new Error(`No collector registered for method: ${method}`);
    }

    try {
      this.logger.info('Starting data collection', {
        fieldId: field.id,
        method,
        sessionId: context?.session.id
      });

      const response = await collector.collect(field, context);

      this.logger.info('Data collection completed', {
        fieldId: field.id,
        method,
        confidence: response.confidence,
        hasValue: response.value !== undefined
      });

      return response;
    } catch (error) {
      this.logger.error('Data collection failed', {
        fieldId: field.id,
        method,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  validate(field: DataField, value: any): ValidationRule[] {
    const errors: ValidationRule[] = [];

    // Check required fields
    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({
        type: 'required',
        message: `${field.label} is required`,
        severity: 'error'
      });
      return errors; // Don't continue validation if required field is missing
    }

    // Apply custom validation rules
    if (field.validation) {
      for (const rule of field.validation) {
        try {
          let isValid = true;

          switch (rule.type) {
            case 'required':
              isValid = value !== undefined && value !== null && value !== '';
              break;
            case 'min':
              if (typeof value === 'number' && typeof rule.value === 'number') {
                isValid = value >= rule.value;
              } else if (typeof value === 'string' && typeof rule.value === 'number') {
                isValid = value.length >= rule.value;
              }
              break;
            case 'max':
              if (typeof value === 'number' && typeof rule.value === 'number') {
                isValid = value <= rule.value;
              } else if (typeof value === 'string' && typeof rule.value === 'number') {
                isValid = value.length <= rule.value;
              }
              break;
            case 'pattern':
              if (rule.value instanceof RegExp) {
                isValid = rule.value.test(String(value));
              }
              break;
            case 'custom':
              if (typeof rule.value === 'function') {
                isValid = rule.value(value);
              }
              break;
          }

          if (!isValid) {
            errors.push(rule);
          }
        } catch (error) {
          this.logger.error('Validation rule failed', {
            fieldId: field.id,
            ruleType: rule.type,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          errors.push({
            ...rule,
            message: 'Validation failed due to an error',
            severity: 'error'
          });
        }
      }
    }

    return errors;
  }

  async collectMultiple(fields: DataField[], context?: CollectionContext): Promise<DataResponse[]> {
    const responses: DataResponse[] = [];

    for (const field of fields) {
      try {
        const response = await this.collect(field, context);
        responses.push(response);
      } catch (error) {
        this.logger.error('Failed to collect field', {
          fieldId: field.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // Continue with other fields even if one fails
      }
    }

    return responses;
  }

  validateMultiple(responses: DataResponse[]): Map<string, ValidationRule[]> {
    const errors = new Map<string, ValidationRule[]>();

    for (const response of responses) {
      const field = this.getFieldById(response.fieldId);
      if (field) {
        const fieldErrors = this.validate(field, response.value);
        if (fieldErrors.length > 0) {
          errors.set(response.fieldId, fieldErrors);
        }
      }
    }

    return errors;
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  createSession(method: DataCollectionMethod, fieldIds?: string[]): CollectionSession {
    const fields = fieldIds
      ? fieldIds.map(id => this.getFieldById(id)).filter(Boolean) as DataField[]
      : Object.values(BUSINESS_DATA_FIELDS).sort((a, b) => a.priority - b.priority);

    return {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fields,
      responses: new Map(),
      completedFieldIds: new Set(),
      method,
      startedAt: new Date(),
      lastActivity: new Date(),
      isComplete: false,
      validationErrors: new Map()
    };
  }

  updateSession(session: CollectionSession, response: DataResponse): CollectionSession {
    const updatedSession = { ...session };
    updatedSession.responses.set(response.fieldId, response);
    updatedSession.completedFieldIds.add(response.fieldId);
    updatedSession.lastActivity = new Date();

    // Validate all responses and update errors
    updatedSession.validationErrors = this.validateMultiple(
      Array.from(updatedSession.responses.values())
    );

    // Check if session is complete (all required fields collected and valid)
    const requiredFields = updatedSession.fields.filter(f => f.required);
    const completedRequiredFields = requiredFields.filter(f =>
      updatedSession.completedFieldIds.has(f.id) &&
      !updatedSession.validationErrors.has(f.id)
    );

    updatedSession.isComplete = completedRequiredFields.length === requiredFields.length;

    return updatedSession;
  }

  getNextField(session: CollectionSession): DataField | undefined {
    // Return first incomplete field that doesn't have blocking errors
    return session.fields.find(field =>
      !session.completedFieldIds.has(field.id) &&
      !session.validationErrors.has(field.id)
    );
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  supportsMethod(method: DataCollectionMethod): boolean {
    return this.collectors.has(method);
  }

  getCapabilities(): DataCollectionMethod[] {
    return Array.from(this.collectors.keys());
  }

  getFieldById(fieldId: string): DataField | undefined {
    return BUSINESS_DATA_FIELDS[fieldId];
  }

  getAllFields(): DataField[] {
    return Object.values(BUSINESS_DATA_FIELDS).sort((a, b) => a.priority - b.priority);
  }
}