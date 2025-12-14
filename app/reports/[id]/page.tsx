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
  // React error #438 occurs when use() receives undefined/null or non-Promise
  if (!params) {
    throw new Error('Params are required')
  }
  
  const resolvedParams = params instanceof Promise ? use(params) : params
  const { id } = resolvedParams || { id: '' }
  
  if (!id) {
    throw new Error('Report ID is required')
  }
  
  return <ValuationReport reportId={id} />
}
