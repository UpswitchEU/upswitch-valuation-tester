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
import { Send, Bot, User } from 'lucide-react';
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
      content: `👋 Welcome! I'll help you value your business in under 30 seconds.

Just tell me your **company name** and I'll take care of the rest.

**How it works:**
1. You tell me your company name
2. I find and analyze your financial data
3. You get a professional valuation report

**Examples:**
• "Innovate NV"
• "Acme Trading"
• "Tech Solutions"

Currently supporting Belgian companies. More countries coming soon! 🚀`,
      timestamp: new Date(),
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageIdsRef = useRef(new Set<string>()); // For deduplication
  const lookupService = useRef(new CompanyLookupService()).current;

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
   * Checks backend availability every 30 seconds
   * Adapted from Ilara's proactive health monitoring
   */
  useEffect(() => {
    const checkHealth = async () => {
      const health = await lookupService.checkHealth();
      setHealthStatus(health);
    };
    
    // Initial check
    checkHealth();
    
    // Periodic checks
    const interval = setInterval(checkHealth, 30000); // Every 30s
    
    return () => clearInterval(interval);
  }, [lookupService]);

  /**
   * Auto-scroll to bottom
   * Smooth scroll when new messages are added
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    setInputValue('');
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
        // Success - company found with financial data
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

**Backend status:** ${healthStatus?.available ? '🟢 Connected' : '🔴 Offline'}`,
        timestamp: new Date(),
      };
      
      addUniqueMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, isLoading, lookupService, addUniqueMessage, onCompanyFound, healthStatus]);

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
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header with health status */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-2xl">⚡</span>
            </div>
            <div>
              <h3 className="text-xl font-bold">AI Valuation Assistant</h3>
              <p className="text-sm opacity-90">Professional company valuation in 30 seconds</p>
            </div>
          </div>
          
          {/* Health indicator - from Ilara architecture */}
          <div className="flex items-center gap-2 text-xs bg-white/10 rounded-full px-3 py-1.5">
            <div className={`w-2 h-2 rounded-full animate-pulse ${
              healthStatus?.available ? 'bg-green-400' : 'bg-red-400'
            }`} />
            <span className="font-medium">
              {healthStatus?.available ? 'Connected' : 'Offline'}
            </span>
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
                <UpswitchLoadingSpinner 
                  message="Searching for your company..."
                  submessage="Analyzing financial records"
                  size="small"
                />
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
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your company name here..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm hover:shadow-md"
            title="Send message (Enter)"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Quick suggestions - only show initially */}
        {messages.length <= 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => useSuggestion('Innovate NV')}
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors font-medium disabled:opacity-50"
              disabled={isLoading}
            >
              Try example
            </button>
            <span className="text-xs text-gray-400 self-center">💡 Tip: Use exact company name or registration number</span>
          </div>
        )}
      </div>
    </div>
  );
};
