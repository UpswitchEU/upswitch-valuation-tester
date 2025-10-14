import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles, Shield } from 'lucide-react';
import { searchCompanies, fetchCompanyFinancials } from '../services/registryService';
import type { CompanyFinancialData } from '../types/registry';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface ConversationalChatProps {
  onCompanyFound: (data: CompanyFinancialData) => void;
}

export const ConversationalChat: React.FC<ConversationalChatProps> = ({
  onCompanyFound
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: `👋 Hi! I'm here to help you get a business valuation. Let's start by finding your company. What's the name of your company?`,
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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
            content: `⚠️ **Found ${bestMatch.company_name}** but couldn't access financial data.

**This could mean:**
• The company's financial data isn't publicly available yet
• Financial statements haven't been filed recently
• The data source is temporarily unavailable
• There was a network connectivity issue

**What would you like to do?**
1. **Try again** (sometimes data is temporarily unavailable)
2. **Enter financial data manually** (if you have the company's financial statements)
3. **Search for a different company**`,
            timestamp: new Date()
          }]);
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
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold">AI Assistant</h3>
            <p className="text-sm opacity-90">Powered by LLM - Only public data (company registries, industry info)</p>
          </div>
        </div>
        
        {/* Privacy Note */}
        <div className="mt-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
          <p className="text-white text-xs flex items-start gap-2">
            <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>
              <strong>Privacy Note:</strong> This AI assistant only processes public information
              (company names, industries, etc.). Your financial data remains private and
              is never shared with external AI services.
            </span>
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
          >
            <div
              className={`max-w-[85%] p-4 rounded-xl ${
                message.type === 'user'
                  ? 'bg-primary-600 text-white rounded-br-none shadow-md'
                  : 'bg-white text-gray-800 rounded-bl-none shadow-sm border border-gray-100'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {message.type === 'ai' && <Bot className="w-4 h-4 text-primary-600" />}
                {message.type === 'user' && <User className="w-4 h-4" />}
                <span className="font-semibold text-sm">
                  {message.type === 'user' ? 'You' : 'AI Assistant'}
                </span>
              </div>
              
              {message.isLoading ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-primary-600" />
                  <span className="text-sm">{message.content}</span>
                </div>
              ) : (
                <div 
                  className="text-sm whitespace-pre-wrap leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
                      .replace(/\n/g, '<br/>')
                      .replace(/^• /gm, '&nbsp;&nbsp;• ')
                  }}
                />
              )}
              
              <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-primary-100' : 'text-gray-400'}`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your company name here..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
        
        {/* Quick suggestions */}
        {messages.length <= 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => useSuggestion('Innovate NV')}
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors font-medium"
              disabled={isProcessing}
            >
              Try example
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
