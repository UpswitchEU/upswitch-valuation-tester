import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Shield } from 'lucide-react';
import { searchCompanies, fetchCompanyFinancials } from '../services/registryService';
import type { CompanyFinancialData } from '../types/registry';
import type { BusinessProfileData } from '../services/businessDataService';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface ConversationalChatProps {
  onCompanyFound: (data: CompanyFinancialData) => void;
  businessProfile?: BusinessProfileData | null;
}

export const ConversationalChat: React.FC<ConversationalChatProps> = ({
  onCompanyFound,
  businessProfile
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Customize initial message when business profile exists
  const getInitialMessage = () => {
    if (businessProfile?.company_name) {
      return `👋 Hi! I see you want to value ${businessProfile.company_name}. Let me help you get a comprehensive valuation.`;
    }
    return `👋 Hi! I'm here to help you get a business valuation. Let's start by finding your company. What's the name of your company?`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Initialize messages with dynamic initial message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: '1',
        type: 'ai',
        content: getInitialMessage(),
        timestamp: new Date()
      }]);
    }
  }, [businessProfile]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const extractCompanyInfo = (text: string): { companyName: string; country: string } => {
    // Simple extraction - in production, this would use NLP
    const ukMatch = text.match(/([A-Za-z\s&]+)\s+(?:Ltd|Limited|PLC|plc)/i);
    const deMatch = text.match(/([A-Za-z\s&]+)\s+GmbH/i);
    const nlMatch = text.match(/([A-Za-z\s&]+)\s+(?:BV|NV)/i);
    const beMatch = text.match(/([A-Za-z\s&]+)\s+(?:BVBA|SPRL|SA|NV)/i);
    const frMatch = text.match(/([A-Za-z\s&]+)\s+(?:SAS|SARL|SA)/i);
    
    let companyName = '';
    let country = 'BE'; // Default to Belgium since that's what the backend supports
    
    if (ukMatch) {
      companyName = ukMatch[0];
      country = 'BE'; // Force Belgium since backend only supports it
    } else if (deMatch) {
      companyName = deMatch[0];
      country = 'BE'; // Force Belgium since backend only supports it
    } else if (nlMatch) {
      companyName = nlMatch[0];
      country = 'BE'; // Force Belgium since backend only supports it
    } else if (beMatch) {
      companyName = beMatch[0];
      country = 'BE';
    } else if (frMatch) {
      companyName = frMatch[0];
      country = 'BE'; // Force Belgium since backend only supports it
    } else {
      // Default extraction from text before "in"
      const parts = text.split(/\s+in\s+/i);
      companyName = parts[0].trim();
      
      // Always default to Belgium since backend only supports it
      country = 'BE';
    }
    
    return { companyName, country };
  };

  const formatCurrency = (amount: number): string => {
    const symbol = '€';
    if (amount >= 1000000) {
      return `${symbol}${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `${symbol}${(amount / 1000).toFixed(0)}K`;
    }
    return `${symbol}${amount.toFixed(0)}`;
  };

  const getCountryFlag = (code: string): string => {
    const flags: Record<string, string> = {
      'GB': '🇬🇧',
      'BE': '🇧🇪',
      'NL': '🇳🇱',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'LU': '🇱🇺'
    };
    return flags[code] || '🌍';
  };

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

    // Add loading message
    const loadingId = Date.now().toString() + '_loading';
    setMessages(prev => [...prev, {
      id: loadingId,
      type: 'ai',
      content: '🔍 Searching for your company...',
      timestamp: new Date(),
      isLoading: true
    }]);

    try {
      const { companyName, country } = extractCompanyInfo(userMessage);
      
      // Search company (real API)
      const searchResults = await searchCompanies(companyName, country);
      
      if (searchResults.length > 0) {
        const bestMatch = searchResults[0];
        
        // Remove loading message
        setMessages(prev => prev.filter(m => m.id !== loadingId));
        
        // Add "Found company" message
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: `${getCountryFlag(country)} **Found your company!** Fetching financial data...`,
          timestamp: new Date(),
          isLoading: true
        }]);

        // Fetch financials (real API)
        try {
          const financialData = await fetchCompanyFinancials(bestMatch.company_id, country);
          
          const latest = financialData.filing_history[0];
          
          // Add success message with data
          setMessages(prev => prev.filter(m => !m.isLoading));
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'ai',
            content: `✅ **${financialData.company_name}**
Registration: ${financialData.registration_number}

**Latest filed accounts (${latest.year}):**
📊 Revenue: ${formatCurrency(latest.revenue || 0)}
💰 EBITDA: ${formatCurrency(latest.ebitda || 0)}
🏦 Assets: ${formatCurrency(latest.total_assets || 0)}

📚 I found **${financialData.filing_history.length} years** of financial history

📁 Data source: Official records

---

✅ **Ready for automatic valuation!**

Would you like to:
1. **Calculate valuation now** (recommended - data is ready)
2. **Review/adjust data** before valuation
3. **Add more recent data** (if you have ${new Date().getFullYear()} figures)`,
            timestamp: new Date()
          }]);

          // Notify parent after a brief delay to show message
          setTimeout(() => {
            onCompanyFound(financialData);
          }, 1500);
        } catch (financialError) {
          console.error('Financial data fetch error:', financialError);
          
          setMessages(prev => prev.filter(m => !m.isLoading));
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'ai',
            content: `✅ **Found: ${bestMatch.company_name}**
Registration: ${bestMatch.registration_number}

📋 No financial data available in public registries, but no problem!

💬 **Let's collect the data together** - I'll ask a few quick questions.

⏱️ Takes under 1 minute • 🔒 Your data stays secure

---

**Question 1 of 2:**
What's your annual revenue for this year? (in EUR)

💡 Your total income before expenses`,
            timestamp: new Date()
          }]);

          // Continue with conversational financial data collection
          setTimeout(() => {
            onCompanyFound({
              company_id: bestMatch.company_id,
              company_name: bestMatch.company_name,
              registration_number: bestMatch.registration_number,
              country_code: bestMatch.country_code,
              legal_form: bestMatch.legal_form,
              filing_history: [], // Empty - will be collected via conversation
              data_source: 'conversational_input',
              last_updated: new Date().toISOString(),
              completeness_score: 0.5
            });
          }, 1500);
        }
        
      } else {
        // Not found
        setMessages(prev => prev.filter(m => m.id !== loadingId));
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: `❌ Sorry, I couldn't find "${companyName}" in the company registry.

**What would you like to do?**
1. **Try a different company name** (check spelling)
2. **Enter financial data manually** (if you have the company's financial statements)
3. **Search by registration number** (if you have it)

Currently supporting Belgian companies. More countries coming soon! 🚀`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Lookup error:', error);
      
      setMessages(prev => prev.filter(m => m.id !== loadingId));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: `❌ Sorry, I had trouble finding that company.

**What happened:**
${error instanceof Error ? error.message : 'An unexpected error occurred'}

**Recommended actions:**
1. **Try again** with exact company name or registration number
2. **Enter your data manually**`,
        timestamp: new Date()
      }]);
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

  const useSuggestion = (suggestion: string) => {
    setInput(suggestion);
  };

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
              <h3 className="text-white font-semibold text-sm">AI auditor</h3>
              <p className="text-xs text-zinc-400">Powered by LLM - Only public data</p>
            </div>
          </div>
          
          {/* Health Status Indicator */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700/50">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-zinc-300 font-medium">Connected</span>
          </div>
        </div>
        
        {/* Privacy Note */}
        <div className="mt-4 bg-zinc-800/30 backdrop-blur-sm border border-zinc-700/50 rounded-lg p-3">
          <p className="text-zinc-300 text-xs flex items-start gap-2">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Privacy Note:</strong> This AI assistant only processes public information
              (company names, industries, etc.). Your financial data remains private and
              is never shared with external AI services.
            </span>
          </p>
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
                      <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
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
            handleSend();
          }}
          className="focus-within:bg-zinc-900/30 group flex flex-col gap-3 p-4 duration-150 w-full rounded-3xl border border-zinc-700/50 bg-zinc-900/20 text-base shadow-xl transition-all ease-in-out focus-within:border-zinc-500/40 hover:border-zinc-600/30 focus-within:hover:border-zinc-500/40 backdrop-blur-sm"
        >
          {/* Textarea container */}
          <div className="relative flex items-center">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter your company name (e.g., Proximus Belgium)..."
              className="flex w-full rounded-md px-3 py-3 ring-offset-background placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-sm leading-snug placeholder-shown:text-ellipsis placeholder-shown:whitespace-nowrap max-h-[200px] bg-transparent focus:bg-transparent flex-1 text-white"
              style={{ minHeight: '60px', height: '60px' }}
              disabled={isProcessing}
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
