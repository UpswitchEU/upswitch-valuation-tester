'use client'

import { use } from 'react'
import { ValuationReport } from '../../../src/components/ValuationReport'

interface ValuationReportPageProps {
  params:
    | Promise<{
        id: string
      }>
    | {
        id: string
      }
  searchParams?:
    | Promise<{
        mode?: 'edit' | 'view'
        version?: string
        flow?: 'manual' | 'conversational'
        prefilledQuery?: string
        autoSend?: string
      }>
    | {
        mode?: 'edit' | 'view'
        version?: string
        flow?: 'manual' | 'conversational'
        prefilledQuery?: string
        autoSend?: string
      }
}

/**
 * Valuation Report Page
 *
 * Supports M&A workflow with multiple modes:
 * - Edit mode (default): Editable form for adjustments and regeneration
 * - View mode: Static report view
 * - Version selection: Load specific version (v1, v2, v3...)
 *
 * Query params:
 * - ?mode=edit|view (default: edit for always-editable UX)
 * - ?version=N (load specific version, default: latest)
 * - ?flow=manual|conversational (existing flow selection)
 * - ?prefilledQuery=Restaurant (existing prefill)
 */
export default function ValuationReportPage({ params, searchParams }: ValuationReportPageProps) {
  // Handle both Promise and plain object params (Next.js 14+ compatibility)
  if (!params) {
    throw new Error('Params are required')
  }

  const paramsPromise = params instanceof Promise ? params : Promise.resolve(params)
  const resolvedParams = use(paramsPromise)

  const { id } = resolvedParams || { id: '' }

  if (!id) {
    throw new Error('Report ID is required')
  }

  // Handle searchParams (optional)
  let mode: 'edit' | 'view' = 'edit' // Default to edit mode (M&A workflow)
  let versionNumber: number | undefined

  if (searchParams) {
    const searchParamsPromise =
      searchParams instanceof Promise ? searchParams : Promise.resolve(searchParams)
    const resolvedSearchParams = use(searchParamsPromise)

    mode = resolvedSearchParams.mode || 'edit'
    versionNumber = resolvedSearchParams.version
      ? parseInt(resolvedSearchParams.version)
      : undefined
  }

  return <ValuationReport reportId={id} initialMode={mode} initialVersion={versionNumber} />
}
