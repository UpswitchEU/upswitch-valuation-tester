import React from 'react'
import { createPortal } from 'react-dom'

interface RegenerationWarningModalProps {
  isOpen: boolean
  completedAt?: Date | string
  onConfirm: () => void
  onCancel: () => void
}

export const RegenerationWarningModal: React.FC<RegenerationWarningModalProps> = ({
  isOpen,
  completedAt,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null

  // Format the timestamp if available
  const formatTimestamp = (date: Date | string | undefined): string => {
    if (!date) return 'earlier'

    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      return dateObj.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    } catch {
      return 'earlier'
    }
  }

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop without blur to avoid GPU repaints */}
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-zinc-800">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-harvest-500/20 rounded-full flex items-center justify-center">
              <span className="text-harvest-400 text-xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold text-white">Overwrite Existing Report?</h3>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <p className="text-zinc-300">
              You have an{' '}
              <span className="font-semibold text-white">existing valuation report</span> that will
              be <span className="font-semibold text-harvest-400">permanently overwritten</span>.
            </p>

            {completedAt && (
              <p className="text-zinc-400 text-sm">
                Previous report was generated on{' '}
                <span className="font-medium text-zinc-300">{formatTimestamp(completedAt)}</span>
              </p>
            )}
          </div>

          {/* Warning Box */}
          <div className="p-4 bg-harvest-tint border border-harvest-500/30 rounded-lg space-y-2">
            <p className="text-sm font-medium text-harvest-700">⚠️ This action cannot be undone</p>
            <p className="text-xs text-harvest-600/80">
              The previous valuation report will be replaced with a new one based on your current
              inputs.
            </p>
          </div>

          {/* Info Box */}
          <div className="p-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
            <p className="text-xs text-zinc-400">
              💡 <span className="font-medium">Tip:</span> If you want to compare different
              valuations, consider downloading the current report first.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t border-zinc-800 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-rust-500 hover:bg-rust-600 text-white rounded-lg font-medium transition-colors"
          >
            Regenerate Report
          </button>
        </div>
      </div>
    </div>
  )

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modal, document.body)
  }

  return modal
}
