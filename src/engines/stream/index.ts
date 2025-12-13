/**
 * Stream Engines - Modular Streaming Event Processing
 *
 * This directory contains focused engines for processing streaming conversation events,
 * breaking down the massive StreamEventHandler.tsx god component.
 *
 * @module engines/stream
 */

// ============================================================================
// EVENT PARSING
// ============================================================================

export {
  EventParser,
  EventParserImpl,
  useEventParser,
  type StreamingEvent,
  type ParsedEvent,
  type UseEventParserResult,
} from './event-parser/EventParser';

// ============================================================================
// DATA EXTRACTION
// ============================================================================

export {
  DataExtractor,
  DataExtractorImpl,
  useDataExtractor,
  type ExtractionRule,
  type ExtractionContext,
  type ExtractionResult,
  type UseDataExtractorResult,
} from './data-extractor/DataExtractor';

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

export {
  PerformanceTracker,
  PerformanceTrackerImpl,
  usePerformanceTracker,
  type ModelPerformanceMetrics,
  type PerformanceStats,
  type PerformanceThresholds,
  type PerformanceAnomaly,
  type ThresholdViolation,
  type PerformanceReport,
  type UsePerformanceTrackerResult,
} from './performance-tracker/PerformanceTracker';

// ============================================================================
// UI STATE COORDINATION
// ============================================================================

export {
  UIStateCoordinator,
  UIStateCoordinatorImpl,
  useUIStateCoordinator,
  type UIState,
  type UIUpdateAction,
  type UseUIStateCoordinatorResult,
} from './ui-coordinator/UIStateCoordinator';

// ============================================================================
// VALUATION PROCESSING
// ============================================================================

export {
  ValuationProcessor,
  ValuationProcessorImpl,
  useValuationProcessor,
  type ValuationPreview,
  type CalculateOption,
  type ValuationContext,
  type ValidationResult,
  type UseValuationProcessorResult,
  // NOTE: QualityAssessment and ValuationAnomaly removed - handled by Python backend
} from './valuation-processor/ValuationProcessor';

// ============================================================================
// STREAM ENGINE COMPOSITION
// ============================================================================

/**
 * Compose Stream Engines into a Complete Streaming Pipeline
 *
 * This function demonstrates how to combine focused stream engines into
 * a complete streaming conversation processing system.
 */
export function createStreamProcessingPipeline(config: {
  eventParser?: any;
  dataExtractor?: any;
  performanceTracker?: any;
  uiCoordinator?: any;
  valuationProcessor?: any;
}) {
  return {
    // Event processing pipeline
    eventParser: () => useEventParser(),
    dataExtractor: () => useDataExtractor(config.dataExtractor),

    // Performance monitoring
    performanceTracker: () => usePerformanceTracker(config.performanceTracker),

    // UI coordination
    uiCoordinator: () => useUIStateCoordinator(config.uiCoordinator),

    // Valuation processing
    valuationProcessor: () => useValuationProcessor(),
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Event parsing
  StreamingEvent,
  ParsedEvent,
  EventParser,

  // Data extraction
  ExtractionRule,
  ExtractionContext,
  ExtractionResult,
  DataExtractor,

  // Performance tracking
  ModelPerformanceMetrics,
  PerformanceStats,
  PerformanceThresholds,
  PerformanceAnomaly,
  ThresholdViolation,
  PerformanceReport,
  PerformanceTracker,

  // UI coordination
  UIState,
  UIUpdateAction,
  UIStateCoordinator,

  // Valuation processing
  ValuationPreview,
  CalculateOption,
  ValuationContext,
  // QualityAssessment and ValuationAnomaly removed - handled by Python backend
  ValuationProcessor,
};
