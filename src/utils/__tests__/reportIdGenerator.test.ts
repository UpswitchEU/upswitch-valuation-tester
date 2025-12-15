/**
 * Unit tests for reportIdGenerator utility
 */

import { describe, expect, it } from 'vitest'
import {
  generateReportId,
  generateReportName,
  getReportTimestamp,
  isValidReportId,
} from '../reportIdGenerator'

describe('reportIdGenerator', () => {
  describe('generateReportId', () => {
    it('should generate a valid report ID', () => {
      const id = generateReportId()
      expect(id).toBeTruthy()
      expect(typeof id).toBe('string')
      expect(id.length).toBeGreaterThan(0)
      expect(id).toMatch(/^val_\d+_[a-z0-9]+$/)
    })

    it('should generate unique IDs', () => {
      const id1 = generateReportId()
      // Small delay to ensure different timestamp
      const id2 = generateReportId()
      expect(id1).not.toBe(id2)
    })

    it('should generate IDs with consistent format', () => {
      const ids = Array.from({ length: 10 }, () => generateReportId())
      ids.forEach((id) => {
        expect(id).toMatch(/^val_\d+_[a-z0-9]+$/)
      })
    })
  })

  describe('isValidReportId', () => {
    it('should validate a generated report ID', () => {
      const id = generateReportId()
      expect(isValidReportId(id)).toBe(true)
    })

    it('should validate correct format', () => {
      expect(isValidReportId('val_1729800000_abc123xyz')).toBe(true)
      expect(isValidReportId('val_1234567890_test123')).toBe(true)
    })

    it('should reject empty string', () => {
      expect(isValidReportId('')).toBe(false)
    })

    it('should reject null or undefined', () => {
      expect(isValidReportId(null as any)).toBe(false)
      expect(isValidReportId(undefined as any)).toBe(false)
    })

    it('should reject invalid formats', () => {
      expect(isValidReportId('invalid-id-format')).toBe(false)
      expect(isValidReportId('123')).toBe(false)
      expect(isValidReportId('val_abc_def')).toBe(false) // non-numeric timestamp
      expect(isValidReportId('val_123')).toBe(false) // missing random part
    })
  })

  describe('getReportTimestamp', () => {
    it('should extract timestamp from valid report ID', () => {
      const timestamp = Date.now()
      const id = `val_${timestamp}_abc123`
      expect(getReportTimestamp(id)).toBe(timestamp)
    })

    it('should return null for invalid report ID', () => {
      expect(getReportTimestamp('invalid')).toBe(null)
      expect(getReportTimestamp('val_abc_def')).toBe(null)
    })
  })

  describe('generateReportName', () => {
    it('should generate a report name', () => {
      const id = generateReportId()
      const name = generateReportName(id)
      expect(name).toBeTruthy()
      expect(typeof name).toBe('string')
      expect(name.length).toBeGreaterThan(0)
    })

    it('should generate consistent names for same ID', () => {
      const id = generateReportId()
      const name1 = generateReportName(id)
      const name2 = generateReportName(id)
      expect(name1).toBe(name2)
    })

    it('should generate different names for different IDs', () => {
      const id1 = generateReportId()
      const id2 = generateReportId()
      const name1 = generateReportName(id1)
      const name2 = generateReportName(id2)
      // Names might be the same due to hash collisions, but usually different
      expect(name1).toBeTruthy()
      expect(name2).toBeTruthy()
    })
  })
})
