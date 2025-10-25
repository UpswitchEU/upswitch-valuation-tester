import React from 'react';
import { CustomInputField, CustomNumberInputField } from './index';

interface HistoricalDataInputsProps {
  historicalInputs: Record<string, string>;
  onChange: (inputs: Record<string, string>) => void;
  onBlur: () => void;
}

export const HistoricalDataInputs: React.FC<HistoricalDataInputsProps> = ({
  historicalInputs,
  onChange,
  onBlur
}) => {
  // Helper function to update historical data
  const updateHistoricalData = (year: number, field: 'revenue' | 'ebitda', value: string) => {
    const key = `${year}_${field}`;
    onChange({
      ...historicalInputs,
      [key]: value
    });
  };

  return (
    <div className="space-y-3">
      {[2023, 2024].map((year) => {
        const revenueKey = `${year}_revenue`;
        const ebitdaKey = `${year}_ebitda`;
        const revenue = historicalInputs[revenueKey] || '';
        const ebitda = historicalInputs[ebitdaKey] || '';

        return (
          <div key={year} className="grid grid-cols-1 @2xl:grid-cols-3 sm:grid-cols-3 gap-4 p-2 @lg:p-3 bg-zinc-900 border border-zinc-700 rounded">
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
