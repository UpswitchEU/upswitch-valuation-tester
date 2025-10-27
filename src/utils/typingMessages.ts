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

/**
 * Get user-friendly typing message based on backend context
 * @param context - Backend event context (e.g., "analyzing_financials")
 * @returns User-friendly message to display
 */
export const getTypingMessage = (context?: string): string => {
  if (!context) {
    return 'AI is thinking...';
  }
  
  // Return mapped message or default
  return TYPING_MESSAGES[context] || 'AI is thinking...';
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

