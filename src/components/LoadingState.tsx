import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

// Accurate loading steps based on the actual 12-step calculation process
const LOADING_STEPS = [
  { 
    text: "Assessing data quality...", 
    subtext: "Evaluating completeness, validity, and consistency across 5 dimensions" 
  },
  { 
    text: "Validating financial metrics...", 
    subtext: "Extracting revenue, EBITDA, and business profile data" 
  },
  { 
    text: "Consulting academic frameworks...", 
    subtext: "Referencing Koller, Damodaran & IVS 2017 standards" 
  },
  { 
    text: "Selecting valuation methodology...", 
    subtext: "Determining DCF vs. Market Multiples eligibility for SMEs" 
  },
  { 
    text: "Benchmarking against comparables...", 
    subtext: "Analyzing industry multiples from real market transactions" 
  },
  { 
    text: "Calibrating SME risk factors...", 
    subtext: "Assessing owner dependency, size discount, and liquidity" 
  },
  { 
    text: "Synthesizing final valuation...", 
    subtext: "Generating Big 4-grade professional report with Belgian compliance" 
  }
];

export const LoadingState: React.FC = () => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  useEffect(() => {
    // Cycle through steps every 2.5 seconds
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % LOADING_STEPS.length);
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const currentStep = LOADING_STEPS[currentStepIndex];

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px] p-8 text-center">
      <div className="relative mb-6 group">
        {/* Outer pulsing rings */}
        <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping opacity-75" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-0 bg-purple-500/10 rounded-full animate-ping opacity-50" style={{ animationDuration: '3s', animationDelay: '0.5s' }} />
        
        {/* Inner container */}
        <div className="relative bg-white p-5 rounded-full shadow-lg border border-zinc-100 z-10 flex items-center justify-center transform transition-transform group-hover:scale-105 duration-300">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      </div>
      
      {/* Dynamic step indicator */}
      <div className="mb-2">
        <span className="text-xs font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Step {currentStepIndex + 1} of {LOADING_STEPS.length}
        </span>
      </div>

      {/* Animated text transition */}
      <div className="min-h-[80px] flex flex-col justify-center">
        <h3 
          key={currentStepIndex}
          className="text-xl font-semibold text-zinc-900 animate-in fade-in duration-500"
        >
          {currentStep.text}
        </h3>
        <p 
          key={`subtext-${currentStepIndex}`}
          className="text-zinc-500 mt-3 text-sm max-w-xs leading-relaxed animate-in fade-in duration-500"
        >
          {currentStep.subtext}
        </p>
      </div>
    </div>
  );
};

