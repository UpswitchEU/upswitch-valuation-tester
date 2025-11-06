import React from 'react';
import { ArrowRight } from 'lucide-react';

export interface BeforeAfterTableProps {
  before: { low: number; mid: number; high: number };
  after: { low: number; mid: number; high: number };
  adjustmentLabel: string;
  adjustmentPercent: number;
}

const formatCurrency = (value: number): string => {
  return `€${Math.round(value).toLocaleString()}`;
};

export const BeforeAfterTable: React.FC<BeforeAfterTableProps> = ({
  before,
  after,
  adjustmentLabel,
  adjustmentPercent
}) => {
  const isNegative = adjustmentPercent < 0;
  const percentColor = isNegative ? 'text-red-600' : 'text-green-600';
  const bgColor = isNegative ? 'bg-red-50' : 'bg-green-50';
  const borderColor = isNegative ? 'border-red-300' : 'border-green-300';

  return (
    <div className="space-y-4">
      {/* Adjustment Label */}
      <div className={`${bgColor} border ${borderColor} rounded-lg p-3`}>
        <div className="flex items-center justify-between">
          <span className="font-semibold text-gray-900">{adjustmentLabel}</span>
          <span className={`text-lg font-bold ${percentColor}`}>
            {adjustmentPercent > 0 ? '+' : ''}{(adjustmentPercent * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="bg-white border border-gray-300 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Estimate</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Before</th>
              <th className="px-2 py-2"></th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">After</th>
              <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600 uppercase">Change</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-3 font-medium text-gray-900">Low</td>
              <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(before.low)}</td>
              <td className="px-2 py-3 text-center">
                <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />
              </td>
              <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatCurrency(after.low)}</td>
              <td className={`px-4 py-3 text-right font-mono text-xs ${percentColor}`}>
                {formatCurrency(after.low - before.low)}
              </td>
            </tr>
            <tr className="bg-blue-50">
              <td className="px-4 py-3 font-bold text-blue-900">Mid</td>
              <td className="px-4 py-3 text-right font-mono text-blue-700">{formatCurrency(before.mid)}</td>
              <td className="px-2 py-3 text-center">
                <ArrowRight className="w-4 h-4 text-blue-400 mx-auto" />
              </td>
              <td className="px-4 py-3 text-right font-mono font-bold text-blue-900">{formatCurrency(after.mid)}</td>
              <td className={`px-4 py-3 text-right font-mono text-xs font-semibold ${percentColor}`}>
                {formatCurrency(after.mid - before.mid)}
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-gray-900">High</td>
              <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(before.high)}</td>
              <td className="px-2 py-3 text-center">
                <ArrowRight className="w-4 h-4 text-gray-400 mx-auto" />
              </td>
              <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatCurrency(after.high)}</td>
              <td className={`px-4 py-3 text-right font-mono text-xs ${percentColor}`}>
                {formatCurrency(after.high - before.high)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

