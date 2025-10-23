import React, { useState, useEffect } from 'react';
import { Bot } from 'lucide-react';
import { HTMLProcessor } from '../utils/htmlProcessor';
import { BrandedLoading } from './BrandedLoading';


interface LiveValuationReportProps {
  htmlContent: string;
  isGenerating: boolean;
  progress?: number;
}

interface ReportSection {
  id: string;
  title: string;
  level: number;
}

export const LiveValuationReport: React.FC<LiveValuationReportProps> = ({
  htmlContent,
  isGenerating,
  progress = 0,
}) => {
  const [sections, setSections] = useState<ReportSection[]>([]);
  const [processedHtml, setProcessedHtml] = useState<string>('');

  useEffect(() => {
    if (!htmlContent) {
      setSections([]);
      setProcessedHtml('');
      return;
    }

    // Process and sanitize HTML content
    const processed = HTMLProcessor.process(htmlContent);
    setProcessedHtml(processed);

    // Extract sections from processed HTML
    const extractedSections = HTMLProcessor.extractSections(htmlContent);
    setSections(extractedSections);
  }, [htmlContent]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Screen reader announcements */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {isGenerating ? "Generating valuation report..." : "Report updated"}
      </div>
      
      {/* Progress bar */}
      {isGenerating && (
        <div className="h-1 bg-zinc-200">
          <div 
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
      
      {/* Table of Contents */}
      {sections.length > 0 && (
        <div className="sticky top-0 bg-white border-b border-zinc-200 p-4">
          <h3 className="text-sm font-semibold text-zinc-700 mb-2">Report Sections</h3>
          <nav className="space-y-1">
            {sections.map(section => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className={`block text-xs hover:text-primary-600 ${
                  section.level === 3 ? 'pl-4' : ''
                }`}
              >
                {section.title}
              </a>
            ))}
          </nav>
        </div>
      )}
      
      {/* Report content */}
      <div className="flex-1 overflow-y-auto p-6">
        {processedHtml ? (
          <div 
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-6">
            <div className="w-full max-w-md">
              {isGenerating ? (
                <div className="text-center mb-8">
                  <BrandedLoading 
                    size="lg" 
                    color="gray" 
                    showText={true}
                    text="Generating insights..."
                    className="animate-pulse"
                  />
                </div>
              ) : (
                <div className="text-center mb-8">
                  <Bot className="w-12 h-12 mx-auto mb-4 text-zinc-400 opacity-50" />
                  <h3 className="text-lg font-semibold text-zinc-700 mb-2">
                    Building Your Valuation Report
                  </h3>
                  <p className="text-sm text-zinc-500">
                    Your report will appear here as we gather information
                  </p>
                </div>
              )}
              
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
