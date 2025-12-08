/**
 * Utility functions for parsing Business Type suggestions from messages
 * Similar to KBO parsing but for business types from PostgreSQL database
 */

export interface BusinessTypeSuggestion {
  number: number;
  id: string;
  title: string;
  description?: string;
  industry?: string;
  category?: string;
  icon?: string;
}

/**
 * Parses a clarification message to extract numbered business type suggestions
 * Pattern: "1. Full-Service Restaurant" or "1. 🍴 Full-Service Restaurant"
 */
export function parseBusinessTypeSuggestions(message: string): BusinessTypeSuggestion[] {
  const suggestions: BusinessTypeSuggestion[] = [];
  
  // Pattern to match: "1. Title" or "1. 🍴 Title"
  // Backend format: "1. Full-Service Restaurant"
  const pattern = /(\d+)\.\s+(.+?)(?:\n|$)/g;
  
  let match;
  while ((match = pattern.exec(message)) !== null) {
    const fullText = match[2].trim();
    
    // Skip if it's not a real business type (too short or contains question text)
    if (fullText.length > 1 && !fullText.toLowerCase().includes('best describes')) {
      // Extract emoji if present (first character)
      const firstChar = fullText.charAt(0);
      const hasEmoji = /[\u{1F300}-\u{1F9FF}]/u.test(firstChar);
      
      const title = hasEmoji ? fullText.slice(1).trim() : fullText;
      const icon = hasEmoji ? firstChar : undefined;
      
      suggestions.push({
        number: parseInt(match[1], 10),
        id: match[1], // Use number as id
        title: title,
        icon: icon
      });
    }
  }
  
  return suggestions;
}

/**
 * Detects if a message contains business type suggestions
 */
export function hasBusinessTypeSuggestions(message: string): boolean {
  // Check for business type keywords and numbered list pattern
  const hasBusinessTypeKeyword = /business type|Which one best describes/i.test(message);
  const hasNumberedList = /\d+\.\s+.+?(?:\n|$)/i.test(message);
  
  return hasBusinessTypeKeyword && hasNumberedList;
}
