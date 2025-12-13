/**
 * ISessionService Interface - Session Management Abstraction
 *
 * Defines the contract for session management.
 * Components depend on this interface, not concrete implementations.
 */

import type { ValuationRequest, ValuationSession } from '../../../types/valuation'

export interface ISessionService {
  createSession(request: Partial<ValuationRequest>): Promise<ValuationSession>
  getSession(sessionId: string): Promise<ValuationSession | null>
  updateSession(sessionId: string, updates: Partial<ValuationSession>): Promise<ValuationSession>
  deleteSession(sessionId: string): Promise<void>
  saveSessionData(sessionId: string, data: Record<string, unknown>): Promise<void>
}
