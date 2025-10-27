import React from 'react';
import { TransparentCalculationView } from './InfoTab/TransparentCalculationView';
import type { ValuationResponse, ValuationInputData } from '../types/valuation';

interface ValuationInfoPanelProps {
  result: ValuationResponse;
  inputData?: ValuationInputData | null;
}

export const ValuationInfoPanel: React.FC<ValuationInfoPanelProps> = ({
  result,
  inputData
}) => {
  return (
    <div className="h-full bg-white p-6 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        <TransparentCalculationView 
          result={result} 
          inputData={inputData || null} 
        />
      </div>
    </div>
  );
};

