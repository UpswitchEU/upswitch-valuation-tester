/**
 * ✏️ Edit Choice Modal
 * Location: src/components/modals/EditChoiceModal.tsx
 * Purpose: Context-aware modal to choose what to edit when clicking edit on business card
 *
 * Shows when user clicks edit on business card.
 * Lets them choose: Edit Report OR Delete Report
 */

'use client'

import { Modal, ModalBody, ModalContent, ModalHeader } from '@heroui/react'
import { Building2, FileText, Trash2 } from 'lucide-react'
import React from 'react'

interface EditChoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onEditReport: () => void
  onDeleteReport?: () => void
  reportName?: string
}

const EditChoiceModal: React.FC<EditChoiceModalProps> = ({
  isOpen,
  onClose,
  onEditReport,
  onDeleteReport,
  reportName = 'this report',
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" placement="center">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 border-b border-gray-200 pb-4">
          <h2 className="text-2xl font-bold text-gray-900">What would you like to do?</h2>
          <p className="text-sm text-gray-600 font-normal mt-1">
            Choose an action for {reportName}
          </p>
        </ModalHeader>
        <ModalBody className="py-6">
          <div className="space-y-4">
            {/* Edit Report Option */}
            <button
              onClick={() => {
                onEditReport()
                onClose()
              }}
              className="w-full group"
            >
              <div className="flex items-start gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-primary-500 hover:bg-primary-50 transition-all duration-200 text-left">
                <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                  <Building2 className="w-6 h-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Edit Report</h3>
                  <p className="text-sm text-gray-600">
                    Update your valuation report: inputs, business information, and other details.
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700">
                      Business Info
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700">
                      Financial Data
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs text-gray-700">
                      Valuation Settings
                    </span>
                  </div>
                </div>
              </div>
            </button>

            {/* Delete Report Option */}
            {onDeleteReport && (
              <button
                onClick={() => {
                  onDeleteReport()
                  onClose()
                }}
                className="w-full group"
              >
                <div className="flex items-start gap-4 p-6 border-2 border-gray-200 rounded-xl hover:border-red-500 hover:bg-red-50 transition-all duration-200 text-left">
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors">
                    <Trash2 className="w-6 h-6 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">Delete Report</h3>
                    <p className="text-sm text-gray-600">
                      Permanently delete {reportName} and all associated data. This action cannot be
                      undone.
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-xs text-red-700">
                        Permanent
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-xs text-red-700">
                        Cannot Undo
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-md bg-red-100 text-xs text-red-700">
                        All Data Lost
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )}

            {/* Info Message */}
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> Editing a report allows you to update business information and
                recalculate the valuation. Deleting permanently removes all data.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}

export default EditChoiceModal
