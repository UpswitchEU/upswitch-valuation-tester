/**
 * CompanyLookupService
 * 
 * Adapted from Ilara AI MCPChatService for company lookup workflow.
 * Provides simplified API for frontend consumption with business logic layer.
 * 
 * Features:
 * - Clean API abstraction
 * - Error recovery
 * - Conversation context management
 */

import { ValuationChatController, type CompanySearchResponse, type HealthStatus } from '../../controllers/chat/valuationChatController';
import type { CompanyFinancialData } from '../../types/registry';

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  companyData?: CompanyFinancialData;
}

export interface LookupResult {
  success: boolean;
  message: string;
  companyData?: CompanyFinancialData;
  searchResults?: CompanySearchResponse;
  error?: string;
}

export class CompanyLookupService {
  private controller: ValuationChatController;
  private conversationId: string | null = null;

  constructor() {
    this.controller = new ValuationChatController();
    console.log('💼 CompanyLookupService initialized');
  }

  /**
   * Process a user message (company name query)
   * Main entry point for company lookup
   */
  async processMessage(message: string, country: string = 'BE'): Promise<LookupResult> {
    const requestId = `lookup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    console.log(`💬 [${requestId}] Processing message:`, {
      messagePreview: message.substring(0, 100),
      country,
      timestamp: new Date().toISOString(),
    });

    try {
      // Step 1: Search for company
      const searchResponse = await this.controller.searchCompany(message, country);

      if (!searchResponse.success || searchResponse.results.length === 0) {
        console.warn(`⚠️ [${requestId}] No companies found`);
        return {
          success: false,
          message: `No companies found matching "${message}". Please try:\n• Exact company name\n• Registration number\n• Manual data entry`,
          searchResults: searchResponse,
        };
      }

      // Step 2: Get best match
      const bestMatch = searchResponse.results[0];
      console.log(`🎯 [${requestId}] Best match:`, {
        companyName: bestMatch.company_name,
        companyId: bestMatch.company_id,
      });

      // Step 3: Validate company ID
      if (!this.controller.isValidCompanyId(bestMatch.company_id, country)) {
        console.log(`⚠️ [${requestId}] Mock/suggestion result detected - data sources unavailable`);
        
        return {
          success: false,
          message: `Sorry, I couldn't find **"${message}"** in the official Belgian company registry.

**This might be because:**
• The company name is spelled differently in official records
• It's registered under a different legal name
• It's a subsidiary or trading name (not the parent company)
• The company hasn't filed recent accounts with KBO/BCE
• Data sources are temporarily unavailable

**What you can do:**
1. **Try the full legal name** (e.g., "Delhaize Group SA" not just "Delhaize")
2. **Use the company's VAT or KBO number** if you have it
3. **Switch to Manual Input** and enter the financials yourself

💡 **Tip:** You can find a company's official name at [kbopub.economie.fgov.be](https://kbopub.economie.fgov.be)`,
        };
      }

      // Step 4: Fetch financial data
      try {
        const financialData = await this.controller.getCompanyFinancials(
          bestMatch.company_id,
          country
        );

        console.log(`✅ [${requestId}] Company lookup complete:`, {
          companyName: financialData.company_name,
          yearsOfData: financialData.filing_history?.length || 0,
        });

        return {
          success: true,
          message: `Found ${financialData.company_name} with ${financialData.filing_history?.length || 0} years of financial data`,
          companyData: financialData,
          searchResults: searchResponse,
        };
      } catch (financialError) {
        console.error(`❌ [${requestId}] Financial data fetch failed:`, financialError);
        
        // Financial data fetch failed, but we still have the company info
        // Create a basic company data object with the search result
        const basicCompanyData: any = {
          company_id: bestMatch.company_id,
          company_name: bestMatch.company_name,
          registration_number: bestMatch.registration_number,
          country_code: bestMatch.country_code,
          legal_form: bestMatch.legal_form,
          address: bestMatch.address,
          website: bestMatch.website,
          status: bestMatch.status,
          filing_history: [], // Empty - no financial data available
          data_source: 'KBO Registry (no financial data)',
          completeness_score: 0.3, // Low score since no financials
        };
        
        console.log(`⚠️ [${requestId}] Returning company with no financial data - will trigger conversational input`);
        
        return {
          success: true, // Mark as success so frontend transitions to financial input
          message: `Found ${bestMatch.company_name}. Let's collect the financial data.`,
          companyData: basicCompanyData,
          searchResults: searchResponse,
          needsFinancialInput: true, // Flag to indicate financial input needed
        };
      }
    } catch (error) {
      console.error(`❌ [${requestId}] Lookup error:`, {
        error,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        success: false,
        message: `Failed to search for company. Please check your connection and try again.`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if the service is available
   * Adapted from Ilara's health monitoring
   */
  async checkHealth(): Promise<HealthStatus> {
    return this.controller.checkHealth();
  }

  /**
   * Generate a conversation ID for tracking
   */
  generateConversationId(): string {
    this.conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return this.conversationId;
  }

  /**
   * Get current conversation ID
   */
  getConversationId(): string | null {
    return this.conversationId;
  }
}
