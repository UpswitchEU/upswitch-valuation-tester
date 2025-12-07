import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { GENERATION_STEPS, type LoadingStep } from './LoadingState.constants';

interface LoadingStateProps {
  steps?: LoadingStep[];
  variant?: 'light' | 'dark';
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  steps = GENERATION_STEPS, 
  variant = 'light' 
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Cycle through steps every 2.5 seconds
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % steps.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [steps.length]);

  const currentStep = steps[currentStepIndex];
  const isDark = variant === 'dark';

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
      <div className="relative mb-6 group">
        {/* Outer pulsing rings */}
        <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${isDark ? 'bg-primary-400/30' : 'bg-primary-500/20'}`} style={{ animationDuration: '2s' }} />
        <div className={`absolute inset-0 rounded-full animate-ping opacity-50 ${isDark ? 'bg-primary-300/20' : 'bg-primary-400/10'}`} style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
        
        {/* Inner container */}
        <div className={`relative p-5 rounded-full shadow-lg border z-10 flex items-center justify-center transform transition-transform group-hover:scale-105 duration-300 ${
          isDark 
            ? 'bg-zinc-900 border-zinc-800' 
            : 'bg-white border-zinc-100'
        }`}>
          <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-primary-400' : 'text-primary-600'}`} />
        </div>
      </div>
      
      {/* Dynamic step indicator */}
      <div className="mb-2">
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${
          isDark 
            ? 'text-primary-300 bg-primary-900/30' 
            : 'text-primary-600 bg-primary-50'
        }`}>
          Step {currentStepIndex + 1} of {steps.length}
        </span>
      </div>

      {/* Animated text transition */}
      <div className="min-h-[80px] flex flex-col justify-center">
        <h3 
          key={currentStepIndex}
          className={`text-xl font-semibold animate-in fade-in duration-500 ${
            isDark ? 'text-white' : 'text-zinc-900'
          }`}
        >
          {currentStep.text}
        </h3>
        <p 
          key={`subtext-${currentStepIndex}`}
          className={`mt-3 text-sm max-w-xs leading-relaxed animate-in fade-in duration-500 ${
            isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}
        >
          {currentStep.subtext}
        </p>
      </div>
    </div>
  );
};

