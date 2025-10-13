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
  
  // Start conversation on mount
  useEffect(() => {
    startConversation();
  }, [companyId]);
  
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
    <div className="flex flex-col h-full bg-zinc-900 rounded-lg border border-zinc-800 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Conversational Valuation</h3>
            <p className="text-xs text-zinc-400">6 quick questions • 30 seconds</p>
          </div>
        </div>
        {currentStep && (
          <div className="text-sm text-zinc-400">
            Step {currentStep.step + 1} of 6
          </div>
        )}
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  message.type === 'ai'
                    ? 'bg-zinc-800 text-white'
                    : message.type === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-green-900/30 border border-green-700/50 text-green-200'
                }`}
              >
                {message.type === 'system' && (
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  </div>
                )}
                <div className="prose prose-invert prose-sm max-w-none whitespace-pre-line">
                  {message.content}
                </div>
                <div className="text-xs opacity-60 mt-2">
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <div className="flex items-center gap-2 text-zinc-400">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Processing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input */}
      {currentStep && !loading && (
        <div className="border-t border-zinc-800 p-4 bg-zinc-900/50 backdrop-blur-sm">
          {error && (
            <div className="mb-3 p-3 bg-red-900/20 border border-red-700/50 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={`Enter amount (e.g., 1500000)`}
                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                disabled={loading}
              />
              {currentStep.helpText && (
                <p className="mt-1.5 text-xs text-zinc-500">
                  💡 {currentStep.helpText}
                </p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading || !inputValue}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white rounded-lg font-medium transition-all flex items-center gap-2 shadow-lg hover:shadow-primary-500/25"
            >
              <Send className="w-4 h-4" />
              Send
            </button>
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

