import React from 'react';
import { CustomInputField, CustomNumberInputField } from './index';

interface HistoricalDataInputsProps {
  historicalInputs: Record<string, string>;
  onChange: (inputs: Record<string, string>) => void;
  onBlur: () => void;
  foundingYear?: number;
  currentYear?: number;
}

export const HistoricalDataInputs: React.FC<HistoricalDataInputsProps> = ({
  historicalInputs,
  onChange,
  onBlur,
  foundingYear,
  currentYear
}) => {
  // Helper function to update historical data
  const updateHistoricalData = (year: number, field: 'revenue' | 'ebitda', value: string) => {
    const key = `${year}_${field}`;
    onChange({
      ...historicalInputs,
      [key]: value
    });
  };

  // Calculate dynamic historical years based on founding year
  const calculateHistoricalYears = (): number[] => {
    const now = currentYear || new Date().getFullYear();
    const historicalYears: number[] = [];
    
    // Show up to 2 years before current year
    for (let i = 2; i >= 1; i--) {
      const year = now - i;
      // Only include years >= founding year
      if (!foundingYear || year >= foundingYear) {
        historicalYears.push(year);
      }
    }
    
    return historicalYears;
  };

  const yearsToShow = calculateHistoricalYears();

  // If no years to show, display a helpful message
  if (yearsToShow.length === 0) {
    return (
      <div className="text-sm text-zinc-400 bg-zinc-900 border border-zinc-700 rounded-lg p-4 text-center">
        <p>No historical data available yet.</p>
        <p className="text-xs mt-1">Company was founded in {foundingYear || 'current year'}.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {yearsToShow.map((year) => {
        const revenueKey = `${year}_revenue`;
        const ebitdaKey = `${year}_ebitda`;
        const revenue = historicalInputs[revenueKey] || '';
        const ebitda = historicalInputs[ebitdaKey] || '';

        return (
          <div key={year} className="grid grid-cols-1 @5xl:grid-cols-3 gap-4 p-2 @lg:p-3 bg-zinc-900 border border-zinc-700 rounded">
            <div>
              <CustomInputField
                label="Year"
                type="text"
                value={year.toString()}
                onChange={() => {}}
                onBlur={() => {}}
                disabled={true}
                placeholder=""
              />
            </div>
            <div>
              <CustomNumberInputField
                label="Revenue (€)"
                placeholder="e.g., 2,000,000"
                value={revenue}
                onChange={(e) => updateHistoricalData(year, 'revenue', e.target.value)}
                onBlur={onBlur}
                name={revenueKey}
                min={0}
                step={1000}
                prefix="€"
                formatAsCurrency
              />
            </div>
            <div>
              <CustomNumberInputField
                label="EBITDA (€)"
                placeholder="e.g., 400,000"
                value={ebitda}
                onChange={(e) => updateHistoricalData(year, 'ebitda', e.target.value)}
                onBlur={onBlur}
                name={ebitdaKey}
                step={1000}
                prefix="€"
                formatAsCurrency
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default HistoricalDataInputs;
