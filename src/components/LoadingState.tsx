import React from 'react';
import { Loader2 } from 'lucide-react';

export const LoadingState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center animate-in fade-in duration-500">
      <div className="relative mb-6 group">
        {/* Outer pulsing rings */}
        <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-0 bg-purple-500/10 rounded-full animate-ping opacity-50" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
        
        {/* Inner container */}
        <div className="relative bg-white p-5 rounded-full shadow-lg border border-zinc-100 z-10 flex items-center justify-center transform transition-transform group-hover:scale-105 duration-300">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-zinc-900 bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600">
        Generating Report
      </h3>
      <p className="text-zinc-500 mt-3 text-sm max-w-xs leading-relaxed">
        Analyzing your financial data and generating valuation insights...
      </p>
    </div>
  );
};

