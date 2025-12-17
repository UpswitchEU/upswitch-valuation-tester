/**
 * Professional Valuation Report Name Generator
 * Generates simple, professional names like "Valuation Report #123"
 * Based on Ilara Mercury's straightforward naming approach
 */
export class NameGenerator {
  private static readonly GUEST_REPORT_COUNT_KEY = 'upswitch_guest_report_count'

  /**
   * Get and increment the sequential report number for guest users
   */
  private static getNextGuestReportNumber(): number {
    try {
      const stored = localStorage.getItem(this.GUEST_REPORT_COUNT_KEY)
      const currentCount = stored ? parseInt(stored, 10) : 0
      const nextCount = currentCount + 1
      localStorage.setItem(this.GUEST_REPORT_COUNT_KEY, nextCount.toString())
      return nextCount
    } catch (error) {
      // Fallback if localStorage is not available
      console.warn('Failed to access localStorage for report count:', error)
      return 1
    }
  }

  /**
   * Generate a unique valuation report name based on a seed
   * For guest users, uses sequential numbering starting from 1
   */
  static generateValuationName(seedSource?: string): string {
    // For guest users, use sequential numbering starting from 1
    // Check if we're in a guest context (no authenticated user)
    const isGuest =
      !localStorage.getItem('upswitch_user_id') && !localStorage.getItem('upswitch_auth_token')

    if (isGuest) {
      const reportNumber = this.getNextGuestReportNumber()
      return `Valuation Report #${reportNumber}`
    }

    // For authenticated users, generate a unique number from seed
    let hashSum = 0
    const seed = seedSource || Date.now().toString()

    for (let i = 0; i < seed.length; i++) {
      hashSum += seed.charCodeAt(i) * (i + 1)
    }

    // Generate a number between 100-999 for professional look
    const reportNumber = (hashSum % 900) + 100

    return `Valuation Report #${reportNumber}`
  }

  /**
   * Generate a name based on company name
   * Format: "[COMPANY NAME] business valuation" (e.g., "Amadeus business valuation")
   */
  static generateFromCompany(companyName: string): string {
    if (!companyName || !companyName.trim()) {
      return this.generateValuationName()
    }

    // Clean company name (remove extra spaces, trim)
    const cleanName = companyName.trim()

    return `${cleanName} business valuation`
  }

  /**
   * Generate a name with date context
   */
  static generateWithDate(baseName?: string): string {
    const date = new Date()
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ]
    const month = monthNames[date.getMonth()]
    const day = date.getDate()

    if (baseName) {
      return `${baseName} ${month}-${day}`
    }

    return `Valuation Report ${month}-${day}`
  }
}
