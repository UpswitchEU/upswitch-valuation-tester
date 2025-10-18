import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { serviceLogger } from '../utils/logger';

interface Message {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
}

interface AIAssistantProps {
  onCompanyFound?: (data: any) => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({
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
      // Simulate API call to search for company
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== loadingId));
      
      // Mock company found response
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: `✅ **Found your company!** 

**Company:** ${userMessage}
**Country:** Belgium 🇧🇪
**Status:** Active in KBO registry

Now I need a few quick financial details to calculate your valuation:

1️⃣ **What's your annual revenue?** (e.g., €500K, €1M, €2.5M)
2️⃣ **What's your EBITDA/profit?** (e.g., €100K, €200K, €500K)
3️⃣ **Any other key financials?** (debt, cash, assets)

Ready to get your professional valuation?`,
        timestamp: new Date()
      }]);

      // Notify parent component
      if (onCompanyFound) {
        onCompanyFound({
          company_name: userMessage,
          country_code: 'BE',
          found_in_registry: true
        });
      }
      
    } catch (error) {
      serviceLogger.error('Company search error', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== loadingId));
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: `❌ Sorry, I couldn't find "${userMessage}" in the company registry.

**What would you like to do?**
1. **Try a different company name** (check spelling)
2. **Enter financial data manually** (if you have the company's financial statements)
3. **Search by registration number** (if you have it)

Currently supporting Belgian companies. More countries coming soon! 🚀`,
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
              onClick={() => setInput('Innovate NV')}
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
