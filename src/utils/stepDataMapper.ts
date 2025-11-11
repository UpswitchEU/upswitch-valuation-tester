/**
 * Step Data Mapper
 * 
 * Maps backend step results to frontend display format.
 * Handles data transformation and normalization.
 * 
 * Phase 4: Data Synchronization & Fallback Logic
 */

import type {
  ValuationResponse,
  EnhancedCalculationStep,
  StepDetail
} from '../types/valuation';
import { getStepData } from './valuationDataExtractor';

/**
 * Map step detail to enhanced calculation step
 */
export function mapStepDetailToEnhanced(stepDetail: StepDetail): EnhancedCalculationStep {
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

/**
 * Get step result data (from step.result dictionary)
 * This extracts the actual calculation results, not just metadata
 */
export function getStepResultData(
  result: ValuationResponse,
  stepNumber: number
): Record<string, any> | null {
  const stepData = getStepData(result, stepNumber);
  if (!stepData) {
    return null;
  }

  // Try to get from key_outputs first
  if (stepData.key_outputs) {
    return stepData.key_outputs;
  }

  // Try legacy outputs field
  if (stepData.outputs) {
    return stepData.outputs;
  }

  // For specific steps, extract from main result
  switch (stepNumber) {
    case 0: // Data Quality
      if (result.transparency?.confidence_breakdown) {
        return {
          quality_score: result.transparency.confidence_breakdown.data_quality,
          dcf_eligible: result.dcf_valuation !== undefined
        };
      }
      break;

    case 1: // Input Data
      return {
        revenue: result.current_year_data?.revenue,
        ebitda: result.current_year_data?.ebitda,
        ebitda_margin: result.financial_metrics?.ebitda_margin
      };

    case 2: // Benchmarking
      if (result.multiples_valuation) {
        return {
          primary_method: result.multiples_valuation.primary_multiple_method,
          ebitda_multiple: result.multiples_valuation.ebitda_multiple,
          revenue_multiple: result.multiples_valuation.revenue_multiple,
          comparables_count: result.multiples_valuation.comparables_count
        };
      }
      break;

    case 3: // Base EV
      return {
        enterprise_value_mid: result.multiples_valuation?.enterprise_value,
        enterprise_value_low: result.equity_value_low, // Approximate
        enterprise_value_high: result.equity_value_high // Approximate
      };

    case 4: // Owner Concentration
      if (result.multiples_valuation?.owner_concentration) {
        return {
          owner_employee_ratio: result.multiples_valuation.owner_concentration.ratio,
          adjustment_factor: result.multiples_valuation.owner_concentration.adjustment_factor,
          risk_level: result.multiples_valuation.owner_concentration.risk_level
        };
      }
      break;

    case 5: // Size Discount
      return {
        size_discount_percentage: result.multiples_valuation?.size_discount
      };

    case 6: // Liquidity Discount
      return {
        liquidity_discount_percentage: result.multiples_valuation?.liquidity_discount
      };

    case 7: // EV to Equity
      return {
        equity_value_mid: result.equity_value_mid,
        equity_value_low: result.equity_value_low,
        equity_value_high: result.equity_value_high
      };

    case 8: // Ownership Adjustment
      if (result.ownership_adjustment) {
        return {
          ownership_percentage: result.ownership_adjustment.shares_for_sale,
          adjustment_type: result.ownership_adjustment.control_premium > 0 ? 'control_premium' : 'minority_discount',
          adjustment_percentage: result.ownership_adjustment.control_premium || 0
        };
      }
      break;

    case 9: // Confidence Score
      return {
        overall_confidence_score: result.confidence_score,
        confidence_level: result.overall_confidence || 'MEDIUM',
        factor_scores: result.transparency?.confidence_breakdown
      };

    case 10: // Range Methodology
      return {
        methodology: result.range_methodology || 'confidence_spread',
        valuation_low: result.equity_value_low,
        valuation_mid: result.equity_value_mid,
        valuation_high: result.equity_value_high
      };

    case 11: // Final Synthesis
      return {
        valuation_low: result.equity_value_low,
        valuation_mid: result.equity_value_mid,
        valuation_high: result.equity_value_high,
        confidence_score: result.confidence_score,
        methodology_statement: result.methodology_statement
      };
  }

  return null;
}

/**
 * Check if step was executed (completed, skipped, or failed)
 */
export function wasStepExecuted(
  result: ValuationResponse,
  stepNumber: number
): boolean {
  const stepData = getStepData(result, stepNumber);
  if (!stepData) {
    return false;
  }
  return stepData.status !== 'not_executed';
}

/**
 * Check if step completed successfully
 */
export function didStepComplete(
  result: ValuationResponse,
  stepNumber: number
): boolean {
  const stepData = getStepData(result, stepNumber);
  return stepData?.status === 'completed';
}

/**
 * Check if step was skipped
 */
export function wasStepSkipped(
  result: ValuationResponse,
  stepNumber: number
): boolean {
  const stepData = getStepData(result, stepNumber);
  return stepData?.status === 'skipped';
}

/**
 * Check if step failed
 */
export function didStepFail(
  result: ValuationResponse,
  stepNumber: number
): boolean {
  const stepData = getStepData(result, stepNumber);
  return stepData?.status === 'failed';
}

/**
 * Format execution time for display
 */
export function formatExecutionTime(ms: number): string {
  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Get step display name
 */
export function getStepDisplayName(stepNumber: number): string {
  const stepNames: Record<number, string> = {
    0: 'Data Quality Assessment',
    1: 'Input Data & Business Profile',
    2: 'Industry Benchmarking',
    3: 'Base Enterprise Value',
    4: 'Owner Concentration Adjustment',
    5: 'Size Discount',
    6: 'Liquidity Discount',
    7: 'EV to Equity Conversion',
    8: 'Ownership Adjustment',
    9: 'Confidence Score Analysis',
    10: 'Range Methodology Selection',
    11: 'Final Valuation Synthesis'
  };
  return stepNames[stepNumber] || `Step ${stepNumber}`;
}

