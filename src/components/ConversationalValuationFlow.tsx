/**
 * ConversationalValuationFlow Component
 * 
 * Drop-in replacement for AIAssistedValuation with improved architecture.
 * Handles conversational mode with robust session persistence and restoration.
 * 
 * Features:
 * - Loads existing conversations seamlessly
 * - Starts new conversations when needed
 * - No race conditions
 * - Identical UI and functionality
 */

export { ConversationalValuationFlow as AIAssistedValuation } from '../features/valuation/components/ConversationalValuationFlow';

