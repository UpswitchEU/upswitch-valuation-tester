import React from 'react';
import { FileText, CheckCircle } from 'lucide-react';

export const ValuationEmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-white">
      <div className="p-4 rounded-full bg-white border border-gray-200 shadow-sm">
        <FileText className="w-8 h-8 text-zinc-400" />
      </div>
      <h3 className="mt-4 text-lg font-medium text-black bg-white">
        Start Your First Valuation
      </h3>
      <p className="mt-2 text-sm text-black bg-white max-w-sm font-light mb-6">
        With unlimited access, you can:
      </p>
      
      <div className="space-y-2 text-sm text-gray-600 max-w-sm">
        <div className="flex items-center gap-2">
          <CheckCircle className="text-green-500" size={16} />
          <span>Generate unlimited valuation reports</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="text-green-500" size={16} />
          <span>Try different scenarios</span>
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle className="text-green-500" size={16} />
          <span>Refine your business model</span>
        </div>
      </div>
    </div>
  );
};

