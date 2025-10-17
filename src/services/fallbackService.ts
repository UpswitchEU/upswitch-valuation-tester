/**
 * Fallback Service - Provides intelligent fallback responses when streaming fails
 * Inspired by IlaraAI Mercury fallback mechanisms
 */

interface FallbackResponse {
  message: string;
  nextField?: string;
  inputType?: 'text' | 'number' | 'select';
  options?: string[];
  helpText?: string;
  isComplete?: boolean;
}

interface ConversationState {
  collectedData: Record<string, any>;
  currentStep: number;
  sessionId: string;
  userInput: string;
}

class FallbackService {
  private fallbackResponses: Map<string, FallbackResponse[]> = new Map();
  private conversationStates: Map<string, ConversationState> = new Map();

  constructor() {
    this.initializeFallbackResponses();
  }

  private initializeFallbackResponses(): void {
    // Company name fallbacks
    this.fallbackResponses.set('company_name', [
      {
        message: "I'd like to help you get a business valuation. What's the name of your company?",
        nextField: 'company_name',
        inputType: 'text',
        helpText: 'Please provide your company\'s legal name'
      },
      {
        message: "Let's start with the basics. What company are we valuing today?",
        nextField: 'company_name',
        inputType: 'text',
        helpText: 'Enter your company\'s official name'
      }
    ]);

    // Revenue fallbacks
    this.fallbackResponses.set('revenue', [
      {
        message: "Great! Now I need to know your company's financial performance. What was your annual revenue last year?",
        nextField: 'revenue',
        inputType: 'number',
        helpText: 'Enter your annual revenue in euros (e.g., 500000)'
      },
      {
        message: "To calculate an accurate valuation, I need your revenue figures. What was your company's annual revenue?",
        nextField: 'revenue',
        inputType: 'number',
        helpText: 'Please provide your annual revenue in euros'
      }
    ]);

    // Industry fallbacks
    this.fallbackResponses.set('industry', [
      {
        message: "What industry is your company in?",
        nextField: 'industry',
        inputType: 'select',
        options: [
          'Technology',
          'Manufacturing',
          'Retail',
          'Services',
          'Healthcare',
          'Construction',
          'Hospitality',
          'Other'
        ],
        helpText: 'Select the industry that best describes your business'
      }
    ]);

    // Employee count fallbacks
    this.fallbackResponses.set('employee_count', [
      {
        message: "How many employees does your company have?",
        nextField: 'employee_count',
        inputType: 'select',
        options: ['1', '2-5', '6-10', '11-25', '26-50', '51-100', '100+'],
        helpText: 'Select the range that best fits your team size'
      }
    ]);

    // Business type fallbacks
    this.fallbackResponses.set('business_type', [
      {
        message: "What type of business structure do you have?",
        nextField: 'business_type',
        inputType: 'select',
        options: [
          'Sole Proprietorship',
          'Partnership',
          'Corporation',
          'LLC',
          'Other'
        ],
        helpText: 'Select your business structure'
      }
    ]);

    // Completion fallbacks
    this.fallbackResponses.set('complete', [
      {
        message: "Thank you! I have enough information to provide a valuation. Let me calculate that for you.",
        isComplete: true
      },
      {
        message: "Perfect! I have all the information I need. Your valuation will be ready shortly.",
        isComplete: true
      }
    ]);

    // General fallbacks
    this.fallbackResponses.set('general', [
      {
        message: "I'm here to help with your business valuation. Let me ask you a few questions to get started.",
        nextField: 'company_name',
        inputType: 'text',
        helpText: 'What\'s your company\'s name?'
      },
      {
        message: "I'll help you get a professional business valuation. Let's start with some basic information.",
        nextField: 'company_name',
        inputType: 'text',
        helpText: 'What\'s the name of your company?'
      }
    ]);
  }

  public getFallbackResponse(
    sessionId: string,
    userInput: string,
    currentField?: string
  ): FallbackResponse {
    const state = this.conversationStates.get(sessionId);
    
    // Determine what field we should ask about next
    const nextField = this.determineNextField(state, currentField);
    
    // Get appropriate fallback responses
    const responses = this.fallbackResponses.get(nextField) || 
                     this.fallbackResponses.get('general') || 
                     [{
                       message: "I'm here to help with your business valuation. What would you like to know?",
                       nextField: 'company_name',
                       inputType: 'text' as const,
                       helpText: 'Let\'s start with your company name'
                     }];
    
    // Select a random response for variety
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Update conversation state
    this.updateConversationState(sessionId, userInput, nextField);
    
    return selectedResponse;
  }

  private determineNextField(state: ConversationState | undefined, _currentField?: string): string {
    if (!state) {
      return 'company_name';
    }

    const { collectedData } = state;
    
    // Priority order for data collection
    const fieldPriority = [
      'company_name',
      'industry',
      'business_type',
      'revenue',
      'employee_count',
      'founded_year',
      'ebitda',
      'total_assets'
    ];

    // Find the first missing field
    for (const field of fieldPriority) {
      if (!collectedData[field]) {
        return field;
      }
    }

    // If all fields are collected, we're complete
    return 'complete';
  }

  private updateConversationState(sessionId: string, userInput: string, nextField: string): void {
    const existingState = this.conversationStates.get(sessionId);
    
    if (existingState) {
      // Update existing state
      existingState.userInput = userInput;
      existingState.currentStep += 1;
      
      // If we have a field name, store the user input
      if (nextField !== 'complete' && nextField !== 'general') {
        existingState.collectedData[nextField] = userInput;
      }
    } else {
      // Create new state
      this.conversationStates.set(sessionId, {
        collectedData: {},
        currentStep: 1,
        sessionId,
        userInput
      });
    }
  }

  public getConversationState(sessionId: string): ConversationState | undefined {
    return this.conversationStates.get(sessionId);
  }

  public clearConversationState(sessionId: string): void {
    this.conversationStates.delete(sessionId);
  }

  public isConversationComplete(sessionId: string): boolean {
    const state = this.conversationStates.get(sessionId);
    if (!state) return false;

    const requiredFields = ['company_name', 'revenue'];
    return requiredFields.every(field => state.collectedData[field]);
  }

  public getCollectedData(sessionId: string): Record<string, any> {
    const state = this.conversationStates.get(sessionId);
    return state?.collectedData || {};
  }

  public generateValuationEstimate(sessionId: string): string {
    const data = this.getCollectedData(sessionId);
    
    if (!data.revenue) {
      return "I need more financial information to provide an accurate valuation.";
    }

    const revenue = parseFloat(data.revenue);
    if (isNaN(revenue)) {
      return "I couldn't parse the revenue figure. Please provide a valid number.";
    }

    // Simple valuation estimate based on revenue
    let multiplier = 2; // Default multiplier
    
    // Adjust multiplier based on industry
    if (data.industry) {
      const industryMultipliers: Record<string, number> = {
        'Technology': 3,
        'Services': 2.5,
        'Manufacturing': 2,
        'Retail': 1.5,
        'Healthcare': 2.5,
        'Construction': 1.8,
        'Hospitality': 1.5
      };
      multiplier = industryMultipliers[data.industry] || 2;
    }

    // Adjust based on company size
    if (data.employee_count) {
      if (data.employee_count === '1') {
        multiplier *= 0.8; // Sole proprietor discount
      } else if (data.employee_count === '100+') {
        multiplier *= 1.2; // Large company premium
      }
    }

    const estimatedValue = revenue * multiplier;
    const minValue = estimatedValue * 0.8;
    const maxValue = estimatedValue * 1.2;

    return `Based on the information provided, I estimate your company's value to be between €${minValue.toLocaleString()} and €${maxValue.toLocaleString()}. This is a preliminary estimate based on revenue multiples. For a more accurate valuation, I would need additional financial details like EBITDA, assets, and debt.`;
  }
}

// Singleton instance
export const fallbackService = new FallbackService();

// Export types
export type { FallbackResponse, ConversationState };
