import { AlertTriangle, Home, Save } from 'lucide-react'
import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ExitReportConfirmationModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onSaveAndExit?: () => void
  hasUnsavedChanges: boolean
  hasValuationResults: boolean
  isSaving?: boolean
}

/**
 * ExitReportConfirmationModal Component
 *
 * Confirms exiting a report with different scenarios:
 * - Empty report: Just exit (no confirmation needed, handled by parent)
 * - Unsaved changes: "Save and exit?" with save option
 * - Saved with results: "Are you sure you want to exit?"
 */
export const ExitReportConfirmationModal: React.FC<ExitReportConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  onSaveAndExit,
  hasUnsavedChanges,
  hasValuationResults,
  isSaving = false,
}) => {
  // Close modal on Escape key
  useEffect(() => {
    if (!isOpen) return

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSaving) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscapeKey)
    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen, isSaving, onClose])

  if (!isOpen) {
    return null
  }

  // Determine modal content based on state
  const showSaveOption = hasUnsavedChanges && onSaveAndExit
  const title = showSaveOption ? 'Save and exit?' : 'Exit report?'
  const message = showSaveOption
    ? 'You have unsaved changes. Would you like to save your progress before exiting?'
    : hasValuationResults
      ? 'Are you sure you want to exit? Your saved progress will be available when you return.'
      : 'Are you sure you want to exit?'

  const modal = (
    <div className="fixed inset-0 z-[100000]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/65" onClick={onClose} aria-hidden="false" />

      {/* Modal */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        aria-hidden="false"
        aria-modal="true"
        role="dialog"
      >
        <div
          className="bg-zinc-800 rounded-2xl shadow-2xl border border-zinc-700 max-w-md w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-zinc-700">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-500/10 flex items-center justify-center">
                {showSaveOption ? (
                  <Save className="w-5 h-5 text-primary-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-primary-500" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-white">{title}</h2>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-5 space-y-3">
            <p className="text-zinc-300 leading-relaxed">{message}</p>
            {showSaveOption && (
              <p className="text-zinc-400 text-sm leading-relaxed">
                Your report will be saved and you'll be redirected to the home page.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-zinc-900/50 rounded-b-2xl flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            {showSaveOption && (
              <button
                onClick={onConfirm}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Exit without saving
              </button>
            )}
            {showSaveOption ? (
              <button
                onClick={onSaveAndExit}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium bg-accent-600 hover:bg-accent-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save and exit
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={onConfirm}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium bg-accent-600 hover:bg-accent-500 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Home className="w-4 h-4" />
                Exit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )

  // Render via portal so the overlay never reflows the main layout.
  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modal, document.body)
  }

  return modal
}
