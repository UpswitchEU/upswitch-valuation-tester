/**
 * Maps backend event contexts to user-friendly typing messages
 * Used by TypingIndicator component to show contextual feedback
 */

interface TypingMessages {
  [key: string]: string;
}

const TYPING_MESSAGES: TypingMessages = {
  // Data analysis phase
  analyzing_financials: 'Analyzing your financial data...',
  analyzing_revenue: 'Analyzing revenue patterns...',
  analyzing_expenses: 'Reviewing expense structure...',
  analyzing_growth: 'Calculating growth metrics...',
  
  // Valuation calculation phase
  calculating_dcf: 'Running DCF valuation model...',
  calculating_multiples: 'Comparing market multiples...',
  calculating_asset_value: 'Calculating asset-based value...',
  calculating_risk: 'Assessing risk factors...',
  
  // Report generation phase
  generating_report: 'Generating your valuation report...',
  generating_insights: 'Creating insights and recommendations...',
  generating_charts: 'Building visualization charts...',
  
  // Industry analysis
  analyzing_industry: 'Analyzing industry benchmarks...',
  comparing_peers: 'Comparing with peer companies...',
  
  // Owner dependency assessment
  analyzing_owner_dependency: 'Evaluating owner dependency factors...',
  calculating_adjustments: 'Calculating valuation adjustments...',
  
  // General processing
  processing: 'Processing your request...',
  thinking: 'AI is thinking...',
};

const THINKING_MESSAGES: TypingMessages = {
  // Input processing
  analyzing_input: 'Analyzing your business...',
  extracting_data: 'Processing your information...',
  validating: 'Validating data...',
  
  // Business analysis
  analyzing_business_type: 'Understanding your business model...',
  analyzing_market: 'Researching market conditions...',
  
  // Calculation preparation
  calculating: 'Running calculations...',
  preparing_valuation: 'Preparing valuation models...',
  
  // Default
  default: 'AI is thinking...',
};

/**
 * Get user-friendly typing message based on backend context
 * @param context - Backend event context (e.g., "analyzing_financials")
 * @returns User-friendly message to display
 */
export const getTypingMessage = (context?: string): string => {
  if (!context) {
    return 'AI is typing...';
  }
  
  // Return mapped message or default
  return TYPING_MESSAGES[context] || 'AI is typing...';
};

/**
 * Get user-friendly thinking message based on backend context
 * @param context - Backend event context (e.g., "analyzing_input")
 * @returns User-friendly message to display
 */
export const getThinkingMessage = (context?: string): string => {
  if (!context) {
    return THINKING_MESSAGES.default;
  }
  
  // Return mapped message or default
  return THINKING_MESSAGES[context] || THINKING_MESSAGES.default;
};

/**
 * Check if a context represents a long-running operation
 * Used to adjust timeout behavior
 */
export const isLongRunningContext = (context?: string): boolean => {
  const longRunningContexts = [
    'calculating_dcf',
    'calculating_multiples',
    'generating_report',
    'analyzing_industry',
  ];
  
  return context ? longRunningContexts.includes(context) : false;
};

