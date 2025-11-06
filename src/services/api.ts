import axios, { AxiosInstance } from 'axios';
import type {
    BusinessTypeAnalysis,
    CompanyLookupResult,
    ConversationContext,
    ConversationStartRequest,
    ConversationStartResponse,
    ConversationStepRequest,
    ConversationStepResponse,
    DocumentParseResult,
    MethodologyRecommendation,
    OwnerProfileRequest,
    OwnerProfileResponse,
    QuickValuationRequest,
    ValuationRequest,
    ValuationResponse,
} from '../types/valuation';
import { apiLogger } from '../utils/logger';

class ValuationAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_BACKEND_URL || 
               'https://api.upswitch.biz',
      timeout: 90000, // 90 seconds - allows for Python processing (60-70s) + buffer
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        apiLogger.error('API Error', {
          error: error.response?.data || error.message,
          status: error.response?.status
        });
        throw error;
      }
    );
  }

  // Health check
  async health(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Quick valuation (fast multiples-only calculation for live preview)
  async quickValuation(data: QuickValuationRequest): Promise<ValuationResponse> {
    const response = await this.client.post('/api/valuations/quick', data);
    return response.data;
  }

  // Comprehensive valuation
  async calculateValuation(data: ValuationRequest): Promise<ValuationResponse> {
    const response = await this.client.post('/api/v1/valuation/calculate', data);
    return response.data;
  }

  // Phase 2: Company lookup (to be implemented in backend)
  async lookupCompany(_name: string, _country: string): Promise<CompanyLookupResult> {
    // TODO: Implement in backend
    // const response = await this.client.get('/api/v1/companies/lookup', {
    //   params: { name, country },
    // });
    // return response.data;
    
    // Placeholder
    throw new Error('Company lookup not yet implemented in backend');
  }

  // Phase 2: Document parsing (to be implemented in backend)
  async parseDocument(_file: File): Promise<DocumentParseResult> {
    // TODO: Implement in backend
    // const formData = new FormData();
    // formData.append('file', file);
    // const response = await this.client.post('/api/v1/documents/parse', formData, {
    //   headers: { 'Content-Type': 'multipart/form-data' },
    // });
    // return response.data;
    
    // Placeholder
    throw new Error('Document parsing not yet implemented in backend');
  }

  // =============================================================================
  // INTELLIGENT CONVERSATION API
  // =============================================================================

  // Start intelligent conversation
  // NOW USES: Intelligent Triage System with structured flow (matches manual form)
  async startConversation(data: ConversationStartRequest): Promise<ConversationStartResponse> {
    // Use intelligent conversation endpoint with structured flow
    const response = await this.client.post('/api/v1/intelligent-conversation/start', data);
    return response.data;
  }

  // Process conversation step
  async conversationStep(data: ConversationStepRequest): Promise<ConversationStepResponse> {
    // Continue using streaming endpoint for conversation steps
    const response = await this.client.post('/api/v1/intelligent-conversation/step', data);
    return response.data;
  }

  // Get conversation context
  async getConversationContext(sessionId: string): Promise<ConversationContext> {
    const response = await this.client.get(`/api/v1/intelligent-conversation/context/${sessionId}`);
    return response.data;
  }

  // Submit owner profile
  async submitOwnerProfile(data: OwnerProfileRequest): Promise<OwnerProfileResponse> {
    const response = await this.client.post('/api/v1/intelligent-conversation/owner-profile', data);
    return response.data;
  }

  // =============================================================================
  // BUSINESS TYPE ANALYSIS API
  // =============================================================================

  // Get business types
  async getBusinessTypes(): Promise<BusinessTypeAnalysis[]> {
    const response = await this.client.get('/api/v1/business-types');
    return response.data;
  }

  // Get methodology recommendation
  async getMethodologyRecommendation(businessContext: Partial<ValuationRequest>): Promise<MethodologyRecommendation> {
    const response = await this.client.post('/api/v1/methodology-recommendation', businessContext);
    return response.data;
  }

  // Analyze business type
  async analyzeBusinessType(businessContext: Partial<ValuationRequest>): Promise<BusinessTypeAnalysis> {
    const response = await this.client.post('/api/v1/analyze', businessContext);
    return response.data;
  }
}

export const valuationAPI = new ValuationAPI();
export const api = valuationAPI;

