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
    type UseSessionManagerResult
} from './session-manager/SessionManager';

// ============================================================================
// DATA SYNCHRONIZATION
// ============================================================================

export {
    DataSynchronizer,
    DataSynchronizerImpl,
    useDataSynchronizer, type SyncConflict, type SyncOperation,
    type SyncResult, type SynchronizationConfig, type UseDataSynchronizerResult
} from './data-synchronizer/DataSynchronizer';

// ============================================================================
// VIEW SWITCHING
// ============================================================================

export {
    ViewSwitcher,
    ViewSwitcherImpl,
    useViewSwitcher, type UseViewSwitcherResult, type ViewSwitchConfig, type ViewSwitchConfirmation,
    type ViewSwitchEvent, type ViewSwitchOptions,
    type ViewSwitchResult
} from './view-switcher/ViewSwitcher';

// ============================================================================
// PERSISTENCE MANAGEMENT
// ============================================================================

export {
    PersistenceManager,
    PersistenceManagerImpl,
    usePersistenceManager, type CacheEntry, type PersistenceConfig, type PersistenceHealthStatus, type PersistenceResult, type PersistenceStats,
    type UsePersistenceManagerResult
} from './persistence-manager/PersistenceManager';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

export {
    StateManager,
    StateManagerImpl,
    useStateManager,
    type StateManagerConfig, type StateSnapshot, type StateUpdate, type StateValidationResult, type ThrottledUpdate, type UseStateManagerResult
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
    CacheEntry,
    // Data synchronization
    DataSynchronizer, PersistenceConfig, PersistenceHealthStatus,
    // Persistence
    PersistenceManager, PersistenceResult, PersistenceStats, SessionConfig,
    SessionInitializationOptions,
    // Session management
    SessionManager, SessionSummary,
    // State management
    StateManager,
    StateManagerConfig, StateSnapshot, StateUpdate, StateValidationResult, SyncConflict, SyncOperation,
    SyncResult, SynchronizationConfig, ThrottledUpdate, ViewSwitchConfig, ViewSwitchConfirmation,
    ViewSwitchEvent, ViewSwitchOptions,
    ViewSwitchResult,
    // View switching
    ViewSwitcher
};
