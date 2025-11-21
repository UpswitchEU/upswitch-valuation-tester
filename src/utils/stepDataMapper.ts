/**
 * Step Data Mapper
 * 
 * Utility functions for mapping and formatting step data from backend responses.
 */

import type { ValuationResponse, EnhancedCalculationStep } from '../types/valuation';

/**
 * Format execution time in milliseconds to human-readable string
 */
export function formatExecutionTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`;
  } else {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }
}

/**
 * Get step result data from valuation response
 * Extracts step-specific result data from transparency report or modular system
 */
export function getStepResultData(
  result: ValuationResponse,
  stepNumber: number
): Record<string, any> | null {
  // Try to get from transparency report calculation_steps
  if (result.transparency?.calculation_steps) {
    const steps = result.transparency.calculation_steps;
    
    // Handle both array and object formats
    if (Array.isArray(steps)) {
      const step = steps.find((s: any) => 
        s.step === stepNumber || s.step_number === stepNumber
      );
  if (step?.key_outputs) {
        return step.key_outputs;
      }
      if (step?.outputs) {
        return step.outputs;
      }
    } else if (typeof steps === 'object') {
      // Handle object format where keys are step numbers or method names
      for (const [key, stepList] of Object.entries(steps)) {
        if (Array.isArray(stepList)) {
          const step = stepList.find((s: any) => 
            s.step === stepNumber || s.step_number === stepNumber
          );
  if (step?.key_outputs) {
    return step.key_outputs;
  }
          if (step?.outputs) {
            return step.outputs;
          }
        }
      }
    }
  }

  // Try to get from modular system step_details
  if (result.modular_system?.step_details) {
    const stepDetail = result.modular_system.step_details.find(
      (detail: any) => detail.step === stepNumber
    );
    if (stepDetail?.result) {
      return stepDetail.result;
    }
  }

  return null;
}

/**
 * Get all step data from valuation response
 * Returns array of step information for display
 */
export function getAllStepData(result: ValuationResponse): Array<{
  step: number;
  name: string;
  description: string;
  status: string;
}> {
  const steps: Array<{
    step: number;
    name: string;
    description: string;
    status: string;
  }> = [];

  // Try to get from transparency report calculation_steps
  if (result.transparency?.calculation_steps) {
    const calculationSteps = result.transparency.calculation_steps;
    
    if (Array.isArray(calculationSteps)) {
      calculationSteps.forEach((step: any) => {
        const stepNum = step.step || step.step_number || 0;
        steps.push({
          step: stepNum,
          name: step.calculation_name || step.name || `Step ${stepNum}`,
          description: step.explanation || step.description || '',
          status: step.status || 'unknown'
        });
      });
    } else if (typeof calculationSteps === 'object') {
      // Handle object format
      for (const [key, stepList] of Object.entries(calculationSteps)) {
        if (Array.isArray(stepList)) {
          stepList.forEach((step: any) => {
            const stepNum = step.step || step.step_number || 0;
            steps.push({
              step: stepNum,
              name: step.calculation_name || step.name || `Step ${stepNum}`,
              description: step.explanation || step.description || '',
              status: step.status || 'unknown'
            });
          });
        }
      }
    }
  }

  // Fallback to modular system step_details
  if (steps.length === 0 && result.modular_system?.step_details) {
    result.modular_system.step_details.forEach((detail: any) => {
      steps.push({
        step: detail.step || 0,
        name: detail.name || `Step ${detail.step || 0}`,
        description: detail.reason || detail.error || '',
        status: detail.status || 'unknown'
      });
    });
  }

  return steps.sort((a, b) => a.step - b.step);
}

