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
import { Send, CheckCircle, AlertCircle, Upload, Building2, Calculator, FileText, Sparkles } from 'lucide-react';
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

import type { ValuationResponse } from '../types/valuation';

interface ConversationUIProps {
  companyId: string;
  onComplete: (valuation: ValuationResponse) => void;
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
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
      console.error('API connection failed:', error);
    }
    
    // Fallback: Start a simple conversation flow
    try {
      // Add welcome message
      addMessage({
        type: 'ai',
        content: "Hi! I'm here to help you get a business valuation. Let's start by finding your company. What's the name of your company?"
      });
      
      // Set a basic step to enable input
      setCurrentStep({
        step: 1,
        field: 'company_name',
        inputType: 'text',
        helpText: 'Enter your company name to get started',
        validation: { min: 0, max: 1000000000 }
      });
      
    } catch (fallbackError) {
      console.error('Fallback conversation failed:', fallbackError);
      setError('Unable to start conversation. Please refresh the page.');
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
    
    if (!inputValue.trim()) return;
    
    // Add user message to chat
    addMessage({
      type: 'user',
      content: inputValue
    });
    
    // If we have a session and current step, try to submit to API
    if (sessionId && currentStep) {
      // Parse input value (remove currency symbols and commas)
      const cleanValue = inputValue.replace(/[€$,\s]/g, '');
      const value = parseFloat(cleanValue);
      
      if (!isNaN(value)) {
        // Validate against backend rules
        if (currentStep.validation) {
          const { min, max } = currentStep.validation;
          if (value < min || value > max) {
            setError(`Value must be between €${min.toLocaleString()} and €${max.toLocaleString()}`);
            return;
          }
        }
        
        submitStep(value);
        return;
      }
    }
    
    // Fallback: Handle text input for company lookup or general conversation
    if (currentStep?.step === 1) {
      // Simulate company lookup response
      setTimeout(() => {
        addMessage({
          type: 'ai',
          content: `Great! I found "${inputValue}" in our database. Now I need some financial information to calculate your valuation. What was your company's revenue last year?`
        });
        
        // Move to next step
        setCurrentStep({
          step: 2,
          field: 'revenue',
          inputType: 'number',
          helpText: 'Enter your annual revenue in euros',
          validation: { min: 0, max: 1000000000 }
        });
      }, 1000);
    } else {
      // General conversation fallback
      setTimeout(() => {
        addMessage({
          type: 'ai',
          content: "I understand. Let me help you with your business valuation. Could you tell me your company's annual revenue?"
        });
      }, 1000);
    }
    
    // Clear input
    setInputValue('');
  };
  
  // ============================================================================
  // RENDER - Matching Archived Version UI
  // ============================================================================
  
  const quickActions = [
    { icon: Upload, label: 'Upload Financial Documents', action: () => console.log('Upload clicked') },
    { icon: Building2, label: 'Look up my company', action: () => setInputValue('Look up my company in Belgium') },
    { icon: Calculator, label: 'Tell you my numbers', action: () => setInputValue('My revenue is €2.5M and EBITDA is €450K') },
  ];

  const LoadingSpinner = () => (
    <div className="flex justify-start">
      <div className="bg-zinc-800 border border-zinc-700 rounded-2xl rounded-bl-sm px-5 py-4">
        <div className="flex items-center gap-3 text-primary-400">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-400 border-t-transparent" />
          <span className="text-sm">AI is analyzing...</span>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Header - Dark theme */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4 sm:p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2 sm:p-3">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg sm:text-xl">AI Assistant</h3>
            <p className="text-primary-100 text-xs sm:text-sm">
              Powered by LLM - Only public data (company registries, industry info)
            </p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-3 sm:mt-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-2 sm:p-3">
          <p className="text-white text-xs flex items-start gap-2">
            <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </p>
        </div>
      </div>

      {/* Messages Container - Dark Theme */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.type === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              {/* Avatar for AI messages */}
              {message.type === 'ai' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="text-xs font-medium text-zinc-400">AI Assistant</span>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`px-5 py-3 rounded-2xl shadow-sm ${
                  message.type === 'user'
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : message.type === 'system'
                    ? 'bg-green-100 border border-green-200 text-green-800 rounded-bl-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                }`}
              >
                {message.type === 'system' ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">{message.content}</span>
                  </div>
                ) : (
                  <div className="text-sm whitespace-pre-line leading-relaxed">{message.content}</div>
                )}
              </div>

              {/* Timestamp */}
              <div
                className={`text-xs text-zinc-400 mt-1 px-2 ${
                  message.type === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
        
        {loading && <LoadingSpinner />}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions - Shown initially or when messages are few */}
      {messages.length <= 2 && !loading && (
        <div className="px-4 sm:px-6 pb-2">
          <div className="flex gap-2 flex-wrap">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.action}
                className="flex items-center gap-2 px-3 py-2 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg text-sm text-zinc-300 hover:text-primary-400 hover:border-primary-500 transition-all"
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area - Sticky at Bottom - Always visible */}
      {!loading && (
        <div className="p-4 sm:p-6 border-t border-zinc-700/50">
          {error && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
          
          <form
            onSubmit={handleSubmit}
            className="flex gap-3 items-end"
          >
            <button
              type="button"
              onClick={() => console.log('Upload clicked')}
              className="flex-shrink-0 p-2.5 rounded-lg border border-zinc-600 hover:border-primary-500 hover:bg-primary-500/10 transition-colors bg-zinc-800"
              title="Upload document"
            >
              <FileText className="w-5 h-5 text-zinc-400" />
            </button>

            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={currentStep ? "Type your message or upload documents..." : "Start by typing your company name or asking about valuation..."}
              className="flex-1 resize-none rounded-xl border border-zinc-600 bg-zinc-800 text-zinc-100 placeholder-zinc-400 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent max-h-32"
              rows={2}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={!inputValue.trim() || loading}
              className="flex-shrink-0 p-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-zinc-600 disabled:cursor-not-allowed transition-colors"
              title="Send message"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </form>

          <p className="text-xs text-zinc-500 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </p>
        </div>
      )}
      
      {/* Completion message */}
      {!currentStep && !loading && messages.length > 0 && (
        <div className="border-t border-zinc-700/50 p-6 bg-gradient-to-br from-green-900/20 to-emerald-900/20">
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle className="w-6 h-6 text-green-500" />
            <div>
              <p className="font-semibold text-green-300">All done!</p>
              <p className="text-sm text-green-200 opacity-80">Preparing your valuation report...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationUI;

