/**
 * Valuation Toolbar Name Hook
 *
 * Single Responsibility: Handle valuation name editing logic
 * SOLID Principles: SRP - Only handles name editing operations
 *
 * @module hooks/valuationToolbar/useValuationToolbarName
 */

import { useEffect, useRef, useState } from 'react'
import { generalLogger } from '../../utils/logger'
import { NameGenerator } from '../../utils/nameGenerator'

export interface UseValuationToolbarNameReturn {
  isEditingName: boolean
  editedName: string
  generatedName: string
  nameInputRef: React.RefObject<HTMLInputElement>
  handleNameEdit: () => void
  handleNameSave: () => Promise<void>
  handleNameCancel: () => void
  handleKeyDown: (e: React.KeyboardEvent) => void
}

export interface UseValuationToolbarNameOptions {
  initialName?: string
  companyName?: string
}

/**
 * Hook for managing valuation name editing in ValuationToolbar
 */
export const useValuationToolbarName = (
  options: UseValuationToolbarNameOptions = {}
): UseValuationToolbarNameReturn => {
  const { initialName = 'Valuation test123', companyName } = options

  const [isEditingName, setIsEditingName] = useState(false)
  const [editedName, setEditedName] = useState(initialName)

  // Generate unique name based on company or default
  const [generatedName, setGeneratedName] = useState(() => {
    if (companyName) {
      return NameGenerator.generateFromCompany(companyName)
    }
    return NameGenerator.generateValuationName()
  })

  const nameInputRef = useRef<HTMLInputElement>(null)

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isEditingName])

  // Sync editedName when generatedName changes
  useEffect(() => {
    if (!isEditingName) {
      setEditedName(generatedName)
    }
  }, [generatedName, isEditingName])

  const handleNameEdit = () => {
    setIsEditingName(true)
  }

  const handleNameSave = async () => {
    if (!editedName.trim()) {
      setEditedName(initialName) // Reset if empty
      setIsEditingName(false)
      return
    }

    // Update the displayed name
    setGeneratedName(editedName.trim())
    setIsEditingName(false)

    try {
      // Log the save for debugging
      generalLogger.info('Valuation name saved', { name: editedName.trim() })

      // TODO: In future, persist to backend
      // await saveValuationName(editedName.trim());
    } catch (error) {
      generalLogger.error('Failed to save valuation name', { error })
      // Note: We don't revert here since the UI update is already done
    }
  }

  const handleNameCancel = () => {
    setEditedName(initialName)
    setIsEditingName(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSave()
    } else if (e.key === 'Escape') {
      handleNameCancel()
    }
  }

  return {
    isEditingName,
    editedName,
    generatedName,
    nameInputRef,
    handleNameEdit,
    handleNameSave,
    handleNameCancel,
    handleKeyDown,
  }
}
