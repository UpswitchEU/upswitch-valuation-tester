import React from 'react';

interface ConfidenceFactorProps {
  name: string;
  score: number;
  description: string;
  impact: 'Strong' | 'Moderate' | 'Weak';
  improvement?: string | null;
  isEstimated?: boolean;
}

export const ConfidenceFactor: React.FC<ConfidenceFactorProps> = ({
  name, 
  score, 
  description, 
  impact, 
  improvement,
  isEstimated = false
}) => {
  return (
    <div className="p-3 bg-gray-50 rounded border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-gray-900">{name}</span>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${
            score > 80 ? 'text-green-600' :
            score > 60 ? 'text-yellow-600' : 'text-red-600'
          }`}>
            {score}%
            {isEstimated && (
              <span className="ml-1 text-xs text-yellow-600 font-normal">(Est.)</span>
            )}
          </span>
          <span className={`text-xs px-2 py-1 rounded ${
            impact === 'Strong' ? 'bg-green-100 text-green-800' :
            impact === 'Moderate' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {impact}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-600 mb-2">{description}</p>
      {improvement && (
        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
          💡 {improvement}
        </div>
      )}
    </div>
  );
};
