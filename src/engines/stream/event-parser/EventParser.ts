/**
 * EventParser Engine - Parse and Validate Streaming Events
 *
 * Single Responsibility: Parse incoming streaming events, validate structure, extract metadata
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/stream/event-parser/EventParser
 */

import { useCallback, useMemo } from 'react';
import { chatLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface StreamingEvent {
  type: string;
  data: any;
  timestamp: number;
  sequenceId?: number;
  metadata?: Record<string, any>;
}

export interface ParsedEvent {
  event: StreamingEvent;
  isValid: boolean;
  validationErrors: string[];
  normalizedData: any;
  eventType: 'message' | 'data' | 'valuation' | 'progress' | 'error' | 'complete' | 'unknown';
  priority: 'high' | 'medium' | 'low';
  requiresUIUpdate: boolean;
  requiresDataCollection: boolean;
}

export interface EventParser {
  // Core parsing
  parseEvent(rawEvent: any): ParsedEvent;

  // Validation
  validateEvent(event: StreamingEvent): { isValid: boolean; errors: string[] };

  // Normalization
  normalizeEventData(event: StreamingEvent): any;

  // Classification
  classifyEvent(event: StreamingEvent): ParsedEvent['eventType'];
  getEventPriority(event: StreamingEvent): ParsedEvent['priority'];

  // Bulk operations
  parseMultipleEvents(rawEvents: any[]): ParsedEvent[];
}

// ============================================================================
// EVENT TYPE CLASSIFICATION
// ============================================================================

const EVENT_TYPE_PATTERNS = {
  message: ['message', 'text', 'content', 'response'],
  data: ['data', 'extracted_data', 'collected_data', 'structured_data'],
  valuation: ['valuation', 'valuation_result', 'valuation_complete', 'calculate'],
  progress: ['progress', 'loading', 'processing', 'phase', 'step'],
  error: ['error', 'error_occurred', 'failure', 'failed'],
  complete: ['complete', 'finished', 'done', 'end'],
} as const;

const EVENT_PRIORITY_MAP: Record<string, ParsedEvent['priority']> = {
  valuation_complete: 'high',
  error: 'high',
  message: 'medium',
  data: 'medium',
  progress: 'low',
  complete: 'medium',
} as const;

// ============================================================================
// VALIDATION RULES
// ============================================================================

interface EventValidationRule {
  field: string;
  required: boolean;
  type?: 'string' | 'number' | 'boolean' | 'object' | 'array';
  custom?: (value: any) => boolean;
  errorMessage?: string;
}

const EVENT_VALIDATION_RULES: Record<string, EventValidationRule[]> = {
  message: [
    { field: 'type', required: true, type: 'string' },
    { field: 'data', required: true, type: 'object' },
    {
      field: 'data.content',
      required: false,
      type: 'string',
      custom: (value) => typeof value === 'string' && value.length <= 10000,
      errorMessage: 'Message content too long (max 10000 chars)',
    },
  ],
  data: [
    { field: 'type', required: true, type: 'string' },
    { field: 'data', required: true, type: 'object' },
    {
      field: 'data.extracted_data',
      required: false,
      type: 'array',
      custom: (value) => Array.isArray(value) && value.length <= 50,
      errorMessage: 'Too many extracted data points (max 50)',
    },
  ],
  valuation: [
    { field: 'type', required: true, type: 'string' },
    { field: 'data', required: true, type: 'object' },
    {
      field: 'data.valuation_id',
      required: false,
      type: 'string',
      custom: (value) => typeof value === 'string' && value.length > 0,
      errorMessage: 'Invalid valuation ID',
    },
  ],
  progress: [
    { field: 'type', required: true, type: 'string' },
    { field: 'data', required: true, type: 'object' },
    {
      field: 'data.progress',
      required: false,
      type: 'number',
      custom: (value) => typeof value === 'number' && value >= 0 && value <= 100,
      errorMessage: 'Progress must be between 0 and 100',
    },
  ],
  error: [
    { field: 'type', required: true, type: 'string' },
    { field: 'data', required: true, type: 'object' },
    {
      field: 'data.error',
      required: false,
      type: 'string',
      custom: (value) => typeof value === 'string' && value.length <= 500,
      errorMessage: 'Error message too long (max 500 chars)',
    },
  ],
  complete: [
    { field: 'type', required: true, type: 'string' },
    { field: 'data', required: true, type: 'object' },
  ],
};

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class EventParserImpl implements EventParser {
  /**
   * Parse a raw streaming event into structured format
   */
  parseEvent(rawEvent: any): ParsedEvent {
    try {
      // Ensure we have a valid event structure
      const event = this.normalizeRawEvent(rawEvent);
      const validation = this.validateEvent(event);
      const eventType = this.classifyEvent(event);
      const priority = this.getEventPriority(event);

      const parsedEvent: ParsedEvent = {
        event,
        isValid: validation.isValid,
        validationErrors: validation.errors,
        normalizedData: validation.isValid ? this.normalizeEventData(event) : null,
        eventType,
        priority,
        requiresUIUpdate: this.requiresUIUpdate(eventType, event),
        requiresDataCollection: this.requiresDataCollection(eventType, event),
      };

      chatLogger.debug('[EventParser] Parsed event', {
        type: eventType,
        priority,
        isValid: validation.isValid,
        uiUpdate: parsedEvent.requiresUIUpdate,
        dataCollection: parsedEvent.requiresDataCollection,
      });

      return parsedEvent;

    } catch (error) {
      chatLogger.error('[EventParser] Failed to parse event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        rawEvent: JSON.stringify(rawEvent).substring(0, 200),
      });

      return {
        event: this.createErrorEvent(rawEvent),
        isValid: false,
        validationErrors: ['Failed to parse event structure'],
        normalizedData: null,
        eventType: 'error',
        priority: 'high',
        requiresUIUpdate: true,
        requiresDataCollection: false,
      };
    }
  }

  /**
   * Validate event structure against rules
   */
  validateEvent(event: StreamingEvent): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const eventType = this.classifyEvent(event);
    const rules = EVENT_VALIDATION_RULES[eventType] || [];

    for (const rule of rules) {
      const value = this.getNestedValue(event, rule.field);

      // Check required fields
      if (rule.required && (value === undefined || value === null)) {
        errors.push(`${rule.field} is required for ${eventType} events`);
        continue;
      }

      // Skip validation if field is not present and not required
      if (value === undefined || value === null) continue;

      // Type validation
      if (rule.type && !this.validateType(value, rule.type)) {
        errors.push(`${rule.field} must be of type ${rule.type}`);
        continue;
      }

      // Custom validation
      if (rule.custom && !rule.custom(value)) {
        errors.push(rule.errorMessage || `${rule.field} failed validation`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Normalize event data for consistent processing
   */
  normalizeEventData(event: StreamingEvent): any {
    const normalized: any = { ...event.data };

    // Normalize common fields
    if (normalized.content && typeof normalized.content === 'string') {
      normalized.content = normalized.content.trim();
    }

    if (normalized.progress !== undefined) {
      normalized.progress = Math.max(0, Math.min(100, Number(normalized.progress)));
    }

    if (normalized.extracted_data && Array.isArray(normalized.extracted_data)) {
      normalized.extracted_data = normalized.extracted_data.map((item: any) => ({
        field: item.field || item.name || 'unknown',
        value: item.value,
        confidence: item.confidence || 0.5,
        source: item.source || 'ai_extraction',
        timestamp: item.timestamp || Date.now(),
      }));
    }

    if (normalized.valuation_result) {
      normalized.valuation_result = this.normalizeValuationResult(normalized.valuation_result);
    }

    return normalized;
  }

  /**
   * Classify event type based on content
   */
  classifyEvent(event: StreamingEvent): ParsedEvent['eventType'] {
    const eventType = event.type?.toLowerCase() || '';
    const dataKeys = Object.keys(event.data || {}).join(' ').toLowerCase();

    // Direct type matching
    for (const [type, patterns] of Object.entries(EVENT_TYPE_PATTERNS)) {
      if (patterns.some(pattern => eventType.includes(pattern) || dataKeys.includes(pattern))) {
        return type as ParsedEvent['eventType'];
      }
    }

    // Data-driven classification
    if (event.data?.valuation_result || event.data?.valuation_id) return 'valuation';
    if (event.data?.extracted_data || event.data?.collected_data) return 'data';
    if (event.data?.progress !== undefined || event.data?.phase) return 'progress';
    if (event.data?.error || event.data?.error_occurred) return 'error';
    if (event.data?.complete || event.data?.finished) return 'complete';
    if (event.data?.content || event.data?.message) return 'message';

    return 'unknown';
  }

  /**
   * Determine event priority
   */
  getEventPriority(event: StreamingEvent): ParsedEvent['priority'] {
    const eventType = this.classifyEvent(event);
    return EVENT_PRIORITY_MAP[eventType] || 'medium';
  }

  /**
   * Parse multiple events in batch
   */
  parseMultipleEvents(rawEvents: any[]): ParsedEvent[] {
    return rawEvents.map(rawEvent => this.parseEvent(rawEvent));
  }

  // Private helper methods
  private normalizeRawEvent(rawEvent: any): StreamingEvent {
    if (typeof rawEvent === 'string') {
      try {
        rawEvent = JSON.parse(rawEvent);
      } catch {
        return {
          type: 'unknown',
          data: { rawContent: rawEvent },
          timestamp: Date.now(),
        };
      }
    }

    return {
      type: rawEvent.type || 'unknown',
      data: rawEvent.data || {},
      timestamp: rawEvent.timestamp || Date.now(),
      sequenceId: rawEvent.sequenceId,
      metadata: rawEvent.metadata || {},
    };
  }

  private validateType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private requiresUIUpdate(eventType: ParsedEvent['eventType'], event: StreamingEvent): boolean {
    const uiUpdateTypes: ParsedEvent['eventType'][] = ['message', 'progress', 'error', 'valuation', 'complete'];
    return uiUpdateTypes.includes(eventType);
  }

  private requiresDataCollection(eventType: ParsedEvent['eventType'], event: StreamingEvent): boolean {
    return eventType === 'data' || (eventType === 'message' && event.data?.extracted_data);
  }

  private normalizeValuationResult(result: any): any {
    return {
      valuation_id: result.valuation_id || result.id,
      equity_value_mid: result.equity_value_mid || result.value,
      equity_value_low: result.equity_value_low,
      equity_value_high: result.equity_value_high,
      confidence_score: result.confidence_score || result.confidence,
      methodology: result.methodology,
      html_report: result.html_report,
      info_tab_html: result.info_tab_html,
      created_at: result.created_at || new Date().toISOString(),
    };
  }

  private createErrorEvent(rawEvent: any): StreamingEvent {
    return {
      type: 'error',
      data: {
        error: 'Failed to parse event',
        rawEvent: typeof rawEvent === 'string' ? rawEvent.substring(0, 200) : JSON.stringify(rawEvent).substring(0, 200),
      },
      timestamp: Date.now(),
    };
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseEventParserResult {
  parser: EventParser;
  actions: {
    parseEvent: (rawEvent: any) => ParsedEvent;
    validateEvent: (event: StreamingEvent) => { isValid: boolean; errors: string[] };
    normalizeEventData: (event: StreamingEvent) => any;
    parseMultipleEvents: (rawEvents: any[]) => ParsedEvent[];
  };
  utilities: {
    classifyEvent: (event: StreamingEvent) => ParsedEvent['eventType'];
    getEventPriority: (event: StreamingEvent) => ParsedEvent['priority'];
  };
}

/**
 * useEventParser Hook
 *
 * React hook interface for EventParser engine
 * Provides reactive event parsing and validation
 */
export const useEventParser = (): UseEventParserResult => {
  const parser = useMemo(() => new EventParserImpl(), []);

  const actions = {
    parseEvent: useCallback((rawEvent: any) => parser.parseEvent(rawEvent), [parser]),
    validateEvent: useCallback(
      (event: StreamingEvent) => parser.validateEvent(event),
      [parser]
    ),
    normalizeEventData: useCallback(
      (event: StreamingEvent) => parser.normalizeEventData(event),
      [parser]
    ),
    parseMultipleEvents: useCallback(
      (rawEvents: any[]) => parser.parseMultipleEvents(rawEvents),
      [parser]
    ),
  };

  const utilities = {
    classifyEvent: useCallback(
      (event: StreamingEvent) => parser.classifyEvent(event),
      [parser]
    ),
    getEventPriority: useCallback(
      (event: StreamingEvent) => parser.getEventPriority(event),
      [parser]
    ),
  };

  return {
    parser,
    actions,
    utilities,
  };
};
