/**
 * Session Service Implementation
 *
 * Concrete implementation of ISessionService interface.
 * Provides session management and persistence with DIP compliance.
 */

import { useValuationSessionStore } from '../../../store/useValuationSessionStore'
import type { ValuationRequest, ValuationSession } from '../../../types/valuation'
import { generalLogger } from '../../../utils/logger'
import { ISessionService } from './interfaces'

/**
 * Session Service Implementation
 *
 * Provides concrete implementation of session management.
 * Follows Single Responsibility Principle - only handles session logic.
 */
export class SessionService implements ISessionService {
  /**
   * Create a new valuation session
   */
  async createSession(
    reportId: string,
    flow: 'manual' | 'conversational',
    initialData?: any
  ): Promise<ValuationSession> {
    try {
      generalLogger.info('Creating new valuation session', { reportId, flow })

      // Use existing store to create session
      await useValuationSessionStore
        .getState()
        .initializeSession(reportId, flow, initialData)

      // Get the created session from the store
      const session = useValuationSessionStore.getState().session

      if (!session) {
        throw new Error('Failed to create session - session is null')
      }

      generalLogger.info('Session created successfully', {
        reportId,
        sessionId: session.reportId, // ValuationSession uses reportId, not sessionId
        flow: session.currentView,
      })

      return session
    } catch (error) {
      generalLogger.error('Failed to create session', { reportId, flow, error })
      throw error instanceof Error ? error : new Error('Failed to create session')
    }
  }

  /**
   * Load existing session by report ID
   */
  async loadSession(reportId: string): Promise<ValuationSession | null> {
    try {
      generalLogger.debug('Loading session', { reportId })

      // Get current session from store
      const { session } = useValuationSessionStore.getState()

      if (session?.reportId === reportId) {
        generalLogger.debug('Session found in store', { reportId })
        return session
      }

      // If not in store, try to load from local storage or backend
      // For now, return null - this would need backend integration
      generalLogger.debug('Session not found', { reportId })
      return null
    } catch (error) {
      generalLogger.error('Failed to load session', { reportId, error })
      return null
    }
  }

  /**
   * Update session data
   */
  async updateSession(reportId: string, updates: Partial<ValuationSession>): Promise<void> {
    try {
      generalLogger.debug('Updating session', { reportId, updates: Object.keys(updates) })

      // Convert ValuationSession updates to ValuationRequest format
      // Extract partialData fields if present
      const requestUpdates: Partial<ValuationRequest> = {}
      if (updates.partialData && typeof updates.partialData === 'object') {
        const partialData = updates.partialData as Record<string, unknown>
        // Map common fields
        if ('company_name' in partialData) {
          requestUpdates.company_name = partialData.company_name as string
        }
        if ('revenue' in partialData) {
          requestUpdates.revenue = partialData.revenue as number
        }
        if ('number_of_employees' in partialData) {
          requestUpdates.number_of_employees = partialData.number_of_employees as number
        }
        // Add other fields as needed based on ValuationRequest interface
      }

      // Use existing store to update session
      await useValuationSessionStore.getState().updateSessionData(requestUpdates)

      generalLogger.debug('Session updated successfully', { reportId })
    } catch (error) {
      generalLogger.error('Failed to update session', { reportId, error })
      throw error instanceof Error ? error : new Error('Failed to update session')
    }
  }

  /**
   * Delete session
   */
  async deleteSession(reportId: string): Promise<void> {
    try {
      generalLogger.info('Deleting session', { reportId })

      // Use existing store to clear session
      useValuationSessionStore.getState().clearSession()

      generalLogger.info('Session deleted successfully', { reportId })
    } catch (error) {
      generalLogger.error('Failed to delete session', { reportId, error })
      throw error instanceof Error ? error : new Error('Failed to delete session')
    }
  }
}

// Export singleton instance
export const sessionService = new SessionService()
