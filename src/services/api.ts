import axios, { AxiosInstance } from 'axios';
import type {
  ValuationRequest,
  ValuationResponse,
  QuickValuationRequest,
  CompanyLookupResult,
  DocumentParseResult,
} from '../types/valuation';

class ValuationAPI {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_VALUATION_API_URL || 'http://localhost:8000',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // Health check
  async health(): Promise<{ status: string }> {
    const response = await this.client.get('/health');
    return response.data;
  }

  // Quick valuation
  async quickValuation(data: QuickValuationRequest): Promise<ValuationResponse> {
    const response = await this.client.post('/api/v1/valuation/quick', data);
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
}

export const valuationAPI = new ValuationAPI();
export const api = valuationAPI;

