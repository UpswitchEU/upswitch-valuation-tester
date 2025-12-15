/**
 * Version History Store
 * 
 * Single Responsibility: Manage version history state and operations
 * Client-side first implementation, will migrate to backend later
 * 
 * @module store/useVersionHistoryStore
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { VersionAPI } from '../services/api/version/VersionAPI'
import type {
    CreateVersionRequest,
    UpdateVersionRequest,
    ValuationVersion,
    VersionChanges,
    VersionComparison
} from '../types/ValuationVersion'
import { createContextLogger } from '../utils/logger'

const versionLogger = createContextLogger('VersionHistoryStore')
const versionAPI = new VersionAPI()

export interface VersionHistoryStore {
  // State
  versions: Record<string, ValuationVersion[]> // Keyed by reportId
  activeVersions: Record<string, number> // Currently selected version per report
  loading: boolean
  error: string | null

  // Actions
  fetchVersions: (reportId: string) => Promise<void>
  createVersion: (request: CreateVersionRequest) => Promise<ValuationVersion>
  updateVersion: (reportId: string, versionNumber: number, updates: UpdateVersionRequest) => Promise<void>
  deleteVersion: (reportId: string, versionNumber: number) => Promise<void>
  setActiveVersion: (reportId: string, versionNumber: number) => void
  getVersion: (reportId: string, versionNumber: number) => ValuationVersion | null
  getActiveVersion: (reportId: string) => ValuationVersion | null
  getLatestVersion: (reportId: string) => ValuationVersion | null
  compareVersions: (reportId: string, versionA: number, versionB: number) => VersionComparison | null
  clearVersions: (reportId: string) => void
}

/**
 * Generate version ID
 */
function generateVersionId(): string {
  return `version_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
}

/**
 * Detect changes between two data objects
 */
function detectChanges(
  oldData: any,
  newData: any
): VersionChanges {
  const changes: VersionChanges = {
    totalChanges: 0,
    significantChanges: [],
  }

  const timestamp = new Date()

  // Financial changes
  if (oldData.current_year_data?.revenue !== newData.current_year_data?.revenue) {
    const oldVal = oldData.current_year_data?.revenue || 0
    const newVal = newData.current_year_data?.revenue || 0
    changes.revenue = {
      from: oldVal,
      to: newVal,
      percentChange: oldVal > 0 ? ((newVal - oldVal) / oldVal) * 100 : 0,
      timestamp,
    }
    changes.totalChanges++
    if (Math.abs(changes.revenue.percentChange || 0) > 10) {
      changes.significantChanges.push('revenue')
    }
  }

  if (oldData.current_year_data?.ebitda !== newData.current_year_data?.ebitda) {
    const oldVal = oldData.current_year_data?.ebitda || 0
    const newVal = newData.current_year_data?.ebitda || 0
    changes.ebitda = {
      from: oldVal,
      to: newVal,
      percentChange: oldVal > 0 ? ((newVal - oldVal) / oldVal) * 100 : 0,
      timestamp,
    }
    changes.totalChanges++
    if (Math.abs(changes.ebitda.percentChange || 0) > 10) {
      changes.significantChanges.push('ebitda')
    }
  }

  // Business profile changes
  if (oldData.company_name !== newData.company_name) {
    changes.companyName = {
      from: oldData.company_name || '',
      to: newData.company_name || '',
      timestamp,
    }
    changes.totalChanges++
  }

  if (oldData.founding_year !== newData.founding_year) {
    changes.foundingYear = {
      from: oldData.founding_year,
      to: newData.founding_year,
      timestamp,
    }
    changes.totalChanges++
  }

  return changes
}

/**
 * Version History Store
 * 
 * Manages version history with client-side storage (interim solution).
 * Will be enhanced with backend persistence in Phase 2.
 */
export const useVersionHistoryStore = create<VersionHistoryStore>()(
  persist(
    (set, get) => ({
      // Initial state
      versions: {},
      activeVersions: {},
      loading: false,
      error: null,

      /**
       * Fetch versions for report
       * 
       * Tries backend first, falls back to local storage
       */
      fetchVersions: async (reportId: string) => {
        set({ loading: true, error: null })

        try {
          versionLogger.info('Fetching versions', { reportId })

          // Try backend API first
          const response = await versionAPI.listVersions(reportId)

          set((state) => ({
            versions: {
              ...state.versions,
              [reportId]: response.versions,
            },
            activeVersions: {
              ...state.activeVersions,
              [reportId]: response.activeVersion,
            },
            loading: false,
          }))

          versionLogger.info('Versions loaded from backend', {
            reportId,
            count: response.versions.length,
          })
        } catch (error) {
          // Fallback to local storage (already populated from persist middleware)
          const localVersions = get().versions[reportId] || []

          versionLogger.warn('Backend unavailable, using local versions', {
            reportId,
            count: localVersions.length,
          })

          set({ loading: false })
        }
      },

      /**
       * Create new version
       */
      createVersion: async (request: CreateVersionRequest) => {
        try {
          versionLogger.info('Creating version', { reportId: request.reportId })

          // Try backend first
          try {
            const version = await versionAPI.createVersion(request)

            // Add to local state
            set((state) => {
              const reportVersions = state.versions[request.reportId] || []
              return {
                versions: {
                  ...state.versions,
                  [request.reportId]: [...reportVersions, version],
                },
                activeVersions: {
                  ...state.activeVersions,
                  [request.reportId]: version.versionNumber,
                },
              }
            })

            return version
          } catch (backendError) {
            // Backend unavailable - create locally
            versionLogger.warn('Backend unavailable, creating local version', {
              reportId: request.reportId,
            })

            const reportVersions = get().versions[request.reportId] || []
            const nextVersionNumber = Math.max(0, ...reportVersions.map((v) => v.versionNumber)) + 1

            const self = get()
            const localVersion: ValuationVersion = {
              id: generateVersionId(),
              reportId: request.reportId,
              versionNumber: nextVersionNumber,
              versionLabel:
                request.versionLabel || self.generateAutoLabel(nextVersionNumber, request.changesSummary),
              createdAt: new Date(),
              createdBy: null,
              formData: request.formData,
              valuationResult: request.valuationResult || null,
              htmlReport: request.htmlReport || null,
              changesSummary: request.changesSummary || { totalChanges: 0, significantChanges: [] },
              isActive: true,
              isPinned: false,
              tags: request.tags || [],
              notes: request.notes,
            }

            // Mark previous versions as inactive
            const updatedVersions = reportVersions.map((v) => ({
              ...v,
              isActive: false,
            }))

            set((state) => ({
              versions: {
                ...state.versions,
                [request.reportId]: [...updatedVersions, localVersion],
              },
              activeVersions: {
                ...state.activeVersions,
                [request.reportId]: nextVersionNumber,
              },
            }))

            versionLogger.info('Local version created', {
              reportId: request.reportId,
              versionNumber: nextVersionNumber,
            })

            return localVersion
          }
        } catch (error) {
          versionLogger.error('Failed to create version', {
            reportId: request.reportId,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          throw error
        }
      },

      /**
       * Generate auto-label from changes (Note: This is internal, use versionDiffDetection.generateAutoLabel for consistency)
       */
      generateAutoLabel(versionNumber: number, changes?: VersionChanges): string {
        if (!changes || changes.totalChanges === 0) {
          return `Version ${versionNumber}`
        }

        const significant = changes.significantChanges || []
        if (significant.length > 0) {
          return `v${versionNumber} - Adjusted ${significant.join(', ')}`
        }

        return `v${versionNumber} - Updated`
      },

      /**
       * Update version metadata
       */
      updateVersion: async (reportId: string, versionNumber: number, updates: UpdateVersionRequest) => {
        try {
          // Try backend first
          await versionAPI.updateVersion(reportId, versionNumber, updates)

          // Update local state
          set((state) => {
            const reportVersions = state.versions[reportId] || []
            const updatedVersions = reportVersions.map((v) =>
              v.versionNumber === versionNumber
                ? {
                    ...v,
                    versionLabel: updates.versionLabel || v.versionLabel,
                    notes: updates.notes !== undefined ? updates.notes : v.notes,
                    tags: updates.tags || v.tags,
                    isPinned: updates.isPinned !== undefined ? updates.isPinned : v.isPinned,
                  }
                : v
            )

            return {
              versions: {
                ...state.versions,
                [reportId]: updatedVersions,
              },
            }
          })

          versionLogger.info('Version updated', { reportId, versionNumber })
        } catch (error) {
          versionLogger.error('Failed to update version', {
            reportId,
            versionNumber,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          throw error
        }
      },

      /**
       * Delete version
       */
      deleteVersion: async (reportId: string, versionNumber: number) => {
        try {
          // Try backend first
          await versionAPI.deleteVersion(reportId, versionNumber)

          // Remove from local state
          set((state) => {
            const reportVersions = state.versions[reportId] || []
            const filteredVersions = reportVersions.filter((v) => v.versionNumber !== versionNumber)

            return {
              versions: {
                ...state.versions,
                [reportId]: filteredVersions,
              },
            }
          })

          versionLogger.info('Version deleted', { reportId, versionNumber })
        } catch (error) {
          versionLogger.error('Failed to delete version', {
            reportId,
            versionNumber,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
          throw error
        }
      },

      /**
       * Set active version (which version user is viewing/editing)
       */
      setActiveVersion: (reportId: string, versionNumber: number) => {
        set((state) => ({
          activeVersions: {
            ...state.activeVersions,
            [reportId]: versionNumber,
          },
        }))

        versionLogger.info('Active version changed', { reportId, versionNumber })
      },

      /**
       * Get specific version
       */
      getVersion: (reportId: string, versionNumber: number) => {
        const reportVersions = get().versions[reportId] || []
        return reportVersions.find((v) => v.versionNumber === versionNumber) || null
      },

      /**
       * Get currently active version
       */
      getActiveVersion: (reportId: string) => {
        const activeVersionNumber = get().activeVersions[reportId]
        if (!activeVersionNumber) return null

        return get().getVersion(reportId, activeVersionNumber)
      },

      /**
       * Get latest version (highest version number)
       */
      getLatestVersion: (reportId: string) => {
        const reportVersions = get().versions[reportId] || []
        if (reportVersions.length === 0) return null

        return reportVersions.reduce((latest, current) =>
          current.versionNumber > latest.versionNumber ? current : latest
        )
      },

      /**
       * Compare two versions (client-side)
       */
      compareVersions: (reportId: string, versionA: number, versionB: number) => {
        const vA = get().getVersion(reportId, versionA)
        const vB = get().getVersion(reportId, versionB)

        if (!vA || !vB) return null

        // Detect changes between versions
        const changes = detectChanges(vA.formData, vB.formData)

        // Calculate valuation delta
        const valuationDelta =
          vA.valuationResult && typeof vA.valuationResult === 'object' &&
          vB.valuationResult && typeof vB.valuationResult === 'object'
            ? {
                absoluteChange:
                  ((vB.valuationResult as any).valuation_summary?.final_valuation || 0) -
                  ((vA.valuationResult as any).valuation_summary?.final_valuation || 0),
                percentChange:
                  (((vB.valuationResult as any).valuation_summary?.final_valuation || 0) -
                    ((vA.valuationResult as any).valuation_summary?.final_valuation || 0)) /
                  ((vA.valuationResult as any).valuation_summary?.final_valuation || 1) *
                  100,
                direction:
                  ((vB.valuationResult as any).valuation_summary?.final_valuation || 0) >
                  ((vA.valuationResult as any).valuation_summary?.final_valuation || 0)
                    ? 'increase' as const
                    : ((vB.valuationResult as any).valuation_summary?.final_valuation || 0) <
                      ((vA.valuationResult as any).valuation_summary?.final_valuation || 0)
                    ? 'decrease' as const
                    : 'unchanged' as const,
              }
            : null

        // Generate highlights
        const highlights = []
        if (changes.revenue) {
          highlights.push({
            field: 'revenue',
            label: 'Revenue',
            oldValue: changes.revenue.from,
            newValue: changes.revenue.to,
            impact: `${changes.revenue.percentChange! > 0 ? '+' : ''}${changes.revenue.percentChange!.toFixed(1)}%`,
          })
        }
        if (changes.ebitda) {
          highlights.push({
            field: 'ebitda',
            label: 'EBITDA',
            oldValue: changes.ebitda.from,
            newValue: changes.ebitda.to,
            impact: `${changes.ebitda.percentChange! > 0 ? '+' : ''}${changes.ebitda.percentChange!.toFixed(1)}%`,
          })
        }

        const comparison: VersionComparison = {
          versionA: vA,
          versionB: vB,
          changes,
          valuationDelta,
          highlights,
        }

        return comparison
      },

      /**
       * Clear versions for report
       */
      clearVersions: (reportId: string) => {
        set((state) => {
          const newVersions = { ...state.versions }
          delete newVersions[reportId]

          const newActiveVersions = { ...state.activeVersions }
          delete newActiveVersions[reportId]

          return {
            versions: newVersions,
            activeVersions: newActiveVersions,
          }
        })

        versionLogger.info('Versions cleared', { reportId })
      },
    }),
    {
      name: 'version-history-storage',
      partialize: (state) => ({
        versions: state.versions,
        activeVersions: state.activeVersions,
      }),
    }
  )
)
