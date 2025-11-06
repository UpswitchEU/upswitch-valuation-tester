import React from 'react';

interface JourneyStep {
  id: string;
  number: number;
  title: string;
  completed: boolean;
}

interface JourneyNavigationProps {
  steps: JourneyStep[];
  activeStep: string;
  onStepClick: (stepId: string) => void;
}

const stepColors = [
  { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-500' },    // Steps 1-2
  { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-500' }, // Step 3
  { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-500' }, // Steps 4-6
  { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-500' },    // Step 7
  { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-500' }, // Steps 8-9
  { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-500' }  // Step 10
];

const getStepColor = (stepNumber: number) => {
  if (stepNumber <= 2) return stepColors[0];
  if (stepNumber === 3) return stepColors[1];
  if (stepNumber >= 4 && stepNumber <= 6) return stepColors[2];
  if (stepNumber === 7) return stepColors[3];
  if (stepNumber >= 8 && stepNumber <= 9) return stepColors[4];
  return stepColors[5];
};

export const JourneyNavigation: React.FC<JourneyNavigationProps> = ({ steps, activeStep, onStepClick }) => {
  return (
    <>
      {/* Mobile/Tablet: Horizontal Sticky Navigation */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="px-4 py-3">
          <h3 className="text-xs font-semibold text-gray-900 uppercase tracking-wide mb-2">
            Calculation Journey
          </h3>
          <div className="overflow-x-auto -mx-4 px-4">
            <nav className="flex space-x-2 pb-2 min-w-max">
              {steps.map((step) => {
                const isActive = step.id === activeStep;
                const colors = getStepColor(step.number);
                
                return (
                  <button
                    key={step.id}
                    onClick={() => onStepClick(step.id)}
                    className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs transition-all whitespace-nowrap ${
                      isActive 
                        ? `${colors.bg} ${colors.text} font-semibold border-b-2 ${colors.border}`
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        isActive ? `${colors.bg} ${colors.text} ring-2 ring-offset-1 ${colors.border.replace('border', 'ring')}` : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step.number}
                      </span>
                      <span className="hidden sm:inline">{step.title}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop: Vertical Sidebar - Fixed position within container */}
      {/* Position accounts for: main navbar (64px/4rem) + minimal journey header (~74px) = ~138px total */}
      <div className="hidden lg:block fixed top-36 w-64 bg-white border border-gray-200 rounded-lg shadow-sm p-4 max-h-[calc(100vh-9rem)] overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-4">
          Calculation Journey
        </h3>
        
        <nav className="space-y-1">
          {steps.map((step) => {
            const isActive = step.id === activeStep;
            const colors = getStepColor(step.number);
            
            return (
              <button
                key={step.id}
                onClick={() => onStepClick(step.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                  isActive 
                    ? `${colors.bg} ${colors.text} font-semibold border-l-4 ${colors.border}`
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isActive ? `${colors.bg} ${colors.text}` : 'bg-gray-200 text-gray-600'
                  }`}>
                    {step.number}
                  </span>
                  <span className="truncate">{step.title}</span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>
    </>
  );
};

