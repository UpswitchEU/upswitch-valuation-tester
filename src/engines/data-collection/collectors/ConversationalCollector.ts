/**
 * Conversational Data Collector
 *
 * Single Responsibility: Handle data collection through AI chat extraction
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * Integrates with existing DataExtractor engine for natural language processing.
 */

import {
  DataField,
  DataResponse,
  DataCollector,
  CollectionContext,
  DataCollectionMethod,
  ValidationRule
} from '../../../types/data-collection';
import { ILogger } from '../../../services/container/interfaces/ILogger';
import { ServiceContainer } from '../../../services/container/ServiceContainer';

export class ConversationalCollector implements DataCollector {
  private logger: ILogger;

  constructor() {
    this.logger = ServiceContainer.getInstance().resolve<ILogger>('ILogger');
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
      // Extract data using the existing DataExtractor patterns
      const extractedData = await this.extractFromMessage(lastMessage, field, context);

      return {
        fieldId: field.id,
        value: extractedData.value,
        method: 'conversational',
        confidence: extractedData.confidence,
        source: 'ai_extraction',
        timestamp: new Date(),
        metadata: {
          extractionMethod: extractedData.method,
          originalMessage: lastMessage,
          extractionContext: context
        }
      };
    } catch (error) {
      this.logger.warn('Conversational data extraction failed', {
        fieldId: field.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      // Return a response indicating extraction failed
      return {
        fieldId: field.id,
        value: undefined,
        method: 'conversational',
        confidence: 0,
        source: 'ai_extraction',
        timestamp: new Date(),
        metadata: {
          extractionFailed: true,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      };
    }
  }

  private async extractFromMessage(
    message: string,
    field: DataField,
    context?: CollectionContext
  ): Promise<{ value: any; confidence: number; method: string }> {
    // This is a simplified version - in practice, this would integrate
    // with the existing DataExtractor engine

    // For now, return a basic extraction result
    // The real implementation would use the complex regex patterns
    // and AI extraction logic from the existing DataExtractor

    const extractionResult = this.simpleExtract(field, message);

    return {
      value: extractionResult.value,
      confidence: extractionResult.confidence,
      method: extractionResult.method
    };
  }

  private simpleExtract(field: DataField, message: string): { value: any; confidence: number; method: string } {
    // Simplified extraction logic - in practice, this would use
    // the sophisticated patterns from DataExtractor

    const lowerMessage = message.toLowerCase();

    switch (field.id) {
      case 'company_name':
        // Look for company names in quotes or after "company"
        const companyMatch = message.match(/(?:company|business|firm)\s+(?:name\s+)?(?:is\s+)?["']?([^"'\n]{2,50})["']?/i) ||
                             message.match(/^["']?([A-Z][a-zA-Z\s&]{1,49})["']?$/m);
        if (companyMatch) {
          return {
            value: companyMatch[1].trim(),
            confidence: 0.8,
            method: 'pattern_match'
          };
        }
        break;

      case 'revenue':
        // Look for revenue figures
        const revenueMatch = message.match(/(?:revenue|sales|turnover)[\s]*(?:of|is|was|were|are)[\s]*[:\-]?\s*(?:€|EUR)?\s*([\d,]+(?:\.\d{1,2})?)/i) ||
                             message.match(/€?\s*([\d,]+(?:\.\d{1,2})?)[\s]*(?:in|of)[\s]*(?:revenue|sales|turnover)/i);
        if (revenueMatch) {
          const revenueStr = revenueMatch[1].replace(/,/g, '');
          const revenue = parseFloat(revenueStr);
          if (!isNaN(revenue)) {
            return {
              value: revenue,
              confidence: 0.7,
              method: 'pattern_match'
            };
          }
        }
        break;

      case 'number_of_employees':
        // Look for employee counts
        const employeeMatch = message.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:employees?|people|team members?|staff)/i);
        if (employeeMatch) {
          const min = parseInt(employeeMatch[1]);
          const max = employeeMatch[2] ? parseInt(employeeMatch[2]) : min;
          const average = (min + max) / 2;
          return {
            value: Math.round(average),
            confidence: 0.6,
            method: 'pattern_match'
          };
        }
        break;
    }

    // No extraction possible
    return {
      value: undefined,
      confidence: 0,
      method: 'no_match'
    };
  }

  validate(field: DataField, value: any): ValidationRule[] {
    // Basic validation for conversational input
    const errors: ValidationRule[] = [];

    if (field.required && (value === undefined || value === null || value === '')) {
      errors.push({
        type: 'required',
        message: `${field.label} could not be extracted from your response`,
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
    const results = new Map<string, ValidationRule[]>();

    // Conversational validation is simpler - we mainly check if extraction succeeded
    for (const response of responses) {
      if (response.confidence === 0) {
        results.set(response.fieldId, [{
          type: 'custom',
          message: `Could not extract ${response.fieldId} from your response`,
          severity: 'warning'
        }]);
      }
    }

    return results;
  }

  supportsMethod(method: DataCollectionMethod): boolean {
    return method === 'conversational';
  }

  getCapabilities(): DataCollectionMethod[] {
    return ['conversational'];
  }
}