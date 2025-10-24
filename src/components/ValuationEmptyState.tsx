import React from 'react';
import { TrendingUp } from 'lucide-react';

export const ValuationEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-4">
        <TrendingUp className="w-8 h-8 text-zinc-400" />
      </div>
      <h3 className="text-lg font-semibold text-zinc-900 mb-2">Valuation Preview</h3>
      <p className="text-sm text-zinc-500 max-w-xs">
        Your valuation report will appear here once you start the conversation.
      </p>
    </div>
  );
};

