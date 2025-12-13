/**
 * ValuationProcessor Engine - Valuation Data Extraction & Validation
 *
 * Single Responsibility: Extract and validate valuation data from backend responses.
 * NO CALCULATIONS - All calculations happen in Python backend.
 * 
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/stream/valuation-processor/ValuationProcessor
 */

import { useCallback, useMemo } from 'react';
import type { ValuationResponse } from '../../../types/valuation';
import type { ParsedEvent } from '../event-parser/EventParser';
import { chatLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ValuationPreview {
  estimatedValue?: number;
  confidence?: number;
  methodology?: string;
  assumptions?: Record<string, any>;
  range?: {
    low: number;
    mid: number;
    high: number;
  };
  keyMetrics?: Record<string, any>;
  risks?: string[];
  timestamp: number;
}

export interface CalculateOption {
  method: string;
  parameters: Record<string, any>;
  estimatedValue?: number;
  confidence?: number;
  processingTime?: number;
  isRecommended?: boolean;
  metadata?: Record<string, any>;
}

export interface ValuationContext {
  companyName?: string;
  businessType?: string;
  revenue?: number;
  ebitda?: number;
  countryCode?: string;
  foundingYear?: number;
  historicalData?: any[];
}

export interface ValuationProcessor {
  // Preview processing (data extraction only)
  processValuationPreview(event: ParsedEvent): ValuationPreview | null;
  validatePreview(preview: ValuationPreview): ValidationResult;

  // Calculation option processing (data extraction only)
  processCalculateOption(event: ParsedEvent): CalculateOption | null;
  validateCalculateOption(option: CalculateOption): ValidationResult;

  // Valuation completion (data extraction only)
  processValuationComplete(event: ParsedEvent): ValuationResponse | null;
  validateValuationResult(result: ValuationResponse): ValidationResult;

  // Context building (data extraction only)
  buildValuationContext(extractedData: any[]): ValuationContext;
  
  // NOTE: All calculation logic (methodology recommendations, quality assessment, etc.)
  // is handled by Python backend. Frontend only extracts and validates data.
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  score: number; // 0-1 quality score
}

// NOTE: QualityAssessment and ValuationAnomaly interfaces removed.
// Quality assessment and anomaly detection are handled by Python backend.
// Frontend only displays the results from backend.

// ============================================================================
// VALIDATION RULES
// ============================================================================

const PREVIEW_VALIDATION_RULES = {
  estimatedValue: (value: any) => typeof value === 'number' && value > 0 && value < 1000000000,
  confidence: (value: any) => typeof value === 'number' && value >= 0 && value <= 1,
  methodology: (value: any) => typeof value === 'string' && value.length > 0,
};

const VALUATION_VALIDATION_RULES = {
  valuation_id: (value: any) => typeof value === 'string' && value.length > 0,
  equity_value_mid: (value: any) => typeof value === 'number' && value > 0,
  confidence_score: (value: any) => typeof value === 'number' && value >= 0 && value <= 1,
  methodology: (value: any) => typeof value === 'string' && value.length > 0,
};

// ============================================================================
// METHODOLOGY SUITABILITY SCORES - REMOVED
// ============================================================================
// 
// All methodology scoring and recommendations are handled by Python backend.
// Frontend only extracts and displays the recommendations from backend responses.

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class ValuationProcessorImpl implements ValuationProcessor {
  /**
   * Process valuation preview from parsed event
   */
  processValuationPreview(event: ParsedEvent): ValuationPreview | null {
    if (event.eventType !== 'valuation' || !event.normalizedData) {
      return null;
    }

    const data = event.normalizedData;

    const preview: ValuationPreview = {
      estimatedValue: data.estimated_value || data.equity_value_mid,
      confidence: data.confidence || data.confidence_score,
      methodology: data.methodology,
      assumptions: data.assumptions || {},
      range: data.range || (data.equity_value_low && data.equity_value_mid && data.equity_value_high ? {
        low: data.equity_value_low,
        mid: data.equity_value_mid,
        high: data.equity_value_high,
      } : undefined),
      keyMetrics: data.key_metrics || {},
      risks: data.risks || [],
      timestamp: event.event.timestamp,
    };

    const validation = this.validatePreview(preview);

    if (!validation.isValid) {
      chatLogger.warn('[ValuationProcessor] Invalid valuation preview', {
        errors: validation.errors,
        preview: preview,
      });
    }

    chatLogger.info('[ValuationProcessor] Processed valuation preview', {
      methodology: preview.methodology,
      confidence: preview.confidence,
      value: preview.estimatedValue,
      isValid: validation.isValid,
    });

    return preview;
  }

  /**
   * Validate valuation preview
   */
  validatePreview(preview: ValuationPreview): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    // Check required fields
    if (!PREVIEW_VALIDATION_RULES.estimatedValue(preview.estimatedValue)) {
      errors.push('Estimated value must be a positive number under €1B');
    } else {
      score += 0.4;
    }

    if (!PREVIEW_VALIDATION_RULES.confidence(preview.confidence)) {
      errors.push('Confidence must be between 0 and 1');
    } else {
      score += 0.3;
    }

    if (!PREVIEW_VALIDATION_RULES.methodology(preview.methodology)) {
      errors.push('Methodology must be specified');
    } else {
      score += 0.3;
    }

    // Quality checks
    if (preview.confidence && preview.confidence < 0.3) {
      warnings.push('Low confidence in valuation estimate');
      score *= 0.8;
    }

    if (preview.range) {
      const range = preview.range.high - preview.range.low;
      const mid = preview.range.mid;
      if (range / mid > 2) { // Range wider than 200% of mid value
        warnings.push('Valuation range is very wide, indicating high uncertainty');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, Math.min(1, score)),
    };
  }

  /**
   * Process calculate option from parsed event
   */
  processCalculateOption(event: ParsedEvent): CalculateOption | null {
    // Calculate options are typically embedded in message metadata
    if (event.eventType !== 'message' || !event.normalizedData?.calculate_options) {
      return null;
    }

    const options = event.normalizedData.calculate_options;
    if (!Array.isArray(options) || options.length === 0) {
      return null;
    }

    // Return the first (recommended) option
    const optionData = options[0];

    const option: CalculateOption = {
      method: optionData.method || 'dcf',
      parameters: optionData.parameters || {},
      estimatedValue: optionData.estimated_value,
      confidence: optionData.confidence,
      processingTime: optionData.processing_time,
      isRecommended: true,
      metadata: optionData.metadata || {},
    };

    const validation = this.validateCalculateOption(option);

    if (!validation.isValid) {
      chatLogger.warn('[ValuationProcessor] Invalid calculate option', {
        errors: validation.errors,
        option: option,
      });
    }

    return option;
  }

  /**
   * Validate calculate option
   */
  validateCalculateOption(option: CalculateOption): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    if (!option.method || typeof option.method !== 'string') {
      errors.push('Method must be specified');
    } else {
      score += 0.4;
    }

    if (option.estimatedValue !== undefined && (!PREVIEW_VALIDATION_RULES.estimatedValue(option.estimatedValue))) {
      errors.push('Estimated value must be valid');
    } else if (option.estimatedValue !== undefined) {
      score += 0.3;
    }

    if (option.confidence !== undefined && (!PREVIEW_VALIDATION_RULES.confidence(option.confidence))) {
      warnings.push('Confidence value seems invalid');
    } else if (option.confidence !== undefined) {
      score += 0.3;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, Math.min(1, score)),
    };
  }

  /**
   * Process valuation completion from parsed event
   */
  processValuationComplete(event: ParsedEvent): ValuationResponse | null {
    if (event.eventType !== 'valuation' || !event.normalizedData) {
      return null;
    }

    const data = event.normalizedData;

    // Build complete valuation response
    const result: ValuationResponse = {
      valuation_id: data.valuation_id || `val_${Date.now()}`,
      equity_value_low: data.equity_value_low || data.range?.low,
      equity_value_mid: data.equity_value_mid || data.estimated_value || data.range?.mid,
      equity_value_high: data.equity_value_high || data.range?.high,
      confidence_score: data.confidence_score || data.confidence || 0.5,
      methodology: data.methodology || 'unknown',
      assumptions: data.assumptions || {},
      key_metrics: data.key_metrics || {},
      risk_factors: data.risk_factors || data.risks || [],
      html_report: data.html_report || '',
      info_tab_html: data.info_tab_html || '',
      created_at: data.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const validation = this.validateValuationResult(result);

    if (!validation.isValid) {
      chatLogger.warn('[ValuationProcessor] Invalid valuation result', {
        errors: validation.errors,
        result: result,
      });
    }

    chatLogger.info('[ValuationProcessor] Processed valuation completion', {
      valuationId: result.valuation_id,
      methodology: result.methodology,
      equityValue: result.equity_value_mid,
      confidence: result.confidence_score,
      isValid: validation.isValid,
    });

    return result;
  }

  /**
   * Validate complete valuation result
   */
  validateValuationResult(result: ValuationResponse): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    // Check required fields
    if (!VALUATION_VALIDATION_RULES.valuation_id(result.valuation_id)) {
      errors.push('Valuation ID must be valid');
    } else {
      score += 0.2;
    }

    if (!VALUATION_VALIDATION_RULES.equity_value_mid(result.equity_value_mid)) {
      errors.push('Equity value mid must be a positive number');
    } else {
      score += 0.3;
    }

    if (!VALUATION_VALIDATION_RULES.confidence_score(result.confidence_score)) {
      errors.push('Confidence score must be between 0 and 1');
    } else {
      score += 0.2;
    }

    if (!VALUATION_VALIDATION_RULES.methodology(result.methodology)) {
      errors.push('Methodology must be specified');
    } else {
      score += 0.2;
    }

    // Business logic validations
    if (result.equity_value_low && result.equity_value_mid && result.equity_value_low > result.equity_value_mid) {
      errors.push('Low value cannot be higher than mid value');
    }

    if (result.equity_value_high && result.equity_value_mid && result.equity_value_high < result.equity_value_mid) {
      errors.push('High value cannot be lower than mid value');
    }

    if (result.confidence_score < 0.2) {
      warnings.push('Very low confidence score - results may not be reliable');
      score *= 0.8;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      score: Math.max(0, Math.min(1, score)),
    };
  }

  /**
   * Build valuation context from extracted data
   */
  buildValuationContext(extractedData: any[]): ValuationContext {
    const context: ValuationContext = {};

    extractedData.forEach(item => {
      switch (item.field) {
        case 'company_name':
          context.companyName = item.value;
          break;
        case 'business_type':
          context.businessType = item.value;
          break;
        case 'revenue':
          context.revenue = item.value;
          break;
        case 'ebitda':
          context.ebitda = item.value;
          break;
        case 'country_code':
          context.countryCode = item.value;
          break;
        case 'founding_year':
          context.foundingYear = item.value;
          break;
      }
    });

    chatLogger.debug('[ValuationProcessor] Built valuation context', {
      hasCompanyName: !!context.companyName,
      hasBusinessType: !!context.businessType,
      hasFinancials: !!(context.revenue || context.ebitda),
    });

    return context;
  }

  // NOTE: All calculation methods removed:
  // - recommendCalculationMethod() - Handled by Python backend
  // - scoreMethodologySuitability() - Handled by Python backend
  // - assessValuationQuality() - Handled by Python backend
  // - detectValuationAnomalies() - Handled by Python backend
  //
  // Frontend only extracts and displays data from backend responses.
  // All quality assessment, methodology recommendations, and anomaly detection
  // are performed by the Python valuation engine.
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseValuationProcessorResult {
  processor: ValuationProcessor;
  actions: {
    processValuationPreview: (event: ParsedEvent) => ValuationPreview | null;
    processCalculateOption: (event: ParsedEvent) => CalculateOption | null;
    processValuationComplete: (event: ParsedEvent) => ValuationResponse | null;
    buildValuationContext: (extractedData: any[]) => ValuationContext;
    // Calculation methods removed - handled by Python backend
  };
  utilities: {
    validatePreview: (preview: ValuationPreview) => ValidationResult;
    validateCalculateOption: (option: CalculateOption) => ValidationResult;
    validateValuationResult: (result: ValuationResponse) => ValidationResult;
    // Calculation utilities removed - handled by Python backend
  };
}

/**
 * useValuationProcessor Hook
 *
 * React hook interface for ValuationProcessor engine
 * Provides reactive valuation processing and analysis
 */
export const useValuationProcessor = (): UseValuationProcessorResult => {
  const processor = useMemo(() => new ValuationProcessorImpl(), []);

  const actions = {
    processValuationPreview: useCallback(
      (event: ParsedEvent) => processor.processValuationPreview(event),
      [processor]
    ),
    processCalculateOption: useCallback(
      (event: ParsedEvent) => processor.processCalculateOption(event),
      [processor]
    ),
    processValuationComplete: useCallback(
      (event: ParsedEvent) => processor.processValuationComplete(event),
      [processor]
    ),
    buildValuationContext: useCallback(
      (extractedData: any[]) => processor.buildValuationContext(extractedData),
      [processor]
    ),
    // Calculation methods removed - handled by Python backend
  };

  const utilities = {
    validatePreview: useCallback(
      (preview: ValuationPreview) => processor.validatePreview(preview),
      [processor]
    ),
    validateCalculateOption: useCallback(
      (option: CalculateOption) => processor.validateCalculateOption(option),
      [processor]
    ),
    validateValuationResult: useCallback(
      (result: ValuationResponse) => processor.validateValuationResult(result),
      [processor]
    ),
    // Calculation utilities removed - handled by Python backend
  };

  return {
    processor,
    actions,
    utilities,
  };
};
