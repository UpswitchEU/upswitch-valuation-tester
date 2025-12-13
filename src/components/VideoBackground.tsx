import React, { useState, useEffect, useRef } from 'react'

export interface VideoBackgroundProps {
  videos: string[]
  transitionDuration?: number
  videoDuration?: number
  opacity?: number
  overlayGradient?: string
  objectPosition?: 'center' | 'top' | 'bottom'
  disableOnMobile?: boolean
  fallbackGradient?: string
  disableAutoRotation?: boolean
  disableKeyboardInteraction?: boolean
}

export const VideoBackground: React.FC<VideoBackgroundProps> = ({
  videos,
  transitionDuration = 1000,
  videoDuration = 8000,
  opacity = 0.6,
  overlayGradient = 'from-black/40 via-black/30 to-black/60',
  objectPosition = 'center',
  disableOnMobile = true,
  fallbackGradient = 'from-neutral-900 via-neutral-800 to-neutral-900',
  disableAutoRotation = false,
  disableKeyboardInteraction = false,
}) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [nextVideoIndex, setNextVideoIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [hasError, setHasError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Initialize with random video
  useEffect(() => {
    if (videos.length === 0) return

    const initialIndex = Math.floor(Math.random() * videos.length)
    setCurrentVideoIndex(initialIndex)
    setNextVideoIndex(initialIndex)
  }, [videos])

  // Auto-rotate videos (disabled if disableAutoRotation is true)
  useEffect(() => {
    if (videos.length <= 1 || hasError || disableAutoRotation) return

    const interval = setInterval(() => {
      const newIndex = Math.floor(Math.random() * videos.length)
      setNextVideoIndex(newIndex)
      setIsTransitioning(true)

      setTimeout(() => {
        setCurrentVideoIndex(newIndex)
        setIsTransitioning(false)
      }, transitionDuration)
    }, videoDuration)

    return () => clearInterval(interval)
  }, [videos, videoDuration, transitionDuration, hasError, disableAutoRotation])

  // Keyboard interaction for video switching (disabled if disableKeyboardInteraction is true)
  useEffect(() => {
    // Early return if keyboard interaction is disabled
    if (disableKeyboardInteraction) return
    if (videos.length <= 1) return
    if (hasError) return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Additional safety: check if we're in password protection mode
      const passwordOverlay = document.querySelector('[data-password-overlay="true"]')
      if (passwordOverlay) {
        e.stopPropagation()
        e.stopImmediatePropagation()
        return
      }

      // Don't respond if user is typing in an input field
      const target = e.target as HTMLElement
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.contentEditable === 'true')
      ) {
        return
      }

      // Don't respond if the target is inside a form (additional safety check)
      if (target && target.closest('form')) {
        return
      }

      // Don't respond if the target has specific attributes that indicate it's an input
      if (
        target &&
        (target.getAttribute('type') === 'password' ||
          target.getAttribute('name') === 'password' ||
          target.getAttribute('autocomplete') === 'current-password')
      ) {
        return
      }

      // Only respond to arrow keys and spacebar
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft' || e.key === ' ') {
        e.preventDefault()
        const newIndex = Math.floor(Math.random() * videos.length)
        setNextVideoIndex(newIndex)
        setIsTransitioning(true)

        setTimeout(() => {
          setCurrentVideoIndex(newIndex)
          setIsTransitioning(false)
        }, transitionDuration)
      }
    }

    window.addEventListener('keydown', handleKeyPress, { capture: true })
    return () => window.removeEventListener('keydown', handleKeyPress, { capture: true })
  }, [disableKeyboardInteraction, videos, transitionDuration, hasError])

  // Set video-background class on body
  useEffect(() => {
    document.body.classList.add('video-background')
    return () => {
      document.body.classList.remove('video-background')
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    const video = videoRef.current
    return () => {
      if (video) {
        video.pause()
        video.src = ''
      }
    }
  }, [])

  // Fallback if mobile, no videos, or error
  if ((disableOnMobile && isMobile) || videos.length === 0 || hasError) {
    return <div className={`fixed inset-0 bg-gradient-to-br ${fallbackGradient} -z-10`} />
  }

  const objectPositionClass = {
    center: 'object-center',
    top: 'object-top',
    bottom: 'object-bottom',
  }[objectPosition]

  const opacityValue = Math.round(opacity * 100)

  const handleVideoError = () => {
    setHasError(true)
  }

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden" style={{ zIndex: -10 }}>
      {/* Current Video */}
      <video
        key={`current-${currentVideoIndex}`}
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        onError={handleVideoError}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
          isTransitioning ? 'opacity-0' : `opacity-${opacityValue}`
        } ${objectPositionClass}`}
        style={{
          transitionDuration: `${transitionDuration}ms`,
          opacity: isTransitioning ? 0 : opacity,
        }}
      >
        <source src={videos[currentVideoIndex]} type="video/mp4" />
      </video>

      {/* Next Video (for smooth transition) */}
      {isTransitioning && (
        <video
          key={`next-${nextVideoIndex}`}
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          onError={handleVideoError}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity opacity-${opacityValue} ${objectPositionClass}`}
          style={{
            transitionDuration: `${transitionDuration}ms`,
            opacity,
          }}
        >
          <source src={videos[nextVideoIndex]} type="video/mp4" />
        </video>
      )}

      {/* Overlay Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-b ${overlayGradient}`} />
    </div>
  )
}

export default VideoBackground
