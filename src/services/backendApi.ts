/**
 * Backend API Service - Refactored Orchestrator
 *
 * Bank-Grade Excellence Framework Implementation:
 * - Single Responsibility: Orchestrate focused API services
 * - SOLID Principles: Dependency Inversion, Interface Segregation
 * - Clean Architecture: Thin orchestrator, focused services
 *
 * BEFORE: 993-line monolithic class with mixed responsibilities
 * AFTER:  150-line orchestrator coordinating 5 focused services
 *
 * Services:
 * - ValuationAPI: All valuation calculation operations
 * - ReportAPI: Report CRUD and download operations
 * - SessionAPI: Valuation session lifecycle management
 * - CreditAPI: Credit status and usage tracking
 * - UtilityAPI: Health checks and utility operations
 */

import { ValuationRequest, ValuationResponse } from '../types/valuation';
import type {
  ValuationSessionResponse,
  CreateValuationSessionResponse,
  UpdateValuationSessionResponse,
  SwitchViewResponse,
  SaveValuationResponse,
  GuestMigrationResponse,
  ConversationStatusResponse,
  ConversationHistoryResponse
} from '../types/api-responses';
import { ValuationAPI } from './api/valuation';
import { ReportAPI } from './api/report';
import { SessionAPI } from './api/session';
import { CreditAPI } from './api/credit';
import { UtilityAPI } from './api/utility';
import { APIRequestConfig } from './api/HttpClient';

/**
 * Refactored BackendAPI - Clean orchestrator for API operations
 *
 * This maintains the same external interface while internally
 * delegating to focused, single-responsibility services.
 */
class BackendAPI {
  // Modular API services
  private valuationAPI: ValuationAPI;
  private reportAPI: ReportAPI;
  private sessionAPI: SessionAPI;
  private creditAPI: CreditAPI;
  private utilityAPI: UtilityAPI;

  constructor() {
    // Initialize all API services
    this.valuationAPI = new ValuationAPI();
    this.reportAPI = new ReportAPI();
    this.sessionAPI = new SessionAPI();
    this.creditAPI = new CreditAPI();
    this.utilityAPI = new UtilityAPI();
  }

  // ===== VALUATION OPERATIONS =====

  async calculateManualValuation(data: ValuationRequest, options?: APIRequestConfig): Promise<ValuationResponse> {
    return this.valuationAPI.calculateManualValuation(data, options);
  }

  async calculateAIGuidedValuation(data: ValuationRequest): Promise<ValuationResponse> {
    return this.valuationAPI.calculateAIGuidedValuation(data);
  }

  async calculateInstantValuation(data: ValuationRequest): Promise<ValuationResponse> {
    return this.valuationAPI.calculateInstantValuation(data);
  }

  async calculateValuationForReport(data: ValuationRequest): Promise<ValuationResponse> {
    return this.valuationAPI.calculateValuationUnified(data);
  }

  async calculateValuation(data: ValuationRequest): Promise<ValuationResponse> {
    return this.valuationAPI.calculateValuationUnified(data);
  }

  async calculateValuationUnified(data: ValuationRequest, options?: APIRequestConfig): Promise<ValuationResponse> {
    return this.valuationAPI.calculateValuationUnified(data, options);
  }

  async generatePreviewHtml(data: ValuationRequest): Promise<{ html: string; completeness_percent: number }> {
    return this.valuationAPI.generatePreviewHtml(data);
  }

  // ===== REPORT OPERATIONS =====

  async getReport(reportId: string): Promise<ValuationResponse> {
    return this.reportAPI.getReport(reportId);
  }

  async updateReport(reportId: string, data: Partial<ValuationRequest>): Promise<ValuationResponse> {
    return this.reportAPI.updateReport(reportId, data);
  }

  async deleteReport(reportId: string): Promise<{ success: boolean }> {
    return this.reportAPI.deleteReport(reportId);
  }

  async downloadAccountantViewPDF(reportId: string): Promise<Blob> {
    return this.reportAPI.downloadAccountantViewPDF(reportId);
  }

  // ===== SESSION OPERATIONS =====

  async getValuationSession(reportId: string): Promise<ValuationSessionResponse> {
    return this.sessionAPI.getValuationSession(reportId);
  }

  async createValuationSession(session: Partial<ValuationRequest>): Promise<CreateValuationSessionResponse> {
    return this.sessionAPI.createValuationSession(session);
  }

  async updateValuationSession(reportId: string, updates: Partial<ValuationSession>): Promise<UpdateValuationSessionResponse> {
    return this.sessionAPI.updateValuationSession(reportId, updates);
  }

  async switchValuationView(reportId: string, view: 'manual' | 'conversational'): Promise<SwitchViewResponse> {
    return this.sessionAPI.switchValuationView(reportId, view);
  }

  // ===== CREDIT OPERATIONS =====

  async getCreditStatus(): Promise<{ creditsRemaining: number; isPremium: boolean }> {
    return this.creditAPI.getCreditStatus();
  }

  async saveValuation(data: ValuationResponse): Promise<SaveValuationResponse> {
    return this.creditAPI.saveValuation(data);
  }

  // ===== UTILITY OPERATIONS =====

  async health(): Promise<{ status: string }> {
    return this.utilityAPI.health();
  }

  async migrateGuestData(guestSessionId: string): Promise<GuestMigrationResponse> {
    return this.utilityAPI.migrateGuestData(guestSessionId);
  }

  async getConversationStatus(sessionId: string): Promise<ConversationStatusResponse> {
    return this.utilityAPI.getConversationStatus(sessionId);
  }

  async getConversationHistory(conversationId: string, signal?: AbortSignal): Promise<ConversationHistoryResponse> {
    return this.utilityAPI.getConversationHistory(conversationId, signal);
  }

  // ===== CLEANUP =====

  /**
   * Clean up all API service resources
   */
  cleanup(): void {
    this.valuationAPI.cleanup();
    this.reportAPI.cleanup();
    this.sessionAPI.cleanup();
    this.creditAPI.cleanup();
    this.utilityAPI.cleanup();
  }
}

// Export singleton instance
export const backendAPI = new BackendAPI();