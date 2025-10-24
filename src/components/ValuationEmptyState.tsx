import React from 'react';
import { TrendingUp } from 'lucide-react';

export const ValuationEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-zinc-100 flex items-center justify-center mb-3 sm:mb-4">
        <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-zinc-400" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-black bg-white">Reports will appear here</h3>
      <p className="mt-2 text-sm text-black bg-white max-w-sm">
        Start a conversation in the chat to generate insights and reports about your valuation
      </p>
    </div>
  );
};

