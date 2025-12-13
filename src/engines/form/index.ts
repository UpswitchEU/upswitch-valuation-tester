/**
 * Form Engines - Modular Form Management
 *
 * This directory contains focused engines for form management,
 * breaking down the massive ValuationForm.tsx god component.
 *
 * @module engines/form
 */

import { useBusinessTypeMatcher } from './business-type-matcher/BusinessTypeMatcher';
import { useFormDataManager } from './data-manager/FormDataManager';
import { useFormRenderer } from './renderer/FormRenderer';

// ============================================================================
// BUSINESS TYPE MATCHING
// ============================================================================

export {
    BusinessTypeMatcherImpl,
    useBusinessTypeMatcher
} from './business-type-matcher/BusinessTypeMatcher';

export type {
    BusinessTypeMatcher,
    MatchResult,
    UseBusinessTypeMatcherResult
} from './business-type-matcher/BusinessTypeMatcher';

// ============================================================================
// FORM DATA MANAGEMENT
// ============================================================================

export {
    FormDataManagerImpl,
    useFormDataManager
} from './data-manager/FormDataManager';

export type {
    FormDataManager,
    FormData, FormField,
    UseFormDataManagerResult, ValidationResult
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
    useValuationOrchestrator,
    ValuationOrchestratorImpl
} from './orchestrator/ValuationOrchestrator';

export type {
    ValuationOrchestrator,
    OrchestratorConfig, UseValuationOrchestratorResult, ValuationState
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
    FormRendererImpl,
    useFormRenderer
} from './renderer/FormRenderer';

export type {
    FormRenderer,
    RenderConfig,
    UseFormRendererResult
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
// TYPE EXPORTS - Handled by individual module exports above
// ============================================================================
