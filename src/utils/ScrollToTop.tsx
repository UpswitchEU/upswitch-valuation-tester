/**
 * ScrollToTop Component
 *
 * Automatically scrolls to the top of the page when the route changes.
 * This ensures that when users navigate to a new page via links in navigation,
 * footer, or anywhere else, the viewport starts at the top of the new page.
 *
 * Usage: Place this component at the root level of your app.
 * Next.js compatible version.
 */

'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

const ScrollToTop = () => {
  const _pathname = usePathname()
  const _searchParams = useSearchParams()

  useEffect(() => {
    // Scroll to top when location changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', // Use 'instant' for immediate scroll, 'smooth' for animated
    })
  }, [])

  return null // This component doesn't render anything
}

export default ScrollToTop
