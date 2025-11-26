import { Edit3, MessageSquare, Loader2, CheckCircle2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useValuationSessionStore } from '../store/useValuationSessionStore';

interface ValuationViewToggleProps {
  className?: string;
}

/**
 * ValuationViewToggle Component
 * 
 * Toggle between Manual Input and AI-Guided Conversation views.
 * Always visible in the left panel for maximum flexibility.
 */
export const ValuationViewToggle: React.FC<ValuationViewToggleProps> = ({ className = '' }) => {
  const { session, switchView, isSyncing, getCompleteness } = useValuationSessionStore();
  const [showSaved, setShowSaved] = useState(false);

  // Show "Saved" indicator briefly after sync completes
  useEffect(() => {
    if (!isSyncing && showSaved === false) {
      // Don't show on initial load
      return;
    }
    
    if (isSyncing) {
      setShowSaved(false);
    } else {
      setShowSaved(true);
      const timer = setTimeout(() => setShowSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isSyncing]);

  if (!session) {
    return null; // Don't render if no session
  }

  const handleToggle = async () => {
    const newView = session.currentView === 'manual' ? 'ai-guided' : 'manual';
    await switchView(newView);
  };

  const isManual = session.currentView === 'manual';
  const completeness = getCompleteness();
  
  // Calculate field count from completeness percentage (approximate)
  const totalFields = 10; // Based on getCompleteness calculation
  const completedFields = Math.round((completeness / 100) * totalFields);

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {/* Header with Status */}
      <div className="flex items-center justify-between h-5">
        <div className="text-xs font-medium text-zinc-400 uppercase tracking-wide">
          Input Method
        </div>
        
        {/* Status Indicator (Fixed width container to prevent layout shift) */}
        <div className="flex items-center justify-end min-w-[80px]">
          {isSyncing ? (
            <div className="flex items-center gap-1.5 text-xs text-blue-400 animate-pulse">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Syncing...</span>
            </div>
          ) : showSaved ? (
            <div className="flex items-center gap-1.5 text-xs text-green-400 animate-in fade-in duration-300">
              <CheckCircle2 className="w-3 h-3" />
              <span>Saved</span>
            </div>
          ) : completeness > 0 && (
            <div className="text-xs text-zinc-500 animate-in fade-in">
              {completedFields}/{totalFields} fields
            </div>
          )}
        </div>
      </div>
      
      {/* Toggle Buttons */}
      <div className="flex gap-2 p-1 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
        <button
          onClick={handleToggle}
          disabled={isSyncing}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20
            ${isManual
              ? 'bg-zinc-700 text-white shadow-sm ring-1 ring-zinc-600'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }
            ${isSyncing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title="Switch to Manual Input"
        >
          <Edit3 className={`w-4 h-4 ${isManual ? 'text-blue-400' : ''}`} />
          <span>Manual</span>
        </button>
        
        <button
          onClick={handleToggle}
          disabled={isSyncing}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20
            ${!isManual
              ? 'bg-zinc-700 text-white shadow-sm ring-1 ring-zinc-600'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }
            ${isSyncing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          title="Switch to AI-Guided Conversation"
        >
          <MessageSquare className={`w-4 h-4 ${!isManual ? 'text-blue-400' : ''}`} />
          <span>AI-Guided</span>
        </button>
      </div>
      
      {/* Data Completeness Progress Bar (Integrated) */}
      {completeness > 0 && (
        <div className="relative h-1 w-full bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-500 ease-out rounded-full"
            style={{ width: `${completeness}%` }}
          />
        </div>
      )}
      
      {session.dataSource === 'mixed' && (
        <div className="flex items-center gap-1.5 px-2 py-1 bg-purple-500/10 rounded text-[10px] text-purple-300 self-start">
          <span className="w-1 h-1 rounded-full bg-purple-400"></span>
          Mixed data sources
        </div>
      )}
    </div>
  );
};

