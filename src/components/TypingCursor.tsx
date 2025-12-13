/**
 * Typing Cursor Component
 *
 * Animated cursor that appears during AI typing animation.
 * Provides visual feedback with smooth blink animation.
 */

import React from 'react'

interface TypingCursorProps {
  isVisible: boolean
  className?: string
}

export const TypingCursor: React.FC<TypingCursorProps> = ({ isVisible, className = '' }) => {
  if (!isVisible) return null

  return (
    <span
      className={`inline-block w-[2px] h-4 bg-primary-400 ml-0.5 animate-blink ${className}`}
      aria-hidden="true"
    />
  )
}
