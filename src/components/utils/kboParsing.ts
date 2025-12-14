/**
 * Utility functions for parsing KBO (Belgian Business Registry) suggestions from messages
 */

export interface KBOSuggestion {
  number: number
  companyName: string
  registrationNumber?: string
}

/**
 * Parses a clarification message to extract numbered KBO suggestions
 * Pattern: "1. **Company Name** (Registration)"
 */
export function parseKBOSuggestions(message: string): KBOSuggestion[] {
  const suggestions: KBOSuggestion[] = []

  // Pattern to match: "1. **Company Name** (Registration)" or "1. **Company Name**"
  // Backend format: "1. **MixMa Sportkampen** (0724.724.018)"
  const pattern = /(\d+)\.\s+\*\*(.+?)\*\*(?:\s+\(([^)]+)\))?/g

  let match
  while ((match = pattern.exec(message)) !== null) {
    const companyName = match[2].trim()
    // Skip if it's not a real company name (too short or contains question text)
    if (companyName.length > 1 && !companyName.toLowerCase().includes('did you mean')) {
      suggestions.push({
        number: parseInt(match[1], 10),
        companyName: companyName,
        registrationNumber: match[3]?.trim(),
      })
    }
  }

  return suggestions
}

/**
 * Detects if a message contains KBO suggestions
 */
export function hasKBOSuggestions(message: string): boolean {
  // Check for KBO registry mention and numbered list pattern
  const hasKBOKeyword = /KBO registry|Did you mean/i.test(message)
  const hasNumberedList = /\d+\.\s+\*\*.*\*\*/i.test(message)

  return hasKBOKeyword && hasNumberedList
}
