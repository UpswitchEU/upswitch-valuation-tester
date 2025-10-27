import React from 'react';

interface ProgressBarProps {
  progress: number;
  showPercentage?: boolean;
}

/**
 * ProgressBar Component
 * 
 * Sticky progress indicator showing overall report generation progress.
 * Features smooth transitions and gradient styling.
 * 
 * @param progress - Progress percentage (0-100)
 * @param showPercentage - Whether to display percentage text (default: true)
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  showPercentage = true 
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.min(100, Math.max(0, progress));
  
  return (
    <div className="sticky top-0 bg-white border-b shadow-sm z-10">
      <div className="flex items-center gap-3 p-4">
        <div className="flex-1">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${clampedProgress}%` }}
            />
          </div>
        </div>
        {showPercentage && (
          <span className="text-sm font-medium text-gray-700 min-w-[3rem] text-right">
            {Math.round(clampedProgress)}%
          </span>
        )}
      </div>
    </div>
  );
};


