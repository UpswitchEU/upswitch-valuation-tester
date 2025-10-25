/**
 * Typing Animation Utilities
 * 
 * Helper functions for calculating typing speeds, detecting punctuation,
 * and managing animation timing.
 */

export interface TypingSpeedConfig {
  fast: number;      // 30ms - Quick responses
  normal: number;    // 50ms - Standard responses  
  thoughtful: number; // 70ms - Complex content
}

export const DEFAULT_SPEED_CONFIG: TypingSpeedConfig = {
  fast: 30,
  normal: 50,
  thoughtful: 70
};

/**
 * Calculate adaptive typing speed based on content
 */
export const calculateTypingSpeed = (
  content: string, 
  currentIndex: number,
  config: TypingSpeedConfig = DEFAULT_SPEED_CONFIG
): number => {
  const remainingLength = content.length - currentIndex;
  const currentChar = content[currentIndex];
  
  // Speed up near end of message
  if (remainingLength < 50) return config.fast;
  
  // Slow down for important financial content
  if (content.includes('valuation') || 
      content.includes('€') || 
      content.includes('million') ||
      content.includes('revenue') ||
      content.includes('profit')) {
    return config.thoughtful;
  }
  
  // Slow down for numbers and technical content
  if (currentChar && /[0-9€$%]/.test(currentChar)) {
    return config.thoughtful;
  }
  
  // Slow down for long sentences (more thoughtful)
  const sentenceLength = content.substring(0, currentIndex).split('.').pop()?.length || 0;
  if (sentenceLength > 100) return config.thoughtful;
  
  return config.normal;
};

/**
 * Check if character should trigger a pause
 */
export const shouldPauseAtChar = (char: string): boolean => {
  return /[.,:\n]/.test(char);
};

/**
 * Get pause delay for specific punctuation
 */
export const getPauseDelay = (char: string): number => {
  const pauses: Record<string, number> = { 
    '.': 200, 
    ',': 100, 
    '\n': 150, 
    ':': 120 
  };
  return pauses[char] || 0;
};

/**
 * Detect if content contains important financial information
 */
export const isFinancialContent = (content: string): boolean => {
  const financialKeywords = [
    'valuation', 'revenue', 'profit', 'income', 'assets', 'liabilities',
    '€', '$', 'million', 'billion', 'thousand', 'cash flow',
    'EBITDA', 'P/E', 'DCF', 'comparable', 'market cap'
  ];
  
  return financialKeywords.some(keyword => 
    content.toLowerCase().includes(keyword.toLowerCase())
  );
};

/**
 * Get optimal speed for content type
 */
export const getContentSpeed = (
  content: string, 
  config: TypingSpeedConfig = DEFAULT_SPEED_CONFIG
): number => {
  if (content.length < 50) return config.fast;
  if (isFinancialContent(content)) return config.thoughtful;
  return config.normal;
};

/**
 * Smooth scroll to element during typing
 */
export const smoothScrollToElement = (element: HTMLElement | null) => {
  if (!element) return;
  
  element.scrollIntoView({ 
    behavior: 'smooth',
    block: 'end',
    inline: 'nearest'
  });
};

/**
 * Debounce function for performance optimization
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};
