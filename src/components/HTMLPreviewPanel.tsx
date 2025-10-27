import React from 'react';
import { Loader2 } from 'lucide-react';

interface HTMLPreviewPanelProps {
  htmlContent: string;
  isGenerating: boolean;
  progress?: number;
}

export const HTMLPreviewPanel: React.FC<HTMLPreviewPanelProps> = ({
  htmlContent,
  isGenerating,
  progress = 0
}) => {
  return (
    <div className="h-full overflow-y-auto bg-white">
      {isGenerating && (
        <div className="sticky top-0 bg-blue-50 border-b border-blue-200 p-3">
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700">
              Generating valuation... {progress}%
            </span>
          </div>
        </div>
      )}
      <div 
        className="prose prose-sm max-w-none p-6"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
};
