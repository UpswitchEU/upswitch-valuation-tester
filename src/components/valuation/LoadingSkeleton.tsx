import React from 'react';

interface LoadingSkeletonProps {
  name: string;
}

/**
 * LoadingSkeleton Component
 * 
 * Displays an animated loading placeholder for a report section.
 * Uses Tailwind CSS animations for smooth pulse effect.
 * 
 * @param name - Human-readable section name
 */
export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ name }) => {
  return (
    <div className="animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] rounded-lg p-6 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-blue-400 rounded-full animate-spin border-4 border-blue-200 border-t-blue-600"></div>
        <div>
          <h3 className="text-lg font-semibold text-gray-700">{name}</h3>
          <p className="text-sm text-gray-500">Calculating...</p>
        </div>
      </div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-400 rounded w-3/4"></div>
        <div className="h-4 bg-gray-400 rounded w-1/2"></div>
        <div className="h-4 bg-gray-400 rounded w-5/6"></div>
      </div>
    </div>
  );
};


