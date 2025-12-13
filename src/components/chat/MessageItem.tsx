/**
 * MessageItem Component
 * 
 * Single Responsibility: Render individual chat messages with all their variants
 * Extracted from StreamingChat.tsx to follow SRP
 * 
 * @module components/chat/MessageItem
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Bot, CheckCircle, Loader2 } from 'lucide-react';
import { Message } from '../../hooks/useStreamingChatState';
import { debugLogger } from '../../utils/debugLogger';
import { AI_CONFIG } from '../../config';
import { hasBusinessTypeSuggestions, parseBusinessTypeSuggestions } from '../utils/businessTypeParsing';
import { hasKBOSuggestions, parseKBOSuggestions } from '../utils/kboParsing';
import { AIHelpCard } from '../AIHelpCard';
import { ValuationReadyCTA } from '../ValuationReadyCTA';
import { BusinessTypeConfirmationCard } from '../BusinessTypeConfirmationCard';
import { CompanyNameConfirmationCard } from '../CompanyNameConfirmationCard';
import { SuggestionChips } from '../SuggestionChips';
import { BusinessTypeSuggestionsList } from '../BusinessTypeSuggestionsList';
import { KBOSuggestionsList } from '../KBOSuggestionsList';

export interface MessageItemProps {
  message: Message;
  onSuggestionSelect: (suggestion: string) => void;
  onSuggestionDismiss: () => void;
  onClarificationConfirm: (messageId: string) => void;
  onClarificationReject: (messageId: string) => void;
  onKBOSuggestionSelect: (selection: string) => void;
  onValuationStart?: () => void;
  isTyping?: boolean;
  isThinking?: boolean;
}

/**
 * MessageItem Component
 * 
 * Renders individual chat messages with support for:
 * - User messages
 * - AI messages
 * - Special message types (AI Help, Valuation CTA, Confirmations)
 * - Suggestion lists (Business Type, KBO)
 * - Clarification buttons
 */
export const MessageItem = React.memo<MessageItemProps>(({
  message,
  onSuggestionSelect,
  onSuggestionDismiss,
  onClarificationConfirm,
  onClarificationReject,
  onKBOSuggestionSelect,
  onValuationStart,
  isTyping = false,
  isThinking = false
}) => {
  // Check if this is an AI help message
  const isAIHelp = message.metadata?.is_ai_help === true;
  const aiResponse = message.metadata?.ai_response;
  
  // Check if this is a Valuation Ready CTA
  const isValuationReadyCTA = message.metadata?.input_type === 'cta_button';
  const buttonText = message.metadata?.button_text || 'Create Valuation Report';
  
  // Strip any stray inline typing indicators that may be present in message content
  const displayContent = React.useMemo(() => {
    if (!message.content) return message.content;
    return message.content.replace(/<span class="[^"]*animate-pulse[^"]*"><\/span>/g, '').trimEnd();
  }, [message.content]);
  
  // Detect business type suggestions in the message
  const businessTypeSuggestions = React.useMemo(() => {
    // First check metadata clarification_message (if available)
    if (message.metadata?.clarification_message) {
      const clarificationMsg = message.metadata.clarification_message;
      if (hasBusinessTypeSuggestions(clarificationMsg)) {
        return parseBusinessTypeSuggestions(clarificationMsg);
      }
    }
    // Check message content directly (primary source)
    if (hasBusinessTypeSuggestions(message.content)) {
      return parseBusinessTypeSuggestions(message.content);
    }
    return null;
  }, [message.content, message.metadata?.clarification_message]);
  
  const hasBusinessTypeSuggestionsInMessage = businessTypeSuggestions !== null && businessTypeSuggestions.length > 0;
  
  // Detect KBO suggestions in the message
  const kboSuggestions = React.useMemo(() => {
    // First check metadata clarification_message (if available)
    if (message.metadata?.clarification_message) {
      const clarificationMsg = message.metadata.clarification_message;
      if (hasKBOSuggestions(clarificationMsg)) {
        return parseKBOSuggestions(clarificationMsg);
      }
    }
    // Check message content directly (primary source)
    if (hasKBOSuggestions(message.content)) {
      return parseKBOSuggestions(message.content);
    }
    return null;
  }, [message.content, message.metadata?.clarification_message]);
  
  const hasKBOSuggestionsInMessage = kboSuggestions !== null && kboSuggestions.length > 0;
  
  // Render AI Help Card if this is an AI help response
  if (isAIHelp && aiResponse) {
    return (
      <AIHelpCard
        answer={aiResponse.answer || message.content}
        reasoning={aiResponse.reasoning}
        example={aiResponse.example}
        nudge={aiResponse.nudge || ''}
        timestamp={message.timestamp}
      />
    );
  }
  
  // Render Valuation Ready CTA if this is a CTA button
  if (isValuationReadyCTA) {
    return (
      <ValuationReadyCTA
        question={displayContent}
        buttonText={buttonText}
        onConfirm={() => {
          // Check if this is valuation confirmation - if so, trigger loading state immediately
          const isValuationConfirmation = message.metadata?.clarification_field === 'valuation_confirmed';
          if (isValuationConfirmation && onValuationStart) {
            onValuationStart();
          }
          // Send "yes" to confirm the valuation
          onClarificationConfirm(message.id);
        }}
        timestamp={message.timestamp}
      />
    );
  }

  // Check if this is a business type confirmation
  const isBusinessTypeConfirmation = message.metadata?.is_business_type_confirmation === true;

  if (isBusinessTypeConfirmation) {
    // Defensive: Extract metadata with fallbacks (in case metadata structure differs)
    const metadata = message.metadata || {};
    const industry = metadata.industry_mapping || metadata.industry || undefined;
    
    return (
      <BusinessTypeConfirmationCard
        businessType={metadata.business_type || ''}
        industry={industry}
        category={metadata.category}
        icon={metadata.icon}
        confidence={metadata.confidence}
        timestamp={message.timestamp}
      />
    );
  }

  // Check if this is a company name KBO confirmation
  const isCompanyNameConfirmation = message.metadata?.is_company_name_confirmation === true;

  if (isCompanyNameConfirmation) {
    // Defensive: Extract metadata with fallbacks (in case metadata structure differs)
    const metadata = message.metadata || {};
    
    debugLogger.log('[MessageItem]', 'Rendering CompanyNameConfirmationCard', {
      companyName: metadata.company_name || message.content || '',
      registrationNumber: metadata.registration_number,
      legalForm: metadata.legal_form,
      hasMetadata: !!message.metadata,
      metadataKeys: message.metadata ? Object.keys(message.metadata) : []
    });
    
    return (
      <CompanyNameConfirmationCard
        companyName={metadata.company_name || message.content || ''}
        registrationNumber={metadata.registration_number}
        legalForm={metadata.legal_form}
        foundingYear={metadata.founding_year}
        industryDescription={metadata.industry_description}
        confidence={metadata.confidence}
        timestamp={message.timestamp}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[85%] ${message.type === 'user' ? 'ml-auto' : 'mr-auto'}`}>
        {message.type === 'user' ? (
          // User message - simple structure without avatar
          <div className="flex flex-col gap-1 items-end">
            <div className="rounded-2xl rounded-tr-sm px-5 py-3.5 bg-primary-600 text-white shadow-md">
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">
                {message.content}
              </div>
            </div>
            <div className="text-xs text-zinc-500 text-right pr-1">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ) : (
          // AI message - with bot avatar
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 bg-white/10 rounded-full flex items-center justify-center border border-white/10 shadow-sm mt-1">
              {/* Show loader when streaming, typing, or thinking, otherwise show bot icon */}
              {(message.isStreaming || isTyping || isThinking) ? (
                <Loader2 className="w-4 h-4 text-primary-400 animate-spin" />
              ) : (
                <Bot className="w-4 h-4 text-primary-400" />
              )}
            </div>
            
            <div className="flex flex-col gap-1">
              <div className="rounded-2xl rounded-tl-sm px-5 py-3.5 bg-white/5 text-white border border-white/10 shadow-sm backdrop-blur-sm">
                <div className="whitespace-pre-wrap text-[15px] leading-relaxed text-zinc-100">
                  {displayContent}
                </div>
              
                {/* Suggestion chips */}
                {message.type === 'suggestion' && message.metadata?.suggestions && (
                  <div className="mt-4">
                    <SuggestionChips
                      suggestions={message.metadata.suggestions}
                      originalValue={message.metadata.originalValue || ''}
                      onSelect={onSuggestionSelect}
                      onDismiss={onSuggestionDismiss}
                    />
                  </div>
                )}
                
                {/* Business Type Suggestions List */}
                {hasBusinessTypeSuggestionsInMessage && businessTypeSuggestions && (
                  <div className="mt-3">
                    <BusinessTypeSuggestionsList
                      suggestions={businessTypeSuggestions}
                      onSelect={onKBOSuggestionSelect} // Reuse same handler
                    />
                  </div>
                )}
                
                {/* KBO Suggestions List */}
                {/* Check if this message comes after "none" was clicked - hide suggestions if so */}
                {(() => {
                  const isAfterNoneResponse = message.content?.includes("No problem!") && 
                                               message.content?.includes("What's your company name?");
                  return hasKBOSuggestionsInMessage && kboSuggestions && !isAfterNoneResponse && (
                    <div className="mt-3">
                      <KBOSuggestionsList
                        suggestions={kboSuggestions}
                        onSelect={onKBOSuggestionSelect}
                      />
                    </div>
                  );
                })()}
                
                {/* Generic Clarification confirmation buttons (only if not KBO/BusinessType suggestions) */}
                {message.metadata?.needs_confirmation &&
                 !hasKBOSuggestionsInMessage &&
                 !hasBusinessTypeSuggestionsInMessage &&
                 message.metadata?.collected_field !== 'business_type' &&
                 message.metadata?.collected_field !== 'company_name' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col gap-2 mt-4 p-3 bg-white/5 rounded-xl border border-white/10"
                  >
                    <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider mb-1">Confirm Details</p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => onClarificationConfirm(message.id)}
                        className="flex-1 py-2.5 px-4 bg-primary-600/20 hover:bg-primary-600/30 border border-primary-500/30 hover:border-primary-500/50 text-primary-300 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Yes, that's correct
                      </button>
                      <button
                        onClick={() => onClarificationReject(message.id)}
                        className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 text-zinc-400 hover:text-zinc-300 rounded-lg text-sm font-medium transition-all active:scale-[0.98]"
                      >
                        No, edit
                      </button>
                    </div>
                  </motion.div>
                )}
                
                {/* Help text */}
                {AI_CONFIG.showHelpText && message.metadata?.help_text && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-zinc-400 flex items-start gap-1.5">
                      <span className="mt-0.5">ℹ️</span>
                      <span className="leading-relaxed">{message.metadata.help_text}</span>
                    </p>
                  </div>
                )}
                
                {/* Valuation narrative */}
                {AI_CONFIG.showNarratives && message.metadata?.valuation_narrative && (
                  <div className="mt-3 p-3 bg-primary-600/10 rounded-xl border border-primary-600/20">
                    <h4 className="text-xs font-semibold text-primary-300 mb-1 uppercase tracking-wider">
                      Valuation Insight
                    </h4>
                    <div className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                      {message.metadata.valuation_narrative}
                    </div>
                  </div>
                )}
              </div>
              {/* Timestamp for AI messages */}
              <div className="text-xs text-zinc-500 ml-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
});

// Display name for React DevTools
MessageItem.displayName = 'MessageItem';

