/**
 * Calculation Journey Overview Component
 * 
 * NOTE: Detailed calculation journey is now available in the Info Tab HTML (info_tab_html).
 * This component provides a simple message directing users to the Info Tab for full details.
 * 
 * Phase 2: Main Report Enhancement (Simplified)
 */

import React from 'react';
import { ExternalLink, Info } from 'lucide-react';
import type { ValuationResponse } from '../../types/valuation';

interface CalculationJourneyOverviewProps {
  result: ValuationResponse;
  onStepClick?: (stepNumber: number) => void; // Callback to navigate to info tab
  className?: string;
}

export const CalculationJourneyOverview: React.FC<CalculationJourneyOverviewProps> = ({
  result,
  onStepClick,
  className = ''
}) => {
  const hasInfoTabHtml = !!(result.info_tab_html && result.info_tab_html.length > 0);

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">12-Step Calculation Journey</h3>
            <p className="text-sm text-gray-600 mb-3">
              Detailed calculation breakdown with all inputs, formulas, outputs, and decisions is available in the Info Tab.
              {hasInfoTabHtml 
                ? ' Click below to view the complete calculation journey.'
                : ' Please ensure info_tab_html is generated in the backend.'}
            </p>
            {onStepClick && hasInfoTabHtml && (
              <button
                onClick={() => onStepClick(0)}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                View Calculation Journey in Info Tab
              </button>
            )}
            {!hasInfoTabHtml && (
              <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  Calculation details not available. Please ensure the backend generates info_tab_html.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
