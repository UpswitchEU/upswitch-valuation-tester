/**
 * Valuation Engines - Modular Valuation Store Management
 *
 * This directory contains focused engines for valuation store management,
 * breaking down the massive useValuationStore.ts god component.
 *
 * @module engines/valuation
 */

// ============================================================================
// FORM MANAGEMENT
// ============================================================================

export {
    FormManager,
    FormManagerImpl,
    useFormManager,
    type BusinessCardData, type FormUpdate, type FormValidationResult, type UseFormManagerResult
} from './form-manager/FormManager';

// ============================================================================
// RESULTS MANAGEMENT
// ============================================================================

export {
    ResultsManager,
    ResultsManagerImpl,
    useResultsManager, type ResultsAnalysis,
    type ResultsComparison, type ResultsDisplayConfig, type ResultsHistoryEntry, type ResultsMetadata, type UseResultsManagerResult
} from './results-manager/ResultsManager';

// ============================================================================
// CALCULATION COORDINATION
// ============================================================================

export {
    CalculationCoordinator,
    CalculationCoordinatorImpl,
    useCalculationCoordinator,
    type CalculationConfig, type CalculationOptions,
    type CalculationResult, type CalculationState, type CalculationStep,
    type UseCalculationCoordinatorResult
} from './calculation-coordinator/CalculationCoordinator';

// ============================================================================
// PERSISTENCE COORDINATION
// ============================================================================

export {
    PersistenceCoordinator,
    PersistenceCoordinatorImpl,
    usePersistenceCoordinator,
    type PersistenceConfig,
    type PersistenceResult,
    type PersistenceState,
    type UsePersistenceCoordinatorResult
} from './persistence-coordinator/PersistenceCoordinator';

// ============================================================================
// PREVIEW MANAGEMENT
// ============================================================================

export {
    PreviewManager,
    PreviewManagerImpl,
    usePreviewManager,
    type PreviewConfig,
    type PreviewState, type PreviewStats, type PreviewUpdate, type UsePreviewManagerResult
} from './preview-manager/PreviewManager';

// ============================================================================
// UI MANAGEMENT
// ============================================================================

export {
    UIManager,
    UIManagerImpl,
    useUIManager, type ActivitySummary, type InteractionStats, type LoadingState, type UIConfig,
    type UIState,
    type UIUpdate, type UseUIManagerResult
} from './ui-manager/UIManager';

// ============================================================================
// COMPOSITE VALUATION ENGINE
// ============================================================================

/**
 * Composite Valuation Engine
 *
 * Combines all valuation engines into a complete valuation management system
 */
export function createValuationEngine(config: {
  form?: any;
  results?: any;
  calculation?: any;
  persistence?: any;
  preview?: any;
  ui?: any;
}) {
  return {
    // Form management
    formManager: () => useFormManager(config.form),

    // Results management
    resultsManager: () => useResultsManager(config.results),

    // Calculation coordination
    calculationCoordinator: () => useCalculationCoordinator(config.calculation),

    // Persistence coordination
    persistenceCoordinator: () => usePersistenceCoordinator(config.persistence),

    // Preview management
    previewManager: () => usePreviewManager(config.preview),

    // UI management
    uiManager: () => useUIManager(config.ui),
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
    ActivitySummary, BusinessCardData, CalculationConfig,
    // Calculation coordination
    CalculationCoordinator, CalculationOptions,
    CalculationResult, CalculationState, CalculationStep,
    // Form management
    FormManager, FormUpdate, FormValidationResult, InteractionStats, LoadingState, PersistenceConfig,
    // Persistence coordination
    PersistenceCoordinator, PersistenceResult,
    PersistenceState, PreviewConfig,
    // Preview management
    PreviewManager, PreviewState, PreviewStats, PreviewUpdate, ResultsAnalysis,
    ResultsComparison, ResultsDisplayConfig, ResultsHistoryEntry,
    // Results management
    ResultsManager, ResultsMetadata, UIConfig,
    // UI management
    UIManager, UIState,
    UIUpdate
};
