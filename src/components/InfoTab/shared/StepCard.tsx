import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface StepCardProps {
  stepNumber: number;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  color: 'blue' | 'purple' | 'orange' | 'teal' | 'indigo' | 'green';
  children: React.ReactNode;
  defaultExpanded?: boolean;
  id?: string;
}

const colorClasses = {
  blue: {
    border: 'border-blue-500',
    bg: 'bg-blue-50',
    badge: 'bg-blue-500',
    text: 'text-blue-900',
    icon: 'text-blue-600'
  },
  purple: {
    border: 'border-purple-500',
    bg: 'bg-purple-50',
    badge: 'bg-purple-500',
    text: 'text-purple-900',
    icon: 'text-purple-600'
  },
  orange: {
    border: 'border-orange-500',
    bg: 'bg-orange-50',
    badge: 'bg-orange-500',
    text: 'text-orange-900',
    icon: 'text-orange-600'
  },
  teal: {
    border: 'border-teal-500',
    bg: 'bg-teal-50',
    badge: 'bg-teal-500',
    text: 'text-teal-900',
    icon: 'text-teal-600'
  },
  indigo: {
    border: 'border-indigo-500',
    bg: 'bg-indigo-50',
    badge: 'bg-indigo-500',
    text: 'text-indigo-900',
    icon: 'text-indigo-600'
  },
  green: {
    border: 'border-green-500',
    bg: 'bg-green-50',
    badge: 'bg-green-500',
    text: 'text-green-900',
    icon: 'text-green-600'
  }
};

export const StepCard: React.FC<StepCardProps> = ({
  stepNumber,
  title,
  subtitle,
  icon,
  color,
  children,
  defaultExpanded = true,
  id
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const colors = colorClasses[color];

  return (
    <div id={id} className="scroll-mt-24">
      <div className={`bg-white rounded-lg border-2 ${colors.border} shadow-md overflow-hidden transition-all duration-200`}>
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`w-full ${colors.bg} p-4 sm:p-6 text-left transition-colors hover:opacity-90`}
          aria-expanded={isExpanded}
        >
          <div className="flex items-start gap-4">
            {/* Step Badge */}
            <div className={`${colors.badge} text-white w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-lg sm:text-xl flex-shrink-0 shadow-md`}>
              {stepNumber}
            </div>
            
            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <div className={colors.icon}>{icon}</div>
                <h3 className={`text-lg sm:text-xl font-bold ${colors.text}`}>{title}</h3>
              </div>
              <p className="text-sm text-gray-600">{subtitle}</p>
            </div>

            {/* Expand/Collapse Icon */}
            <div className="flex-shrink-0 ml-2">
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </div>
          </div>
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="p-4 sm:p-6 bg-white border-t-2 border-gray-100">
            {children}
          </div>
        )}
      </div>

      {/* Arrow to next step */}
      <div className="flex justify-center my-4">
        <div className="text-gray-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </div>
  );
};

