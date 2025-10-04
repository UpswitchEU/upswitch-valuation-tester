import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Send, Sparkles, Building2, MapPin, Users, Calendar } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  data?: any;
}

interface AIConversationProps {
  extractedCompanyName?: string;
  onComplete: (data: any) => void;
}

const LoadingDots = () => (
  <div className="flex items-center gap-1">
    <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
    <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
    <div className="w-2 h-2 bg-primary-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
  </div>
);

export const AIConversation: React.FC<AIConversationProps> = ({
  extractedCompanyName,
  onComplete,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'ai',
      content: extractedCompanyName
        ? `Great! I've processed your financial documents securely. Now let me help with some additional details.

I see the company name might be **${extractedCompanyName}**. Let me look that up in public company registries...`
        : `Perfect! Your financial documents have been processed securely. Now I need a few more details to complete your valuation. 

What's your company name and which country are you based in?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [collectedData, setCollectedData] = useState<any>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-trigger company lookup if we have a company name
  useEffect(() => {
    if (extractedCompanyName && messages.length === 1) {
      setTimeout(() => {
        handleCompanyLookup(extractedCompanyName);
      }, 1500);
    }
  }, [extractedCompanyName]);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newMessage]);
    return newMessage;
  }, []);

  const handleCompanyLookup = async (companyName: string) => {
    const loadingMsg = addMessage({
      type: 'ai',
      content: '🔍 Searching public company registries...',
    });

    try {
      // TODO: Call backend /api/v1/companies/lookup
      // This is PUBLIC data (company registries) - safe for LLM
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Remove loading message
      setMessages((prev: ChatMessage[]) => prev.filter(m => m.id !== loadingMsg.id));

      // Mock company data (from public registries)
      const companyData = {
        name: companyName,
        country: 'Belgium',
        founded: 2015,
        employees: 45,
        industry: 'Retail',
        business_model: 'B2C',
      };

      setCollectedData((prev: any) => ({ ...prev, ...companyData }));

      addMessage({
        type: 'ai',
        content: `✅ Found your company in the Belgian company registry!

**${companyData.name}**
📍 Country: ${companyData.country}
📅 Founded: ${companyData.founded}
👥 Employees: ~${companyData.employees}
🏢 Industry: ${companyData.industry}
💼 Model: ${companyData.business_model}

A few quick questions to refine your valuation:

1️⃣ Do you have any **unique intellectual property** (patents, trademarks, proprietary technology)?
2️⃣ What's your **growth trajectory** over the last 2 years?
3️⃣ Any **strategic partnerships** or major contracts?`,
        data: companyData,
      });
    } catch (error) {
      setMessages((prev: ChatMessage[]) => prev.filter(m => m.id !== loadingMsg.id));
      addMessage({
        type: 'ai',
        content: `I couldn't find "${companyName}" in public registries. Could you tell me:
        
• Your company's full legal name?
• Which country are you based in?
• What industry/sector?`,
      });
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    addMessage({
      type: 'user',
      content: userMessage,
    });

    setIsLoading(true);

    // Simulate AI processing (in reality, this goes to LLM)
    // IMPORTANT: Only NON-FINANCIAL data is sent to LLM
    // Financial numbers were already extracted in Step 1 (private)
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Check if user is providing company name
    if (!collectedData.name && (userMessage.toLowerCase().includes('company') || userMessage.length > 3)) {
      // Try to extract company name and trigger lookup
      const possibleCompanyName = userMessage.split('in ')[0].trim();
      await handleCompanyLookup(possibleCompanyName);
      setIsLoading(false);
      return;
    }

    // Parse response for common questions
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('patent') || lowerMessage.includes('ip') || lowerMessage.includes('trademark')) {
      setCollectedData((prev: any) => ({ ...prev, has_ip: true, ip_description: userMessage }));
      addMessage({
        type: 'ai',
        content: `Great! Intellectual property adds significant value. I've noted that.

What about your **growth trajectory** over the last 2 years? Have you been:
• Growing rapidly (>30% YoY)
• Steady growth (10-30% YoY)
• Stable (0-10% YoY)
• Declining`,
      });
    } else if (lowerMessage.includes('grow') || lowerMessage.includes('increase') || lowerMessage.includes('%')) {
      setCollectedData((prev: any) => ({ ...prev, growth_rate: userMessage }));
      addMessage({
        type: 'ai',
        content: `Excellent! Growth patterns are important for valuation.

Do you have any **strategic partnerships** or major long-term contracts that provide revenue stability?`,
      });
    } else if (lowerMessage.includes('partner') || lowerMessage.includes('contract') || lowerMessage.includes('client')) {
      setCollectedData((prev: any) => ({ ...prev, partnerships: userMessage }));
      addMessage({
        type: 'ai',
        content: `Perfect! I think I have everything I need now.

Let me calculate your business valuation based on:
✅ Your financial data (processed securely)
✅ Company registry information
✅ Industry benchmarks
✅ Growth factors
✅ Strategic assets

Calculating...`,
      });

      // Trigger valuation calculation
      setTimeout(() => {
        onComplete(collectedData);
      }, 2000);
    } else {
      // General response
      addMessage({
        type: 'ai',
        content: `I understand. Let me ask a few more clarifying questions to give you the most accurate valuation.

Could you tell me about:
• Any unique competitive advantages?
• Customer concentration (do you rely heavily on a few clients)?
• Market position (leader, challenger, niche player)?`,
      });
    }

    setIsLoading(false);
  }, [inputValue, isLoading, collectedData, addMessage, onComplete]);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[700px]">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-t-2xl p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-xl">AI Assistant</h3>
            <p className="text-primary-100 text-sm">
              Powered by LLM - Only public data (company registries, industry info)
            </p>
          </div>
        </div>

        {/* Privacy Notice */}
        <div className="mt-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-3">
          <p className="text-white text-xs flex items-start gap-2">
            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <span>
              <strong>Privacy Note:</strong> This AI assistant only processes public information
              (company names, industries, etc.). Your financial data from Step 1 remains private and
              is never shared with external AI services.
            </span>
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 p-6 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[80%] ${message.type === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              {/* Avatar */}
              {message.type === 'ai' && (
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary-600" />
                  </div>
                  <span className="text-xs font-medium text-gray-600">AI Assistant</span>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`px-5 py-3 rounded-2xl shadow-sm ${
                  message.type === 'user'
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                }`}
              >
                <div className="text-sm whitespace-pre-line leading-relaxed">{message.content}</div>

                {/* Display extracted company data */}
                {message.data && message.type === 'ai' && (
                  <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{message.data.country}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Est. {message.data.founded}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Users className="w-3.5 h-3.5" />
                      <span>{message.data.employees} employees</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{message.data.business_model}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Timestamp */}
              <div
                className={`text-xs text-gray-400 mt-1 px-2 ${
                  message.type === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-5 py-4">
              <LoadingDots />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-gray-200 p-4 rounded-b-2xl">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-3 items-end"
        >
          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent max-h-32"
            rows={2}
            disabled={isLoading}
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="flex-shrink-0 p-3 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-2 text-center">
          Press Enter to send • Shift+Enter for new line
        </p>
      </div>
    </div>
  );
};
