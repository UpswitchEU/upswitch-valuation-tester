import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface FlowSwitchWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  targetFlow: 'manual' | 'conversational';
}

/**
 * FlowSwitchWarningModal Component
 * 
 * Warns users when switching flows that their current progress will be reset.
 * Only business type (from homepage) is preserved.
 */
export const FlowSwitchWarningModal: React.FC<FlowSwitchWarningModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  targetFlow,
}) => {
  if (!isOpen) return null;

  const flowName = targetFlow === 'conversational' ? 'Conversational' : 'Manual';

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-700 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              </div>
              <h2 className="text-xl font-semibold text-white">
                Switch to {flowName} Flow?
              </h2>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-3">
            <p className="text-zinc-300 leading-relaxed">
              This will reset your current progress. Only your business type will be preserved.
            </p>
            <p className="text-zinc-400 text-sm leading-relaxed">
              You'll start fresh in the {flowName.toLowerCase()} flow. All other entered data will be cleared.
            </p>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-zinc-900/50 rounded-b-2xl flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium bg-yellow-600 hover:bg-yellow-500 text-white rounded-lg transition-colors"
            >
              Switch & Reset
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

