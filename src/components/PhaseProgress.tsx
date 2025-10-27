/**
 * PhaseProgress Component
 * 
 * Visual progress indicator for multi-phase question flows.
 * Shows current phase and completion status.
 * 
 * @author UpSwitch CTO Team
 * @version 2.0.0
 */

import React from 'react';

// ============================================================================
// TYPES
// ============================================================================

export interface Phase {
  id: string;
  label: string;
  icon?: string;
}

interface PhaseProgressProps {
  phases: Phase[] | string[];
  currentPhase: string;
  completedPhases?: string[];
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const PhaseProgress: React.FC<PhaseProgressProps> = ({
  phases,
  currentPhase,
  completedPhases = [],
  className = '',
}) => {
  // Convert string array to Phase objects
  const normalizedPhases: Phase[] = phases.map((phase) =>
    typeof phase === 'string'
      ? {
          id: phase,
          label: phase.charAt(0).toUpperCase() + phase.slice(1),
        }
      : phase
  );

  const currentIndex = normalizedPhases.findIndex((p) => p.id === currentPhase);

  return (
    <div className={`phase-progress ${className}`}>
      <div className="flex items-center justify-between w-full">
        {normalizedPhases.map((phase, index) => {
          const isCompleted = completedPhases.includes(phase.id);
          const isCurrent = phase.id === currentPhase;
          const isPast = index < currentIndex;

          return (
            <React.Fragment key={phase.id}>
              {/* Phase Step */}
              <div className="flex flex-col items-center">
                {/* Circle */}
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${
                      isCompleted || isPast
                        ? 'bg-green-600 text-white'
                        : isCurrent
                        ? 'bg-indigo-600 text-white ring-4 ring-indigo-200'
                        : 'bg-gray-200 text-gray-500'
                    }
                  `}
                >
                  {isCompleted || isPast ? (
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>

                {/* Label */}
                <div
                  className={`
                    mt-2 text-xs font-medium text-center
                    ${
                      isCompleted || isPast
                        ? 'text-green-600'
                        : isCurrent
                        ? 'text-indigo-600'
                        : 'text-gray-500'
                    }
                  `}
                >
                  {phase.icon && <span className="mr-1">{phase.icon}</span>}
                  {phase.label}
                </div>
              </div>

              {/* Connector Line */}
              {index < normalizedPhases.length - 1 && (
                <div
                  className={`
                    flex-1 h-1 mx-2 transition-all duration-300
                    ${
                      isPast || isCompleted
                        ? 'bg-green-600'
                        : 'bg-gray-200'
                    }
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
          style={{
            width: `${((currentIndex + 1) / normalizedPhases.length) * 100}%`,
          }}
        />
      </div>
    </div>
  );
};

export default PhaseProgress;

