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
  try {
    // Handle null/undefined
    if (!calculation_steps) {
      return [];
    }

    // If it's already an array, filter out null/undefined entries and return
    if (Array.isArray(calculation_steps)) {
      return calculation_steps.filter((step) => step != null) as EnhancedCalculationStep[];
    }

    // If it's a dictionary/object, flatten all values into a single array
    if (typeof calculation_steps === 'object' && !Array.isArray(calculation_steps)) {
      const flattened: EnhancedCalculationStep[] = [];
      for (const key in calculation_steps) {
        if (Object.prototype.hasOwnProperty.call(calculation_steps, key)) {
          const steps = calculation_steps[key];
          if (Array.isArray(steps)) {
            // Filter out null/undefined entries
            const validSteps = steps.filter((step) => step != null) as EnhancedCalculationStep[];
            flattened.push(...validSteps);
          }
        }
      }
      return flattened;
    }

    // Fallback: return empty array
    return [];
  } catch (error) {
    // Log error but don't throw - return empty array to prevent crashes
    console.warn('[normalizeCalculationSteps] Error normalizing calculation steps:', error);
    return [];
  }
}

