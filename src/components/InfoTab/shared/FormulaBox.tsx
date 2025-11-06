import React from 'react';

export interface FormulaBoxProps {
  formula: string;
  description?: string;
}

export const FormulaBox: React.FC<FormulaBoxProps> = ({ formula, description }) => {
  return (
    <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
      <div className="flex items-start gap-2 mb-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Formula</span>
      </div>
      <div className="font-mono text-sm sm:text-base text-gray-900 font-medium whitespace-pre-wrap break-words">
        {formula}
      </div>
      {description && (
        <p className="text-xs text-gray-600 mt-2 italic">{description}</p>
      )}
    </div>
  );
};

