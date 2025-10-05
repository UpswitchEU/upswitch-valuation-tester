# 🎨 Frontend Implementation Plan: Registry-First Architecture

**Goal:** Build conversational AI + registry lookup interface  
**Timeline:** 1-2 days (with mock data) + 1 day (backend integration)  
**Status:** Ready to build

---

## 📋 Implementation Checklist

### **Phase 1: Component Development (1-2 Days with Mocks)**

- [ ] **ConversationalChat Component** (4-6 hours)
  - [ ] Chat message display
  - [ ] User input with suggestions
  - [ ] Loading states
  - [ ] Company name extraction
  - [ ] Mock registry responses
  - [ ] Error handling

- [ ] **RegistryDataPreview Component** (3-4 hours)
  - [ ] Company header with registry link
  - [ ] Financial data display (latest + historical)
  - [ ] Edit data functionality
  - [ ] Calculate button
  - [ ] Mock data structure

- [ ] **AIAssistedValuation Container** (2-3 hours)
  - [ ] Stage management (chat → preview → results)
  - [ ] Flow orchestration
  - [ ] Trust indicators
  - [ ] Integration with existing Results component

- [ ] **App.tsx Integration** (1-2 hours)
  - [ ] Add new view mode: 'ai-assisted'
  - [ ] Make it the default
  - [ ] Toggle between modes
  - [ ] Update messaging

- [ ] **Mock Data Service** (1 hour)
  - [ ] Mock company search
  - [ ] Mock registry data
  - [ ] Simulate API delays
  - [ ] Error scenarios

### **Phase 2: Backend Integration (1 Day)**

- [ ] **API Service Layer** (3-4 hours)
  - [ ] Replace mock with real API calls
  - [ ] Error handling
  - [ ] Loading states
  - [ ] Type safety

- [ ] **Testing** (2-3 hours)
  - [ ] Test with real UK companies
  - [ ] Test error scenarios
  - [ ] Test edge cases
  - [ ] Mobile testing

- [ ] **Polish** (1-2 hours)
  - [ ] Animations
  - [ ] Error messages
  - [ ] Loading indicators
  - [ ] Accessibility

### **Phase 3: Deployment (1 Day)**

- [ ] **Staging Deployment**
  - [ ] Test with beta users
  - [ ] Gather feedback
  - [ ] Fix bugs

- [ ] **Production Deployment**
  - [ ] Feature flag (optional)
  - [ ] Analytics setup
  - [ ] Monitoring
  - [ ] Documentation

---

## 🏗️ Component Architecture

```
src/
├── components/
│   ├── registry/                          # NEW
│   │   ├── ConversationalChat.tsx        # NEW - AI chat interface
│   │   ├── RegistryDataPreview.tsx       # NEW - Show fetched data
│   │   ├── AIAssistedValuation.tsx       # NEW - Main container
│   │   └── CompanySearchSuggestions.tsx  # NEW - Quick examples
│   │
│   ├── ValuationForm.tsx                 # EXISTING - Keep for manual
│   ├── Results.tsx                       # EXISTING - Reuse
│   └── Header.tsx                        # EXISTING - Update messaging
│
├── services/
│   ├── api.ts                            # EXISTING - Update
│   └── mockRegistry.ts                   # NEW - Mock data for development
│
├── types/
│   └── registry.ts                       # NEW - TypeScript types
│
└── App.tsx                               # UPDATE - Add new mode
```

---

## 📝 Step-by-Step Implementation

### **Step 1: Create TypeScript Types (15 minutes)**

**File:** `src/types/registry.ts`

```typescript
export interface CompanySearchResult {
  company_id: string;
  company_name: string;
  registration_number: string;
  legal_form: string;
  address?: string;
  status: string;
  confidence_score: number;
}

export interface FinancialFilingYear {
  year: number;
  revenue?: number;
  ebitda?: number;
  net_income?: number;
  total_assets?: number;
  total_debt?: number;
  cash?: number;
  filing_date?: string;
  source_url?: string;
}

export interface CompanyFinancialData {
  company_id: string;
  company_name: string;
  registration_number: string;
  country_code: string;
  legal_form: string;
  
  filing_history: FinancialFilingYear[];
  
  // Metadata
  founding_year?: number;
  industry_code?: string;
  industry_description?: string;
  employees?: number;
  website?: string;
  
  // Data quality
  data_source: string;
  source_url?: string;
  last_updated: string;
  completeness_score: number;
}

export interface RegistrySearchRequest {
  company_name: string;
  country_code: string;
  registration_number?: string;
}

export interface RegistrySearchResponse {
  results: CompanySearchResult[];
  registry_name: string;
  registry_url: string;
}
```

---

### **Step 2: Create Mock Data Service (30 minutes)**

**File:** `src/services/mockRegistry.ts`

```typescript
import { CompanyFinancialData, CompanySearchResult } from '../types/registry';

export const mockCompanySearch = async (
  companyName: string,
  countryCode: string
): Promise<CompanySearchResult[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Mock data based on country
  const mockResults: CompanySearchResult[] = [
    {
      company_id: '12345678',
      company_name: `${companyName} LTD`,
      registration_number: '12345678',
      legal_form: 'Ltd',
      address: 'London, UK',
      status: 'active',
      confidence_score: 0.95
    },
    {
      company_id: '87654321',
      company_name: `${companyName} HOLDINGS LTD`,
      registration_number: '87654321',
      legal_form: 'Ltd',
      address: 'Manchester, UK',
      status: 'active',
      confidence_score: 0.75
    }
  ];

  return mockResults;
};

export const mockFetchFinancials = async (
  companyId: string
): Promise<CompanyFinancialData> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  return {
    company_id: companyId,
    company_name: 'Tech Solutions Ltd',
    registration_number: companyId,
    country_code: 'GB',
    legal_form: 'Ltd',
    
    filing_history: [
      {
        year: 2023,
        revenue: 1500000,
        ebitda: 250000,
        net_income: 180000,
        total_assets: 800000,
        total_debt: 200000,
        cash: 150000,
        filing_date: '2024-06-30',
        source_url: 'https://find-and-update.company-information.service.gov.uk/company/12345678'
      },
      {
        year: 2022,
        revenue: 1200000,
        ebitda: 200000,
        net_income: 150000,
        total_assets: 650000,
        total_debt: 150000,
        cash: 100000,
        filing_date: '2023-06-30'
      },
      {
        year: 2021,
        revenue: 900000,
        ebitda: 150000,
        net_income: 110000,
        total_assets: 500000,
        total_debt: 100000,
        cash: 80000,
        filing_date: '2022-06-30'
      }
    ],
    
    founding_year: 2015,
    industry_code: '62012',
    industry_description: 'Software Development',
    employees: 45,
    website: 'https://techsolutions.example.com',
    
    data_source: 'UK Companies House',
    source_url: 'https://find-and-update.company-information.service.gov.uk/company/12345678',
    last_updated: new Date().toISOString(),
    completeness_score: 0.90
  };
};
```

---

### **Step 3: Build ConversationalChat Component (4-6 hours)**

**File:** `src/components/registry/ConversationalChat.tsx`

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { mockCompanySearch, mockFetchFinancials } from '../../services/mockRegistry';
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
• "Tech Solutions Ltd in the UK"
• "Acme GmbH in Germany"  
• "Innovate BV in Belgium"`,
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

  const extractCompanyInfo = (text: string) => {
    // Simple extraction - in production, this would be smarter
    const ukMatch = text.match(/([A-Za-z\s&]+)\s+(?:Ltd|Limited|PLC)/i);
    const deMatch = text.match(/([A-Za-z\s&]+)\s+GmbH/i);
    const nlMatch = text.match(/([A-Za-z\s&]+)\s+(?:BV|NV)/i);
    
    let companyName = '';
    let country = 'GB';
    
    if (ukMatch) {
      companyName = ukMatch[0];
      country = 'GB';
    } else if (deMatch) {
      companyName = deMatch[0];
      country = 'DE';
    } else if (nlMatch) {
      companyName = nlMatch[0];
      country = 'NL';
    } else {
      // Default extraction
      companyName = text.split('in')[0].trim();
      if (text.toLowerCase().includes('uk')) country = 'GB';
      if (text.toLowerCase().includes('germany')) country = 'DE';
      if (text.toLowerCase().includes('belgium')) country = 'BE';
    }
    
    return { companyName, country };
  };

  const formatCurrency = (amount: number, country: string = 'GB') => {
    const symbol = country === 'GB' ? '£' : '€';
    return `${symbol}${(amount / 1000000).toFixed(1)}M`;
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
      
      // Search company (mock)
      const searchResults = await mockCompanySearch(companyName, country);
      
      if (searchResults.length > 0) {
        const bestMatch = searchResults[0];
        
        // Remove loading message
        setMessages(prev => prev.filter(m => m.id !== loadingId));
        
        // Add "Found company" message
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: `✅ Found your company! Looking up financial data...`,
          timestamp: new Date()
        }]);

        // Fetch financials (mock)
        const financialData = await mockFetchFinancials(bestMatch.company_id);
        
        const latest = financialData.filing_history[0];
        
        // Add success message with data
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: `✅ **${financialData.company_name}** (${financialData.registration_number})

**Latest filed accounts (${latest.year}):**
📊 Revenue: ${formatCurrency(latest.revenue!, country)}
💰 EBITDA: ${formatCurrency(latest.ebitda!, country)}
🏦 Assets: ${formatCurrency(latest.total_assets!, country)}

📚 I also have **${financialData.filing_history.length} years** of history

🔗 [View on ${financialData.data_source}](${financialData.source_url})

Do you have more recent data (2024/2025) you'd like to add, or shall I calculate with the ${latest.year} data?`,
          timestamp: new Date()
        }]);

        // Notify parent after a brief delay
        setTimeout(() => {
          onCompanyFound(financialData);
        }, 2000);
        
      } else {
        // Not found
        setMessages(prev => prev.filter(m => m.id !== loadingId));
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: `⚠️ I couldn't find "${companyName}" in the registry.

This could mean:
• The company name spelling is different
• It's a very new company (hasn't filed accounts yet)
• It's not a registered limited company

Would you like to:
1. Try a different company name
2. Provide your registration number (for exact match)
3. Enter your data manually instead`,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Lookup error:', error);
      setMessages(prev => prev.filter(m => m.id !== loadingId));
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: 'Sorry, I had trouble accessing the registry. Would you like to try again?',
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
    <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold">AI Valuation Assistant</h3>
            <p className="text-sm opacity-90">Powered by official company registries</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-gray-50">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-4 rounded-xl ${
                message.type === 'user'
                  ? 'bg-primary-600 text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {message.type === 'ai' && <Bot className="w-4 h-4 text-primary-600" />}
                {message.type === 'user' && <User className="w-4 h-4" />}
                <span className="font-semibold text-sm">
                  {message.type === 'user' ? 'You' : 'Assistant'}
                </span>
              </div>
              
              {message.isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent" />
                  <span className="text-sm">{message.content}</span>
                </div>
              ) : (
                <div 
                  className="text-sm whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: message.content
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/\n/g, '<br/>')
                  }}
                />
              )}
              
              <p className={`text-xs mt-2 ${message.type === 'user' ? 'text-primary-100' : 'text-gray-400'}`}>
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your company name and country..."
            className="flex-1 px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={isProcessing}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        
        {/* Quick suggestions */}
        {messages.length <= 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => useSuggestion('Tech Solutions Ltd in the UK')}
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              disabled={isProcessing}
            >
              🇬🇧 Example: UK Company
            </button>
            <button
              onClick={() => useSuggestion('Acme GmbH in Germany')}
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              disabled={isProcessing}
            >
              🇩🇪 Example: German Company
            </button>
            <button
              onClick={() => useSuggestion('Innovate NV in Belgium')}
              className="px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
              disabled={isProcessing}
            >
              🇧🇪 Example: Belgian Company
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
```

---

### **Step 4: Build RegistryDataPreview Component (3-4 hours)**

**File:** `src/components/registry/RegistryDataPreview.tsx`

See next message for this component...

---

## 🎯 Integration Steps

### **When Backend is Ready:**

1. **Replace Mock Service:**
```typescript
// OLD: import { mockCompanySearch } from '../../services/mockRegistry';
// NEW: import { api } from '../../services/api';

// OLD: const results = await mockCompanySearch(name, country);
// NEW: const results = await api.searchCompany({ company_name: name, country_code: country });
```

2. **Update API Service:**
```typescript
// src/services/api.ts

export const registryAPI = {
  searchCompany: async (request: RegistrySearchRequest) => {
    const response = await fetch('/api/v1/companies/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request)
    });
    return response.json();
  },
  
  fetchFinancials: async (companyId: string, countryCode: string) => {
    const response = await fetch('/api/v1/companies/financials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, country_code: countryCode })
    });
    return response.json();
  }
};
```

3. **Test:**
- [ ] Test with real UK companies
- [ ] Test error scenarios
- [ ] Test edge cases (no data, multiple matches, etc.)

---

## 📊 Success Criteria

### **Phase 1 Complete (Mock Data):**
- [ ] Can demo the full flow
- [ ] Chat interface works smoothly
- [ ] Data preview looks professional
- [ ] All components render correctly
- [ ] Mobile responsive
- [ ] No console errors

### **Phase 2 Complete (Real Backend):**
- [ ] Successfully fetches UK company data
- [ ] Displays real financial information
- [ ] Links to Companies House work
- [ ] Error handling works
- [ ] Performance is acceptable (<3 sec)

### **Phase 3 Complete (Production):**
- [ ] Beta users can use it
- [ ] Analytics tracking works
- [ ] No critical bugs
- [ ] User feedback is positive
- [ ] Support docs updated

---

## 🚀 Next Steps After Components Built

1. **Demo to stakeholders**
   - Show the flow with mock data
   - Get feedback on UX
   - Iterate on design

2. **Backend team integration**
   - Share TypeScript types
   - Coordinate on API contract
   - Test integration

3. **Beta launch planning**
   - Feature flag setup
   - Analytics events
   - Support documentation
   - User communication

---

**Status:** ✅ **Plan Complete - Ready to Build**

**Timeline:** 
- Components with mocks: 1-2 days
- Backend integration: 1 day
- Testing & polish: 1 day
- **Total:** 3-4 days to production-ready

**Next:** Start building components!
