/**
 * Version History Store Tests
 *
 * Test version lifecycle and state management.
 *
 * @module store/__tests__/useVersionHistoryStore.test
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { CreateVersionRequest } from '../../types/ValuationVersion'
import { useVersionHistoryStore } from '../useVersionHistoryStore'

describe('useVersionHistoryStore', () => {
  beforeEach(() => {
    // Clear store before each test
    const { clearVersions } = useVersionHistoryStore.getState()
    clearVersions('val_test_123')
  })

  describe('createVersion', () => {
    it('should create first version', async () => {
      const { createVersion, getLatestVersion } = useVersionHistoryStore.getState()

      const request: CreateVersionRequest = {
        reportId: 'val_test_123',
        formData: {
          company_name: 'Test Company',
          country_code: 'BE',
          current_year_data: {
            year: 2025,
            revenue: 2000000,
            ebitda: 500000,
          },
        } as any,
        versionLabel: 'Initial',
      }

      const version = await createVersion(request)

      expect(version.versionNumber).toBe(1)
      expect(version.versionLabel).toBe('Initial')
      expect(version.isActive).toBe(true)

      const latest = getLatestVersion('val_test_123')
      expect(latest?.versionNumber).toBe(1)
    })

    it('should increment version number', async () => {
      const { createVersion } = useVersionHistoryStore.getState()

      // Create v1
      await createVersion({
        reportId: 'val_test_123',
        formData: {} as any,
      })

      // Create v2
      const v2 = await createVersion({
        reportId: 'val_test_123',
        formData: {} as any,
      })

      expect(v2.versionNumber).toBe(2)
    })

    it('should mark previous version as inactive', async () => {
      const { createVersion, getVersion } = useVersionHistoryStore.getState()

      // Create v1
      const v1 = await createVersion({
        reportId: 'val_test_123',
        formData: {} as any,
      })

      expect(v1.isActive).toBe(true)

      // Create v2
      await createVersion({
        reportId: 'val_test_123',
        formData: {} as any,
      })

      // v1 should now be inactive
      const v1Updated = getVersion('val_test_123', 1)
      expect(v1Updated?.isActive).toBe(false)
    })
  })

  describe('getActiveVersion', () => {
    it('should return latest version as active', async () => {
      const { createVersion, getActiveVersion, setActiveVersion } =
        useVersionHistoryStore.getState()

      await createVersion({
        reportId: 'val_test_123',
        formData: {} as any,
      })

      await createVersion({
        reportId: 'val_test_123',
        formData: {} as any,
      })

      setActiveVersion('val_test_123', 2)

      const active = getActiveVersion('val_test_123')
      expect(active?.versionNumber).toBe(2)
    })
  })

  describe('compareVersions', () => {
    it('should compare two versions', async () => {
      const { createVersion, compareVersions } = useVersionHistoryStore.getState()

      // Create v1
      await createVersion({
        reportId: 'val_test_123',
        formData: {
          current_year_data: {
            year: 2025,
            revenue: 2000000,
            ebitda: 500000,
          },
        } as any,
        valuationResult: {
          valuation_summary: {
            final_valuation: 4200000,
          },
        } as any,
      })

      // Create v2 with changes
      await createVersion({
        reportId: 'val_test_123',
        formData: {
          current_year_data: {
            year: 2025,
            revenue: 2500000, // +25%
            ebitda: 750000, // +50%
          },
        } as any,
        valuationResult: {
          valuation_summary: {
            final_valuation: 6200000, // +47.6%
          },
        } as any,
      })

      const comparison = compareVersions('val_test_123', 1, 2)

      expect(comparison).toBeDefined()
      expect(comparison?.changes.revenue).toBeDefined()
      expect(comparison?.changes.revenue?.from).toBe(2000000)
      expect(comparison?.changes.revenue?.to).toBe(2500000)
      expect(comparison?.changes.ebitda?.from).toBe(500000)
      expect(comparison?.changes.ebitda?.to).toBe(750000)
      expect(comparison?.valuationDelta?.direction).toBe('increase')
    })
  })

  describe('deleteVersion', () => {
    it('should delete version', async () => {
      const { createVersion, deleteVersion, getVersion } = useVersionHistoryStore.getState()

      await createVersion({
        reportId: 'val_test_123',
        formData: {} as any,
      })

      await deleteVersion('val_test_123', 1)

      const deleted = getVersion('val_test_123', 1)
      expect(deleted).toBeNull()
    })
  })
})

/**
 * Version History Store Tests
 *
 * Test version lifecycle and state management.
 *
 * @module store/__tests__/useVersionHistoryStore.test
 */

import { beforeEach, describe, expect, it } from 'vitest'
import type { CreateVersionRequest } from '../../types/ValuationVersion'
import { useVersionHistoryStore } from '../useVersionHistoryStore'

describe('useVersionHistoryStore', () => {
  beforeEach(() => {
    // Clear store before each test
    const { clearVersions } = useVersionHistoryStore.getState()
    clearVersions('val_test_123')
  })

  describe('createVersion', () => {
    it('should create first version', async () => {
      const { createVersion, getLatestVersion } = useVersionHistoryStore.getState()

      const request: CreateVersionRequest = {
        reportId: 'val_test_123',
        formData: {
          company_name: 'Test Company',
          country_code: 'BE',
          current_year_data: {
            year: 2025,
            revenue: 2000000,
            ebitda: 500000,
          },
        } as any,
        versionLabel: 'Initial',
      }

      const version = await createVersion(request)

      expect(version.versionNumber).toBe(1)
      expect(version.versionLabel).toBe('Initial')
      expect(version.isActive).toBe(true)

      const latest = getLatestVersion('val_test_123')
      expect(latest?.versionNumber).toBe(1)
    })

    it('should increment version number', async () => {
      const { createVersion } = useVersionHistoryStore.getState()

      // Create v1
      await createVersion({
        reportId: 'val_test_123',
        formData: {} as any,
      })

      // Create v2
      const v2 = await createVersion({
        reportId: 'val_test_123',
        formData: {} as any,
      })

      expect(v2.versionNumber).toBe(2)
    })

    it('should mark previous version as inactive', async () => {
      const { createVersion, getVersion } = useVersionHistoryStore.getState()

      // Create v1
      const v1 = await createVersion({
        reportId: 'val_test_123',
        formData: {} as any,
      })

      expect(v1.isActive).toBe(true)

      // Create v2
      await createVersion({
        reportId: 'val_test_123',
        formData: {} as any,
      })

      // v1 should now be inactive
      const v1Updated = getVersion('val_test_123', 1)
      expect(v1Updated?.isActive).toBe(false)
    })
  })

  describe('getActiveVersion', () => {
    it('should return latest version as active', async () => {
      const { createVersion, getActiveVersion, setActiveVersion } =
        useVersionHistoryStore.getState()

      await createVersion({
        reportId: 'val_test_123',
        formData: {} as any,
      })

      await createVersion({
        reportId: 'val_test_123',
        formData: {} as any,
      })

      setActiveVersion('val_test_123', 2)

      const active = getActiveVersion('val_test_123')
      expect(active?.versionNumber).toBe(2)
    })
  })

  describe('compareVersions', () => {
    it('should compare two versions', async () => {
      const { createVersion, compareVersions } = useVersionHistoryStore.getState()

      // Create v1
      await createVersion({
        reportId: 'val_test_123',
        formData: {
          current_year_data: {
            year: 2025,
            revenue: 2000000,
            ebitda: 500000,
          },
        } as any,
        valuationResult: {
          valuation_summary: {
            final_valuation: 4200000,
          },
        } as any,
      })

      // Create v2 with changes
      await createVersion({
        reportId: 'val_test_123',
        formData: {
          current_year_data: {
            year: 2025,
            revenue: 2500000, // +25%
            ebitda: 750000, // +50%
          },
        } as any,
        valuationResult: {
          valuation_summary: {
            final_valuation: 6200000, // +47.6%
          },
        } as any,
      })

      const comparison = compareVersions('val_test_123', 1, 2)

      expect(comparison).toBeDefined()
      expect(comparison?.changes.revenue).toBeDefined()
      expect(comparison?.changes.revenue?.from).toBe(2000000)
      expect(comparison?.changes.revenue?.to).toBe(2500000)
      expect(comparison?.changes.ebitda?.from).toBe(500000)
      expect(comparison?.changes.ebitda?.to).toBe(750000)
      expect(comparison?.valuationDelta?.direction).toBe('increase')
    })
  })

  describe('deleteVersion', () => {
    it('should delete version', async () => {
      const { createVersion, deleteVersion, getVersion } = useVersionHistoryStore.getState()

      await createVersion({
        reportId: 'val_test_123',
        formData: {} as any,
      })

      await deleteVersion('val_test_123', 1)

      const deleted = getVersion('val_test_123', 1)
      expect(deleted).toBeNull()
    })
  })
})
