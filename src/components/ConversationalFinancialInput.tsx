import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, DollarSign } from 'lucide-react';
import { serviceLogger } from '../utils/logger';
import { LoadingDots } from './LoadingDots';
import { useLoadingMessage } from '../hooks/useLoadingMessage';

interface ConversationalFinancialInputProps {
  companyId: string;
  onComplete: (summary: any, valuationId?: string) => void;
  onError: (error: string) => void;
}

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

export const ConversationalFinancialInput: React.FC<ConversationalFinancialInputProps> = ({
  companyId: _companyId,
  onComplete,
  onError
}) => {
  const loadingMessage = useLoadingMessage();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `💬 **Let's collect your financial data together**

I'll ask you a few quick questions to get your business valuation.

**Question 1 of 2:**
What's your annual revenue for this year? (in EUR)

💡 Your total income before expenses`,
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [financialData, setFinancialData] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const questions = [
    {
      field: 'revenue',
      question: "What's your annual revenue for this year? (in EUR)",
      helpText: "Your total income before expenses",
      optional: false
    },
    {
      field: 'ebitda',
      question: "What's your EBITDA for this year? (in EUR)",
      helpText: "Earnings Before Interest, Taxes, Depreciation & Amortization",
      optional: false
    }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage = input.trim();
    
    // Add user message
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);
    
    setInput('');
    setIsProcessing(true);

    try {
      const currentQ = questions[currentQuestion];
      
      // Parse the financial value
      const value = parseFloat(userMessage.replace(/[^0-9.-]/g, ''));
      
      if (isNaN(value)) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: `Please enter a valid number. For example: ${currentQ.field.includes('revenue') ? '1000000' : '200000'}${currentQ.optional ? '\n\nOr press Enter to skip this question.' : ''}`,
          timestamp: new Date()
        }]);
        setIsProcessing(false);
        return;
      }

      // Save the financial data
      const newData = { ...financialData, [currentQ.field]: value };
      setFinancialData(newData);

      // Move to next question or complete
      if (currentQuestion < questions.length - 1) {
        const nextQ = questions[currentQuestion + 1];
        setCurrentQuestion(currentQuestion + 1);
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: `✅ Got it! €${value.toLocaleString()}

**Question ${currentQuestion + 2} of ${questions.length}:**
${nextQ.question}

💡 ${nextQ.helpText}`,
          timestamp: new Date()
        }]);
      } else {
        // All questions answered - complete
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: `🎉 **Perfect! I have all the data.**

**Current Year (${new Date().getFullYear()}):**
• Revenue: €${newData.revenue?.toLocaleString()}
• EBITDA: €${newData.ebitda?.toLocaleString()}

⚡ Preparing your valuation...`,
          timestamp: new Date()
        }]);

        // Complete the financial data collection
        setTimeout(() => {
          onComplete(newData);
        }, 2000);
      }
    } catch (error) {
      serviceLogger.error('Financial input error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      onError('Failed to process financial data');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Header */}
      <div className="border-b border-zinc-700/50 bg-zinc-900/50 backdrop-blur-sm px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
            <DollarSign className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">Financial Data Collection</h3>
            <p className="text-xs text-zinc-400">Quick questions to get your valuation</p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
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
                      : 'bg-zinc-700/50 text-white'
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex items-center justify-center gap-2 py-2">
                      <LoadingDots size="sm" color="text-green-600" />
                      <span className="text-xs text-zinc-400 animate-pulse">{loadingMessage}</span>
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-zinc-800 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="focus-within:bg-zinc-900/30 group flex flex-col gap-3 p-4 duration-150 w-full rounded-3xl border border-zinc-700/50 bg-zinc-900/20 text-base shadow-xl transition-all ease-in-out focus-within:border-zinc-500/40 hover:border-zinc-600/30 focus-within:hover:border-zinc-500/40 backdrop-blur-sm"
        >
          <div className="relative flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your financial data (e.g., 1000000)..."
              className="flex w-full rounded-md px-3 py-3 ring-offset-background placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-sm leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap max-h-[200px] bg-transparent focus:bg-transparent flex-1 text-white"
              style={{ minHeight: '60px', height: '60px' }}
              disabled={isProcessing}
              spellCheck="false"
            />
          </div>

          <div className="flex gap-2 flex-wrap items-center">
            <div className="flex flex-grow items-center justify-end gap-2">
              <button
                type="submit"
                disabled={isProcessing || !input.trim()}
                className="submit-button-white flex h-8 w-8 items-center justify-center rounded-full bg-white hover:bg-zinc-100 transition-all duration-150 ease-out disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-zinc-600"
              >
                <Send className="w-4 h-4 text-zinc-900" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
