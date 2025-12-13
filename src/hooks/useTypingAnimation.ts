/**
 * Smooth AI Typing Animation Hook
 *
 * Provides buttery-smooth character-by-character typing animation
 * with adaptive speed, smart punctuation pauses, and cursor animation.
 *
 * Inspired by ChatGPT, Claude, and Perplexity's typing experiences.
 */

import { useState, useRef, useCallback, useEffect } from 'react'

interface TypingAnimationOptions {
  baseSpeed?: number // Base ms per character (default: 50)
  adaptiveSpeed?: boolean // Enable adaptive speed (default: true)
  punctuationPauses?: boolean // Enable smart pauses (default: true)
  showCursor?: boolean // Show typing cursor (default: true)
}

export const useTypingAnimation = (options?: TypingAnimationOptions) => {
  const [displayedText, setDisplayedText] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const bufferRef = useRef<string>('')
  const currentIndexRef = useRef(0)
  const animationFrameRef = useRef<number>()
  const lastUpdateRef = useRef<number>(0)

  // Add text to buffer (called when chunks arrive)
  const addToBuffer = useCallback(
    (text: string) => {
      bufferRef.current += text
      if (!isTyping) {
        setIsTyping(true)
        startAnimation()
      }
    },
    [isTyping]
  )

  // Calculate adaptive speed based on content
  const calculateSpeed = useCallback(
    (text: string, index: number) => {
      if (!options?.adaptiveSpeed) return options?.baseSpeed || 50

      const remainingLength = text.length - index
      const currentChar = text[index]

      // Speed up near end of message
      if (remainingLength < 50) return 30

      // Slow down for important content
      if (text.includes('valuation') || text.includes('€') || text.includes('million')) return 70

      // Slow down for numbers and technical content
      if (currentChar && /[0-9€$%]/.test(currentChar)) return 60

      return 50 // Default speed
    },
    [options?.adaptiveSpeed, options?.baseSpeed]
  )

  // Smart punctuation pauses
  const shouldPause = useCallback(
    (char: string) => {
      return options?.punctuationPauses && /[.,:\n]/.test(char)
    },
    [options?.punctuationPauses]
  )

  const getPauseDelay = useCallback((char: string) => {
    const pauses = { '.': 200, ',': 100, '\n': 150, ':': 120 }
    return pauses[char as keyof typeof pauses] || 0
  }, [])

  // Animation loop using requestAnimationFrame
  const startAnimation = useCallback(() => {
    const animate = (timestamp: number) => {
      const elapsed = timestamp - lastUpdateRef.current
      const speed = calculateSpeed(bufferRef.current, currentIndexRef.current)

      if (elapsed >= speed) {
        if (currentIndexRef.current < bufferRef.current.length) {
          const nextChar = bufferRef.current[currentIndexRef.current]
          setDisplayedText(bufferRef.current.substring(0, currentIndexRef.current + 1))
          currentIndexRef.current++
          lastUpdateRef.current = timestamp

          // Add pause for punctuation
          if (shouldPause(nextChar)) {
            setTimeout(() => {
              animationFrameRef.current = requestAnimationFrame(animate)
            }, getPauseDelay(nextChar))
            return
          }
        } else {
          setIsTyping(false)
          return // Animation complete
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)
  }, [calculateSpeed, shouldPause, getPauseDelay])

  // Complete animation immediately (skip to end)
  const complete = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    setDisplayedText(bufferRef.current)
    currentIndexRef.current = bufferRef.current.length
    setIsTyping(false)
  }, [])

  // Reset animation
  const reset = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
    }
    bufferRef.current = ''
    currentIndexRef.current = 0
    setDisplayedText('')
    setIsTyping(false)
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  return {
    displayedText,
    isTyping,
    addToBuffer,
    complete,
    reset,
  }
}
