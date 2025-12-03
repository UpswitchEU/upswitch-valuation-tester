import React from 'react';
import { Code, Copy } from 'lucide-react';
import type { ValuationResponse } from '../types/valuation';

interface HTMLViewProps {
  result: ValuationResponse | null;
}

export const HTMLView: React.FC<HTMLViewProps> = ({ result }) => {
  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Code className="w-16 h-16 text-zinc-400 mb-4" />
        <p className="text-zinc-500">No valuation data available</p>
      </div>
    );
  }

  // BANK-GRADE: Use server-generated html_report as single source of truth
  // No fallback HTML generation - if html_report is missing, show error
  const htmlContent = result.html_report || null;

  const handleCopyHTML = async () => {
    if (!htmlContent) {
      console.error('Cannot copy: HTML report not available');
      return;
    }
    try {
      await navigator.clipboard.writeText(htmlContent);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy HTML:', err);
    }
  };

  // BANK-GRADE: Fail fast if html_report is missing - no fallback HTML generation
  if (!htmlContent || htmlContent.trim().length === 0) {
    return (
      <div className="h-full flex flex-col bg-zinc-900">
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="text-white font-medium">HTML Report</h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <Code className="w-16 h-16 text-red-400 mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">HTML Report Not Available</h3>
          <p className="text-sm text-zinc-400 mb-4 text-center max-w-md">
            The server-generated HTML report is not available. This indicates an issue with the valuation response.
            Fallback HTML generation has been removed per bank-grade standards.
          </p>
          <div className="text-xs text-zinc-500 text-center">
            <p>Valuation ID: {result.valuation_id || 'N/A'}</p>
            <p>HTML Report: {result.html_report ? 'Present but empty' : 'Not present'}</p>
            <p>HTML Length: {result.html_report?.length || 0} characters</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-zinc-900">
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-white font-medium">HTML Report</h3>
        <button
          onClick={handleCopyHTML}
          className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 flex items-center gap-2 transition-colors"
        >
          <Copy className="w-4 h-4" />
          Copy HTML
        </button>
      </div>
      <div className="flex-1 overflow-auto p-4">
        <pre className="text-xs text-zinc-300 whitespace-pre-wrap font-mono">
          {htmlContent}
        </pre>
      </div>
    </div>
  );
};

// BANK-GRADE REFACTORING: Removed generateHTMLReport() fallback HTML generation function
// 
// Rationale (Bank-Grade Excellence Audit):
// 1. Single Responsibility: Frontend should only render server-generated HTML, not generate fallback HTML
// 2. No Duplication: Server-generated html_report is the single source of truth
// 3. Fail Fast: Better to show error than silently generate inferior fallback HTML
// 4. Transparency: If HTML generation fails, we should know about it, not hide it
// 5. Consistency: Aligned with backend removal of fallback HTML generation
//
// The HTMLView component now:
// - Uses result.html_report directly (server-generated HTML)
// - Shows error state if html_report is missing
// - Does NOT generate fallback HTML that duplicates main report functionality
//
// The server-generated HTML in html_report_service.py is responsible for HTML generation.
// If it fails, that's a system error that should be fixed, not masked with fallbacks.
