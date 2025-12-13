'use client'

import { use } from 'react'
import { ValuationReport } from '../../../src/components/ValuationReport'

interface ValuationReportPageProps {
  params: Promise<{
    id: string
  }>
}

export default function ValuationReportPage({ params }: ValuationReportPageProps) {
  const { id } = use(params)
  return <ValuationReport reportId={id} />
}
