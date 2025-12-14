/**
 * useBusinessTypeFull Hook
 *
 * Fetches complete business type metadata including:
 * - Questions (dynamic question templates)
 * - Validations (business-type-specific rules)
 * - Benchmarks (industry data)
 * - Extended metadata
 *
 * @author UpSwitch CTO Team
 * @version 2.0.0
 */

import { useCallback, useEffect, useState } from 'react'
import { businessTypesApiService } from '../services/businessTypesApi'
import { logger as generalLogger } from '../utils/loggers'

// ============================================================================
// TYPES
// ============================================================================

export interface BusinessTypeFull {
  // Core fields
  id: string
  title: string
  short_title?: string
  description: string
  icon: string
  category_id: string
  sector: string
  industry: string
  sub_industry?: string

  // Business Model
  primary_model: string
  secondary_models?: string[]
  revenue_streams?: any[]

  // Visual
  color_hex?: string

  // Valuation
  dcf_preference: number
  multiples_preference: number
  preferred_multiples?: string[]
  owner_dependency_impact: number

  // Typical Ranges
  typical_revenue_min?: number
  typical_revenue_max?: number
  typical_revenue_median?: number
  typical_ebitda_margin_min?: number
  typical_ebitda_margin_max?: number
  typical_ebitda_margin_median?: number
  typical_employee_min?: number
  typical_employee_max?: number
  typical_employee_median?: number

  // Key Metrics
  key_metrics?: any[]

  // Risk Factors
  risk_factors?: any[]

  // Market Intelligence
  market_maturity?: string
  market_trend?: string
  seasonality_impact?: string
  economic_sensitivity?: string

  // Geographic
  relevant_countries?: string[]
  urban_rural_split?: string

  // Extended data
  questions: any[]
  validations: any[]
  benchmarks: any[]
  metadata: any[]

  // Lifecycle
  status: string
  version: number
  created_at: string
  updated_at: string
}

export interface UseBusinessTypeFullState {
  businessType: BusinessTypeFull | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

// ============================================================================
// HOOK
// ============================================================================

export function useBusinessTypeFull(
  businessTypeId: string | null | undefined
): UseBusinessTypeFullState {
  const [businessType, setBusinessType] = useState<BusinessTypeFull | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBusinessTypeFull = useCallback(async () => {
    if (!businessTypeId) {
      setBusinessType(null)
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)

      generalLogger.debug('[useBusinessTypeFull] Fetching full metadata', { businessTypeId })

      const result = await businessTypesApiService.getBusinessTypeFull(businessTypeId)

      if (result) {
        setBusinessType(result)
        generalLogger.info('[useBusinessTypeFull] Loaded successfully', {
          businessTypeId,
          questionsCount: result.questions?.length || 0,
          validationsCount: result.validations?.length || 0,
          benchmarksCount: result.benchmarks?.length || 0,
        })
      } else {
        setError('Business type not found')
        generalLogger.error('[useBusinessTypeFull] Not found', { businessTypeId })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch business type'
      setError(errorMessage)
      generalLogger.error('[useBusinessTypeFull] Error:', { businessTypeId, error: errorMessage })
    } finally {
      setLoading(false)
    }
  }, [businessTypeId])

  const refetch = useCallback(async () => {
    await fetchBusinessTypeFull()
  }, [fetchBusinessTypeFull])

  useEffect(() => {
    fetchBusinessTypeFull()
  }, [fetchBusinessTypeFull])

  return {
    businessType,
    loading,
    error,
    refetch,
  }
}

export default useBusinessTypeFull
