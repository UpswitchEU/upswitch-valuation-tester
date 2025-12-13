/**
 * Conversational Valuation Feature
 *
 * Contains all components, hooks, and logic specific to the conversational AI-assisted valuation flow.
 * This feature handles chat-based data collection and conversation persistence.
 */

export { BusinessProfileSection } from './components/BusinessProfileSection'
export { Conversation } from './components/Conversation'
export { ConversationalLayout } from './components/ConversationalLayout'
// Components
export { ConversationalValuationFlow } from './components/ConversationalValuationFlow'
export { ConversationPanel } from './components/ConversationPanel'
export { ReportPanel } from './components/ReportPanel'
// Context & State Management
export {
  ConversationProvider,
  useConversationContext,
  useConversationDispatch,
  useConversationState,
} from './context/ConversationContext'
export { useConversationActions } from './hooks/useConversationActions'
export { useConversationStateManager } from './hooks/useConversationStateManager'
export { useSessionRestoration } from './hooks/useSessionRestoration'
// Legacy hooks (to be migrated)
// TODO: Replace with new unified state management
export { useValuationOrchestrator } from './hooks/useValuationOrchestrator'

// Types
export * from './types/conversation'
