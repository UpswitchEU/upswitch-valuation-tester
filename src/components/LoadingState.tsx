import { Loader2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { GENERATION_STEPS, type LoadingStep } from './LoadingState.constants';

interface LoadingStateProps {
  steps?: LoadingStep[];
  variant?: 'light' | 'dark';
  centered?: boolean;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ 
  steps = GENERATION_STEPS, 
  variant = 'light',
  centered = true
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Cycle through steps every 3 seconds for better readability
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, [steps.length]);

  const currentStep = steps[currentStepIndex];
  const isDark = variant === 'dark';

  return (
    <div className={`flex flex-col items-center w-full h-full max-w-lg mx-auto text-center ${
      centered 
        ? 'justify-center min-h-[300px] px-4 py-6' 
        : 'justify-start min-h-[200px] px-4 py-2'
    }`}>
      <div className={`relative group ${centered ? 'mb-2' : 'mb-1'}`}>
        {/* Outer pulsing rings - refined for subtlety */}
        <div 
          className={`absolute inset-0 rounded-full animate-ping ${
            isDark ? 'bg-primary-400/20' : 'bg-primary-500/10'
          }`} 
          style={{ animationDuration: '3s' }} 
        />
        <div 
          className={`absolute inset-0 rounded-full animate-ping ${
            isDark ? 'bg-primary-300/10' : 'bg-primary-400/5'
          }`} 
          style={{ animationDuration: '4s', animationDelay: '1s' }} 
        />
        
        {/* Inner container */}
        <div className={`relative p-6 rounded-2xl shadow-sm border z-10 flex items-center justify-center transform transition-all duration-500 ${
          isDark 
            ? 'bg-zinc-900 border-zinc-800 shadow-primary-900/10' 
            : 'bg-white border-gray-200 shadow-lg'
        }`}>
          <Loader2 className={`w-10 h-10 animate-spin ${isDark ? 'text-primary-400' : 'text-primary-600'}`} strokeWidth={1.5} />
        </div>
      </div>
      
      {/* Dynamic step indicator */}
      <div className="mt-6 mb-3 animate-in fade-in slide-in-from-bottom-2 duration-700 delay-100 fill-mode-backwards">
        <span className={`text-xs font-semibold tracking-wide uppercase px-3 py-1.5 rounded-full ${
          isDark 
            ? 'text-primary-300 bg-primary-900/30 border border-primary-800/50' 
            : 'text-primary-700 bg-primary-50 border border-primary-100'
        }`}>
          Step {currentStepIndex + 1} of {steps.length}
        </span>
      </div>

      {/* Animated text transition */}
      <div className="flex flex-col items-center max-w-md mx-auto text-center">
        <h3 
          key={`title-${currentStepIndex}`}
          className={`text-xl md:text-2xl font-semibold tracking-tight animate-in fade-in slide-in-from-bottom-3 duration-500 text-center ${
            isDark ? 'text-white' : 'text-slate-ink'
          }`}
        >
          {currentStep.text}
        </h3>
        <p 
          key={`subtext-${currentStepIndex}`}
          className={`mt-1.5 text-base leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-500 delay-75 text-center ${
            isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}
        >
          {currentStep.subtext}
        </p>
      </div>
    </div>
  );
};
