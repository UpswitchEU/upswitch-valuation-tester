/**
 * Engines - Modular Engine Management
 *
 * This directory contains focused engines for various aspects of the application,
 * breaking down god components into manageable, single-responsibility modules.
 *
 * @module engines
 */

// ============================================================================
// FORM ENGINES
// ============================================================================

export {
  BusinessTypeMatcherImpl,
  FormDataManagerImpl,
  FormRendererImpl,
  ValuationOrchestratorImpl,
  useBusinessTypeMatcher,
  useFormDataManager,
  useFormRenderer,
  useValuationOrchestrator,
  createFormEngine
} from './form';

// ============================================================================
// STREAM ENGINES
// ============================================================================

export * from './stream';

// ============================================================================
// UI RENDERING ENGINES
// ============================================================================

export {
  MessageRendererImpl,
  useMessageRenderer
} from './ui-rendering/MessageRenderer';

// ============================================================================
// DATA COLLECTION ENGINES
// ============================================================================

export {
  DataCollectionEngineImpl,
  useDataCollectionEngine
} from './data-collection/DataCollectionEngine';
