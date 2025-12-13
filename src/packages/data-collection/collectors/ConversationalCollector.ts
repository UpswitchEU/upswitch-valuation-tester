/**
 * @package @upswitch/data-collection
 *
 * Conversational Data Collector - Handles AI chat-based data extraction.
 */

import type {
  CollectionContext,
  DataCollectionMethod,
  DataCollector,
  DataField,
  DataResponse,
  ValidationRule
} from '../types';

/**
 * ConversationalCollector handles data collection through AI chat extraction.
 * Processes natural language responses to extract structured data.
 */
export class ConversationalCollector implements DataCollector {
  constructor() {
    // No dependencies required - can be used standalone
  }

  async collect(field: DataField, context?: CollectionContext): Promise<DataResponse> {
    if (!context?.conversationHistory?.length) {
      throw new Error('Conversation history required for conversational collection');
    }

    // Use the last message from conversation history
    const lastMessage = context.conversationHistory[context.conversationHistory.length - 1];

    if (!lastMessage || typeof lastMessage !== 'string') {
      throw new Error('Invalid conversation message');
    }

    try {
      // Extract data from the message
      const extractedData = await this.extractFromMessage(lastMessage, field, context);

      return {
        fieldId: field.id,
        value: extractedData.value,
        method: 'conversational',
        confidence: extractedData.confidence,
        source: 'ai_extraction',
        timestamp: new Date(),
        metadata: {
          originalMessage: lastMessage,
          extractionMethod: extractedData.method,
          context: context
        }
      };
    } catch (error) {
      // Fallback: return a placeholder response indicating manual intervention needed
      return {
        fieldId: field.id,
        value: undefined,
        method: 'conversational',
        confidence: 0.0,
        source: 'ai_extraction_failed',
        timestamp: new Date(),
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          requiresManualReview: true,
          originalMessage: lastMessage
        }
      };
    }
  }

  validate(field: DataField, value: any): ValidationRule[] {
    // Conversational data gets validated by the AI extraction process
    // Additional validation could be added here if needed
    const errors: ValidationRule[] = [];

    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({
        type: 'required',
        message: `${field.label} is required`,
        severity: 'error'
      });
    }

    return errors;
  }

  async collectMultiple(fields: DataField[], context?: CollectionContext): Promise<DataResponse[]> {
    const responses: DataResponse[] = [];

    for (const field of fields) {
      const response = await this.collect(field, context);
      responses.push(response);
    }

    return responses;
  }

  validateMultiple(responses: DataResponse[]): Map<string, ValidationRule[]> {
    const errors = new Map<string, ValidationRule[]>();

    for (const response of responses) {
      // For conversational collection, validation is minimal since AI handles it
      const fieldErrors: ValidationRule[] = [];

      if (response.confidence < 0.5) {
        fieldErrors.push({
          type: 'custom',
          message: 'Low confidence in extracted data - please review',
          severity: 'warning'
        });
      }

      if (fieldErrors.length > 0) {
        errors.set(response.fieldId, fieldErrors);
      }
    }

    return errors;
  }

  supportsMethod(method: DataCollectionMethod): boolean {
    return method === 'conversational';
  }

  getCapabilities(): DataCollectionMethod[] {
    return ['conversational'];
  }

  // Helper method for extracting data from messages
  private async extractFromMessage(
    message: string,
    field: DataField,
    context?: CollectionContext
  ): Promise<{ value: any; confidence: number; method: string }> {
    // This is a simplified implementation
    // In a real implementation, this would use NLP/AI processing

    const lowerMessage = message.toLowerCase().trim();

    switch (field.id) {
      case 'company_name':
        // Simple extraction - look for company-like patterns
        const companyPatterns = [
          /(?:my company is|company name is|business name is)\s+([^.!?]+)/i,
          /(?:called|named)\s+([^.!?]+)/i,
          /^([^.!?]+)$/  // fallback: whole message
        ];

        for (const pattern of companyPatterns) {
          const match = message.match(pattern);
          if (match && match[1]) {
            return {
              value: match[1].trim(),
              confidence: 0.8,
              method: 'pattern_matching'
            };
          }
        }
        break;

      case 'revenue':
        // Extract revenue numbers
        const revenuePatterns = [
          /(?:revenue|sales|turnover)(?:\s+(?:is|was|of))?\s*€?([\d,]+(?:\.\d+)?)\s*(k|m|million|billion)?/i,
          /€([\d,]+(?:\.\d+)?)\s*(k|m|million|billion)?/i
        ];

        for (const pattern of revenuePatterns) {
          const match = lowerMessage.match(pattern);
          if (match && match[1]) {
            let value = parseFloat(match[1].replace(/,/g, ''));
            const multiplier = match[2]?.toLowerCase();

            if (multiplier === 'k') value *= 1000;
            else if (multiplier === 'm' || multiplier === 'million') value *= 1000000;
            else if (multiplier === 'billion') value *= 1000000000;

            return {
              value: Math.round(value),
              confidence: 0.9,
              method: 'numeric_extraction'
            };
          }
        }
        break;

      case 'number_of_employees':
        // Extract employee numbers
        const employeePatterns = [
          /(?:employees?|staff|team)(?:\s+(?:is|are|has))?\s*(\d+)(?:\s*-\s*(\d+))?/i,
          /(\d+)\s+(?:employees?|staff|team)/i
        ];

        for (const pattern of employeePatterns) {
          const match = lowerMessage.match(pattern);
          if (match && match[1]) {
            const min = parseInt(match[1]);
            const max = match[2] ? parseInt(match[2]) : min;
            const value = Math.round((min + max) / 2);

            return {
              value: value,
              confidence: 0.85,
              method: 'numeric_extraction'
            };
          }
        }
        break;
    }

    // Fallback: low confidence extraction
    return {
      value: message,
      confidence: 0.3,
      method: 'fallback'
    };
  }
}