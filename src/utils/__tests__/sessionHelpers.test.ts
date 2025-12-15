/**
 * Session Helper Utilities Tests
 * 
 * @module utils/__tests__/sessionHelpers.test
 */

import { describe, expect, it } from 'vitest'
import {
    createBaseSession,
    generateSessionId,
    mergePrefilledQuery,
    normalizeSessionDates,
} from '../sessionHelpers'

describe('sessionHelpers', () => {
  describe('generateSessionId', () => {
    it('should generate unique session IDs', () => {
      const id1 = generateSessionId()
      const id2 = generateSessionId()
      
      expect(id1).toMatch(/^session_\d+_[a-z0-9]+$/)
      expect(id2).toMatch(/^session_\d+_[a-z0-9]+$/)
      expect(id1).not.toBe(id2)
    })

    it('should have correct format', () => {
      const id = generateSessionId()
      const parts = id.split('_')
      
      expect(parts[0]).toBe('session')
      expect(parts[1]).toMatch(/^\d+$/) // timestamp
      expect(parts[2]).toMatch(/^[a-z0-9]+$/) // random string
    })
  })

  describe('createBaseSession', () => {
    it('should create session with all required fields', () => {
      const session = createBaseSession('val_123', 'session_456', 'manual')
      
      expect(session.reportId).toBe('val_123')
      expect(session.sessionId).toBe('session_456')
      expect(session.currentView).toBe('manual')
      expect(session.dataSource).toBe('manual')
      expect(session.createdAt).toBeInstanceOf(Date)
      expect(session.updatedAt).toBeInstanceOf(Date)
      expect(session.partialData).toEqual({})
      expect(session.sessionData).toEqual({})
    })

    it('should include prefilled query when provided', () => {
      const session = createBaseSession('val_123', 'session_456', 'conversational', 'Restaurant')
      
      expect(session.partialData).toEqual({ _prefilledQuery: 'Restaurant' })
    })

    it('should handle null prefilled query', () => {
      const session = createBaseSession('val_123', 'session_456', 'manual', null)
      
      expect(session.partialData).toEqual({})
    })
  })

  describe('mergePrefilledQuery', () => {
    it('should add prefilled query to empty data', () => {
      const result = mergePrefilledQuery({}, 'Restaurant')
      expect(result).toEqual({ _prefilledQuery: 'Restaurant' })
    })

    it('should not override existing prefilled query', () => {
      const existing = { _prefilledQuery: 'Existing' }
      const result = mergePrefilledQuery(existing, 'New')
      expect(result._prefilledQuery).toBe('Existing')
    })

    it('should preserve other data', () => {
      const existing = { company_name: 'Test Co', revenue: 100000 }
      const result = mergePrefilledQuery(existing, 'Restaurant')
      expect(result).toEqual({
        company_name: 'Test Co',
        revenue: 100000,
        _prefilledQuery: 'Restaurant',
      })
    })

    it('should return data unchanged if no query provided', () => {
      const data = { company_name: 'Test' }
      expect(mergePrefilledQuery(data, null)).toEqual(data)
      expect(mergePrefilledQuery(data, undefined)).toEqual(data)
    })
  })

  describe('normalizeSessionDates', () => {
    it('should convert string dates to Date objects', () => {
      const session = {
        sessionId: 'test',
        reportId: 'val_123',
        createdAt: '2025-12-13T10:00:00Z',
        updatedAt: '2025-12-13T11:00:00Z',
        completedAt: '2025-12-13T12:00:00Z',
      }
      
      const result = normalizeSessionDates(session)
      
      expect(result.createdAt).toBeInstanceOf(Date)
      expect(result.updatedAt).toBeInstanceOf(Date)
      expect(result.completedAt).toBeInstanceOf(Date)
    })

    it('should handle undefined completedAt', () => {
      const session = {
        sessionId: 'test',
        reportId: 'val_123',
        createdAt: '2025-12-13T10:00:00Z',
        updatedAt: '2025-12-13T11:00:00Z',
        completedAt: undefined,
      }
      
      const result = normalizeSessionDates(session)
      
      expect(result.completedAt).toBeUndefined()
    })
  })
})
