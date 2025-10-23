/**
 * Professional Valuation Report Name Generator
 * Generates simple, professional names like "Valuation Report #123"
 * Based on Ilara Mercury's straightforward naming approach
 */
export class NameGenerator {

  /**
   * Generate a unique valuation report name based on a seed
   */
  static generateValuationName(seedSource?: string): string {
    // Generate a unique number from seed
    let hashSum = 0;
    const seed = seedSource || Date.now().toString();
    
    for (let i = 0; i < seed.length; i++) {
      hashSum += seed.charCodeAt(i) * (i + 1);
    }

    // Generate a number between 100-999 for professional look
    const reportNumber = (hashSum % 900) + 100;

    return `Valuation Report #${reportNumber}`;
  }


  /**
   * Generate a name based on company name
   */
  static generateFromCompany(companyName: string): string {
    if (!companyName) {
      return this.generateValuationName();
    }

    // Clean and truncate company name
    const cleanName = companyName
      .trim()
      .split(' ')
      .slice(0, 2) // Take first 2 words max
      .join(' ')
      .substring(0, 20); // Max 20 chars

    // Generate unique number from company name
    let hashSum = 0;
    for (let i = 0; i < companyName.length; i++) {
      hashSum += companyName.charCodeAt(i) * (i + 1);
    }

    const reportNumber = (hashSum % 900) + 100;

    return `${cleanName} Valuation #${reportNumber}`;
  }


  /**
   * Generate a name with date context
   */
  static generateWithDate(baseName?: string): string {
    const date = new Date();
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = monthNames[date.getMonth()];
    const day = date.getDate();

    if (baseName) {
      return `${baseName} ${month}-${day}`;
    }

    return `Valuation Report ${month}-${day}`;
  }
}
