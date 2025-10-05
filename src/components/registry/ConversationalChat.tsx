import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { searchCompanies, fetchCompanyFinancials } from '../../services/registryService';
import type { CompanyFinancialData } from '../../types/registry';

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
      content: `Hi! I'm your AI valuation assistant 👋

I can value your business in 30 seconds by looking up your official financial accounts from public registries.

Just tell me your company name and country.

**Examples:**
• "Innovate NV in Belgium"
• "Acme Trading BV in Belgium"
• "Tech Solutions SA in Belgium"

**Supported countries:** 🇧🇪 Belgium`,
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
      country = 'GB';
    } else if (deMatch) {
      companyName = deMatch[0];
      country = 'DE';
    } else if (nlMatch) {
      companyName = nlMatch[0];
      country = 'NL';
    } else if (beMatch) {
      companyName = beMatch[0];
      country = 'BE';
    } else if (frMatch) {
      companyName = frMatch[0];
      country = 'FR';
    } else {
      // Default extraction from text before "in"
      const parts = text.split(/\s+in\s+/i);
      companyName = parts[0].trim();
      
      // Detect country from text
      if (text.toLowerCase().includes('uk') || text.toLowerCase().includes('united kingdom')) country = 'GB';
      else if (text.toLowerCase().includes('germany') || text.toLowerCase().includes('deutschland')) country = 'DE';
      else if (text.toLowerCase().includes('belgium') || text.toLowerCase().includes('belgique')) country = 'BE';
      else if (text.toLowerCase().includes('netherlands') || text.toLowerCase().includes('holland')) country = 'NL';
      else if (text.toLowerCase().includes('france')) country = 'FR';
      else if (text.toLowerCase().includes('luxembourg')) country = 'LU';
      else {
        // Default to Belgium for unknown companies since backend supports it
        country = 'BE';
      }
    }
    
    return { companyName, country };
  };

  const formatCurrency = (amount: number, country: string = 'GB'): string => {
    const symbol = country === 'GB' ? '£' : '€';
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
      content: 'Looking up your company in official registries...',
      timestamp: new Date(),
      isLoading: true
    }]);

    try {
      const { companyName, country } = extractCompanyInfo(userMessage);
      
      // Search company (real API)
      const searchResults = await searchCompanies(companyName, country);
      
      if (searchResults.length > 0) {
        const bestMatch = searchResults[0];
        
        // Check if this is a suggestion/help result
        if (bestMatch.company_id === 'suggestion') {
          // Remove loading message
          setMessages(prev => prev.filter(m => m.id !== loadingId));
          
          // Add helpful suggestions message
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'ai',
            content: `⚠️ I couldn't find "${companyName}" in the ${getCountryFlag(country)} registry.\n\n**This could mean:**\n• The company name spelling is slightly different\n• It's a very new company (hasn't filed accounts yet)\n• It's not a registered limited company (e.g., sole trader)\n• The registry is temporarily unavailable\n\n**What would you like to do?**\n1. Try with the exact company name or registration number\n2. Try a different country\n3. Enter your financials manually instead`,
            timestamp: new Date()
          }]);
          
          return;
        }
        
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
📊 Revenue: ${formatCurrency(latest.revenue || 0, country)}
💰 EBITDA: ${formatCurrency(latest.ebitda || 0, country)}
🏦 Assets: ${formatCurrency(latest.total_assets || 0, country)}

📚 I found **${financialData.filing_history.length} years** of financial history

🔗 [View on ${financialData.data_source}](${financialData.source_url})

---

Would you like to:
1. **Calculate valuation** with ${latest.year} data
2. **Add more recent data** (if you have 2024/2025 figures)
3. **Review all ${financialData.filing_history.length} years** of data first`,
          timestamp: new Date()
        }]);

        // Notify parent after a brief delay to show message
        setTimeout(() => {
          onCompanyFound(financialData);
        }, 1500);
        
      } else {
        // Not found
        setMessages(prev => prev.filter(m => m.id !== loadingId));
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: `⚠️ I couldn't find "${companyName}" in the ${getCountryFlag(country)} registry.

**This could mean:**
• The company name spelling is slightly different
• It's a very new company (hasn't filed accounts yet)
• It's not a registered limited company (e.g., sole trader)
• The registry is temporarily unavailable

**What would you like to do?**
1. Try with the exact company name or registration number
2. Try a different country
3. Enter your financials manually instead`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Lookup error:', error);
      setMessages(prev => prev.filter(m => m.id !== loadingId));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: `❌ Sorry, I had trouble accessing the registry.

**Error:** ${error instanceof Error ? error.message : 'Unknown error'}

Would you like to:
• Try again
• Enter your data manually`,
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
            <span className="text-2xl">🇧🇪</span>
          </div>
          <div>
            <h3 className="text-xl font-bold">Belgian Company Lookup</h3>
            <p className="text-sm opacity-90">Find your company in the Belgian registry</p>
          </div>
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
            placeholder="Type your company name and country..."
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
              onClick={() => useSuggestion('Innovate NV in Belgium')}
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors font-medium"
              disabled={isProcessing}
            >
              🇧🇪 Belgian Company
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

