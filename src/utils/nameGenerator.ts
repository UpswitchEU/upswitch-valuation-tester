/**
 * Unique Report Name Generator
 * Based on Ilara Mercury's algorithm for generating unique report names
 */
export class NameGenerator {
  private static readonly valuationWords = [
    'Value',
    'Worth',
    'Price',
    'Estimate',
    'Assessment',
    'Analysis',
    'Evaluation',
    'Appraisal',
    'Valuation',
    'Calculation',
    'Projection',
    'Forecast',
    'Insight',
    'Report',
    'Summary',
    'Overview'
  ];

  private static readonly businessWords = [
    'Business',
    'Company',
    'Enterprise',
    'Corporation',
    'Firm',
    'Organization',
    'Venture',
    'Startup',
    'SME',
    'Entity',
    'Operation',
    'Practice',
    'Service',
    'Solution',
    'Platform'
  ];

  private static readonly qualityWords = [
    'Professional',
    'Comprehensive',
    'Detailed',
    'Advanced',
    'Strategic',
    'Financial',
    'Market',
    'Industry',
    'Expert',
    'Premium',
    'Complete',
    'Thorough',
    'Accurate',
    'Reliable',
    'Precise'
  ];

  /**
   * Generate a unique valuation report name based on a seed
   */
  static generateValuationName(seed?: string): string {
    const seedSource = seed || Date.now().toString();
    
    // Create a hash from the seed
    let hashSum = 0;
    for (let i = 0; i < seedSource.length; i++) {
      hashSum += seedSource.charCodeAt(i) * (i + 1);
    }

    // Select words based on hash
    const valuationWord = this.valuationWords[hashSum % this.valuationWords.length];
    const businessWord = this.businessWords[(hashSum * 2) % this.businessWords.length];
    const qualityWord = this.qualityWords[(hashSum * 3) % this.qualityWords.length];

    // Generate a number suffix (1-99)
    const numberSuffix = (hashSum % 99) + 1;

    return `${qualityWord} ${businessWord} ${valuationWord} ${numberSuffix}`;
  }

  /**
   * Generate a unique name with custom categories
   */
  static generateCustomName(
    categories: string[][],
    seed?: string
  ): string {
    const seedSource = seed || Date.now().toString();
    
    let hashSum = 0;
    for (let i = 0; i < seedSource.length; i++) {
      hashSum += seedSource.charCodeAt(i) * (i + 1);
    }

    const words = categories.map((category, index) => {
      const categoryHash = (hashSum * (index + 1)) % category.length;
      return category[categoryHash];
    });

    const numberSuffix = (hashSum % 99) + 1;
    return `${words.join(' ')} ${numberSuffix}`;
  }

  /**
   * Generate a name based on company name
   */
  static generateFromCompany(companyName: string): string {
    if (!companyName) {
      return this.generateValuationName();
    }

    // Clean company name for seed
    const cleanName = companyName
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .substring(0, 10);

    return this.generateValuationName(cleanName);
  }

  /**
   * Generate a name based on valuation method
   */
  static generateFromMethod(method: string): string {
    if (!method) {
      return this.generateValuationName();
    }

    const methodWords = method.split(' ').join('');
    return this.generateValuationName(methodWords);
  }

  /**
   * Generate a name with date context
   */
  static generateWithDate(baseName?: string): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();

    const dateSeed = `${year}${month}${day}`;
    const baseSeed = baseName ? `${baseName}${dateSeed}` : dateSeed;

    return this.generateValuationName(baseSeed);
  }
}
