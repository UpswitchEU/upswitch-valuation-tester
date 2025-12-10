import React from 'react';
import { MultiplePipeline } from '../../types/valuation';

interface MultipleWaterfallProps {
  pipeline: MultiplePipeline;
}

export const MultipleWaterfall: React.FC<MultipleWaterfallProps> = ({ pipeline }) => {
  const formatMultiple = (value: number) => `${value.toFixed(2)}x`;
  const formatPercentage = (value: number) => `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  const formatCurrency = (value: number) => `€${value.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-slate-ink mb-4">
        📊 Multiple Discount Waterfall
      </h3>
      
      {/* Summary */}
      <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Initial Multiple</p>
            <p className="text-xl font-bold text-slate-ink">{formatMultiple(pipeline.initial_multiple)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Final Multiple</p>
            <p className="text-xl font-bold text-primary-700">{formatMultiple(pipeline.final_multiple)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total Reduction</p>
            <p className="text-xl font-bold text-accent-600">{formatPercentage(pipeline.total_reduction_percentage)}</p>
          </div>
        </div>
      </div>
      
      {/* Waterfall Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stage</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Discount</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Multiple Before</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Multiple After</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">EV Impact</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Initial stage */}
            <tr className="bg-blue-50">
              <td className="px-4 py-3 text-sm font-medium text-gray-900">Start</td>
              <td className="px-4 py-3 text-sm text-gray-600">Initial {pipeline.metric_type} Multiple</td>
              <td className="px-4 py-3 text-sm text-right text-gray-900">–</td>
              <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatMultiple(pipeline.initial_multiple)}</td>
              <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">{formatMultiple(pipeline.initial_multiple)}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(pipeline.initial_multiple * pipeline.metric_value)}</td>
            </tr>
            
            {/* Discount stages */}
            {pipeline.stages.map((stage, index) => (
              <tr key={stage.step_number} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-4 py-3 text-sm font-medium text-gray-900">Step {stage.step_number}</td>
                <td className="px-4 py-3 text-sm text-gray-600">{stage.explanation}</td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className={`font-semibold ${stage.discount_percentage < 0 ? 'text-rust-600' : 'text-moss-600'}`}>
                    {formatPercentage(stage.discount_percentage)}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-right text-slate-ink">{formatMultiple(stage.multiple_before)}</td>
                <td className="px-4 py-3 text-sm text-right">
                  <span className="font-semibold text-primary-700">{formatMultiple(stage.multiple_after)}</span>
                </td>
                <td className="px-4 py-3 text-sm text-right text-gray-600">{formatCurrency(stage.ev_after)}</td>
              </tr>
            ))}
            
            {/* Final stage */}
            <tr className="bg-primary-50 font-semibold">
              <td className="px-4 py-3 text-sm text-slate-ink">Final</td>
              <td className="px-4 py-3 text-sm text-slate-ink">Applied Multiple</td>
              <td className="px-4 py-3 text-sm text-right text-accent-600">{formatPercentage(pipeline.total_reduction_percentage)}</td>
              <td className="px-4 py-3 text-sm text-right text-slate-ink">–</td>
              <td className="px-4 py-3 text-sm text-right">
                <span className="text-lg font-bold text-primary-700">{formatMultiple(pipeline.final_multiple)}</span>
              </td>
              <td className="px-4 py-3 text-sm text-right">
                <span className="text-lg font-bold text-slate-ink">{formatCurrency(pipeline.final_multiple * pipeline.metric_value)}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      
      {/* Formula */}
      <div className="mt-4 p-4 bg-river-50 rounded-lg border border-river-200">
        <p className="text-sm text-river-900">
          <span className="font-semibold">Final Valuation:</span> {formatCurrency(pipeline.metric_value)} ({pipeline.metric_type}) × {formatMultiple(pipeline.final_multiple)} = {formatCurrency(pipeline.final_multiple * pipeline.metric_value)}
        </p>
      </div>
    </div>
  );
};

