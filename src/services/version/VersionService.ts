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

import { ApplicationError, NetworkError, NotFoundError, ValidationError } from '../../types/errors'
import type {
  CreateVersionRequest,
  UpdateVersionRequest,
  ValuationVersion,
  VersionChanges,
  VersionComparison,
  VersionStatistics,
} from '../../types/ValuationVersion'
import { getErrorMessage } from '../../utils/errors/errorConverter'
import { createContextLogger } from '../../utils/logger'
import { VersionAPI } from '../api/version/VersionAPI'

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

      // Use instanceof checks for specific error handling
      if (error instanceof NotFoundError) {
        logger.info('No versions found - returning empty list', {
          reportId,
          duration_ms: duration.toFixed(2),
        })
        return {
          versions: [],
          activeVersion: 1,
        }
      } else if (error instanceof NetworkError && error.retryable) {
        logger.warn('Failed to fetch versions - network error (retryable)', {
          error: error.message,
          reportId,
          duration_ms: duration.toFixed(2),
        })
        return {
          versions: [],
          activeVersion: 1,
        }
      } else {
        logger.error('Failed to fetch versions - unknown error', {
          error: getErrorMessage(error),
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

      // Use instanceof checks for specific error handling
      if (error instanceof ValidationError) {
        logger.warn('Failed to create version - validation error', {
          error: error.message,
          field: error.field,
          reportId: request.reportId,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else if (error instanceof NetworkError && error.retryable) {
        logger.warn('Failed to create version - network error (retryable)', {
          error: error.message,
          reportId: request.reportId,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else {
        logger.error('Failed to create version - unknown error', {
          error: getErrorMessage(error),
          reportId: request.reportId,
          duration_ms: duration.toFixed(2),
        })
        throw new ApplicationError(
          `Failed to create version: ${getErrorMessage(error)}`,
          'VERSION_CREATE_FAILED',
          {
            originalError: error,
            reportId: request.reportId,
            duration_ms: duration.toFixed(2),
          }
        )
      }
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

      // Use instanceof checks for specific error handling
      if (error instanceof ValidationError) {
        logger.warn('Failed to update version - validation error', {
          error: error.message,
          field: error.field,
          reportId,
          versionNumber,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else if (error instanceof NotFoundError) {
        logger.error('Failed to update version - not found', {
          error: error.message,
          resourceType: error.resourceType,
          resourceId: error.resourceId,
          reportId,
          versionNumber,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else if (error instanceof NetworkError && error.retryable) {
        logger.warn('Failed to update version - network error (retryable)', {
          error: error.message,
          reportId,
          versionNumber,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else {
        logger.error('Failed to update version - unknown error', {
          error: getErrorMessage(error),
          reportId,
          versionNumber,
          duration_ms: duration.toFixed(2),
        })
        throw new ApplicationError(
          `Failed to update version: ${getErrorMessage(error)}`,
          'VERSION_UPDATE_FAILED',
          {
            originalError: error,
            reportId,
            versionNumber,
            duration_ms: duration.toFixed(2),
          }
        )
      }
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

      // Use instanceof checks for specific error handling
      if (error instanceof NotFoundError) {
        logger.error('Failed to delete version - not found', {
          error: error.message,
          resourceType: error.resourceType,
          resourceId: error.resourceId,
          reportId,
          versionNumber,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else if (error instanceof NetworkError && error.retryable) {
        logger.warn('Failed to delete version - network error (retryable)', {
          error: error.message,
          reportId,
          versionNumber,
          duration_ms: duration.toFixed(2),
        })
        throw error
      } else {
        logger.error('Failed to delete version - unknown error', {
          error: getErrorMessage(error),
          reportId,
          versionNumber,
          duration_ms: duration.toFixed(2),
        })
        throw new ApplicationError(
          `Failed to delete version: ${getErrorMessage(error)}`,
          'VERSION_DELETE_FAILED',
          {
            originalError: error,
            reportId,
            versionNumber,
            duration_ms: duration.toFixed(2),
          }
        )
      }
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

      // Use instanceof checks for specific error handling
      if (error instanceof NotFoundError) {
        logger.info('Version not found - returning null', {
          reportId,
          versionNumber,
          duration_ms: duration.toFixed(2),
        })
        return null
      } else if (error instanceof NetworkError && error.retryable) {
        logger.warn('Failed to get version - network error (retryable)', {
          error: error.message,
          reportId,
          versionNumber,
          duration_ms: duration.toFixed(2),
        })
        return null
      } else {
        logger.error('Failed to get version - unknown error', {
          error: getErrorMessage(error),
          reportId,
          versionNumber,
          duration_ms: duration.toFixed(2),
        })
        return null
      }
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

      // Use instanceof checks for specific error handling
      if (error instanceof NotFoundError) {
        logger.warn('Failed to compare versions - version not found', {
          error: error.message,
          resourceType: error.resourceType,
          resourceId: error.resourceId,
          reportId,
          versionA,
          versionB,
          duration_ms: duration.toFixed(2),
        })
        return null
      } else if (error instanceof NetworkError && error.retryable) {
        logger.warn('Failed to compare versions - network error (retryable)', {
          error: error.message,
          reportId,
          versionA,
          versionB,
          duration_ms: duration.toFixed(2),
        })
        return null
      } else {
        logger.error('Failed to compare versions - unknown error', {
          error: getErrorMessage(error),
          reportId,
          versionA,
          versionB,
          duration_ms: duration.toFixed(2),
        })
        return null
      }
    }
  }

  /**
   * Get version statistics
   *
   * @param reportId - Report identifier
   * @returns Statistics about version history
   */
  async getStatistics(reportId: string): Promise<VersionStatistics> {
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

      // Use instanceof checks for specific error handling
      if (error instanceof NotFoundError) {
        logger.info('No statistics found - returning defaults', {
          reportId,
          duration_ms: duration.toFixed(2),
        })
      } else if (error instanceof NetworkError && error.retryable) {
        logger.warn('Failed to get statistics - network error (retryable)', {
          error: error.message,
          reportId,
          duration_ms: duration.toFixed(2),
        })
      } else {
        logger.error('Failed to get statistics - unknown error', {
          error: getErrorMessage(error),
          reportId,
          duration_ms: duration.toFixed(2),
        })
      }

      // Return default stats instead of throwing
      // Return empty statistics on error
      return {
        totalVersions: 0,
        averageTimeBetweenVersions_hours: 0,
        mostChangedFields: [],
        averageValuationChange_percent: 0,
        firstVersion: {
          number: 1,
          createdAt: new Date(),
        },
        latestVersion: {
          number: 1,
          createdAt: new Date(),
        },
      }
    }
  }
}

// Export singleton instance
export const versionService = VersionService.getInstance()
