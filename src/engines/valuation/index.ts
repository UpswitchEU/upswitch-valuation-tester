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
  type BusinessCardData,
  type FormValidationResult,
  type FormUpdate,
  type UseFormManagerResult,
} from './form-manager/FormManager';

// ============================================================================
// RESULTS MANAGEMENT
// ============================================================================

export {
  ResultsManager,
  ResultsManagerImpl,
  useResultsManager,
  type ResultsDisplayConfig,
  type ResultsMetadata,
  type ResultsAnalysis,
  type ResultsComparison,
  type ResultsHistoryEntry,
  type UseResultsManagerResult,
} from './results-manager/ResultsManager';

// ============================================================================
// CALCULATION COORDINATION
// ============================================================================

export {
  CalculationCoordinator,
  CalculationCoordinatorImpl,
  useCalculationCoordinator,
  type CalculationConfig,
  type CalculationState,
  type CalculationOptions,
  type CalculationResult,
  type CalculationStep,
  type UseCalculationCoordinatorResult,
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
  type UsePersistenceCoordinatorResult,
} from './persistence-coordinator/PersistenceCoordinator';

// ============================================================================
// PREVIEW MANAGEMENT
// ============================================================================

export {
  PreviewManager,
  PreviewManagerImpl,
  usePreviewManager,
  type PreviewConfig,
  type PreviewState,
  type PreviewUpdate,
  type PreviewStats,
  type UsePreviewManagerResult,
} from './preview-manager/PreviewManager';

// ============================================================================
// UI MANAGEMENT
// ============================================================================

export {
  UIManager,
  UIManagerImpl,
  useUIManager,
  type UIConfig,
  type UIState,
  type UIUpdate,
  type LoadingState,
  type InteractionStats,
  type ActivitySummary,
  type UseUIManagerResult,
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
  // Form management
  FormManager,
  BusinessCardData,
  FormValidationResult,
  FormUpdate,

  // Results management
  ResultsManager,
  ResultsDisplayConfig,
  ResultsMetadata,
  ResultsAnalysis,
  ResultsComparison,
  ResultsHistoryEntry,

  // Calculation coordination
  CalculationCoordinator,
  CalculationConfig,
  CalculationState,
  CalculationOptions,
  CalculationResult,
  CalculationStep,

  // Persistence coordination
  PersistenceCoordinator,
  PersistenceConfig,
  PersistenceResult,
  PersistenceState,

  // Preview management
  PreviewManager,
  PreviewConfig,
  PreviewState,
  PreviewUpdate,
  PreviewStats,

  // UI management
  UIManager,
  UIConfig,
  UIState,
  UIUpdate,
  LoadingState,
  InteractionStats,
  ActivitySummary,
};
