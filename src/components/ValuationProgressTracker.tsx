import React from 'react';
import { CheckCircle, Circle, Loader2 } from 'lucide-react';

interface ProgressItem {
  id: string;
  label: string;
  status: 'completed' | 'in_progress' | 'pending';
}

interface ValuationProgressTrackerProps {
  items: ProgressItem[];
  compact?: boolean;
}

export const ValuationProgressTracker: React.FC<ValuationProgressTrackerProps> = ({ 
  items, 
  compact = false 
}) => {
  const completedCount = items.filter(i => i.status === 'completed').length;
  const progressPercent = (completedCount / items.length) * 100;

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="font-medium">{completedCount}/{items.length}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs mb-3">
        <span className="font-medium text-zinc-300">Information Collected</span>
        <span className="text-zinc-400">{completedCount} of {items.length}</span>
      </div>
      
      <div className="space-y-1.5">
        {items.map(item => (
          <div key={item.id} className="flex items-center gap-2">
            {item.status === 'completed' ? (
              <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
            ) : item.status === 'in_progress' ? (
              <Loader2 className="w-4 h-4 text-primary-400 flex-shrink-0 animate-spin" />
            ) : (
              <Circle className="w-4 h-4 text-zinc-600 flex-shrink-0" />
            )}
            <span className={`text-xs ${
              item.status === 'completed' ? 'text-zinc-300' :
              item.status === 'in_progress' ? 'text-primary-400' :
              'text-zinc-500'
            }`}>
              {item.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
