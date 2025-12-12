/**
 * Valuation Feature - Shared Logic
 *
 * Contains shared valuation logic, types, and utilities that are used across
 * both manual and conversational valuation flows. This feature should not
 * contain UI components specific to any flow.
 */

// Service interfaces (DIP compliant)
export type {
  IValuationService,
  ISessionService,
  IConversationService,
  IBusinessProfileService,
  ICreditService,
  IReportService,
  BusinessProfile,
  ConversationStartRequest,
  ConversationStartResponse,
} from './services/interfaces';

// Service implementations
export { valuationService } from './services/valuationService';
export { sessionService } from './services/sessionService';

// Shared valuation types
export * from './types';

