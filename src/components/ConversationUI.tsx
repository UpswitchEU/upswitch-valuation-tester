/**
 * ConversationUI - Thin Client for Backend Conversation API
 * 
 * This component is a THIN CLIENT - it only handles UI rendering and user input.
 * All business logic (conversation flow, validation, valuation calculation) 
 * happens in the backend.
 * 
 * Backend API: /api/valuation/conversation
 * Architecture: Pre-scripted guided flow (6 questions, privacy-safe)
 * 
 * Key Principle: NO business logic in frontend, just display and input
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { API_CONFIG } from '../config';

// ============================================================================
// TYPES (matches backend API)
// ============================================================================

interface ConversationMessage {
  id: string;
  type: 'ai' | 'user' | 'system';
  content: string;
  timestamp: Date;
}

interface ConversationStep {
  step: number;
  field: string;
  inputType: string;
  helpText: string;
  validation: {
    min: number;
    max: number;
  };
}

interface ValuationResult {
  valuation_id: string;
  equity_value: number;
  valuation_range: {
    min: number;
    max: number;
  };
  confidence_score: number;
  methodology: string;
  [key: string]: any;
}

interface ConversationUIProps {
  companyId: string;
  onComplete: (valuation: ValuationResult) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ConversationUI: React.FC<ConversationUIProps> = ({
  companyId,
  onComplete,
  onError
}) => {
  // State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<ConversationStep | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Auto-focus input
  useEffect(() => {
    if (currentStep && !loading) {
      inputRef.current?.focus();
    }
  }, [currentStep, loading]);
  
  // Start conversation on mount (only once)
  useEffect(() => {
    if (!sessionId && !loading) {
      startConversation();
    }
  }, []);
  
  // ============================================================================
  // API CALLS (thin client - just call backend)
  // ============================================================================
  
  const startConversation = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Try real API first
      const response = await fetch(`${API_CONFIG.baseURL}/api/valuations/conversation/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Save session
          setSessionId(data.session_id);
          
          // Add AI message
          addMessage({
            type: 'ai',
            content: data.ai_message
          });
          
          // Set current step
          setCurrentStep({
            step: data.step,
            field: data.next_field,
            inputType: data.input_type,
            helpText: data.help_text,
            validation: data.validation
          });
          
          setLoading(false);
          return; // Success, exit early
        }
      }
    } catch (apiError) {
      const error = apiError as Error;
      setError('Failed to connect to valuation service. Please try again later.');
      onError?.(error);
      console.error('API connection failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const submitStep = async (value: number) => {
    if (!sessionId || !currentStep) return;
    
    // Add user's response to chat
    addMessage({
      type: 'user',
      content: `€${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    });
    
    setLoading(true);
    setError(null);
    
    try {
      // Try real API first
      const response = await fetch(`${API_CONFIG.baseURL}/api/valuations/conversation/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          session_id: sessionId,
          step: currentStep.step,
          field: currentStep.field,
          value: value
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.success) {
          // Add AI response
          addMessage({
            type: 'ai',
            content: data.ai_message
          });
          
          // Check if complete
          if (data.complete) {
            // Conversation complete
            if (data.valuation_result) {
              // Success - show success message
              addMessage({
                type: 'system',
                content: '✅ Valuation calculated successfully!'
              });
              
              // Call completion callback with valuation
              setTimeout(() => {
                onComplete(data.valuation_result);
              }, 1000);
            } else if (data.error) {
              // Error during calculation
              setError(data.error);
              onError?.(new Error(data.error));
            }
          } else {
            // Move to next step
            setCurrentStep({
              step: data.step,
              field: data.next_field,
              inputType: data.input_type,
              helpText: data.help_text,
              validation: data.validation
            });
          }
          
          // Clear input
          setInputValue('');
          setLoading(false);
          return; // Success, exit early
        }
      }
    } catch (apiError) {
      const error = apiError as Error;
      setError('Failed to connect to valuation service. Please try again later.');
      onError?.(error);
      console.error('API connection failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // ============================================================================
  // HELPERS
  // ============================================================================
  
  const addMessage = (msg: Omit<ConversationMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [
      ...prev,
      {
        ...msg,
        id: `msg_${Date.now()}_${Math.random()}`,
        timestamp: new Date()
      }
    ]);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse input value (remove currency symbols and commas)
    const cleanValue = inputValue.replace(/[€$,\s]/g, '');
    const value = parseFloat(cleanValue);
    
    if (isNaN(value)) {
      setError('Please enter a valid number');
      return;
    }
    
    // Validate against backend rules
    if (currentStep) {
      const { min, max } = currentStep.validation;
      if (value < min || value > max) {
        setError(`Value must be between €${min.toLocaleString()} and €${max.toLocaleString()}`);
        return;
      }
    }
    
    submitStep(value);
  };
  
  // ============================================================================
  // RENDER
  // ============================================================================
  
  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Header with Health Status - Ilara Style */}
      <div className="border-b border-zinc-700/50 bg-zinc-900/50 backdrop-blur-sm px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">AI auditor</h3>
            </div>
          </div>
          
          {/* Health Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-zinc-300 font-medium">
              Connected
            </span>
          </div>
        </div>
      </div>
      
      {/* Messages Container - Ilara Style - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.type === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              <div className="flex flex-col gap-1">
                <div
                  className={`px-4 py-3 rounded-lg ${
                    message.type === 'user' 
                      ? 'bg-zinc-800 text-white' 
                      : message.type === 'system'
                      ? 'bg-green-900/30 border border-green-700/50 text-green-200'
                      : 'bg-zinc-700/50 text-white'
                  }`}
                >
                  {message.type === 'system' ? (
                    <div className="flex items-center gap-2 text-green-400">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">{message.content}</span>
                    </div>
                  ) : (
                    <div 
                      className="whitespace-pre-wrap text-sm"
                      dangerouslySetInnerHTML={{ 
                        __html: message.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
                          .replace(/\n/g, '<br/>')
                          .replace(/^• /gm, '&nbsp;&nbsp;• ')
                      }}
                    />
                  )}
                </div>
                <div
                  className={`text-xs text-zinc-500 ${
                    message.type === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Processing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Area - Sticky at Bottom - Ilara Style */}
      {currentStep && !loading && (
        <div className="p-4 border-t border-zinc-800 flex-shrink-0">
          {error && (
            <div className="mb-3 p-3 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
          
          <form
            onSubmit={handleSubmit}
            className="focus-within:bg-zinc-900/30 group flex flex-col gap-3 p-4 duration-150 w-full rounded-3xl border border-zinc-700/50 bg-zinc-900/20 text-base shadow-xl transition-all ease-in-out focus-within:border-zinc-500/40 hover:border-zinc-600/30 focus-within:hover:border-zinc-500/40 backdrop-blur-sm"
          >
            {/* Textarea container */}
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Enter amount (e.g., 1500000)`}
                className="flex w-full rounded-md px-3 py-3 ring-offset-background placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-sm leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap max-h-[200px] bg-transparent focus:bg-transparent flex-1 text-white"
                style={{ minHeight: '60px', height: '60px' }}
                disabled={loading}
                spellCheck="false"
              />
            </div>

            {/* Action buttons row */}
            <div className="flex gap-2 flex-wrap items-center">
              {/* Help text */}
              {currentStep.helpText && (
                <div className="text-xs text-zinc-400">
                  💡 {currentStep.helpText}
                </div>
              )}

              {/* Right side with send button */}
              <div className="flex flex-grow items-center justify-end gap-2">
                <button
                  type="submit"
                  disabled={loading || !inputValue}
                  className="submit-button-white flex h-8 w-8 items-center justify-center rounded-full bg-white hover:bg-zinc-100 transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-600"
                >
                  <Send className="w-4 h-4 text-zinc-900" />
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
      
      {/* Completion message */}
      {!currentStep && !loading && messages.length > 0 && (
        <div className="border-t border-zinc-800 p-6 bg-gradient-to-br from-green-900/20 to-emerald-900/20">
          <div className="flex items-center gap-3 text-green-200">
            <CheckCircle className="w-6 h-6 text-green-400" />
            <div>
              <p className="font-semibold">All done!</p>
              <p className="text-sm opacity-80">Preparing your valuation report...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationUI;

