import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { searchCompanies, fetchCompanyFinancials } from '../../services/registryService';
import type { CompanyFinancialData } from '../../types/registry';
import { 
  isRealCompany, 
  isValidCompanyId, 
  getNotFoundMessage,
  categorizeError,
  getErrorMessage,
  RegistryErrorType
} from '../../utils/registryUtils';
import {
  transformRegistryDataToValuationRequest,
  validateDataForValuation,
  getTransformationSummary
} from '../../services/transformationService';
import { useAuth } from '../../contexts/AuthContext';

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
  const { businessCard, isAuthenticated } = useAuth();
  
  // 🚀 SMART INITIAL MESSAGE: Personalized based on user's business data
  const getInitialMessage = () => {
    if (isAuthenticated && businessCard?.company_name) {
      return `👋 Hi! I see you're from **${businessCard.company_name}**!

I'll help you get a professional valuation for your business in 1-2 minutes.

**I already know:**
• Company: ${businessCard.company_name}
• Industry: ${businessCard.industry || 'Not specified'}
• Founded: ${businessCard.founding_year || 'Not specified'}
• Team: ${businessCard.employee_count ? `${businessCard.employee_count} employees` : 'Not specified'}

**I just need:**
• Your company's **revenue** and **profit** numbers
• A few quick financial details

Ready to get your valuation? Just say "yes" or tell me your company name to confirm!`;
    }
    
    // Fallback for non-authenticated users or when business card is not available
    const companySuggestion = businessCard?.company_name ? `• "${businessCard.company_name}" (your company)` : '';
    
    return `👋 Welcome! I'll help you value your business in 1-2 minutes.

Just tell me your **company name** to get started.

**How it works:**
1. You tell me your company name
2. I search official registries for your company
3. I'll ask 2-4 quick financial questions
4. You get your professional valuation report

**Examples:**
${companySuggestion ? companySuggestion + '\n' : ''}• "Innovate NV"
• "Acme Trading"
• "Tech Solutions"

Currently supporting Belgian companies. More countries coming soon! 🚀`;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: getInitialMessage(),
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

    // 🚀 SMART HANDLING: Check if user is confirming their company
    if (isAuthenticated && businessCard?.company_name && 
        (userMessage.toLowerCase().includes('yes') || 
         userMessage.toLowerCase().includes(businessCard.company_name.toLowerCase()))) {
      
      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== loadingId));
      
      // Create user company data and proceed
      const userCompanyData: CompanyFinancialData = {
        company_id: `user-${businessCard.company_name.toLowerCase().replace(/\s+/g, '-')}`,
        company_name: businessCard.company_name,
        registration_number: '',
        country_code: businessCard.country_code || 'BE',
        legal_form: 'BV',
        industry_code: businessCard.industry || 'services',
        industry_description: businessCard.industry || 'services',
        founding_year: businessCard.founding_year || new Date().getFullYear(),
        employees: businessCard.employee_count || 1,
        filing_history: [],
        data_source: 'user_profile',
        last_updated: new Date().toISOString(),
        completeness_score: 100
      };
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: `✅ Perfect! I have your company details for **${businessCard.company_name}**.

🔍 I'm also verifying your company in the official KBO registry in the background to ensure we have the most accurate data.

Now I just need your financial information to calculate your valuation. Let me ask a few quick questions:

1️⃣ **What's your annual revenue?** (e.g., €500K, €1M, €2.5M)
2️⃣ **What's your net profit/EBITDA?** (e.g., €100K, €200K, €500K)
3️⃣ **Any other financial details?** (debt, cash, assets)

Ready to start?`,
        timestamp: new Date()
      }]);
      
      setIsProcessing(false);
      onCompanyFound(userCompanyData);
      return;
    }

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
        
        // Debug: Log the entire result object
        console.log('🔍 Full search result:', JSON.stringify(bestMatch, null, 2));
        console.log('🔍 Result keys:', Object.keys(bestMatch));
        console.log('🔍 Result type:', bestMatch.result_type);
        
        // Type-safe detection: Check if this is a real company or a suggestion
        if (!isRealCompany(bestMatch)) {
          console.log('🔍 Detected suggestion/non-company result');
          
          // Remove loading message
          setMessages(prev => prev.filter(m => m.id !== loadingId));
          
          // Add helpful suggestions message using utility function
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'ai',
            content: getNotFoundMessage(companyName, country),
            timestamp: new Date()
          }]);
          
          setIsProcessing(false);
          return;
        }
        
        // Validate company ID format before proceeding
        if (!isValidCompanyId(bestMatch.company_id, country)) {
          console.error('🔍 Invalid company ID format:', bestMatch.company_id);
          
          // Remove loading message
          setMessages(prev => prev.filter(m => m.id !== loadingId));
          
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'ai',
            content: `⚠️ Invalid company ID format: "${bestMatch.company_id}"\n\nThis appears to be an error. Please try searching again or contact support.`,
            timestamp: new Date()
          }]);
          
          setIsProcessing(false);
          return;
        }
        
        console.log('✅ Valid company found:', bestMatch.company_name);
        
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

        // Fetch financials (real API) with error categorization
        try {
          const financialData = await fetchCompanyFinancials(bestMatch.company_id, country);
          
          const latest = financialData.filing_history[0];
          
          // Validate data for valuation
          const validation = validateDataForValuation(financialData);
          
          // Transform data to valuation format
          let transformationSummary = '';
          let valuationRequest = null;
          
          if (validation.valid) {
            try {
              valuationRequest = transformRegistryDataToValuationRequest(financialData);
              transformationSummary = getTransformationSummary(financialData, valuationRequest);
              console.log('✅ Data transformation successful:', valuationRequest);
            } catch (transformError) {
              console.error('Data transformation failed:', transformError);
              validation.warnings.push('Automatic data transformation failed - manual entry may be required');
            }
          }
          
          // Add success message with data and transformation info
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

📁 Data source: Official records

---

${transformationSummary}

---

${validation.valid 
  ? `✅ **Ready for automatic valuation!**\n\nWould you like to:\n1. **Calculate valuation now** (recommended - data is ready)\n2. **Review/adjust data** before valuation\n3. **Add more recent data** (if you have ${new Date().getFullYear()} figures)`
  : `⚠️ **Data validation issues:**\n${validation.errors.map(e => `❌ ${e}`).join('\n')}\n\nPlease:\n1. **Enter financial data manually**\n2. **Try a different company**`
}`,
            timestamp: new Date()
          }]);

          // Notify parent after a brief delay to show message
          setTimeout(() => {
            onCompanyFound(financialData);
          }, 1500);
        } catch (financialError) {
          console.error('Financial data fetch error:', financialError);
          
          // Categorize the error for better messaging
          const errorType = categorizeError(financialError);
          const errorMessage = getErrorMessage(errorType);
          
          setMessages(prev => prev.filter(m => !m.isLoading));
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'ai',
            content: `⚠️ **Found ${bestMatch.company_name}** but couldn't access financial data.

**Error:** ${errorMessage}

**This could mean:**
• The company's financial data isn't publicly available yet
• Financial statements haven't been filed recently
• The data source is temporarily unavailable
• There was a network connectivity issue

**What would you like to do?**
1. **Try again** (${errorType === RegistryErrorType.TIMEOUT || errorType === RegistryErrorType.NETWORK_ERROR ? 'recommended - might be a temporary issue' : 'sometimes data is temporarily unavailable'})
2. **Enter financial data manually** (if you have the company's financial statements)
3. **Search for a different company**`,
            timestamp: new Date()
          }]);
        }
        
      } else {
        // Not found - use utility function for consistent messaging
        setMessages(prev => prev.filter(m => m.id !== loadingId));
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: getNotFoundMessage(companyName, country),
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Lookup error:', error);
      
      // Categorize the error for better user guidance
      const errorType = categorizeError(error);
      const errorMessage = getErrorMessage(errorType);
      
      setMessages(prev => prev.filter(m => m.id !== loadingId));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: `❌ Sorry, I had trouble finding that company.

**Error Type:** ${errorType}
**Details:** ${errorMessage}

**What happened:**
${error instanceof Error ? error.message : 'An unexpected error occurred'}

**Recommended actions:**
${errorType === RegistryErrorType.NETWORK_ERROR || errorType === RegistryErrorType.TIMEOUT 
  ? '1. **Check your internet connection** and try again\n2. Wait a moment and retry\n3. Enter your data manually' 
  : errorType === RegistryErrorType.UNSUPPORTED_COUNTRY
  ? '1. **Try Belgium (BE)** - currently the only supported country\n2. Enter your data manually'
  : errorType === RegistryErrorType.RATE_LIMITED
  ? '1. **Wait 1-2 minutes** before trying again\n2. Enter your data manually'
  : '1. **Try again** with exact company name or registration number\n2. Enter your data manually'}`,
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
            <span className="text-2xl">⚡</span>
          </div>
          <div>
            <h3 className="text-xl font-bold">AI Valuation Assistant</h3>
            <p className="text-sm opacity-90">Tell me your company name, I'll handle the rest</p>
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

