import React, { useState } from 'react';

/**
 * TransparencyDisclosure - "Details on demand" component
 * 
 * Shows summary by default, full details on click
 * Design: Accordion-style, expands to show calculation steps, benchmarks, etc.
 * 
 * Strategy: Don't overwhelm - let power users dig deeper if they want
 */

interface TransparencyDisclosureProps {
  title: string;
  summary: string | React.ReactNode;
  icon?: React.ReactNode;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  badge?: React.ReactNode;
  variant?: 'default' | 'compact';
}

export const TransparencyDisclosure: React.FC<TransparencyDisclosureProps> = ({
  title,
  summary,
  icon,
  defaultExpanded = false,
  children,
  badge,
  variant = 'default',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`
      border rounded-lg overflow-hidden
      ${isExpanded ? 'border-primary-300 bg-primary-50/30' : 'border-gray-200 bg-white'}
      transition-colors
    `}>
      {/* Header (Always Visible) */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          w-full text-left
          ${variant === 'compact' ? 'px-3 py-2' : 'px-4 py-3'}
          flex items-center justify-between
          hover:bg-gray-50/50 transition-colors
          focus:outline-none focus:ring-2 focus:ring-primary-400 focus:ring-inset
        `}
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {icon && (
            <div className="flex-shrink-0 text-primary-600">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`
                font-semibold text-slate-ink
                ${variant === 'compact' ? 'text-sm' : 'text-base'}
              `}>
                {title}
              </h4>
              {badge && (
                <div className="inline-flex">
                  {badge}
                </div>
              )}
            </div>
            {!isExpanded && typeof summary === 'string' && (
              <p className={`
                text-gray-600 truncate
                ${variant === 'compact' ? 'text-xs mt-0.5' : 'text-sm mt-1'}
              `}>
                {summary}
              </p>
            )}
            {!isExpanded && typeof summary !== 'string' && (
              <div className={variant === 'compact' ? 'text-xs mt-0.5' : 'text-sm mt-1'}>
                {summary}
              </div>
            )}
          </div>
        </div>
        
        {/* Expand/Collapse Icon */}
        <div className="flex-shrink-0 ml-2">
          <svg
            className={`
              w-5 h-5 text-gray-400 transition-transform
              ${isExpanded ? 'transform rotate-180' : ''}
            `}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className={`
          border-t border-gray-200 bg-white
          ${variant === 'compact' ? 'px-3 py-2' : 'px-4 py-3'}
        `}>
          {children}
        </div>
      )}
    </div>
  );
};

