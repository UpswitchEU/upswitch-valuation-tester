import React from 'react';
import { CalculationJourney } from './InfoTab/CalculationJourney';
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
    <div className="h-full overflow-y-auto">
      <CalculationJourney 
          result={result} 
          inputData={inputData || null} 
        />
    </div>
  );
};

