/**
 * Conversational Valuation Feature
 *
 * Contains all components, hooks, and logic specific to the conversational AI-assisted valuation flow.
 * This feature handles chat-based data collection and conversation persistence.
 */

// Context & State Management
export { ConversationProvider, useConversationContext, useConversationState, useConversationDispatch } from './context/ConversationContext';
export { useConversationActions } from './hooks/useConversationActions';

// Components
export { ConversationalValuationFlow } from './components/ConversationalValuationFlow';
export { ConversationalLayout } from './components/ConversationalLayout';
export { BusinessProfileSection } from './components/BusinessProfileSection';
export { ReportPanel } from './components/ReportPanel';
export { ConversationPanel } from './components/ConversationPanel';
export { Conversation } from './components/Conversation';

// Legacy hooks (to be migrated)
// TODO: Replace with new unified state management
export { useValuationOrchestrator } from './hooks/useValuationOrchestrator';
export { useConversationStateManager } from './hooks/useConversationStateManager';
export { useSessionRestoration } from './hooks/useSessionRestoration';

// Types
export * from './types/conversation';
