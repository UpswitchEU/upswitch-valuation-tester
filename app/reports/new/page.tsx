import { redirect } from 'next/navigation';
import { generateReportId } from '../../../src/utils/reportIdGenerator';

export default function NewReportPage() {
  // Generate new report ID and redirect
  const newReportId = generateReportId();
  redirect(`/reports/${newReportId}`);
}