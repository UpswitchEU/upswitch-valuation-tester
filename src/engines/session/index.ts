/**
 * Session Engines - Modular Session Management
 *
 * This directory contains focused engines for session management,
 * breaking down the massive useValuationSessionStore.ts god component.
 *
 * @module engines/session
 */

// ============================================================================
// SESSION LIFECYCLE MANAGEMENT
// ============================================================================

export {
  SessionManager,
  SessionManagerImpl,
  useSessionManager,
  type SessionConfig,
  type SessionInitializationOptions,
  type SessionSummary,
  type UseSessionManagerResult,
} from './session-manager/SessionManager';

// ============================================================================
// DATA SYNCHRONIZATION
// ============================================================================

export {
  DataSynchronizer,
  DataSynchronizerImpl,
  useDataSynchronizer,
  type SynchronizationConfig,
  type SyncOperation,
  type SyncResult,
  type SyncConflict,
  type UseDataSynchronizerResult,
} from './data-synchronizer/DataSynchronizer';

// ============================================================================
// VIEW SWITCHING
// ============================================================================

export {
  ViewSwitcher,
  ViewSwitcherImpl,
  useViewSwitcher,
  type ViewSwitchConfig,
  type ViewSwitchOptions,
  type ViewSwitchResult,
  type ViewSwitchConfirmation,
  type ViewSwitchEvent,
  type UseViewSwitcherResult,
} from './view-switcher/ViewSwitcher';

// ============================================================================
// PERSISTENCE MANAGEMENT
// ============================================================================

export {
  PersistenceManager,
  PersistenceManagerImpl,
  usePersistenceManager,
  type PersistenceConfig,
  type PersistenceResult,
  type CacheEntry,
  type PersistenceHealthStatus,
  type PersistenceStats,
  type UsePersistenceManagerResult,
} from './persistence-manager/PersistenceManager';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

export {
  StateManager,
  StateManagerImpl,
  useStateManager,
  type StateManagerConfig,
  type StateUpdate,
  type ThrottledUpdate,
  type StateSnapshot,
  type StateValidationResult,
  type UseStateManagerResult,
} from './state-manager/StateManager';

// ============================================================================
// COMPOSITE SESSION ENGINE
// ============================================================================

/**
 * Composite Session Engine
 *
 * Combines all session engines into a complete session management system
 */
export function createSessionEngine(config: {
  session?: any;
  dataSync?: any;
  viewSwitch?: any;
  persistence?: any;
  state?: any;
}) {
  return {
    // Session lifecycle
    sessionManager: () => useSessionManager(config.session),

    // Data synchronization
    dataSynchronizer: () => useDataSynchronizer(config.dataSync),

    // View switching
    viewSwitcher: () => useViewSwitcher(config.viewSwitch),

    // Persistence
    persistenceManager: () => usePersistenceManager(config.persistence),

    // State management
    stateManager: () => useStateManager(config.state),
  };
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  // Session management
  SessionManager,
  SessionConfig,
  SessionInitializationOptions,
  SessionSummary,

  // Data synchronization
  DataSynchronizer,
  SynchronizationConfig,
  SyncOperation,
  SyncResult,
  SyncConflict,

  // View switching
  ViewSwitcher,
  ViewSwitchConfig,
  ViewSwitchOptions,
  ViewSwitchResult,
  ViewSwitchConfirmation,
  ViewSwitchEvent,

  // Persistence
  PersistenceManager,
  PersistenceConfig,
  PersistenceResult,
  CacheEntry,
  PersistenceHealthStatus,
  PersistenceStats,

  // State management
  StateManager,
  StateManagerConfig,
  StateUpdate,
  ThrottledUpdate,
  StateSnapshot,
  StateValidationResult,
};
