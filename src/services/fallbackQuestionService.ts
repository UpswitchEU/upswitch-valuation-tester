export interface FallbackQuestion {
  question: string;
  field: string;
  inputType: 'number' | 'text' | 'select' | 'boolean';
  validation?: {
    min?: number;
    max?: number;
    required?: boolean;
  };
  helpText?: string;
}

export const fallbackQuestionService = {
  getQuestionSequence(businessType?: string, industry?: string): FallbackQuestion[] {
    const baseQuestions: FallbackQuestion[] = [
      {
        question: "What was your annual revenue last year? (in EUR)",
        field: "revenue",
        inputType: "number",
        validation: { min: 0, required: true },
        helpText: "Your total income before expenses"
      },
      {
        question: "What was your EBITDA? (in EUR)",
        field: "ebitda",
        inputType: "number",
        validation: { min: 0, required: true },
        helpText: "Earnings before interest, taxes, depreciation, and amortization"
      },
      {
        question: "How many employees does your company have?",
        field: "employees",
        inputType: "number",
        validation: { min: 0, required: true },
        helpText: "Full-time equivalent employees"
      }
    ];
    
    // Add industry-specific questions
    if (industry === 'technology' || businessType === 'saas') {
      baseQuestions.push({
        question: "What percentage of your revenue is recurring? (%)",
        field: "recurring_revenue_percentage",
        inputType: "number",
        validation: { min: 0, max: 100 },
        helpText: "Monthly or annual subscriptions as % of total revenue"
      });
    }
    
    if (industry === 'retail' || businessType === 'ecommerce') {
      baseQuestions.push({
        question: "What is your average inventory turnover rate?",
        field: "inventory_turnover",
        inputType: "number",
        validation: { min: 0 },
        helpText: "How many times per year you sell and replace inventory"
      });
    }
    
    if (industry === 'manufacturing') {
      baseQuestions.push({
        question: "What is your production capacity (units per month)?",
        field: "production_capacity",
        inputType: "number",
        validation: { min: 0 },
        helpText: "Maximum units you can produce per month"
      });
    }
    
    if (industry === 'services' || businessType === 'consulting') {
      baseQuestions.push({
        question: "What is your average hourly rate? (in EUR)",
        field: "hourly_rate",
        inputType: "number",
        validation: { min: 0 },
        helpText: "Your standard billing rate per hour"
      });
    }
    
    return baseQuestions;
  },
  
  getNextQuestion(
    collectedData: Record<string, any>,
    businessType?: string,
    industry?: string
  ): FallbackQuestion | null {
    const sequence = this.getQuestionSequence(businessType, industry);
    return sequence.find(q => !(q.field in collectedData)) || null;
  },

  /**
   * Get all remaining questions for progress tracking
   */
  getRemainingQuestions(
    collectedData: Record<string, any>,
    businessType?: string,
    industry?: string
  ): FallbackQuestion[] {
    const sequence = this.getQuestionSequence(businessType, industry);
    return sequence.filter(q => !(q.field in collectedData));
  },

  /**
   * Get progress percentage
   */
  getProgressPercentage(
    collectedData: Record<string, any>,
    businessType?: string,
    industry?: string
  ): number {
    const sequence = this.getQuestionSequence(businessType, industry);
    const completed = sequence.filter(q => q.field in collectedData).length;
    return Math.round((completed / sequence.length) * 100);
  },

  /**
   * Validate user input based on question validation rules
   */
  validateInput(value: any, question: FallbackQuestion): { valid: boolean; error?: string } {
    if (question.validation?.required && (!value || value === '')) {
      return { valid: false, error: 'This field is required' };
    }

    if (question.inputType === 'number' && value !== null && value !== undefined) {
      const numValue = parseFloat(value);
      if (isNaN(numValue)) {
        return { valid: false, error: 'Please enter a valid number' };
      }

      if (question.validation?.min !== undefined && numValue < question.validation.min) {
        return { valid: false, error: `Value must be at least ${question.validation.min}` };
      }

      if (question.validation?.max !== undefined && numValue > question.validation.max) {
        return { valid: false, error: `Value must be at most ${question.validation.max}` };
      }
    }

    return { valid: true };
  }
};
