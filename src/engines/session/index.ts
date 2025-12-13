/**
 * Session Engines - Modular Session Management
 *
 * This directory contains focused engines for session management,
 * breaking down the massive useValuationSessionStore.ts god component.
 *
 * @module engines/session
 */

import { useDataSynchronizer } from './data-synchronizer/DataSynchronizer';
import { usePersistenceManager } from './persistence-manager/PersistenceManager';
import { useSessionManager } from './session-manager/SessionManager';
import { useStateManager } from './state-manager/StateManager';
import { useViewSwitcher } from './view-switcher/ViewSwitcher';

// ============================================================================
// SESSION LIFECYCLE MANAGEMENT
// ============================================================================

export {
    SessionManagerImpl,
    useSessionManager
} from './session-manager/SessionManager';

export type {
    SessionConfig,
    SessionInitializationOptions, SessionManager, SessionSummary,
    UseSessionManagerResult
} from './session-manager/SessionManager';

// ============================================================================
// DATA SYNCHRONIZATION
// ============================================================================

export {
    DataSynchronizerImpl,
    useDataSynchronizer
} from './data-synchronizer/DataSynchronizer';

export type {
    DataSynchronizer,
    SyncConflict, SynchronizationConfig, SyncOperation,
    SyncResult, UseDataSynchronizerResult
} from './data-synchronizer/DataSynchronizer';

// ============================================================================
// VIEW SWITCHING
// ============================================================================

export {
    useViewSwitcher, ViewSwitcherImpl
} from './view-switcher/ViewSwitcher';

export type {
    UseViewSwitcherResult, ViewSwitchConfig, ViewSwitchConfirmation, ViewSwitcher, ViewSwitchEvent, ViewSwitchOptions,
    ViewSwitchResult
} from './view-switcher/ViewSwitcher';

// ============================================================================
// PERSISTENCE MANAGEMENT
// ============================================================================

export {
    PersistenceManagerImpl,
    usePersistenceManager
} from './persistence-manager/PersistenceManager';

export type {
    CacheEntry, PersistenceConfig, PersistenceHealthStatus, PersistenceManager, PersistenceResult, PersistenceStats,
    UsePersistenceManagerResult
} from './persistence-manager/PersistenceManager';

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

export {
    StateManagerImpl,
    useStateManager
} from './state-manager/StateManager';

export type {
    StateManager,
    StateManagerConfig, StateSnapshot, StateUpdate, StateValidationResult, ThrottledUpdate, UseStateManagerResult
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
// TYPE EXPORTS - Handled by individual module exports above
// ============================================================================
