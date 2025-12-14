/**
 * Unit tests for InputValidator utility
 */

import { describe, expect, it } from 'vitest'
import { InputValidator } from '../InputValidator'

describe('InputValidator', () => {
  const validator = new InputValidator()

  describe('validateInput', () => {
    it('should validate valid input', async () => {
      const result = await validator.validateInput('What is the revenue?')
      expect(result.is_valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject empty input', async () => {
      const result = await validator.validateInput('')
      expect(result.is_valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject input exceeding max length', async () => {
      const longInput = 'a'.repeat(1001)
      const result = await validator.validateInput(longInput)
      expect(result.is_valid).toBe(false)
      expect(result.errors.some((e) => e.includes('too long'))).toBe(true)
    })

    it('should detect PII in input', async () => {
      const result = await validator.validateInput('My email is test@example.com')
      expect(result.detected_pii).toBe(true)
      expect(result.warnings.length).toBeGreaterThan(0)
    })

    it('should reject profanity', async () => {
      const result = await validator.validateInput('This is a damn test')
      expect(result.is_valid).toBe(false)
      expect(result.errors.some((e) => e.includes('professional'))).toBe(true)
    })

    it('should validate numeric input when expected', async () => {
      const messages = [{ content: 'What is your revenue?' }]
      const result = await validator.validateInput('1000000', messages)
      expect(result.is_valid).toBe(true)
    })

    it('should reject non-numeric input when numeric expected', async () => {
      const messages = [{ content: 'What is your revenue?' }]
      const result = await validator.validateInput('not a number', messages)
      expect(result.is_valid).toBe(false)
      expect(result.errors.some((e) => e.includes('valid number'))).toBe(true)
    })
  })

  describe('getConstants', () => {
    it('should return validation constants', () => {
      const constants = validator.getConstants()
      expect(constants).toHaveProperty('maxMessageLength')
      expect(constants).toHaveProperty('minMessageLength')
      expect(constants.maxMessageLength).toBeGreaterThan(0)
      expect(constants.minMessageLength).toBeGreaterThanOrEqual(0)
    })
  })
})
