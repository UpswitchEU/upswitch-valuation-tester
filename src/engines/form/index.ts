/**
 * Form Engines - Modular Form Management
 *
 * This directory contains focused engines for form management,
 * breaking down the massive ValuationForm.tsx god component.
 *
 * @module engines/form
 */

// ============================================================================
// BUSINESS TYPE MATCHING
// ============================================================================

export {
  BusinessTypeMatcher,
  BusinessTypeMatcherImpl,
  useBusinessTypeMatcher,
  type MatchResult,
  type UseBusinessTypeMatcherResult,
} from './business-type-matcher/BusinessTypeMatcher';

// ============================================================================
// FORM DATA MANAGEMENT
// ============================================================================

export {
  FormDataManager,
  FormDataManagerImpl,
  useFormDataManager,
  type FormData,
  type ValidationResult,
  type FormField,
  type UseFormDataManagerResult,
} from './data-manager/FormDataManager';

// ============================================================================
// SESSION SYNCHRONIZATION
// ============================================================================

// Session synchronization engine would go here
// export * from './session-sync/SessionSynchronizer';

// ============================================================================
// VALUATION ORCHESTRATION
// ============================================================================

export {
  ValuationOrchestrator,
  ValuationOrchestratorImpl,
  useValuationOrchestrator,
  type OrchestratorConfig,
  type ValuationState,
  type UseValuationOrchestratorResult,
} from './orchestrator/ValuationOrchestrator';

// ============================================================================
// BUSINESS CARD INTEGRATION
// ============================================================================

// Business card integration engine would go here
// export * from './business-card/BusinessCardIntegrator';

// ============================================================================
// FORM RENDERING
// ============================================================================

export {
  FormRenderer,
  FormRendererImpl,
  useFormRenderer,
  type RenderConfig,
  type UseFormRendererResult,
} from './renderer/FormRenderer';

// ============================================================================
// COMPOSITE FORM ENGINE
// ============================================================================

/**
 * Composite Form Engine
 *
 * Combines all form engines into a cohesive form management system
 */
export function createFormEngine(config: {
  businessType?: any;
  data?: any;
  orchestrator?: any;
  renderer?: any;
}) {
  return {
    businessTypeMatcher: () => useBusinessTypeMatcher(),
    dataManager: () => useFormDataManager(config.data),
    orchestrator: () => {
      // Would need valuation service injection
      throw new Error('ValuationOrchestrator requires valuation service');
    },
    renderer: () => useFormRenderer(config.renderer),
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Business type matching
  BusinessTypeMatcher,

  // Form data management
  FormDataManager,
  ValidationResult,

  // Valuation orchestration
  ValuationOrchestrator,
  ValuationState,

  // Form rendering
  FormRenderer,
};
