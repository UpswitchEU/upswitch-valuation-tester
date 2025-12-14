'use client'

import { use } from 'react'
import { ValuationReport } from '../../../src/components/ValuationReport'

interface ValuationReportPageProps {
  params: Promise<{
    id: string
  }> | {
    id: string
  }
}

export default function ValuationReportPage({ params }: ValuationReportPageProps) {
  // Handle both Promise and plain object params (Next.js 14+ compatibility)
  // FIX: Call use() unconditionally to comply with Rules of Hooks
  // React error #438 occurs when use() receives undefined/null or non-Promise
  if (!params) {
    throw new Error('Params are required')
  }
  
  // FIX: Always call use() unconditionally - wrap non-Promise in Promise.resolve()
  // Next.js 15+ always passes Promise, but we handle both cases for compatibility
  // use() requires a Promise or Context, so we ensure params is always a Promise
  const paramsPromise = params instanceof Promise ? params : Promise.resolve(params)
  const resolvedParams = use(paramsPromise)
  
  const { id } = resolvedParams || { id: '' }
  
  if (!id) {
    throw new Error('Report ID is required')
  }
  
  return <ValuationReport reportId={id} />
}
