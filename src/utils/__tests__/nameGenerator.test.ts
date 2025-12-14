/**
 * Unit tests for NameGenerator utility
 */

import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NameGenerator } from '../nameGenerator'

describe('NameGenerator', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear()
    vi.clearAllMocks()
  })

  describe('generateValuationName', () => {
    it('should generate a valuation name', () => {
      const name = NameGenerator.generateValuationName()
      expect(name).toBeTruthy()
      expect(typeof name).toBe('string')
      expect(name).toMatch(/Valuation Report #\d+/)
    })

    it('should generate sequential names for guest users', () => {
      // Simulate guest user (no auth tokens)
      localStorage.removeItem('upswitch_user_id')
      localStorage.removeItem('upswitch_auth_token')
      // Set initial count to 0 to start from 1
      localStorage.setItem('upswitch_guest_report_count', '0')

      const name1 = NameGenerator.generateValuationName()
      const name2 = NameGenerator.generateValuationName()
      
      expect(name1).toMatch(/Valuation Report #1/)
      expect(name2).toMatch(/Valuation Report #2/)
    })

    it('should generate names with consistent format', () => {
      const name = NameGenerator.generateValuationName()
      expect(name).toMatch(/^Valuation Report #\d+$/)
    })
  })

  describe('generateFromCompany', () => {
    it('should generate name from company name', () => {
      const name = NameGenerator.generateFromCompany('Test Company')
      expect(name).toBeTruthy()
      expect(typeof name).toBe('string')
      expect(name).toContain('Test')
      expect(name).toContain('Valuation')
    })

    it('should handle empty company name', () => {
      const name = NameGenerator.generateFromCompany('')
      expect(name).toMatch(/Valuation Report #\d+/)
    })

    it('should truncate long company names', () => {
      const longName = 'Very Long Company Name That Should Be Truncated'
      const result = NameGenerator.generateFromCompany(longName)
      expect(result.length).toBeLessThan(100) // Reasonable length
    })
  })

  describe('generateWithDate', () => {
    it('should generate name with date', () => {
      const name = NameGenerator.generateWithDate()
      expect(name).toBeTruthy()
      expect(typeof name).toBe('string')
      expect(name).toMatch(/Valuation Report/)
    })

    it('should include base name when provided', () => {
      const name = NameGenerator.generateWithDate('Custom Name')
      expect(name).toContain('Custom Name')
    })
  })
})
