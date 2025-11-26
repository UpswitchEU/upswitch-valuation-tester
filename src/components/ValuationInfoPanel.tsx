import React, { useEffect } from 'react';
import type { ValuationResponse } from '../types/valuation';
import { componentLogger } from '../utils/logger';
import { HTMLProcessor } from '../utils/htmlProcessor';

interface ValuationInfoPanelProps {
  result: ValuationResponse;
}

/**
 * ValuationInfoPanel - Info Tab Content
 * 
 * This component renders the Info Tab using server-generated HTML.
 * 
 * The server-generated HTML contains all calculation breakdowns, waterfalls, and
 * analysis in a single optimized HTML string, reducing payload size by 50-70%.
 * 
 * Architecture:
 * - Server-side: Python generates complete info_tab_html with all calculation details
 * - Frontend: Renders HTML directly via dangerouslySetInnerHTML
 * - Benefits: 50-70% payload reduction, consistent rendering, single source of truth
 */
export const ValuationInfoPanel: React.FC<ValuationInfoPanelProps> = ({
  result
}) => {
  // Log rendering mode for monitoring
  useEffect(() => {
    const hasServerHtml = !!(result.info_tab_html && result.info_tab_html.length > 0);
    
    if (hasServerHtml) {
      componentLogger.info('ValuationInfoPanel: Using server-generated HTML', {
        component: 'ValuationInfoPanel',
        valuationId: result.valuation_id,
        htmlLength: result.info_tab_html?.length || 0,
        renderingMode: 'server-html'
      });
    } else {
      componentLogger.error('ValuationInfoPanel: info_tab_html not available', {
        component: 'ValuationInfoPanel',
        valuationId: result.valuation_id,
        hasInfoTabHtml: !!result.info_tab_html,
        infoTabHtmlLength: result.info_tab_html?.length || 0,
        renderingMode: 'error',
        reason: result.info_tab_html ? 'HTML too short' : 'HTML not present'
      });
    }
  }, [result.info_tab_html, result.valuation_id]);

  // Server-generated HTML (required)
  if (result.info_tab_html && result.info_tab_html.length > 0) {
    return (
      <div 
        className="h-full overflow-y-auto info-tab-html"
        dangerouslySetInnerHTML={{ __html: HTMLProcessor.sanitize(result.info_tab_html) }}
      />
    );
  }
  
  // Error state: info_tab_html should always be present
  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="text-center max-w-md">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Info Tab Not Available</h3>
        <p className="text-sm text-gray-600 mb-4">
          The calculation breakdown is not available. This may indicate an issue with the valuation response.
        </p>
        <div className="text-xs text-gray-500">
          <p>Valuation ID: {result.valuation_id || 'N/A'}</p>
          <p>Info Tab HTML: {result.info_tab_html ? 'Present but empty' : 'Not present'}</p>
        </div>
      </div>
    </div>
  );
};

