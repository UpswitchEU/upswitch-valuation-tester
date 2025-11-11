/**
 * Valuation Data Extractor
 * 
 * Utility functions to extract data from backend response with proper fallback logic.
 * Priority: modular_system → transparency → legacy fields
 * 
 * Phase 4: Data Synchronization & Fallback Logic
 */

import type {
  ValuationResponse,
  ModularSystem,
  EnhancedCalculationStep
} from '../types/valuation';
import { dataExtractionLogger, createPerformanceLogger } from './logger';

/**
 * Extract step data with fallback priority:
 * 1. modular_system.step_details (primary)
 * 2. transparency.calculation_steps (fallback)
 * 3. Legacy fields (last resort)
 */
export function getStepData(
  result: ValuationResponse,
  stepNumber: number
): EnhancedCalculationStep | null {
  const perfLogger = createPerformanceLogger('getStepData', 'data-extraction');
  dataExtractionLogger.debug('Extracting step data', { step: stepNumber });
  
  // Priority 1: modular_system.step_details
  if (result.modular_system?.step_details) {
    const stepDetail = result.modular_system.step_details.find(
      (s) => s.step === stepNumber
    );
    if (stepDetail) {
      dataExtractionLogger.info('Step data extracted from modular_system', {
        step: stepNumber,
        dataSource: 'modular_system',
        status: stepDetail.status,
        hasExecutionTime: !!stepDetail.execution_time_ms
      });
      perfLogger.end({ dataSource: 'modular_system', hasData: true });
      return {
        step: stepDetail.step,
        step_number: stepDetail.step,
        name: stepDetail.name,
        description: `Step ${stepDetail.step}: ${stepDetail.name}`,
        status: stepDetail.status as 'completed' | 'skipped' | 'failed' | 'not_executed',
        execution_time_ms: stepDetail.execution_time_ms,
        reason: stepDetail.reason,
        error: stepDetail.error
      };
    }
  }

  // Priority 2: transparency.calculation_steps
  if (result.transparency?.calculation_steps) {
    const step = result.transparency.calculation_steps.find(
      (s) => s.step === stepNumber || s.step_number === stepNumber
    );
    if (step) {
      dataExtractionLogger.info('Step data extracted from transparency', {
        step: stepNumber,
        dataSource: 'transparency',
        status: step.status,
        hasKeyOutputs: !!step.key_outputs
      });
      perfLogger.end({ dataSource: 'transparency', hasData: true, fallbackUsed: true });
      return step;
    }
  }

  // Priority 3: Legacy calculation_steps (if exists)
  if (result.transparency?.calculation_steps) {
    const legacyStep = (result.transparency.calculation_steps as any[]).find(
      (s: any) => s.step_number === stepNumber
    );
    if (legacyStep) {
      dataExtractionLogger.info('Step data extracted from legacy format', {
        step: stepNumber,
        dataSource: 'legacy',
        fallbackUsed: true
      });
      perfLogger.end({ dataSource: 'legacy', hasData: true, fallbackUsed: true });
      return {
        step: legacyStep.step_number,
        step_number: legacyStep.step_number,
        name: legacyStep.description || `Step ${stepNumber}`,
        description: legacyStep.description || legacyStep.explanation || '',
        status: 'completed', // Legacy doesn't have status, assume completed
        execution_time_ms: 0,
        formula: legacyStep.formula,
        inputs: legacyStep.inputs,
        outputs: legacyStep.outputs,
        explanation: legacyStep.explanation
      };
    }
  }

  dataExtractionLogger.warn('Step data not found in any source', {
    step: stepNumber,
    dataSource: 'none',
    hasModularSystem: !!result.modular_system,
    hasTransparency: !!result.transparency,
    modularSystemStepsCount: result.modular_system?.step_details?.length || 0,
    transparencyStepsCount: result.transparency?.calculation_steps?.length || 0
  });
  perfLogger.end({ dataSource: 'none', hasData: false });
  return null;
}

/**
 * Get all step data with status information
 */
export function getAllStepData(
  result: ValuationResponse
): EnhancedCalculationStep[] {
  const perfLogger = createPerformanceLogger('getAllStepData', 'data-extraction');
  dataExtractionLogger.debug('Extracting all step data');
  
  const steps: EnhancedCalculationStep[] = [];

  // Try modular_system first
  if (result.modular_system?.step_details) {
    const stepCount = result.modular_system.step_details.length;
    dataExtractionLogger.info('All step data extracted from modular_system', {
      dataSource: 'modular_system',
      stepCount,
      completedCount: result.modular_system.steps_completed,
      skippedCount: result.modular_system.steps_skipped
    });
    perfLogger.end({ dataSource: 'modular_system', stepCount });
    return result.modular_system.step_details.map((detail) => ({
      step: detail.step,
      step_number: detail.step,
      name: detail.name,
      description: `Step ${detail.step}: ${detail.name}`,
      status: detail.status as 'completed' | 'skipped' | 'failed' | 'not_executed',
      execution_time_ms: detail.execution_time_ms,
      reason: detail.reason,
      error: detail.error
    }));
  }

  // Fallback to transparency
  if (result.transparency?.calculation_steps) {
    const stepCount = result.transparency.calculation_steps.length;
    dataExtractionLogger.info('All step data extracted from transparency', {
      dataSource: 'transparency',
      stepCount,
      fallbackUsed: true
    });
    perfLogger.end({ dataSource: 'transparency', stepCount, fallbackUsed: true });
    return result.transparency.calculation_steps;
  }

  dataExtractionLogger.warn('No step data available from any source', {
    hasModularSystem: !!result.modular_system,
    hasTransparency: !!result.transparency
  });
  perfLogger.end({ dataSource: 'none', stepCount: 0 });
  return steps;
}

/**
 * Get step status
 */
export function getStepStatus(
  result: ValuationResponse,
  stepNumber: number
): 'completed' | 'skipped' | 'failed' | 'not_executed' | 'unknown' {
  const stepData = getStepData(result, stepNumber);
  if (!stepData) {
    return 'not_executed';
  }
  return stepData.status || 'unknown';
}

/**
 * Get step execution time
 */
export function getStepExecutionTime(
  result: ValuationResponse,
  stepNumber: number
): number {
  const stepData = getStepData(result, stepNumber);
  return stepData?.execution_time_ms || 0;
}

/**
 * Get step skip reason
 */
export function getStepSkipReason(
  result: ValuationResponse,
  stepNumber: number
): string | null {
  const stepData = getStepData(result, stepNumber);
  return stepData?.reason || null;
}

/**
 * Get step error message
 */
export function getStepError(
  result: ValuationResponse,
  stepNumber: number
): string | null {
  const stepData = getStepData(result, stepNumber);
  return stepData?.error || null;
}

/**
 * Get methodology statement with fallback
 */
export function getMethodologyStatement(result: ValuationResponse): string | null {
  // Priority 1: Direct field
  if (result.methodology_statement) {
    return result.methodology_statement;
  }

  // Priority 2: From transparency report
  if (result.transparency?.methodology_statement) {
    return result.transparency.methodology_statement;
  }

  // Priority 3: Generate from methodology field
  if (result.methodology) {
    return `Valuation methodology: ${result.methodology}`;
  }

  return null;
}

/**
 * Get academic sources with fallback
 */
export function getAcademicSources(result: ValuationResponse) {
  // Priority 1: Direct field
  if (result.academic_sources && result.academic_sources.length > 0) {
    return result.academic_sources;
  }

  // Priority 2: From transparency report
  if (result.transparency?.academic_sources && result.transparency.academic_sources.length > 0) {
    return result.transparency.academic_sources;
  }

  return [];
}

/**
 * Get professional review readiness with fallback
 */
export function getProfessionalReviewReady(result: ValuationResponse) {
  // Priority 1: Direct field
  if (result.professional_review_ready) {
    return result.professional_review_ready;
  }

  // Priority 2: From transparency report
  if (result.transparency?.professional_review_ready) {
    return result.transparency.professional_review_ready;
  }

  return null;
}

/**
 * Get modular system metadata
 */
export function getModularSystem(result: ValuationResponse): ModularSystem | null {
  return result.modular_system || null;
}

/**
 * Check if modular system is enabled
 */
export function isModularSystemEnabled(result: ValuationResponse): boolean {
  return result.modular_system?.enabled === true;
}

/**
 * Get total execution time
 */
export function getTotalExecutionTime(result: ValuationResponse): number {
  if (result.modular_system?.total_execution_time_ms) {
    return result.modular_system.total_execution_time_ms;
  }
  return 0;
}

/**
 * Get steps summary (completed, skipped, failed counts)
 */
export function getStepsSummary(result: ValuationResponse) {
  dataExtractionLogger.debug('Getting steps summary');
  
  if (result.modular_system) {
    const summary = {
      total: result.modular_system.total_steps,
      completed: result.modular_system.steps_completed,
      skipped: result.modular_system.steps_skipped,
      failed: result.modular_system.steps_failed || 0
    };
    dataExtractionLogger.debug('Steps summary from modular_system', summary);
    return summary;
  }

  // Fallback: count from transparency
  if (result.transparency?.calculation_steps) {
    const steps = result.transparency.calculation_steps;
    const summary = {
      total: steps.length,
      completed: steps.filter((s) => s.status === 'completed').length,
      skipped: steps.filter((s) => s.status === 'skipped').length,
      failed: steps.filter((s) => s.status === 'failed').length
    };
    dataExtractionLogger.debug('Steps summary from transparency (fallback)', summary);
    return summary;
  }

  dataExtractionLogger.warn('No steps summary available', {
    hasModularSystem: !!result.modular_system,
    hasTransparency: !!result.transparency
  });
  return {
    total: 0,
    completed: 0,
    skipped: 0,
    failed: 0
  };
}

/**
 * Get data sources from transparency
 */
export function getDataSources(result: ValuationResponse) {
  const sources = result.transparency?.data_sources || [];
  dataExtractionLogger.debug('Getting data sources', { count: sources.length });
  return sources;
}

/**
 * Get comparable companies from transparency
 */
export function getComparableCompanies(result: ValuationResponse) {
  const fromTransparency = result.transparency?.comparable_companies || [];
  const fromLegacy = (result.multiples_valuation as any)?.comparables || [];
  const companies = fromTransparency.length > 0 ? fromTransparency : fromLegacy;
  
  dataExtractionLogger.debug('Getting comparable companies', {
    count: companies.length,
    dataSource: fromTransparency.length > 0 ? 'transparency' : 'legacy',
    fallbackUsed: fromTransparency.length === 0 && fromLegacy.length > 0
  });
  return companies;
}

/**
 * Get confidence breakdown
 */
export function getConfidenceBreakdown(result: ValuationResponse) {
  const breakdown = result.transparency?.confidence_breakdown || null;
  dataExtractionLogger.debug('Getting confidence breakdown', {
    hasBreakdown: !!breakdown,
    overallScore: breakdown?.overall_score
  });
  return breakdown;
}

/**
 * Get range methodology details
 */
export function getRangeMethodology(result: ValuationResponse) {
  const methodology = result.transparency?.range_methodology || null;
  dataExtractionLogger.debug('Getting range methodology', {
    hasMethodology: !!methodology,
    methodology: methodology?.confidence_level
  });
  return methodology;
}

/**
 * Get methodology selection details
 */
export function getMethodologySelection(result: ValuationResponse) {
  const selection = result.methodology_selection || null;
  dataExtractionLogger.debug('Getting methodology selection', {
    hasSelection: !!selection
  });
  return selection;
}

/**
 * Get small firm adjustments
 */
export function getSmallFirmAdjustments(result: ValuationResponse) {
  const adjustments = result.small_firm_adjustments || null;
  dataExtractionLogger.debug('Getting small firm adjustments', {
    hasAdjustments: !!adjustments,
    hasSizeDiscount: !!adjustments?.size_discount,
    hasLiquidityDiscount: !!adjustments?.liquidity_discount
  });
  return adjustments;
}

/**
 * Get adjustments applied from transparency
 */
export function getAdjustmentsApplied(result: ValuationResponse) {
  const adjustments = result.transparency?.adjustments_applied || [];
  dataExtractionLogger.debug('Getting adjustments applied', {
    count: adjustments.length,
    adjustmentTypes: adjustments.map((a: any) => a.type || a.step)
  });
  return adjustments;
}

