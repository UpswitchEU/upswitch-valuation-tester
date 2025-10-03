import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Upload, Building2, Calculator, FileText, Sparkles, Send } from 'lucide-react';
import { useValuationStore } from '../store/useValuationStore';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  content: string;
  timestamp: Date;
  data?: any;
  isLoading?: boolean;
}

interface ValuationChatProps {
  onValuationComplete?: () => void;
}

const LoadingSpinner = () => (
  <div className="flex items-center gap-3 text-primary-600">
    <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary-600 border-t-transparent" />
    <span className="text-sm">AI is analyzing...</span>
  </div>
);

export const ValuationChat: React.FC<ValuationChatProps> = ({ onValuationComplete }) => {
  const { formData, updateFormData, calculateValuation, isCalculating } = useValuationStore();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      type: 'ai',
      content: `Hi! I'm your AI valuation assistant. I'll help you value your business in 3 easy ways:

📄 **Upload Documents** - Drop your P&L, balance sheet, or financials
🔍 **Company Lookup** - I can search company registries automatically  
💬 **Tell Me Directly** - Just describe your business and numbers

How would you like to start?`,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageIdsRef = useRef(new Set<string>());

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const addMessage = useCallback((message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const newMessage: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random()}`,
      timestamp: new Date(),
    };

    if (!messageIdsRef.current.has(newMessage.id)) {
      messageIdsRef.current.add(newMessage.id);
      setMessages(prev => [...prev, newMessage]);
    }

    return newMessage;
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true);

    // Add user message
    addMessage({
      type: 'user',
      content: `📄 Uploaded: ${file.name}`,
    });

    // Add loading message
    const loadingMsg = addMessage({
      type: 'ai',
      content: 'Analyzing your document with AI...',
      isLoading: true,
    });

    try {
      // TODO: Call backend API /api/v1/documents/parse
      // Simulate AI extraction
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== loadingMsg.id));
      messageIdsRef.current.delete(loadingMsg.id);

      // Mock extracted data
      const extracted = {
        company_name: 'Acme Trading NV',
        country: 'BE',
        revenue: 2500000,
        ebitda: 450000,
        industry: 'retail',
      };

      updateFormData(extracted);

      addMessage({
        type: 'ai',
        content: `Great! I extracted the following from your document:

**Company:** ${extracted.company_name}  
**Country:** Belgium 🇧🇪  
**Revenue:** €2,500,000  
**EBITDA:** €450,000  
**Industry:** Retail

Now let me look up your company in the Belgian company registry to auto-fill more details...`,
        data: extracted,
      });

      // Auto-trigger company lookup
      setTimeout(() => handleCompanyLookup(extracted.company_name, extracted.country), 1500);
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== loadingMsg.id));
      messageIdsRef.current.delete(loadingMsg.id);

      addMessage({
        type: 'ai',
        content: '❌ Sorry, I had trouble reading that file. Could you try uploading a different format (PDF, Excel, or CSV)?',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompanyLookup = async (companyName: string, _country: string) => {
    const loadingMsg = addMessage({
      type: 'ai',
      content: `🔍 Searching company registries for "${companyName}"...`,
      isLoading: true,
    });

    try {
      // TODO: Call backend API /api/v1/companies/lookup
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Remove loading message
      setMessages(prev => prev.filter(m => m.id !== loadingMsg.id));
      messageIdsRef.current.delete(loadingMsg.id);

      // Mock company data
      const companyData = {
        founding_year: 2015,
        employees: 45,
        business_model: 'B2C',
      };

      updateFormData(companyData);

      addMessage({
        type: 'ai',
        content: `✅ Found your company!

**Founded:** 2015  
**Employees:** 45  
**Business Model:** B2C

Perfect! I have most of the information I need. Let me ask a few quick questions to complete the valuation:

1️⃣ What's your **net profit margin**? (e.g., 10%, 15%)  
2️⃣ Any **unique assets or IP**? (patents, brand value, etc.)  
3️⃣ Are you selling **100% or partial** ownership?`,
        data: companyData,
      });
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== loadingMsg.id));
      messageIdsRef.current.delete(loadingMsg.id);

      addMessage({
        type: 'ai',
        content: `I couldn't find "${companyName}" in the registry. No problem! You can tell me the details manually, or try a different company name.`,
      });
    }
  };

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    addMessage({
      type: 'user',
      content: userMessage,
    });

    setIsProcessing(true);

    const loadingMsg = addMessage({
      type: 'ai',
      content: 'Thinking...',
      isLoading: true,
    });

    try {
      // Check if user wants to upload
      if (
        userMessage.toLowerCase().includes('upload') ||
        userMessage.toLowerCase().includes('document') ||
        userMessage.toLowerCase().includes('file')
      ) {
        setMessages(prev => prev.filter(m => m.id !== loadingMsg.id));
        messageIdsRef.current.delete(loadingMsg.id);

        addMessage({
          type: 'ai',
          content: '📄 Great! Click the upload button below or drag & drop your financial documents here.',
        });
        setIsProcessing(false);
        return;
      }

      // Check if user wants company lookup
      if (
        userMessage.toLowerCase().includes('look up') ||
        userMessage.toLowerCase().includes('lookup') ||
        userMessage.toLowerCase().includes('find company')
      ) {
        setMessages(prev => prev.filter(m => m.id !== loadingMsg.id));
        messageIdsRef.current.delete(loadingMsg.id);

        addMessage({
          type: 'ai',
          content: '🔍 What\'s the company name and country? (e.g., "Acme NV in Belgium")',
        });
        setIsProcessing(false);
        return;
      }

      // Check if user wants to calculate
      if (
        userMessage.toLowerCase().includes('calculate') ||
        userMessage.toLowerCase().includes('valuation') ||
        userMessage.toLowerCase().includes('value my business')
      ) {
        setMessages(prev => prev.filter(m => m.id !== loadingMsg.id));
        messageIdsRef.current.delete(loadingMsg.id);

        if (formData.revenue && formData.ebitda) {
          addMessage({
            type: 'ai',
            content: '🎯 Perfect! I have enough data. Calculating your valuation now...',
          });

          await calculateValuation();
          onValuationComplete?.();
          setIsProcessing(false);
          return;
        } else {
          addMessage({
            type: 'ai',
            content: 'I need a few more details first. What\'s your **annual revenue** and **EBITDA**?',
          });
          setIsProcessing(false);
          return;
        }
      }

      // Parse revenue/EBITDA from message
      const revenueMatch = userMessage.match(/revenue[:\s]+[€$£]?[\d,]+/i);
      const ebitdaMatch = userMessage.match(/ebitda[:\s]+[€$£]?[\d,]+/i);

      if (revenueMatch || ebitdaMatch) {
        setMessages(prev => prev.filter(m => m.id !== loadingMsg.id));
        messageIdsRef.current.delete(loadingMsg.id);

        if (revenueMatch) {
          const revenue = parseInt(revenueMatch[0].replace(/\D/g, ''));
          updateFormData({ revenue });
        }

        if (ebitdaMatch) {
          const ebitda = parseInt(ebitdaMatch[0].replace(/\D/g, ''));
          updateFormData({ ebitda });
        }

        addMessage({
          type: 'ai',
          content: `✅ Got it! ${revenueMatch ? `Revenue: €${revenueMatch[0].match(/[\d,]+/)?.[0]}` : ''} ${ebitdaMatch ? `EBITDA: €${ebitdaMatch[0].match(/[\d,]+/)?.[0]}` : ''}

What else can you tell me about your business? (industry, employees, founding year, etc.)`,
        });
        setIsProcessing(false);
        return;
      }

      // General AI response
      await new Promise(resolve => setTimeout(resolve, 1500));

      setMessages(prev => prev.filter(m => m.id !== loadingMsg.id));
      messageIdsRef.current.delete(loadingMsg.id);

      addMessage({
        type: 'ai',
        content: `I understand. Let me help you with that. Could you provide:

• Your **annual revenue** (e.g., €2.5M)  
• Your **EBITDA** or net profit  
• Your **industry** and **country**

Or you can just **upload your financial documents** and I'll extract everything automatically! 📄`,
      });
    } catch (error) {
      setMessages(prev => prev.filter(m => m.id !== loadingMsg.id));
      messageIdsRef.current.delete(loadingMsg.id);

      addMessage({
        type: 'ai',
        content: '❌ Sorry, I had an error. Could you rephrase that or try uploading a document instead?',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [inputValue, isProcessing, formData, updateFormData, calculateValuation, onValuationComplete, addMessage]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickActions = [
    { icon: Upload, label: 'Upload Financial Documents', action: () => fileInputRef.current?.click() },
    { icon: Building2, label: 'Look up my company', action: () => setInputValue('Look up my company in Belgium') },
    { icon: Calculator, label: 'Tell you my numbers', action: () => setInputValue('My revenue is €2.5M and EBITDA is €450K') },
  ];

  return (
    <div
      className={`flex flex-col h-[600px] bg-white rounded-2xl shadow-lg border ${
        isDragging ? 'border-primary-500 border-2' : 'border-gray-200'
      } overflow-hidden`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">AI Valuation Assistant</h3>
            <p className="text-primary-100 text-sm">Powered by GPT-4 & Company Registries</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[85%] ${message.type === 'user' ? 'ml-auto' : 'mr-auto'}`}>
              <div
                className={`px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                }`}
              >
                {message.isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <div className="text-sm whitespace-pre-line leading-relaxed">{message.content}</div>
                )}
              </div>
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
        <div ref={messagesEndRef} />

        {/* Drag & Drop Overlay */}
        {isDragging && (
          <div className="fixed inset-0 bg-primary-600/10 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 shadow-2xl border-2 border-primary-600 border-dashed">
              <Upload className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <p className="text-xl font-semibold text-gray-900">Drop your document here</p>
              <p className="text-sm text-gray-500 mt-2">PDF, Excel, CSV, or Images</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions (shown initially or when messages are few) */}
      {messages.length <= 2 && !isProcessing && (
        <div className="px-4 pb-2 bg-gray-50">
          <div className="flex gap-2 flex-wrap">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.action}
                className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-lg text-sm text-gray-700 hover:text-primary-600 hover:border-primary-300 transition-all"
              >
                <action.icon className="w-4 h-4" />
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex gap-2 items-end"
        >
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-2.5 rounded-lg border border-gray-300 hover:border-primary-500 hover:bg-primary-50 transition-colors"
            title="Upload document"
          >
            <FileText className="w-5 h-5 text-gray-600" />
          </button>

          <textarea
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or upload documents..."
            className="flex-1 resize-none rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            rows={1}
            disabled={isProcessing || isCalculating}
          />

          <button
            type="submit"
            disabled={!inputValue.trim() || isProcessing || isCalculating}
            className="flex-shrink-0 p-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </form>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.xlsx,.xls,.csv,image/*"
          onChange={handleFileInputChange}
          className="hidden"
        />
      </div>
    </div>
  );
};

