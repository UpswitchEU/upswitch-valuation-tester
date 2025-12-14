/**
 * Report ID Generator Utility
 * Generate unique report IDs following Ilara Mercury pattern
 */

/**
 * Generate unique report ID following Ilara pattern
 * Format: val_${timestamp}_${random8chars}
 * Example: val_1729800000_abc123xyz
 */
export const generateReportId = (): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substr(2, 9)
  return `val_${timestamp}_${random}`
}

/**
 * Validate report ID format
 */
export const isValidReportId = (reportId: string): boolean => {
  return /^val_\d+_[a-z0-9]+$/.test(reportId)
}

/**
 * Extract timestamp from report ID
 */
export const getReportTimestamp = (reportId: string): number | null => {
  const match = reportId.match(/^val_(\d+)_/)
  return match ? parseInt(match[1], 10) : null
}

/**
 * Generate report name deterministically from report ID
 * Similar to Ilara's approach for consistent naming
 */
export const generateReportName = (reportId: string): string => {
  const trendWords = [
    'Wave',
    'Pulse',
    'Flow',
    'Surge',
    'Spike',
    'Shift',
    'Boom',
    'Peak',
    'Rise',
    'Edge',
    'Vibe',
    'Buzz',
    'Momentum',
    'Force',
  ]

  const descriptors = [
    'Business',
    'Company',
    'Enterprise',
    'Corporate',
    'Valuation',
    'Analysis',
    'Assessment',
    'Review',
    'Study',
    'Report',
  ]

  const formats = [
    'Valuation',
    'Analysis',
    'Report',
    'Assessment',
    'Study',
    'Brief',
    'Overview',
    'Summary',
    'Intelligence',
    'Tracker',
  ]

  // Use report ID for deterministic seeding
  let hashSum = 0
  for (let i = 0; i < reportId.length; i++) {
    hashSum += reportId.charCodeAt(i) * (i + 1)
  }

  const trendWord = trendWords[hashSum % trendWords.length]
  const descriptor = descriptors[(hashSum * 2) % descriptors.length]
  const format = formats[(hashSum * 3) % formats.length]

  return `${trendWord} ${descriptor} ${format}`
}
