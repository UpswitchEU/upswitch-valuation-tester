import React, { lazy, Suspense } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useValuationStore } from '../../../store/useValuationStore';
import { ValuationForm } from './ValuationForm';
import { ValuationToolbar } from './ValuationToolbar';

// Lazy load results component
const Results = lazy(() => import('./Results').then(m => ({ default: m.Results })));

// Loading component
const ComponentLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="flex items-center justify-center p-8">
    <div className="flex items-center gap-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
      <span className="text-gray-600">{message}</span>
    </div>
  </div>
);

interface ManualValuationFlowProps {
  reportId?: string;
  onComplete: (result: any) => void;
}

export const ManualValuationFlow: React.FC<ManualValuationFlowProps> = ({
  reportId,
  onComplete
}) => {
  const { result, isCalculating } = useValuationStore();
  const { user } = useAuth();

  return (
    <div className="h-full flex flex-col">
      {/* Form Section */}
      <div className="flex-1 overflow-y-auto p-4">
        <ValuationForm />
      </div>

      {/* Toolbar */}
      <ValuationToolbar
        onRefresh={() => window.location.reload()}
        onDownload={async () => {
          if (result) {
            try {
              const { DownloadService } = await import('../../../services/downloadService');
              await DownloadService.downloadPDF(result, {
                format: 'pdf',
                filename: `valuation-${Date.now()}.pdf`
              });
            } catch (error) {
              console.error('Download failed:', error);
            }
          }
        }}
        onFullScreen={() => {/* TODO: Implement full screen */}}
        isGenerating={isCalculating}
        user={user}
        valuationName="Manual Valuation"
        valuationId={result?.valuation_id}
        activeTab="preview"
        onTabChange={() => {/* Single tab for now */}}
      />

      {/* Results Display */}
      {result && (
        <div className="border-t border-gray-200">
          <Suspense fallback={<ComponentLoader message="Loading results..." />}>
            <Results />
          </Suspense>
        </div>
      )}
    </div>
  );
};