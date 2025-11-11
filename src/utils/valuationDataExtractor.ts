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
  EnhancedCalculationStep,
  CalculationStep,
  StepDetail,
  StepStatus
} from '../types/valuation';

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
  // Priority 1: modular_system.step_details
  if (result.modular_system?.step_details) {
    const stepDetail = result.modular_system.step_details.find(
      (s) => s.step === stepNumber
    );
    if (stepDetail) {
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
      return step;
    }
  }

  // Priority 3: Legacy calculation_steps (if exists)
  if (result.transparency?.calculation_steps) {
    const legacyStep = (result.transparency.calculation_steps as any[]).find(
      (s: any) => s.step_number === stepNumber
    );
    if (legacyStep) {
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

  return null;
}

/**
 * Get all step data with status information
 */
export function getAllStepData(
  result: ValuationResponse
): EnhancedCalculationStep[] {
  const steps: EnhancedCalculationStep[] = [];

  // Try modular_system first
  if (result.modular_system?.step_details) {
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
    return result.transparency.calculation_steps;
  }

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
  if (result.modular_system) {
    return {
      total: result.modular_system.total_steps,
      completed: result.modular_system.steps_completed,
      skipped: result.modular_system.steps_skipped,
      failed: result.modular_system.steps_failed || 0
    };
  }

  // Fallback: count from transparency
  if (result.transparency?.calculation_steps) {
    const steps = result.transparency.calculation_steps;
    return {
      total: steps.length,
      completed: steps.filter((s) => s.status === 'completed').length,
      skipped: steps.filter((s) => s.status === 'skipped').length,
      failed: steps.filter((s) => s.status === 'failed').length
    };
  }

  return {
    total: 0,
    completed: 0,
    skipped: 0,
    failed: 0
  };
}

