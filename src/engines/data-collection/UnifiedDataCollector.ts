/**
 * Data Collector Engine
 *
 * Single Responsibility: Orchestrate data collection across all methods (manual, conversational, suggestions, etc.)
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * Provides a consistent interface for collecting business valuation data regardless of the UI method used.
 */

import {
  DataField,
  DataResponse,
  DataCollector,
  CollectionContext,
  CollectionSession,
  BUSINESS_DATA_FIELDS,
  ValidationRule,
  DataCollectionMethod
} from '../../types/data-collection';
import { ILogger } from '../../services/container/interfaces/ILogger';
import { ServiceContainer } from '../../services/container/ServiceContainer';

export class DataCollector implements DataCollector {
  private logger: ILogger;
  private collectors = new Map<DataCollectionMethod, DataCollector>();

  constructor() {
    this.logger = ServiceContainer.getInstance().resolve<ILogger>('ILogger');
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
              if (typeof value === 'number') {
                isValid = value >= rule.value;
              } else if (typeof value === 'string') {
                isValid = value.length >= rule.value;
              }
              break;
            case 'max':
              if (typeof value === 'number') {
                isValid = value <= rule.value;
              } else if (typeof value === 'string') {
                isValid = value.length <= rule.value;
              }
              break;
            case 'pattern':
              if (typeof value === 'string') {
                isValid = new RegExp(rule.value).test(value);
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
          this.logger.warn('Validation rule failed', {
            fieldId: field.id,
            ruleType: rule.type,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    return errors;
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  async collectMultiple(fields: DataField[], context?: CollectionContext): Promise<DataResponse[]> {
    const responses: DataResponse[] = [];

    for (const field of fields) {
      try {
        const response = await this.collect(field, context);
        responses.push(response);
      } catch (error) {
        this.logger.warn('Failed to collect field in batch', {
          fieldId: field.id,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // Continue with other fields
      }
    }

    return responses;
  }

  validateMultiple(responses: DataResponse[]): Map<string, ValidationRule[]> {
    const validationResults = new Map<string, ValidationRule[]>();

    for (const response of responses) {
      const field = BUSINESS_DATA_FIELDS[response.fieldId];
      if (field) {
        const errors = this.validate(field, response.value);
        if (errors.length > 0) {
          validationResults.set(response.fieldId, errors);
        }
      }
    }

    return validationResults;
  }

  // ============================================================================
  // METHOD MANAGEMENT
  // ============================================================================

  registerCollector(method: DataCollectionMethod, collector: DataCollector): void {
    if (!collector.supportsMethod(method)) {
      throw new Error(`Collector does not support method: ${method}`);
    }

    this.collectors.set(method, collector);
    this.logger.info('Registered data collector', { method });
  }

  unregisterCollector(method: DataCollectionMethod): void {
    this.collectors.delete(method);
    this.logger.info('Unregistered data collector', { method });
  }

  supportsMethod(method: DataCollectionMethod): boolean {
    return this.collectors.has(method);
  }

  getCapabilities(): DataCollectionMethod[] {
    return Array.from(this.collectors.keys());
  }

  // ============================================================================
  // SESSION MANAGEMENT
  // ============================================================================

  createSession(method: DataCollectionMethod = 'manual_form'): CollectionSession {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const session: CollectionSession = {
      id: sessionId,
      fields: Object.values(BUSINESS_DATA_FIELDS),
      responses: new Map(),
      completedFieldIds: new Set(),
      method,
      startedAt: new Date(),
      lastActivity: new Date(),
      isComplete: false,
      validationErrors: new Map()
    };

    this.logger.info('Created data collection session', {
      sessionId,
      method,
      totalFields: session.fields.length
    });

    return session;
  }

  updateSession(session: CollectionSession, response: DataResponse): CollectionSession {
    // Add response
    session.responses.set(response.fieldId, response);
    session.completedFieldIds.add(response.fieldId);
    session.lastActivity = new Date();

    // Validate the response
    const field = session.fields.find(f => f.id === response.fieldId);
    if (field) {
      const errors = this.validate(field, response.value);
      if (errors.length > 0) {
        session.validationErrors.set(response.fieldId, errors);
      } else {
        session.validationErrors.delete(response.fieldId);
      }
    }

    // Check if session is complete
    const requiredFields = session.fields.filter(f => f.required);
    const completedRequiredFields = requiredFields.filter(f =>
      session.completedFieldIds.has(f.id)
    );

    session.isComplete = completedRequiredFields.length === requiredFields.length;

    this.logger.debug('Updated collection session', {
      sessionId: session.id,
      fieldId: response.fieldId,
      completedFields: session.completedFieldIds.size,
      totalFields: session.fields.length,
      isComplete: session.isComplete
    });

    return session;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  getField(fieldId: string): DataField | undefined {
    return BUSINESS_DATA_FIELDS[fieldId];
  }

  getAllFields(): DataField[] {
    return Object.values(BUSINESS_DATA_FIELDS);
  }

  getFieldsByGroup(group: string): DataField[] {
    return Object.values(BUSINESS_DATA_FIELDS).filter(field => field.group === group);
  }

  getRequiredFields(): DataField[] {
    return Object.values(BUSINESS_DATA_FIELDS).filter(field => field.required);
  }

  getNextField(session: CollectionSession): DataField | undefined {
    // Get incomplete required fields first, then optional fields
    const incompleteRequired = session.fields
      .filter(f => f.required && !session.completedFieldIds.has(f.id))
      .sort((a, b) => a.priority - b.priority);

    if (incompleteRequired.length > 0) {
      return incompleteRequired[0];
    }

    // Then get incomplete optional fields
    const incompleteOptional = session.fields
      .filter(f => !f.required && !session.completedFieldIds.has(f.id))
      .sort((a, b) => a.priority - b.priority);

    return incompleteOptional[0];
  }
}