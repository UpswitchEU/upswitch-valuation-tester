import { api } from './api';
import type { 
  ConversationStepRequest, 
  ConversationStartResponse, 
  ConversationStepResponse, 
  ConversationContext,
  OwnerProfileRequest 
} from '../types/valuation';

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

export interface TriageStepRequest {
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
      const response: ConversationStartResponse = await api.startConversation(request);
      // Convert to TriageSession format
      return {
        session_id: response.session_id,
        complete: false,
        ai_message: response.welcome_message,
        step: 0,
        field_name: response.next_question.id,
        input_type: response.next_question.question_type,
        validation_rules: { required: response.next_question.required },
        help_text: response.next_question.help_text,
        context: { estimated_steps: response.estimated_steps },
        owner_profile_needed: false,
        valuation_result: response.current_valuation
      };
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
        answer: value,
        question_id: field,
        additional_context: contextData ? JSON.stringify(contextData) : undefined
      };
      
      const response: ConversationStepResponse = await api.conversationStep(request);
      
      // Convert to TriageSession format
      return {
        session_id: sessionId,
        complete: response.is_complete,
        ai_message: response.next_question?.question || 'Conversation complete',
        step: 0, // Will be updated based on progress
        field_name: response.next_question?.id,
        input_type: response.next_question?.question_type,
        validation_rules: { required: response.next_question?.required },
        help_text: response.next_question?.help_text,
        context: { 
          progress_percentage: response.progress_percentage,
          insights: response.insights,
          recommendations: response.recommendations
        },
        owner_profile_needed: false, // Will be determined by backend
        valuation_result: response.current_valuation
      };
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
      const response: ConversationContext = await api.getConversationContext(sessionId);
      
      // Convert to TriageSession format
      return {
        session_id: response.session_id,
        complete: response.current_step >= response.total_steps,
        ai_message: 'Continue conversation',
        step: response.current_step,
        field_name: undefined,
        input_type: undefined,
        validation_rules: {},
        help_text: undefined,
        context: {
          business_context: response.business_context,
          owner_profile: response.owner_profile,
          conversation_history: response.conversation_history,
          methodology_selected: response.methodology_selected
        },
        owner_profile_needed: false,
        valuation_result: undefined
      };
    } catch (error) {
      console.error('Failed to get triage context:', error);
      throw new Error('Failed to get conversation context');
    }
  },

  /**
   * Create owner profile for human factor in valuation
   */
  async createOwnerProfile(
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
      // Convert to OwnerProfile format
      const ownerProfile = {
        involvement_level: 'hands_on' as const,
        time_commitment: profileData.hours_per_week,
        succession_plan: profileData.succession_plan ? 'management' as const : 'none' as const,
        risk_tolerance: 'moderate' as const,
        growth_ambition: 'moderate_growth' as const,
        industry_experience: 5, // Default value
        management_team_strength: 'adequate' as const,
        key_man_risk: profileData.delegation_capability < 5,
        personal_guarantees: false,
        additional_context: profileData.succession_details
      };

      const request: OwnerProfileRequest = {
        profile: ownerProfile,
        business_context: {
          company_name: businessId,
          country_code: 'BE'
        }
      };

      const response = await api.submitOwnerProfile(request);
      return response;
    } catch (error) {
      console.error('Failed to create owner profile:', error);
      throw new Error('Failed to create owner profile');
    }
  }
};
