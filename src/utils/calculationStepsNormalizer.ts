/**
 * Calculation Steps Normalizer
 * 
 * Normalizes calculation_steps from either dictionary format {"multiples": [...]}
 * or array format [...] to always return an array for frontend consumption.
 * 
 * This provides backward compatibility with both the new dictionary format
 * (matching Pydantic schema) and the legacy array format.
 */

import type { EnhancedCalculationStep } from '../types/valuation';

/**
 * Normalize calculation_steps to always return an array
 * 
 * @param calculation_steps - Can be a dictionary {"multiples": [...]}, an array [...], or null/undefined
 * @returns Array of calculation steps, or empty array if input is null/undefined
 */
export function normalizeCalculationSteps(
  calculation_steps: 
    | Record<string, EnhancedCalculationStep[]>
    | EnhancedCalculationStep[]
    | null
    | undefined
): EnhancedCalculationStep[] {
  // Handle null/undefined
  if (!calculation_steps) {
    return [];
  }

  // If it's already an array, return as-is
  if (Array.isArray(calculation_steps)) {
    return calculation_steps;
  }

  // If it's a dictionary/object, flatten all values into a single array
  if (typeof calculation_steps === 'object') {
    const flattened: EnhancedCalculationStep[] = [];
    for (const key in calculation_steps) {
      if (Object.prototype.hasOwnProperty.call(calculation_steps, key)) {
        const steps = calculation_steps[key];
        if (Array.isArray(steps)) {
          flattened.push(...steps);
        }
      }
    }
    return flattened;
  }

  // Fallback: return empty array
  return [];
}

