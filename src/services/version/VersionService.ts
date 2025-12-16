/**
 * Version Service
 *
 * Shared service for version management across Manual and Conversational flows.
 * Provides a single, consistent API for version operations.
 *
 * Key Features:
 * - Create versions (auto-versioning on regeneration)
 * - Fetch version history
 * - Update version metadata (labels, notes, tags, pin status)
 * - Delete versions
 * - Compare versions
 * - Version statistics
 *
 * Used by:
 * - Manual Flow (after valuation calculation)
 * - Conversational Flow (after valuation calculation)
 * - Version History UI components
 *
 * @module services/version/VersionService
 */

import { VersionAPI } from '../api/version/VersionAPI'
import type {
  ValuationVersion,
  CreateVersionRequest,
  UpdateVersionRequest,
  VersionComparison,
  VersionChanges,
} from '../../types/ValuationVersion'
import { createContextLogger } from '../../utils/logger'
import { convertToApplicationError, getErrorMessage } from '../../utils/errors/errorConverter'

const logger = createContextLogger('VersionService')

/**
 * VersionService - Shared version management
 *
 * Singleton service for consistent version operations across all flows.
 */
export class VersionService {
  private static instance: VersionService
  private versionAPI: VersionAPI

  private constructor() {
    this.versionAPI = new VersionAPI()
  }

  /**
   * Get singleton instance
   */
  static getInstance(): VersionService {
    if (!VersionService.instance) {
      VersionService.instance = new VersionService()
    }
    return VersionService.instance
  }

  /**
   * Fetch versions for a report
   *
   * @param reportId - Report identifier
   * @returns List of versions and active version number
   */
  async fetchVersions(reportId: string): Promise<{
    versions: ValuationVersion[]
    activeVersion: number
  }> {
    const startTime = performance.now()

    try {
      logger.info('Fetching versions', { reportId })

      const response = await this.versionAPI.listVersions(reportId)

      const duration = performance.now() - startTime

      logger.info('Versions fetched successfully', {
        reportId,
        count: response.versions.length,
        activeVersion: response.activeVersion,
        duration_ms: duration.toFixed(2),
      })

      return response
    } catch (error) {
      const duration = performance.now() - startTime
      const appError = convertToApplicationError(error, { reportId })

      logger.error('Failed to fetch versions', {
        error: getErrorMessage(appError),
        reportId,
        duration_ms: duration.toFixed(2),
      })

      // Return empty list instead of throwing - let caller decide how to handle
      return {
        versions: [],
        activeVersion: 1,
      }
    }
  }

  /**
   * Create new version
   *
   * Auto-increments version number and creates version snapshot.
   * Marks previous version as inactive.
   *
   * @param request - Version creation request
   * @returns Created version object
   */
  async createVersion(request: CreateVersionRequest): Promise<ValuationVersion> {
    const startTime = performance.now()

    try {
      logger.info('Creating version', {
        reportId: request.reportId,
        hasFormData: !!request.formData,
        hasResult: !!request.valuationResult,
        hasHtmlReport: !!request.htmlReport,
      })

      const version = await this.versionAPI.createVersion(request)

      const duration = performance.now() - startTime

      logger.info('Version created successfully', {
        reportId: request.reportId,
        versionNumber: version.versionNumber,
        versionLabel: version.versionLabel,
        duration_ms: duration.toFixed(2),
      })

      return version
    } catch (error) {
      const duration = performance.now() - startTime
      const appError = convertToApplicationError(error, { reportId: request.reportId })

      logger.error('Failed to create version', {
        error: getErrorMessage(appError),
        reportId: request.reportId,
        duration_ms: duration.toFixed(2),
      })

      throw appError
    }
  }

  /**
   * Update version metadata
   *
   * Updates version label, notes, tags, or pin status.
   * Does not modify version snapshot data.
   *
   * @param reportId - Report identifier
   * @param versionNumber - Version number to update
   * @param updates - Metadata updates
   */
  async updateVersion(
    reportId: string,
    versionNumber: number,
    updates: UpdateVersionRequest
  ): Promise<void> {
    const startTime = performance.now()

    try {
      logger.info('Updating version', {
        reportId,
        versionNumber,
        updateKeys: Object.keys(updates),
      })

      await this.versionAPI.updateVersion(reportId, versionNumber, updates)

      const duration = performance.now() - startTime

      logger.info('Version updated successfully', {
        reportId,
        versionNumber,
        duration_ms: duration.toFixed(2),
      })
    } catch (error) {
      const duration = performance.now() - startTime
      const appError = convertToApplicationError(error, { reportId, versionNumber })

      logger.error('Failed to update version', {
        error: getErrorMessage(appError),
        reportId,
        versionNumber,
        duration_ms: duration.toFixed(2),
      })

      throw appError
    }
  }

  /**
   * Delete version
   *
   * Removes version from history.
   * Cannot delete active version.
   *
   * @param reportId - Report identifier
   * @param versionNumber - Version number to delete
   */
  async deleteVersion(reportId: string, versionNumber: number): Promise<void> {
    const startTime = performance.now()

    try {
      logger.info('Deleting version', {
        reportId,
        versionNumber,
      })

      await this.versionAPI.deleteVersion(reportId, versionNumber)

      const duration = performance.now() - startTime

      logger.info('Version deleted successfully', {
        reportId,
        versionNumber,
        duration_ms: duration.toFixed(2),
      })
    } catch (error) {
      const duration = performance.now() - startTime
      const appError = convertToApplicationError(error, { reportId, versionNumber })

      logger.error('Failed to delete version', {
        error: getErrorMessage(appError),
        reportId,
        versionNumber,
        duration_ms: duration.toFixed(2),
      })

      throw appError
    }
  }

  /**
   * Get specific version
   *
   * @param reportId - Report identifier
   * @param versionNumber - Version number to retrieve
   * @returns Version object or null if not found
   */
  async getVersion(reportId: string, versionNumber: number): Promise<ValuationVersion | null> {
    const startTime = performance.now()

    try {
      logger.info('Getting version', {
        reportId,
        versionNumber,
      })

      const version = await this.versionAPI.getVersion(reportId, versionNumber)

      const duration = performance.now() - startTime

      logger.info('Version retrieved successfully', {
        reportId,
        versionNumber,
        duration_ms: duration.toFixed(2),
      })

      return version
    } catch (error) {
      const duration = performance.now() - startTime
      const appError = convertToApplicationError(error, { reportId, versionNumber })

      logger.error('Failed to get version', {
        error: getErrorMessage(appError),
        reportId,
        versionNumber,
        duration_ms: duration.toFixed(2),
      })

      return null
    }
  }

  /**
   * Compare two versions
   *
   * @param reportId - Report identifier
   * @param versionA - First version number
   * @param versionB - Second version number
   * @returns Comparison object with changes and highlights
   */
  async compareVersions(
    reportId: string,
    versionA: number,
    versionB: number
  ): Promise<VersionComparison | null> {
    const startTime = performance.now()

    try {
      logger.info('Comparing versions', {
        reportId,
        versionA,
        versionB,
      })

      const comparison = await this.versionAPI.compareVersions(reportId, versionA, versionB)

      const duration = performance.now() - startTime

      logger.info('Versions compared successfully', {
        reportId,
        versionA,
        versionB,
        totalChanges: comparison.changes.totalChanges,
        duration_ms: duration.toFixed(2),
      })

      return comparison
    } catch (error) {
      const duration = performance.now() - startTime
      const appError = convertToApplicationError(error, { reportId, versionA, versionB })

      logger.error('Failed to compare versions', {
        error: getErrorMessage(appError),
        reportId,
        versionA,
        versionB,
        duration_ms: duration.toFixed(2),
      })

      return null
    }
  }

  /**
   * Get version statistics
   *
   * @param reportId - Report identifier
   * @returns Statistics about version history
   */
  async getStatistics(reportId: string): Promise<{
    totalVersions: number
    activeVersion: number
    pinnedVersions: number
    lastCreated: Date | null
  }> {
    const startTime = performance.now()

    try {
      logger.info('Getting version statistics', { reportId })

      const stats = await this.versionAPI.getStatistics(reportId)

      const duration = performance.now() - startTime

      logger.info('Statistics retrieved successfully', {
        reportId,
        totalVersions: stats.totalVersions,
        duration_ms: duration.toFixed(2),
      })

      return stats
    } catch (error) {
      const duration = performance.now() - startTime
      const appError = convertToApplicationError(error, { reportId })

      logger.error('Failed to get statistics', {
        error: getErrorMessage(appError),
        reportId,
        duration_ms: duration.toFixed(2),
      })

      // Return default stats instead of throwing
      return {
        totalVersions: 0,
        activeVersion: 1,
        pinnedVersions: 0,
        lastCreated: null,
      }
    }
  }
}

// Export singleton instance
export const versionService = VersionService.getInstance()

