/**
 * Info Tab Skeleton
 * 
 * Loading skeleton for info tab HTML - MATCHES ACTUAL INFO TAB STRUCTURE.
 * Shows while info tab is being loaded from backend.
 * Matches: Calculation breakdown with waterfalls and detailed analysis
 * 
 * @module components/skeletons/InfoTabSkeleton
 */

import React from 'react'

export function InfoTabSkeleton() {
  return (
    <div className="h-full overflow-y-auto px-4 sm:px-6 lg:px-8 py-6 animate-pulse bg-white">
      {/* Header section */}
      <div className="space-y-3 mb-8">
        <div className="h-7 w-2/5 bg-gray-200 rounded" />
        <div className="h-4 w-3/4 bg-gray-100 rounded" />
      </div>
      
      {/* Calculation steps - match actual waterfall structure */}
      {[
        'DCF Valuation',
        'Comparable Multiples',
        'Weighted Valuation',
        'Adjustments',
        'Final Valuation Range'
      ].map((step, idx) => (
        <div key={idx} className="mb-8">
          {/* Step header */}
          <div className="flex items-center gap-4 mb-4">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
              <div className="h-5 w-5 bg-blue-200 rounded-full" />
            </div>
            <div className="h-6 w-56 bg-gray-200 rounded" />
          </div>
          
          {/* Step content */}
          <div className="ml-14 space-y-4">
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded" />
              <div className="h-4 w-5/6 bg-gray-100 rounded" />
              <div className="h-4 w-4/5 bg-gray-100 rounded" />
            </div>
            
            {/* Data table/grid */}
            <div className="border border-gray-200 rounded-lg p-4 space-y-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-3/4 bg-gray-100 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-3/4 bg-gray-100 rounded" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="h-4 w-full bg-gray-100 rounded" />
                <div className="h-4 w-3/4 bg-gray-100 rounded" />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Notes section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-100 rounded" />
          <div className="h-4 w-5/6 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  )
}

