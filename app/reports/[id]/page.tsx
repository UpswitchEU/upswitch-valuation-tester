'use client';

import { ValuationReport } from '../../../src/components/ValuationReport';

interface ValuationReportPageProps {
  params: {
    id: string;
  };
}

export default function ValuationReportPage({ params }: ValuationReportPageProps) {
  return <ValuationReport reportId={params.id} />;
}

export async function generateMetadata({ params }: ValuationReportPageProps) {
  return {
    title: `Valuation Report ${params.id}`,
    description: 'Professional business valuation analysis and report',
  };
}