/**
 * Business Type Display Utilities
 * 
 * Helper functions for displaying business type information (icons, titles, etc.)
 * Adapted from upswitch-frontend for valuation-tester
 */

import { BUSINESS_TYPES_FALLBACK } from '../config/businessTypes'
import { businessTypesCache } from '../services/cache/businessTypesCache'

/**
 * Get business type icon from business type ID
 * Falls back to generic icon if type not found
 */
export function getBusinessTypeIcon(businessTypeId: string | undefined): string {
  if (!businessTypeId) {
    return '🏢' // Default generic business icon
  }

  // Try to find in fallback first (synchronous)
  const fallbackType = BUSINESS_TYPES_FALLBACK.find(
    (bt) => bt.value === businessTypeId
  )
  if (fallbackType) {
    // Extract emoji from label if icon not directly available
    const emojiMatch = fallbackType.label.match(/^(\p{Emoji}+)/u)
    if (emojiMatch) {
      return emojiMatch[1]
    }
  }

  // Try to get from cache (synchronous check)
  try {
    // Access cache synchronously - this will return null if cache not loaded yet
    const cacheData = businessTypesCache.hasValidCache()
      ? (() => {
          try {
            const cached = localStorage.getItem('upswitch_valuation_tester_business_types_cache')
            if (cached) {
              const entry = JSON.parse(cached)
              if (!entry.data) return null
              const businessType = entry.data.businessTypes?.find(
                (bt: any) => bt.id === businessTypeId
              )
              return businessType
            }
          } catch {
            return null
          }
          return null
        })()
      : null

    if (cacheData?.icon) {
      return cacheData.icon
    }
  } catch {
    // Cache not available, continue
  }

  return '🏢' // Default fallback
}

/**
 * Get business type title from business type ID
 * Falls back to the ID itself if type not found
 */
export function getBusinessTypeTitle(businessTypeId: string | undefined): string {
  if (!businessTypeId) {
    return 'Business'
  }

  // Try to find in fallback first (synchronous)
  const fallbackType = BUSINESS_TYPES_FALLBACK.find(
    (bt) => bt.value === businessTypeId
  )
  if (fallbackType) {
    // Remove emoji from label for title
    return fallbackType.label.replace(/^(\p{Emoji}+)\s*/u, '').trim() || fallbackType.label
  }

  // Try to get from cache (synchronous check)
  try {
    const cacheData = businessTypesCache.hasValidCache()
      ? (() => {
          try {
            const cached = localStorage.getItem('upswitch_valuation_tester_business_types_cache')
            if (cached) {
              const entry = JSON.parse(cached)
              if (!entry.data) return null
              const businessType = entry.data.businessTypes?.find(
                (bt: any) => bt.id === businessTypeId
              )
              return businessType
            }
          } catch {
            return null
          }
          return null
        })()
      : null

    if (cacheData?.title) {
      return cacheData.title
    }
  } catch {
    // Cache not available, continue
  }

  // Fallback: format the ID nicely
  return businessTypeId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/**
 * Get business type description from business type ID
 */
export function getBusinessTypeDescription(businessTypeId: string | undefined): string | undefined {
  if (!businessTypeId) {
    return undefined
  }

  // Try to get from cache (synchronous check)
  try {
    const cacheData = businessTypesCache.hasValidCache()
      ? (() => {
          try {
            const cached = localStorage.getItem('upswitch_valuation_tester_business_types_cache')
            if (cached) {
              const entry = JSON.parse(cached)
              if (!entry.data) return null
              const businessType = entry.data.businessTypes?.find(
                (bt: any) => bt.id === businessTypeId
              )
              return businessType
            }
          } catch {
            return null
          }
          return null
        })()
      : null

    if (cacheData?.description) {
      return cacheData.description
    }
  } catch {
    // Cache not available, continue
  }

  return undefined
}

/**
 * Get full business type info from business type ID
 */
export function getBusinessTypeInfo(businessTypeId: string | undefined) {
  if (!businessTypeId) {
    return {
      icon: '🏢',
      title: 'Business',
      description: undefined,
    }
  }

  // Try to find in fallback first
  const fallbackType = BUSINESS_TYPES_FALLBACK.find(
    (bt) => bt.value === businessTypeId
  )
  
  let icon = '🏢'
  let title = businessTypeId
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  if (fallbackType) {
    // Extract emoji from label
    const emojiMatch = fallbackType.label.match(/^(\p{Emoji}+)/u)
    if (emojiMatch) {
      icon = emojiMatch[1]
    }
    // Remove emoji from label for title
    title = fallbackType.label.replace(/^(\p{Emoji}+)\s*/u, '').trim() || fallbackType.label
  }

  // Try to get from cache (synchronous check)
  try {
    const cacheData = businessTypesCache.hasValidCache()
      ? (() => {
          try {
            const cached = localStorage.getItem('upswitch_valuation_tester_business_types_cache')
            if (cached) {
              const entry = JSON.parse(cached)
              if (!entry.data) return null
              const businessType = entry.data.businessTypes?.find(
                (bt: any) => bt.id === businessTypeId
              )
              return businessType
            }
          } catch {
            return null
          }
          return null
        })()
      : null

    if (cacheData) {
      return {
        icon: cacheData.icon || icon,
        title: cacheData.title || title,
        description: cacheData.description,
      }
    }
  } catch {
    // Cache not available, use fallback
  }

  return {
    icon,
    title,
    description: undefined,
  }
}

