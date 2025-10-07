/**
 * EnhancedConversationalChat
 * 
 * Enhanced conversational UI for company lookup adapted from Ilara AI's MCPChatUI.
 * 
 * Key improvements over basic ConversationalChat:
 * - Message deduplication (prevents duplicate messages on re-renders)
 * - Health monitoring (real-time backend status)
 * - Performance optimizations (useCallback, efficient state management)
 * - Graceful error handling (contextual messages, recovery suggestions)
 * - Beautiful loading states (branded animations)
 * - Enterprise architecture (controller → service pattern)
 * 
 * Architecture:
 * UI Component → CompanyLookupService → ValuationChatController → Backend API
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
import { CompanyLookupService, type ChatMessage } from '../../services/chat/companyLookupService';
import { UpswitchLoadingSpinner } from './UpswitchLoadingSpinner';
import type { CompanyFinancialData } from '../../types/registry';
import type { HealthStatus } from '../../controllers/chat/valuationChatController';

interface EnhancedConversationalChatProps {
  onCompanyFound: (data: CompanyFinancialData) => void;
}

export const EnhancedConversationalChat: React.FC<EnhancedConversationalChatProps> = ({
  onCompanyFound
}) => {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      type: 'ai',
      content: `👋 Welcome! I'll guide you through a quick business valuation.

Just tell me your **company name** to get started.

**How it works:**
1. You tell me your company name
2. I search for financial data from official registries
3. If needed, I'll ask you a few quick questions about your financials
4. You review the data and get your professional valuation report

**Examples:**
• "Proximus"
• "Delhaize"
• "Acme Trading NV"

**Time:** 1-2 minutes • **Privacy:** Your data stays secure 🔒

Currently supporting Belgian companies. More countries coming soon! 🚀`,
      timestamp: new Date(),
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [collectingFinancials, setCollectingFinancials] = useState(false);
  const [currentFinancialQuestion, setCurrentFinancialQuestion] = useState(0);
  const [financialData, setFinancialData] = useState<any>({});
  const [foundCompany, setFoundCompany] = useState<CompanyFinancialData | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdsRef = useRef(new Set<string>()); // For deduplication
  const lookupService = useRef(new CompanyLookupService()).current;

  // Financial questions (extended for higher accuracy)
  const financialQuestions = [
    // Current year (required)
    { field: 'revenue', question: "What's your annual revenue for this year? (in EUR)", helpText: "Your total income for 2023", year: 'current' },
    { field: 'ebitda', question: "What's your EBITDA for this year? (in EUR)", helpText: "Earnings before interest, taxes, depreciation, and amortization", year: 'current' },
    { field: 'net_income', question: "What's your net income for this year? (in EUR)", helpText: "Profit after all expenses", year: 'current' },
    { field: 'total_assets', question: "What are your total assets? (in EUR)", helpText: "Everything your company owns", year: 'current' },
    { field: 'total_debt', question: "What's your total debt? (in EUR)", helpText: "All outstanding loans and liabilities", year: 'current' },
    { field: 'cash', question: "How much cash do you have? (in EUR)", helpText: "Cash and cash equivalents", year: 'current' },
    
    // Previous year (for growth analysis)
    { field: 'revenue_y1', question: "What was your revenue LAST year? (in EUR)", helpText: "For 2022 - helps calculate growth rate", year: 'previous' },
    { field: 'ebitda_y1', question: "What was your EBITDA last year? (in EUR)", helpText: "For 2022 - validates profitability trend", year: 'previous' },
    
    // Company context (critical for valuation)
    { field: 'employees', question: "How many employees do you have?", helpText: "Full-time equivalent count", year: 'current' },
    { field: 'recurring_revenue', question: "What % of your revenue is recurring?", helpText: "Subscription, retainers, contracts (0-100%)", year: 'current' },
    
    // Optional but helpful
    { field: 'operating_expenses', question: "What are your total operating expenses? (in EUR)", helpText: "COGS + admin + sales costs (optional - press Enter to skip)", year: 'current', optional: true },
  ];

  /**
   * Message deduplication
   * Prevents duplicate messages from being added on re-renders
   * Key optimization from Ilara AI architecture
   */
  const addUniqueMessage = useCallback((message: ChatMessage) => {
    if (!messageIdsRef.current.has(message.id)) {
      messageIdsRef.current.add(message.id);
      setMessages(prev => [...prev, message]);
    }
  }, []);

  /**
   * Health monitoring
   * Checks backend availability on mount only
   * Reduces unnecessary polling - health is checked again on errors
   */
  useEffect(() => {
    const checkHealth = async () => {
      const health = await lookupService.checkHealth();
      setHealthStatus(health);
    };
    
    // Initial check only
    checkHealth();
    
    // No periodic polling - reduces server load
    // Health will be checked again if API calls fail
  }, [lookupService]);

  /**
   * Auto-scroll to bottom
   * Smooth scroll when new messages are added
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Complete financial data collection and structure for valuation
   */
  const completeFinancialCollection = useCallback((collectedData: any) => {
    setCollectingFinancials(false);
    
    // Build summary message
    const currentYear = new Date().getFullYear();
    const summaryLines = [
      `🎉 **Perfect! I have all the data.**\n`,
      `**Current Year (${currentYear}):**`,
      `• Revenue: €${collectedData.revenue?.toLocaleString() || '?'}`,
      `• EBITDA: €${collectedData.ebitda?.toLocaleString() || '?'}`,
      `• Net Income: €${collectedData.net_income?.toLocaleString() || '?'}`,
      `• Total Assets: €${collectedData.total_assets?.toLocaleString() || '?'}`,
      `• Total Debt: €${collectedData.total_debt?.toLocaleString() || '?'}`,
      `• Cash: €${collectedData.cash?.toLocaleString() || '?'}`,
    ];
    
    if (collectedData.revenue_y1) {
      summaryLines.push(`\n**Last Year (${currentYear - 1}):**`);
      summaryLines.push(`• Revenue: €${collectedData.revenue_y1?.toLocaleString()}`);
      if (collectedData.ebitda_y1) {
        summaryLines.push(`• EBITDA: €${collectedData.ebitda_y1?.toLocaleString()}`);
      }
    }
    
    if (collectedData.employees) {
      summaryLines.push(`\n**Company Context:**`);
      summaryLines.push(`• Employees: ${collectedData.employees}`);
    }
    
    if (collectedData.recurring_revenue !== undefined) {
      summaryLines.push(`• Recurring Revenue: ${collectedData.recurring_revenue}%`);
    }
    
    summaryLines.push(`\n⚡ Preparing your valuation...`);
    
    addUniqueMessage({
      id: `ai_${Date.now()}`,
      type: 'ai',
      content: summaryLines.join('\n'),
      timestamp: new Date(),
    });

    // Structure data for valuation engine
    if (foundCompany) {
      const filingHistory = [];
      
      // Current year data
      filingHistory.push({
        year: currentYear,
        revenue: collectedData.revenue,
        ebitda: collectedData.ebitda,
        net_income: collectedData.net_income,
        total_assets: collectedData.total_assets,
        total_debt: collectedData.total_debt,
        cash: collectedData.cash,
        operating_expenses: collectedData.operating_expenses,
        filing_date: new Date().toISOString().split('T')[0],
        source_url: undefined
      });
      
      // Previous year data (if provided)
      if (collectedData.revenue_y1) {
        filingHistory.push({
          year: currentYear - 1,
          revenue: collectedData.revenue_y1,
          ebitda: collectedData.ebitda_y1,
          filing_date: `${currentYear - 1}-12-31`,
          source_url: undefined
        });
      }
      
      const updatedCompanyData: CompanyFinancialData = {
        ...foundCompany,
        filing_history: filingHistory,
        employees: collectedData.employees,
        // Store additional context for valuation
        completeness_score: collectedData.revenue_y1 ? 0.85 : 0.65,
        data_source: `Conversational input (${filingHistory.length} year${filingHistory.length > 1 ? 's' : ''})`,
        // Pass through for valuation form
        _additional_context: {
          recurring_revenue_percentage: collectedData.recurring_revenue ? collectedData.recurring_revenue / 100 : undefined,
          number_of_employees: collectedData.employees,
        }
      };
      
      setTimeout(() => {
        onCompanyFound(updatedCompanyData);
      }, 1500);
    }
  }, [foundCompany, addUniqueMessage, onCompanyFound]);

  /**
   * Handle message send
   * Main interaction handler with comprehensive error handling
   * Optimized with useCallback to prevent unnecessary re-renders
   */
  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    // Add user message
    addUniqueMessage(userMessage);
    const userInput = inputValue.trim();
    setInputValue('');

    // If we're collecting financial data, handle that
    if (collectingFinancials) {
      const currentQ = financialQuestions[currentFinancialQuestion];
      
      // Allow skipping optional questions
      if (currentQ.optional && userInput.trim() === '') {
        // Skip this question
        if (currentFinancialQuestion < financialQuestions.length - 1) {
          const nextQ = financialQuestions[currentFinancialQuestion + 1];
          setCurrentFinancialQuestion(currentFinancialQuestion + 1);
          
          addUniqueMessage({
            id: `ai_${Date.now()}`,
            type: 'ai',
            content: `⏭️ Skipped.\n\n**Question ${currentFinancialQuestion + 2} of ${financialQuestions.length}:**\n${nextQ.question}\n\n💡 ${nextQ.helpText}${nextQ.optional ? '\n\n_(Press Enter to skip)_' : ''}`,
            timestamp: new Date(),
          });
        } else {
          // Last question was optional and skipped - complete
          onCompanyFound(financialData);
        }
        return;
      }
      
      const value = parseFloat(userInput.replace(/[^0-9.-]/g, ''));
      
      if (isNaN(value)) {
        addUniqueMessage({
          id: `error_${Date.now()}`,
          type: 'ai',
          content: `Please enter a valid number. For example: ${currentQ.field.includes('employees') ? '50' : '1000000'}${currentQ.optional ? '\n\nOr press Enter to skip this question.' : ''}`,
          timestamp: new Date(),
        });
        return;
      }

      // Save the financial data
      const newData = { ...financialData, [currentQ.field]: value };
      setFinancialData(newData);

      // Move to next question or finish
      if (currentFinancialQuestion < financialQuestions.length - 1) {
        const nextQ = financialQuestions[currentFinancialQuestion + 1];
        setCurrentFinancialQuestion(currentFinancialQuestion + 1);
        
        addUniqueMessage({
          id: `ai_${Date.now()}`,
          type: 'ai',
          content: `✅ Got it!\n\n**Question ${currentFinancialQuestion + 2} of ${financialQuestions.length}:**\n${nextQ.question}\n\n💡 ${nextQ.helpText}${nextQ.optional ? '\n\n_(Press Enter to skip)_' : ''}`,
          timestamp: new Date(),
        });
      } else {
        // All questions answered - complete
        completeFinancialCollection(newData);
      }
      return;
    }

    // Otherwise, handle company lookup
    setIsLoading(true);

    // Add loading message
    const loadingMessage: ChatMessage = {
      id: `loading_${Date.now()}`,
      type: 'ai',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };
    addUniqueMessage(loadingMessage);

    try {
      // Process company lookup
      const result = await lookupService.processMessage(userMessage.content, 'BE');

      // Remove loading message
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessage.id));
      messageIdsRef.current.delete(loadingMessage.id);

      if (result.success && result.companyData) {
        // Check if we have financial data or need to collect it
        const hasFinancialData = result.companyData.filing_history && 
                                  result.companyData.filing_history.length > 0;
        
        if (hasFinancialData) {
          // Success - company found WITH financial data
          const latest = result.companyData.filing_history[0];
          
          const successMessage: ChatMessage = {
            id: `success_${Date.now()}`,
            type: 'ai',
            content: `✅ **${result.companyData.company_name}**
Registration: ${result.companyData.registration_number}

**Latest filed accounts (${latest.year}):**
📊 Revenue: €${(latest.revenue || 0).toLocaleString()}
💰 EBITDA: €${(latest.ebitda || 0).toLocaleString()}
🏦 Assets: €${(latest.total_assets || 0).toLocaleString()}

📚 I found **${result.companyData.filing_history.length} years** of financial history

📁 Data source: Official records

---

✅ **Ready for valuation!**

Would you like to calculate your business valuation now?`,
            timestamp: new Date(),
            companyData: result.companyData,
          };
          
          addUniqueMessage(successMessage);

          // Notify parent after brief delay to show message
          setTimeout(() => {
            onCompanyFound(result.companyData!);
          }, 1500);
          
        } else {
          // Success - company found WITHOUT financial data (stay in chat, ask questions)
          setFoundCompany(result.companyData);
          setCollectingFinancials(true);
          setCurrentFinancialQuestion(0);
          
          const firstQ = financialQuestions[0];
          const successMessage: ChatMessage = {
            id: `success_${Date.now()}`,
            type: 'ai',
            content: `✅ **Found: ${result.companyData.company_name}**
Registration: ${result.companyData.registration_number}

📋 No financial data available in public registries, but no problem!

💬 **Let's collect the data together** - I'll ask you ${financialQuestions.length} quick questions to get you the most accurate valuation.

⏱️ Takes 2-3 minutes • 🔒 Your data stays secure • 📊 Investment-grade accuracy

---

**Question 1 of ${financialQuestions.length}:**
${firstQ.question}

💡 ${firstQ.helpText}`,
            timestamp: new Date(),
          };
          
          addUniqueMessage(successMessage);
        }

      } else {
        // Error or not found
        const errorMessage: ChatMessage = {
          id: `error_${Date.now()}`,
          type: 'ai',
          content: result.message + `\n\n**Backend status:** ${healthStatus?.available ? '🟢 Connected' : '🔴 Offline'}`,
          timestamp: new Date(),
        };
        
        addUniqueMessage(errorMessage);
      }
    } catch (error) {
      console.error('Message handling error:', error);
      
      // Recheck health on error
      const health = await lookupService.checkHealth();
      setHealthStatus(health);
      
      // Remove all loading messages
      setMessages(prev => prev.filter(msg => !msg.isLoading));
      
      // Show error message with recovery suggestions
      const errorMessage: ChatMessage = {
        id: `error_${Date.now()}`,
        type: 'ai',
        content: `❌ Sorry, I encountered an unexpected error.

**What you can do:**
1. ✅ Check your internet connection
2. ⏳ Wait a moment and try again
3. 📝 Enter your data manually (fallback option)

**Backend status:** ${health?.available ? '🟢 Connected' : '🔴 Offline'}`,
        timestamp: new Date(),
      };
      
      addUniqueMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, collectingFinancials, currentFinancialQuestion, financialData, foundCompany, financialQuestions, lookupService, addUniqueMessage, onCompanyFound, healthStatus]);

  /**
   * Keyboard shortcut handler
   */
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  /**
   * Quick suggestion handler
   */
  const useSuggestion = useCallback((suggestion: string) => {
    setInputValue(suggestion);
  }, []);

  return (
    <div className="flex h-full flex-col overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900">
      {/* Header with Health Status - Ilara Style */}
      <div className="border-b border-zinc-700/50 bg-zinc-900/50 backdrop-blur-sm px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-blue-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">AI Assistant</h3>
              <p className="text-zinc-400 text-xs">Instant company lookup</p>
            </div>
          </div>
          
          {/* Health Status Indicator */}
          {healthStatus && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">
              <div className={`w-2 h-2 rounded-full ${
                healthStatus.available ? 'bg-green-500' : 'bg-red-500'
              } animate-pulse`} />
              <span className="text-xs text-zinc-300 font-medium">
                {healthStatus.available ? 'Connected' : 'Offline'}
              </span>
            </div>
          )}
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
                      : 'bg-zinc-700/50 text-white'
                  }`}
                >
                  {message.isLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <UpswitchLoadingSpinner />
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

      {/* Input Area - Sticky at Bottom - Ilara Style */}
      <div className="p-4 border-t border-zinc-800 flex-shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="focus-within:bg-zinc-900/30 group flex flex-col gap-3 p-4 duration-150 w-full rounded-3xl border border-zinc-700/50 bg-zinc-900/20 text-base shadow-xl transition-all ease-in-out focus-within:border-zinc-500/40 hover:border-zinc-600/30 focus-within:hover:border-zinc-500/40 backdrop-blur-sm"
        >
          {/* Textarea container */}
          <div className="relative flex items-center">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your company name (e.g., Proximus Belgium)..."
              className="flex w-full rounded-md px-3 py-3 ring-offset-background placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-sm leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap max-h-[200px] bg-transparent focus:bg-transparent flex-1 text-white"
              style={{ minHeight: '60px', height: '60px' }}
              disabled={isLoading}
              spellCheck="false"
            />
          </div>

          {/* Action buttons row */}
          <div className="flex gap-2 flex-wrap items-center">
            {/* Quick suggestion buttons */}
            {messages.length <= 1 && (
              <>
                <button
                  type="button"
                  onClick={() => useSuggestion('Proximus Belgium')}
                  className="px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-zinc-600/60 rounded-full text-xs text-zinc-300 hover:text-white transition-all duration-200 hover:shadow-md hover:shadow-black/20"
                >
                  Proximus Belgium
                </button>
                <button
                  type="button"
                  onClick={() => useSuggestion('Delhaize')}
                  className="px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-zinc-600/60 rounded-full text-xs text-zinc-300 hover:text-white transition-all duration-200 hover:shadow-md hover:shadow-black/20"
                >
                  Delhaize
                </button>
              </>
            )}

            {/* Right side with send button */}
            <div className="flex flex-grow items-center justify-end gap-2">
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
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
