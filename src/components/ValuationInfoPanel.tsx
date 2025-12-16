import React, { useEffect } from 'react'
import type { ValuationResponse } from '../types/valuation'
import { HTMLProcessor } from '../utils/htmlProcessor'
import { componentLogger } from '../utils/logger'

interface ValuationInfoPanelProps {
  result?: ValuationResponse | null
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
 *
 * PERFORMANCE: Memoized to prevent unnecessary re-renders when result hasn't changed
 *
 * NOTE: This component is now prop-driven (no direct store access) for flow isolation
 */
export const ValuationInfoPanel: React.FC<ValuationInfoPanelProps> = React.memo(
  ({ result: resultProp }) => {
    // Use prop only (prop-driven component for flow isolation)
    const result = resultProp

    // Early return if no result available
    if (!result) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8">
          <div className="text-center max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Valuation Result Available</h3>
            <p className="text-sm text-gray-600 mb-4">
              Generate a valuation report first to see the detailed calculation breakdown.
            </p>
          </div>
        </div>
      )
    }

    // Log rendering mode for monitoring
    useEffect(() => {
      const hasServerHtml = !!(result.info_tab_html && result.info_tab_html.length > 0)

      if (hasServerHtml) {
        componentLogger.info('ValuationInfoPanel: Using server-generated HTML', {
          component: 'ValuationInfoPanel',
          valuationId: result.valuation_id,
          htmlLength: result.info_tab_html?.length || 0,
          renderingMode: 'server-html',
        })
      } else {
        componentLogger.error('ValuationInfoPanel: info_tab_html not available', {
          component: 'ValuationInfoPanel',
          valuationId: result.valuation_id,
          hasInfoTabHtml: !!result.info_tab_html,
          infoTabHtmlLength: result.info_tab_html?.length || 0,
          resultKeys: Object.keys(result),
          infoTabHtmlInKeys: 'info_tab_html' in result,
          resultType: typeof result,
          renderingMode: 'error',
          reason: result.info_tab_html ? 'HTML too short' : 'HTML not present',
        })
      }
    }, [result.info_tab_html, result.valuation_id])

    // Server-generated HTML (required)
    if (result.info_tab_html && result.info_tab_html.length > 0) {
      return (
        <div
          className="h-full overflow-y-auto info-tab-html px-4 sm:px-6 lg:px-8"
          dangerouslySetInnerHTML={{ __html: HTMLProcessor.sanitize(result.info_tab_html) }}
        />
      )
    }

    // Error state: info_tab_html should always be present
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Info Tab Not Available</h3>
          <p className="text-sm text-gray-600 mb-4">
            The calculation breakdown is not available. This may indicate an issue with the
            valuation response.
          </p>
          <div className="text-xs text-gray-500">
            <p>Valuation ID: {result.valuation_id || 'N/A'}</p>
            <p>Info Tab HTML: {result.info_tab_html ? 'Present but empty' : 'Not present'}</p>
          </div>
        </div>
      </div>
    )
  },
  (prevProps, nextProps) => {
    // Only re-render if result actually changed
    // Handle optional result prop
    if (!prevProps.result && !nextProps.result) return true
    if (!prevProps.result || !nextProps.result) return false
    return (
      prevProps.result.valuation_id === nextProps.result.valuation_id &&
      prevProps.result.info_tab_html === nextProps.result.info_tab_html
    )
  }
)

ValuationInfoPanel.displayName = 'ValuationInfoPanel'
