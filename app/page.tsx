import { redirect } from 'next/navigation';
import HomePage from '../src/pages/HomePage';

export default function Page() {
  return <HomePage />;
}

// This will handle the legacy redirects
export async function generateMetadata() {
  return {
    title: 'UpSwitch Valuation Tester',
    description: 'Professional business valuation platform',
  };
}