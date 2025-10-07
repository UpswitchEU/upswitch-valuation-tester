/**
 * ConversationalFinancialInput Component
 * 
 * Privacy-compliant conversational interface for collecting financial data.
 * 
 * Architecture:
 * - Chat-style UI (feels conversational)
 * - Secure embedded input fields (data goes to YOUR backend, not OpenAI)
 * - One question at a time (guided flow)
 * - Pre-scripted conversation (no AI for financial questions)
 * 
 * Privacy Guarantee:
 * - Financial inputs submitted directly to backend
 * - NO external AI services receive sensitive data
 * - Data encrypted in transit (HTTPS) and at rest (AES-256)
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

interface CompanyInfo {
  company_id: string;
  company_name: string;
  registration_number: string;
  legal_form: string;
  country: string;
  address?: string;
  status: string;
}

interface ChatMessage {
  id: string;
  type: 'ai' | 'user' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
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

interface FinancialSummary {
  revenue?: number;
  ebitda?: number;
  net_income?: number;
  total_assets?: number;
  total_debt?: number;
  cash?: number;
}

interface ConversationalFinancialInputProps {
  companyId: string;
  onComplete: (summary: FinancialSummary, valuationId?: string) => void;
  onError?: (error: Error) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const ConversationalFinancialInput: React.FC<ConversationalFinancialInputProps> = ({
  companyId,
  onComplete,
  onError
}) => {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<ConversationStep | null>(null);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when step changes
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
  // API CALLS
  // ============================================================================

  const startConversation = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/valuation/conversation/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ company_id: companyId })
      });

      if (!response.ok) {
        throw new Error(`Failed to start conversation: ${response.statusText}`);
      }

      const data = await response.json();

      setSessionId(data.session_id);
      setCompanyInfo(data.company_info);
      
      // Add AI's first message
      addMessage({
        type: 'ai',
        content: data.ai_message
      });

      // Set first step
      setCurrentStep({
        step: data.step,
        field: data.next_field,
        inputType: data.input_type,
        helpText: data.help_text,
        validation: data.validation
      });

    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
      console.error('Failed to start conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitStep = async (value: number) => {
    if (!sessionId || !currentStep) return;

    // Add user's response to chat
    addMessage({
      type: 'user',
      content: `€${formatNumber(value)}`
    });

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/valuation/conversation/step', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          company_id: companyId,
          session_id: sessionId,
          step: currentStep.step,
          field: currentStep.field,
          value: value
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to submit step: ${response.statusText}`);
      }

      const data = await response.json();

      // Add AI response
      addMessage({
        type: 'ai',
        content: data.ai_message
      });

      if (data.complete) {
        // Conversation complete - trigger valuation
        setTimeout(() => {
          onComplete(data.summary, data.valuation_id);
        }, 1000);
      } else {
        // Move to next step
        setCurrentStep({
          step: data.step,
          field: data.next_field!,
          inputType: data.input_type!,
          helpText: data.help_text!,
          validation: data.validation!
        });
      }

      // Clear input
      setInputValue('');

    } catch (err) {
      const error = err as Error;
      setError(error.message);
      onError?.(error);
      console.error('Failed to submit step:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HELPERS
  // ============================================================================

  const addMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setMessages(prev => [
      ...prev,
      {
        ...msg,
        id: `msg_${Date.now()}_${Math.random()}`,
        timestamp: new Date()
      }
    ]);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const parseInputValue = (): number | null => {
    if (!inputValue.trim()) return null;
    
    // Remove non-numeric characters except decimal point
    const cleaned = inputValue.replace(/[^0-9.]/g, '');
    const parsed = parseFloat(cleaned);
    
    if (isNaN(parsed)) return null;
    return parsed;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const value = parseInputValue();
    if (value === null) {
      setError('Please enter a valid number');
      return;
    }

    if (currentStep?.validation) {
      if (value < currentStep.validation.min || value > currentStep.validation.max) {
        setError(`Value must be between €${formatNumber(currentStep.validation.min)} and €${formatNumber(currentStep.validation.max)}`);
        return;
      }
    }

    submitStep(value);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="conversational-financial-input">
      {/* Chat messages */}
      <div className="messages-container">
        <AnimatePresence>
          {messages.map((msg) => (
            <Message key={msg.id} message={msg} />
          ))}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input section */}
      {currentStep && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="input-section"
        >
          <form onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <span className="currency-symbol">€</span>
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentStep.helpText}
                className="financial-input"
                autoComplete="off"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="submit-button"
              >
                Continue →
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="error-message"
              >
                {error}
              </motion.div>
            )}

            <div className="privacy-notice">
              🔒 Encrypted • Stored securely on our servers • Never shared with external AI
            </div>
          </form>
        </motion.div>
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="loading-indicator">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .conversational-financial-input {
          display: flex;
          flex-direction: column;
          height: 100%;
          max-height: 600px;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 2rem;
          background: linear-gradient(to bottom, #f8fafc, #ffffff);
        }

        .input-section {
          padding: 1.5rem;
          background: white;
          border-top: 1px solid #e2e8f0;
        }

        .input-wrapper {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.75rem 1rem;
          background: white;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          transition: all 0.2s;
        }

        .input-wrapper:focus-within {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .currency-symbol {
          font-size: 1.25rem;
          font-weight: 600;
          color: #64748b;
        }

        .financial-input {
          flex: 1;
          font-size: 1.125rem;
          font-weight: 500;
          border: none;
          outline: none;
          color: #1e293b;
        }

        .financial-input::placeholder {
          color: #94a3b8;
          font-weight: 400;
        }

        .submit-button {
          padding: 0.5rem 1.5rem;
          background: #3b82f6;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .submit-button:hover:not(:disabled) {
          background: #2563eb;
          transform: translateX(2px);
        }

        .submit-button:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
        }

        .error-message {
          margin-top: 0.5rem;
          padding: 0.75rem 1rem;
          background: #fef2f2;
          border: 1px solid #fee2e2;
          border-radius: 8px;
          color: #dc2626;
          font-size: 0.875rem;
        }

        .privacy-notice {
          margin-top: 0.75rem;
          text-align: center;
          font-size: 0.875rem;
          color: #64748b;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }

        .loading-indicator {
          padding: 1.5rem;
          display: flex;
          justify-content: center;
        }

        .typing-indicator {
          display: flex;
          gap: 0.5rem;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #94a3b8;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

// ============================================================================
// MESSAGE COMPONENT
// ============================================================================

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isAI = message.type === 'ai';
  const isUser = message.type === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={`message ${message.type}`}
    >
      {isAI && (
        <div className="avatar ai-avatar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      )}
      
      <div className="message-content">
        <div className="message-bubble">
          {message.content.split('\n').map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
        <div className="message-time">
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {isUser && (
        <div className="avatar user-avatar">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="2"/>
            <path d="M6 21V19C6 16.7909 7.79086 15 10 15H14C16.2091 15 18 16.7909 18 19V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
      )}

      <style jsx>{`
        .message {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          align-items: flex-start;
        }

        .message.user {
          flex-direction: row-reverse;
        }

        .avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ai-avatar {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }

        .user-avatar {
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
        }

        .message-content {
          flex: 1;
          max-width: 70%;
        }

        .message.user .message-content {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .message-bubble {
          padding: 1rem 1.25rem;
          border-radius: 16px;
          line-height: 1.6;
        }

        .message.ai .message-bubble {
          background: white;
          border: 1px solid #e2e8f0;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .message.user .message-bubble {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          color: white;
        }

        .message-bubble p {
          margin: 0;
        }

        .message-bubble p + p {
          margin-top: 0.5rem;
        }

        .message-time {
          margin-top: 0.25rem;
          font-size: 0.75rem;
          color: #94a3b8;
          padding: 0 0.5rem;
        }
      `}</style>
    </motion.div>
  );
};

export default ConversationalFinancialInput;
