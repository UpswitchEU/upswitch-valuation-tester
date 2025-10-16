import { api } from './api';
import type { BusinessProfileData } from './businessDataService';

export interface TriageSession {
  session_id: string;
  complete: boolean;
  ai_message: string;
  step: number;
  field_name?: string;
  input_type?: string;
  validation_rules?: Record<string, any>;
  help_text?: string;
  context: Record<string, any>;
  owner_profile_needed: boolean;
  valuation_result?: any;
}

export interface StartTriageRequest {
  user_id?: string;
  company_id?: string;
  business_type?: string;
  industry?: string;
  country_code?: string;
  business_context?: Record<string, any>;
  pre_filled_data?: Record<string, any>;
  user_preferences?: Record<string, any>;
}

export interface ConversationStepRequest {
  session_id: string;
  field: string;
  value: any;
  context_data?: Record<string, any>;
}

export const intelligentTriageService = {
  /**
   * Start intelligent conversation with pre-filled business data
   */
  async startConversation(request: StartTriageRequest): Promise<TriageSession> {
    try {
      const response = await api.post('/api/intelligent-conversation/start', request);
      return response.data;
    } catch (error) {
      console.error('Failed to start triage conversation:', error);
      throw new Error('Failed to start intelligent conversation');
    }
  },

  /**
   * Process conversation step with user response
   */
  async processStep(
    sessionId: string, 
    field: string, 
    value: any,
    contextData?: Record<string, any>
  ): Promise<TriageSession> {
    try {
      const request: ConversationStepRequest = {
        session_id: sessionId,
        field,
        value,
        context_data: contextData
      };
      
      const response = await api.post('/api/intelligent-conversation/step', request);
      return response.data;
    } catch (error) {
      console.error('Failed to process triage step:', error);
      throw new Error('Failed to process conversation step');
    }
  },

  /**
   * Get current conversation context
   */
  async getContext(sessionId: string): Promise<TriageSession> {
    try {
      const response = await api.get(`/api/intelligent-conversation/context/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to get triage context:', error);
      throw new Error('Failed to get conversation context');
    }
  },

  /**
   * Create owner profile for human factor in valuation
   */
  async createOwnerProfile(
    userId: string,
    businessId: string,
    profileData: {
      hours_per_week: number;
      primary_tasks: string[];
      delegation_capability: number;
      succession_plan: boolean;
      succession_details?: string;
    }
  ): Promise<any> {
    try {
      const response = await api.post('/api/intelligent-conversation/owner-profile', {
        user_id: userId,
        business_id: businessId,
        ...profileData
      });
      return response.data;
    } catch (error) {
      console.error('Failed to create owner profile:', error);
      throw new Error('Failed to create owner profile');
    }
  }
};
