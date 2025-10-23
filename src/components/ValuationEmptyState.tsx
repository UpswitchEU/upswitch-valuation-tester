import React from 'react';
import { FileText } from 'lucide-react';

export const ValuationEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
      <div className="p-4 rounded-full bg-white border border-gray-200 shadow-sm">
        <FileText className="w-8 h-8 text-zinc-400" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-black bg-white">
        Reports will appear here
      </h3>
      <p className="mt-2 text-sm text-black bg-white max-w-sm font-normal">
        Start a conversation in the chat to generate insights and reports about your data
      </p>
    </div>
  );
};

