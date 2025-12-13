/**
 * ConversationalLayout Component
 *
 * Main layout component for conversational valuation flow.
 * Single Responsibility: Layout orchestration and UI state management.
 *
 * @module features/conversational-valuation/components/ConversationalLayout
 */

import React, { useCallback, useEffect, useState } from 'react';
import { FullScreenModal } from '../../../components/FullScreenModal';
import { ResizableDivider } from '../../../components/ResizableDivider';
import { ValuationToolbar } from '../../../components/ValuationToolbar';
import { MOBILE_BREAKPOINT, PANEL_CONSTRAINTS } from '../../../constants/panelConstants';
import { useAuth } from '../../../hooks/useAuth';
import { guestCreditService } from '../../../services/guestCreditService';
import UrlGeneratorService from '../../../services/urlGenerator';
import { useValuationStore } from '../../../store/useValuationStore';
import { generateReportId } from '../../../utils/reportIdGenerator';
import { CreditGuard } from '../../auth/components/CreditGuard';
import { BusinessProfileSection } from './BusinessProfileSection';
import { ConversationPanel } from './ConversationPanel';
import { ReportPanel } from './ReportPanel';
import { useConversationActions, useConversationState } from '../context/ConversationContext';
import { chatLogger } from '../../../utils/logger';

interface ConversationalLayoutProps {
  reportId: string;
  onComplete: (result: any) => void;
  initialQuery?: string | null;
  autoSend?: boolean;
}

/**
 * Conversational Layout Component
 *
 * Orchestrates the main layout for conversational valuation.
 * Handles UI state, panels, and toolbar interactions.
 */
export const ConversationalLayout: React.FC<ConversationalLayoutProps> = React.memo(({
  reportId,
  onComplete,
  initialQuery = null,
  autoSend = false,
}) => {
  const { user } = useAuth();
  const { state } = useConversationState();
  const actions = useConversationActions();
  const { setResult } = useValuationStore();

  // UI State
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileActivePanel, setMobileActivePanel] = useState<'chat' | 'preview'>('chat');
  const [showPreConversationSummary, setShowPreConversationSummary] = useState(false);

  // Panel resize state
  const [leftPanelWidth, setLeftPanelWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('upswitch-panel-width');
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= PANEL_CONSTRAINTS.MIN_WIDTH && parsed <= PANEL_CONSTRAINTS.MAX_WIDTH) {
          return parsed;
        }
      }
    } catch (error) {
      console.warn('Failed to load saved panel width:', error);
    }
    return PANEL_CONSTRAINTS.DEFAULT_WIDTH;
  });

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Save panel width
  useEffect(() => {
    try {
      localStorage.setItem('upswitch-panel-width', leftPanelWidth.toString());
    } catch (error) {
      console.warn('Failed to save panel width:', error);
    }
  }, [leftPanelWidth]);

  // Sync valuation result to global store
  useEffect(() => {
    if (state.valuationResult) {
      setResult(state.valuationResult);
    }
  }, [state.valuationResult, setResult]);

  // Handle panel resize
  const handleResize = useCallback((newWidth: number) => {
    const constrainedWidth = Math.max(PANEL_CONSTRAINTS.MIN_WIDTH, Math.min(PANEL_CONSTRAINTS.MAX_WIDTH, newWidth));
    if (Math.abs(constrainedWidth - PANEL_CONSTRAINTS.DEFAULT_WIDTH) < 2) {
      setLeftPanelWidth(PANEL_CONSTRAINTS.DEFAULT_WIDTH);
    } else {
      setLeftPanelWidth(constrainedWidth);
    }
  }, []);

  // Toolbar handlers
  const handleRefresh = useCallback(() => {
    const newReportId = generateReportId();
    window.location.href = UrlGeneratorService.reportById(newReportId);
  }, []);

  const handleDownload = useCallback(async () => {
    if (state.valuationResult && state.finalReportHtml) {
      try {
        const { DownloadService } = await import('../../../services/downloadService');
        const valuationData = {
          companyName: state.businessProfile?.company_name || 'Company',
          valuationAmount: state.valuationResult.equity_value_mid,
          valuationDate: new Date(),
          method: state.valuationResult.methodology || 'DCF Analysis',
          confidenceScore: state.valuationResult.confidence_score,
          inputs: {
            revenue: state.businessProfile?.revenue,
            ebitda: state.businessProfile?.ebitda,
            industry: state.businessProfile?.industry,
            employees: state.businessProfile?.employees
          },
          assumptions: {
            growth_rate: '5%',
            discount_rate: '10%',
            terminal_growth: '2%'
          },
          htmlContent: state.finalReportHtml || state.valuationResult?.html_report || ''
        };
        await DownloadService.downloadPDF(valuationData, {
          format: 'pdf',
          filename: DownloadService.getDefaultFilename(state.businessProfile?.company_name, 'pdf')
        });
      } catch (error) {
        console.error('Download failed:', error);
      }
    }
  }, [state.valuationResult, state.finalReportHtml, state.businessProfile]);

  // Handle Python session ID updates from conversation
  const handlePythonSessionIdReceived = useCallback((sessionId: string) => {
    chatLogger.info('Python session ID received, updating conversation state', {
      sessionId,
      reportId
    });
    actions.setPythonSessionId(sessionId);
  }, [actions, reportId]);

  // Handle valuation completion
  const handleValuationComplete = useCallback(async (result: any) => {
    actions.setValuationResult(result);
    onComplete(result);

    // Update frontend credit count for guests
    if (!user && (result as any).creditsRemaining !== undefined) {
      guestCreditService.setCredits((result as any).creditsRemaining);
    }
  }, [actions, onComplete, user]);

  return (
    <CreditGuard
      hasCredits={state.hasCredits}
      isBlocked={state.isBlocked}
      showOutOfCreditsModal={state.showOutOfCreditsModal}
      onCloseModal={() => actions.setShowOutOfCreditsModal(false)}
      onSignUp={() => {
        actions.setShowOutOfCreditsModal(false);
        console.log('Sign up clicked');
      }}
      onTryManual={() => {
        actions.setShowOutOfCreditsModal(false);
        console.log('Try manual flow clicked');
      }}
    >
      <div className="flex flex-col h-full overflow-hidden">
        {/* Toolbar */}
        <ValuationToolbar
          onRefresh={handleRefresh}
          onDownload={handleDownload}
          onFullScreen={() => setIsFullScreen(true)}
          isGenerating={state.isGenerating}
          user={user}
          valuationName="Valuation"
          valuationId={state.valuationResult?.valuation_id}
          activeTab="preview" // This will be managed by ReportPanel
          onTabChange={() => {}} // Tab changes handled by ReportPanel
          companyName={state.businessProfile?.company_name}
          valuationMethod={state.valuationResult?.methodology}
        />

        {/* Error Display */}
        {state.error && (
          <div className="mx-4 mb-4">
            <div className="bg-rust-500/20 border border-rust-600/30 rounded-lg p-4">
              <div className="flex items-center gap-2 text-rust-300">
                <span className="text-rust-400">⚠️</span>
                <span className="font-medium">Error</span>
              </div>
              <p className="text-rust-200 text-sm mt-1">{state.error}</p>
            </div>
          </div>
        )}

        {/* Business Profile Section */}
        <BusinessProfileSection
          showPreConversationSummary={showPreConversationSummary}
          onTogglePreConversationSummary={() => setShowPreConversationSummary(false)}
        />

        {/* Split Panel */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden mx-4 my-4 rounded-lg border border-zinc-800" style={{transition: 'width 150ms ease-out'}}>
          {/* Left Panel: Chat */}
          <div
            className={`${
              isMobile ? (mobileActivePanel === 'chat' ? 'w-full' : 'hidden') : ''
            } h-full flex flex-col bg-zinc-900 border-r border-zinc-800 w-full lg:w-auto`}
            style={{
              width: isMobile ? '100%' : `${leftPanelWidth}%`
            }}
          >
            <div className="flex-1 overflow-y-auto">
              <ConversationPanel
                sessionId={state.sessionId}
                userId={user?.id}
                restoredMessages={state.messages.filter(m => m.isComplete)}
                isRestoring={state.isRestoring}
                isRestorationComplete={state.restorationComplete}
                isSessionInitialized={state.isSessionInitialized}
                pythonSessionId={state.pythonSessionId}
                onPythonSessionIdReceived={handlePythonSessionIdReceived}
                onValuationComplete={handleValuationComplete}
                onValuationStart={() => actions.setGenerating(true)}
                onDataCollected={(data) => {
                  // Handle data collection - sync to session
                  if (data.field && data.value !== undefined) {
                    // This would sync to session store
                    console.log('Data collected:', data);
                  }
                }}
                initialMessage={initialQuery}
                autoSend={autoSend}
              />
            </div>
          </div>

          {/* Resizable Divider */}
          <ResizableDivider
            onResize={handleResize}
            leftWidth={leftPanelWidth}
            isMobile={isMobile}
          />

          {/* Right Panel: Report Display */}
          <div
            className={`${
              isMobile ? (mobileActivePanel === 'preview' ? 'w-full' : 'hidden') : ''
            } h-full min-h-[400px] lg:min-h-0 w-full lg:w-auto border-t lg:border-t-0 border-zinc-800`}
            style={{ width: isMobile ? '100%' : `${100 - leftPanelWidth}%` }}
          >
            <ReportPanel />
          </div>
        </div>

        {/* Mobile Panel Switcher */}
        {isMobile && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 bg-zinc-800 p-1 rounded-full shadow-lg">
            <button
              onClick={() => setMobileActivePanel('chat')}
              className={`px-4 py-2 rounded-full transition-colors ${
                mobileActivePanel === 'chat' ? 'bg-accent-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setMobileActivePanel('preview')}
              className={`px-4 py-2 rounded-full transition-colors ${
                mobileActivePanel === 'preview' ? 'bg-accent-600 text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Preview
            </button>
          </div>
        )}

        {/* Full Screen Modal */}
        <FullScreenModal
          isOpen={isFullScreen}
          onClose={() => setIsFullScreen(false)}
          title="Valuation - Full Screen"
        >
          <ReportPanel className="h-full" />
        </FullScreenModal>
      </div>
    </CreditGuard>
  );
});

ConversationalLayout.displayName = 'ConversationalLayout';
