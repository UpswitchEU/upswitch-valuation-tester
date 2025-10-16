import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Loader2, Shield } from 'lucide-react';
import { searchCompanies, fetchCompanyFinancials } from '../services/registryService';
import { intelligentTriageService, type TriageSession } from '../services/intelligentTriageService';
import { fallbackQuestionService, type FallbackQuestion } from '../services/fallbackQuestionService';
import { OwnerProfilingQuestions, type OwnerProfileData } from './OwnerProfilingQuestions';
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
  onValuationComplete: (valuationResult: any) => void;
  businessProfile?: BusinessProfileData | null;
}

export const ConversationalChat: React.FC<ConversationalChatProps> = ({
  onValuationComplete,
  businessProfile
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Intelligent triage state
  const [triageSession, setTriageSession] = useState<TriageSession | null>(null);
  const [isUsingIntelligentTriage, setIsUsingIntelligentTriage] = useState(true);
  const [triageError, setTriageError] = useState<string | null>(null);
  
  // Fallback system state
  const [currentFallbackQuestion, setCurrentFallbackQuestion] = useState<FallbackQuestion | null>(null);
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  
  // Owner profiling state
  const [showOwnerProfiling, setShowOwnerProfiling] = useState(false);
  const [ownerProfileData, setOwnerProfileData] = useState<OwnerProfileData | null>(null);
  
  // Legacy state (for backward compatibility)
  const [conversationMode, setConversationMode] = useState<'company-lookup' | 'financial-collection' | 'complete'>('company-lookup');
  const [financialData, setFinancialData] = useState({
    revenue: null as number | null,
    ebitda: null as number | null,
    employees: null as number | null
  });
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [foundCompanyData, setFoundCompanyData] = useState<any>(null);

  // Initialize triage system when component mounts or company is found
  useEffect(() => {
    console.log('🔍 State:', {
      isUsingIntelligentTriage,
      hasTriageSession: !!triageSession,
      hasBusinessProfile: !!businessProfile,
      hasFoundCompany: !!foundCompanyData
    });
    
    // Only initialize if we have company data or business profile
    if ((foundCompanyData || businessProfile) && !triageSession && isUsingIntelligentTriage) {
      initializeTriage();
    }
  }, [foundCompanyData, businessProfile, triageSession, isUsingIntelligentTriage]);

  // Customize initial message when business profile exists
  const getInitialMessage = () => {
    if (businessProfile?.company_name) {
      return `👋 Hi! I see you're here to value ${businessProfile.company_name}. I already have some information about your business. Let's gather the financial details to complete your valuation.

What was your revenue last year? (in EUR)`;
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

    // Handle different conversation modes
    if (isUsingIntelligentTriage && triageSession) {
      await handleTriageAnswer(userMessage);
      setIsProcessing(false);
      return;
    }
    
    if (!isUsingIntelligentTriage && currentFallbackQuestion) {
      await handleFallbackAnswer(userMessage);
      setIsProcessing(false);
      return;
    }
    
    // Legacy mode
    if (conversationMode === 'financial-collection') {
      await handleFinancialAnswer(userMessage);
      setIsProcessing(false);
      return;
    }

    // If we have business profile data, skip company lookup and go directly to financial data collection
    if (businessProfile?.company_name && messages.length <= 1) {
      // Skip company lookup - we already know the company
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: `✅ Perfect! I'll use ${businessProfile.company_name} for your valuation.

Let me collect the financial details I need:

**Question 1 of 3:**
What was your annual revenue last year? (in EUR)

💡 Your total income before expenses`,
        timestamp: new Date()
      }]);

      // Create mock company data from business profile
      const mockCompanyData = {
        company_id: `user-${businessProfile.user_id}`,
        company_name: businessProfile.company_name,
        registration_number: 'User Business',
        country_code: businessProfile.country || 'BE',
        legal_form: businessProfile.business_type || 'Company',
        filing_history: [], // Will be collected via conversation
        data_source: 'user_profile',
        last_updated: new Date().toISOString(),
        completeness_score: 0.3
      };

      // Store company data and start financial collection
      setFoundCompanyData(mockCompanyData);
      setConversationMode('financial-collection');
      setCurrentQuestion(0);
      
      // Start financial data collection
      setTimeout(() => {
        const firstQuestion = getNextFinancialQuestion(0);
        if (firstQuestion) {
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'ai',
            content: firstQuestion,
            timestamp: new Date()
          }]);
        }
      }, 1000);

      setIsProcessing(false);
      return;
    }

    // Add loading message for company search
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

          // Store company data and start financial collection
          setFoundCompanyData(financialData);
          setConversationMode('financial-collection');
          setCurrentQuestion(0);
          
          // Start financial data collection
          setTimeout(() => {
            const firstQuestion = getNextFinancialQuestion(0);
            if (firstQuestion) {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                type: 'ai',
                content: firstQuestion,
                timestamp: new Date()
              }]);
            }
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

          // Store company data and start financial collection
          const companyData = {
            company_id: bestMatch.company_id,
            company_name: bestMatch.company_name,
            registration_number: bestMatch.registration_number,
            country_code: bestMatch.country_code,
            legal_form: bestMatch.legal_form,
            filing_history: [], // Empty - will be collected via conversation
            data_source: 'conversational_input',
            last_updated: new Date().toISOString(),
            completeness_score: 0.5
          };
          
          setFoundCompanyData(companyData);
          setConversationMode('financial-collection');
          setCurrentQuestion(0);
          
          // Start financial data collection
          setTimeout(() => {
            const firstQuestion = getNextFinancialQuestion(0);
            if (firstQuestion) {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                type: 'ai',
                content: firstQuestion,
                timestamp: new Date()
              }]);
            }
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

  // Intent detection (IlaraAI pattern)
  const detectUserIntent = (message: string): string => {
    const intentPatterns = {
      'quick_estimate': ['quick', 'fast', 'estimate', 'ballpark', 'rough'],
      'detailed_valuation': ['detailed', 'comprehensive', 'thorough', 'complete'],
      'comparison': ['compare', 'benchmark', 'versus', 'similar'],
      'update_data': ['update', 'change', 'correct', 'modify'],
      'clarification': ['what', 'why', 'how', 'explain', 'mean']
    };
    
    const lowerMessage = message.toLowerCase();
    
    for (const [intent, keywords] of Object.entries(intentPatterns)) {
      if (keywords.some(keyword => lowerMessage.includes(keyword))) {
        return intent;
      }
    }
    
    return 'answer_question'; // Default intent
  };

  // Enhanced context building (IlaraAI pattern)
  const buildEnhancedContext = (): Record<string, any> => {
    return {
      // User context
      user_type: businessProfile ? 'authenticated' : 'guest',
      business_profile_available: !!businessProfile,
      
      // Conversation context
      message_count: messages.length,
      conversation_duration: Date.now() - (messages[0]?.timestamp?.getTime() || Date.now()),
      
      // Data context
      data_completeness: calculateDataCompleteness(),
      collected_fields: Object.keys(collectedData),
      
      // Industry context
      business_type: businessProfile?.business_type || foundCompanyData?.business_type,
      industry: businessProfile?.industry || foundCompanyData?.industry,
      
      // Company context
      company_name: businessProfile?.company_name || foundCompanyData?.company_name,
      country_code: businessProfile?.country || foundCompanyData?.country_code || 'BE'
    };
  };

  const calculateDataCompleteness = (): number => {
    const requiredFields = ['revenue', 'ebitda', 'employees'];
    const completedFields = requiredFields.filter(field => 
      collectedData[field] !== null && collectedData[field] !== undefined
    );
    return completedFields.length / requiredFields.length;
  };

  // Initialize intelligent triage session
  const initializeTriage = async () => {
    // Don't initialize if already initialized or triage is disabled
    if (triageSession || !isUsingIntelligentTriage) {
      return;
    }

    console.log('🚀 Initializing intelligent triage...');

    try {
      const session = await intelligentTriageService.startConversation({
        user_id: businessProfile?.user_id,
        company_id: foundCompanyData?.company_id,
        business_type: businessProfile?.business_type || foundCompanyData?.business_type,
        industry: businessProfile?.industry || foundCompanyData?.industry,
        country_code: businessProfile?.country || foundCompanyData?.country_code || 'BE',
        business_context: {
          company_name: businessProfile?.company_name || foundCompanyData?.company_name,
          is_authenticated: !!businessProfile,
          has_business_profile: !!businessProfile
        },
        pre_filled_data: businessProfile ? {
          company_name: businessProfile.company_name,
          revenue: businessProfile.revenue,
          ebitda: businessProfile.ebitda,
          employees: businessProfile.employees
        } : {}
      });
      
      setTriageSession(session);
      setTriageError(null);
      
      console.log('✅ Triage session started:', session.session_id);
      
      // Add initial AI message from triage
      if (session.ai_message) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: session.ai_message,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.warn('⚠️ Triage initialization failed, switching to fallback mode:', error);
      setTriageError('Intelligent triage unavailable, using fallback mode');
      setIsUsingIntelligentTriage(false);
      
      // Initialize fallback with delay to ensure component is ready
      setTimeout(() => {
        initializeFallback();
      }, 100);
    }
  };

  // Initialize fallback system
  const initializeFallback = () => {
    console.log('🔄 Switching to fallback question mode');
    
    const questions = fallbackQuestionService.getQuestionSequence(
      businessProfile?.business_type || foundCompanyData?.business_type,
      businessProfile?.industry || foundCompanyData?.industry
    );
    
    const firstQuestion = questions[0];
    
    if (firstQuestion) {
      setCurrentFallbackQuestion(firstQuestion);
      
      // Add initial fallback message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: `Let me help you with a business valuation. ${firstQuestion.question}${firstQuestion.helpText ? `\n\n💡 ${firstQuestion.helpText}` : ''}`,
        timestamp: new Date()
      }]);
    }
  };

  // Handle triage answer
  const handleTriageAnswer = async (answer: string) => {
    if (!triageSession) return;
    
    console.log('🔄 Processing triage answer:', { answer, sessionId: triageSession.session_id });
    
    try {
      // Extract field name from current question
      const fieldName = triageSession.field_name || extractFieldFromMessage(triageSession.ai_message);
      const detectedIntent = detectUserIntent(answer);
      
      console.log('📝 Triage context:', { fieldName, detectedIntent });
      
      // Process step with triage engine
      const nextSession = await intelligentTriageService.processStep(
        triageSession.session_id,
        fieldName,
        answer,
        {
          previous_answer: answer,
          conversation_history: messages.slice(-5), // Last 5 messages for context
          detected_intent: detectedIntent,
          enhanced_context: buildEnhancedContext()
        }
      );
      
      console.log('✅ Triage step completed:', { 
        complete: nextSession.complete, 
        hasNextQuestion: !!nextSession.field_name,
        hasValuation: !!nextSession.valuation_result
      });
      
      setTriageSession(nextSession);
      
      // Add AI response
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: nextSession.ai_message,
        timestamp: new Date()
      }]);
      
      // Check if owner profiling is needed
      if (nextSession.owner_profile_needed && !ownerProfileData) {
        setShowOwnerProfiling(true);
        return;
      }
      
      // Check if conversation is complete
      if (nextSession.complete && nextSession.valuation_result) {
        // Show valuation result
        onValuationComplete(nextSession.valuation_result);
      }
      
    } catch (error) {
      console.error('❌ Triage step failed:', error);
      setTriageError('Failed to process response');
      // Fallback to manual flow
      setIsUsingIntelligentTriage(false);
      initializeFallback();
    }
  };

  // Handle fallback answer
  const handleFallbackAnswer = async (answer: string) => {
    if (!currentFallbackQuestion) return;
    
    // Validate input
    const validation = fallbackQuestionService.validateInput(answer, currentFallbackQuestion);
    if (!validation.valid) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: `❌ ${validation.error}`,
        timestamp: new Date()
      }]);
      return;
    }
    
    // Store the answer
    setCollectedData(prev => ({
      ...prev,
      [currentFallbackQuestion.field]: answer
    }));
    
    // Get next question
    const nextQuestion = fallbackQuestionService.getNextQuestion(
      { ...collectedData, [currentFallbackQuestion.field]: answer },
      businessProfile?.business_type || foundCompanyData?.business_type,
      businessProfile?.industry || foundCompanyData?.industry
    );
    
    if (nextQuestion) {
      setCurrentFallbackQuestion(nextQuestion);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: nextQuestion.question + (nextQuestion.helpText ? `\n\n💡 ${nextQuestion.helpText}` : ''),
        timestamp: new Date()
      }]);
    } else {
      // All questions answered - calculate valuation
      await calculateValuation();
    }
  };

  // Extract field name from AI message
  const extractFieldFromMessage = (message: string): string => {
    // Simple field extraction based on common patterns
    if (message.toLowerCase().includes('revenue')) return 'revenue';
    if (message.toLowerCase().includes('ebitda')) return 'ebitda';
    if (message.toLowerCase().includes('employee')) return 'employees';
    if (message.toLowerCase().includes('recurring')) return 'recurring_revenue_percentage';
    if (message.toLowerCase().includes('inventory')) return 'inventory_turnover';
    if (message.toLowerCase().includes('capacity')) return 'production_capacity';
    if (message.toLowerCase().includes('rate')) return 'hourly_rate';
    return 'general';
  };

  // Handle owner profile completion
  const handleOwnerProfileComplete = async (profile: OwnerProfileData) => {
    setOwnerProfileData(profile);
    setShowOwnerProfiling(false);
    
    try {
      // Send owner profile to triage engine
      if (triageSession) {
        await intelligentTriageService.createOwnerProfile(
          foundCompanyData?.company_id || 'unknown',
          profile
        );
      }
      
      // Continue with triage session
      if (triageSession) {
        const nextSession = await intelligentTriageService.processStep(
          triageSession.session_id,
          'owner_profile',
          profile,
          { owner_profile_completed: true }
        );
        
        setTriageSession(nextSession);
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: nextSession.ai_message,
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to process owner profile:', error);
      // Continue anyway
    }
  };

  // Financial data collection helpers
  const getFinancialQuestions = () => [
    {
      field: 'revenue',
      question: 'What was your annual revenue last year? (in EUR)',
      help: 'Your total income before expenses'
    },
    {
      field: 'ebitda',
      question: 'What was your EBITDA? (in EUR)',
      help: 'Earnings before interest, taxes, depreciation, and amortization'
    },
    {
      field: 'employees',
      question: 'How many employees does your company have?',
      help: 'Full-time equivalent employees'
    }
  ];

  const getNextFinancialQuestion = (questionIndex: number) => {
    const questions = getFinancialQuestions();
    if (questionIndex < questions.length) {
      const q = questions[questionIndex];
      return `**Question ${questionIndex + 1} of ${questions.length}:**
${q.question}

💡 ${q.help}`;
    }
    return null;
  };

  const handleFinancialAnswer = async (answer: string) => {
    const questions = getFinancialQuestions();
    const currentField = questions[currentQuestion].field;
    const numericValue = parseFloat(answer.replace(/[^\d.-]/g, ''));
    
    if (isNaN(numericValue)) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: `❌ Please enter a valid number for ${questions[currentQuestion].field}.`,
        timestamp: new Date()
      }]);
      return;
    }

    setFinancialData(prev => ({
      ...prev,
      [currentField]: numericValue
    }));

    if (currentQuestion < questions.length - 1) {
      // Ask next question
      setCurrentQuestion(prev => prev + 1);
      const nextQuestion = getNextFinancialQuestion(currentQuestion + 1);
      if (nextQuestion) {
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'ai',
          content: nextQuestion,
          timestamp: new Date()
        }]);
      }
    } else {
      // All questions answered - calculate valuation
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: '✅ Perfect! I have all the information I need. Calculating your valuation...',
        timestamp: new Date(),
        isLoading: true
      }]);

      await calculateValuation();
    }
  };

  const calculateValuation = async () => {
    try {
      // Create valuation request
      const valuationRequest = {
        company_name: foundCompanyData?.company_name || businessProfile?.company_name || 'Your Company',
        country_code: foundCompanyData?.country_code || businessProfile?.country || 'BE',
        industry: foundCompanyData?.industry || businessProfile?.industry || 'services',
        business_type: foundCompanyData?.business_type || businessProfile?.business_type || 'company',
        current_year: new Date().getFullYear(),
        revenue: financialData.revenue || 0,
        ebitda: financialData.ebitda || 0,
        employees: financialData.employees || 0
      };

      // Call valuation API
      const response = await fetch('http://localhost:8000/api/v1/calculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(valuationRequest),
      });

      if (!response.ok) {
        throw new Error('Valuation calculation failed');
      }

      const result = await response.json();
      
      // Remove loading message
      setMessages(prev => prev.filter(m => !m.isLoading));
      
      // Add success message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: `🎉 **Valuation Complete!**

Your business is valued at **€${result.equity_value_mid?.toLocaleString() || 'N/A'}**

**Valuation Range:** €${result.equity_value_low?.toLocaleString()} - €${result.equity_value_high?.toLocaleString()}
**Confidence:** ${Math.round((result.confidence_score || 0) * 100)}%
**Methodology:** ${result.methodology || 'DCF + Market Multiples'}

The detailed report is now available in the preview panel.`,
        timestamp: new Date()
      }]);

      setConversationMode('complete');
      onValuationComplete(result);
      
    } catch (error) {
      console.error('Valuation calculation error:', error);
      
      // Remove loading message
      setMessages(prev => prev.filter(m => !m.isLoading));
      
      // Add error message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'ai',
        content: `❌ Sorry, I encountered an error calculating your valuation. Please try again or contact support.`,
        timestamp: new Date()
      }]);
    }
  };

  // Show owner profiling component if needed
  if (showOwnerProfiling) {
    return (
      <OwnerProfilingQuestions
        onComplete={handleOwnerProfileComplete}
        onCancel={() => setShowOwnerProfiling(false)}
      />
    );
  }

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
              <p className="text-xs text-zinc-400">
                {isUsingIntelligentTriage ? 'Intelligent Triage Active' : 'Fallback Mode'}
              </p>
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

      {/* Error Display */}
      {triageError && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-lg mx-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-red-300 text-sm font-medium">Triage Error</span>
          </div>
          <p className="text-red-200 text-sm mt-1">{triageError}</p>
          <button
            onClick={() => {
              setTriageError(null);
              setIsUsingIntelligentTriage(false);
              initializeFallback();
            }}
            className="text-red-300 hover:text-red-200 text-xs underline mt-2"
          >
            Switch to fallback mode
          </button>
        </div>
      )}

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
              placeholder={
                isUsingIntelligentTriage && triageSession
                  ? "Enter your response..."
                  : !isUsingIntelligentTriage && currentFallbackQuestion
                    ? `Enter ${currentFallbackQuestion.field || 'data'} (e.g., ${currentFallbackQuestion.inputType === 'number' ? '1000000' : 'text'})...`
                    : conversationMode === 'financial-collection' 
                      ? "Enter your financial data (e.g., 1000000)..."
                      : businessProfile?.company_name 
                        ? `Enter your revenue for ${businessProfile.company_name} (e.g., 1000000)...` 
                        : "Enter your company name (e.g., Proximus Belgium)..."
              }
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
                {businessProfile?.company_name ? (
                  <button
                    type="button"
                    onClick={() => useSuggestion(businessProfile.company_name || '')}
                    className="px-3 py-1.5 bg-zinc-800/50 hover:bg-zinc-700/60 border border-zinc-700/50 hover:border-zinc-600/60 rounded-full text-xs text-zinc-300 hover:text-white transition-all duration-200 hover:shadow-md hover:shadow-black/20"
                  >
                    {businessProfile.company_name} ✓
                  </button>
                ) : (
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
