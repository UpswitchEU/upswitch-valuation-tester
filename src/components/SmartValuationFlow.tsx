import React, { useState } from 'react';
import { useValuationStore } from '../store/useValuationStore';

/**
 * SmartValuationFlow Component
 * 
 * Primary AI-powered flow that combines:
 * 1. Document Upload → Extract financial data
 * 2. Company Lookup → Auto-fill company details
 * 3. AI Conversation → Fill gaps and clarify ambiguous data
 * 4. Review & Calculate → Final validation and valuation
 * 
 * This is the main UX - manual input is fallback only
 */

type FlowStep = 'upload' | 'company' | 'conversation' | 'review';

interface ExtractedData {
  company_name?: string;
  revenue?: number;
  ebitda?: number;
  industry?: string;
  country_code?: string;
  confidence?: number;
  gaps?: string[];
}

export const SmartValuationFlow: React.FC = () => {
  const { formData, updateFormData, calculateValuation, isCalculating } = useValuationStore();
  const [currentStep, setCurrentStep] = useState<FlowStep>('upload');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationMessages, setConversationMessages] = useState<Array<{role: 'ai' | 'user', text: string}>>([]);

  // Step 1: Document Upload
  const handleDocumentUpload = async (_file: File) => {
    setIsProcessing(true);
    
    try {
      // TODO: Call backend /api/v1/documents/parse
      // Simulate AI extraction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockData: ExtractedData = {
        company_name: 'TechVenture GmbH',
        revenue: 2500000,
        ebitda: 500000,
        industry: 'Technology & Software',
        country_code: 'DE',
        confidence: 0.85,
        gaps: ['founding_year', 'employees'],
      };
      
      setExtractedData(mockData);
      updateFormData(mockData as any);
      
      // Auto-proceed to company lookup
      setCurrentStep('company');
      await performCompanyLookup(mockData.company_name!, mockData.country_code!);
      
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2: Company Lookup (automatic)
  const performCompanyLookup = async (_companyName: string, _country: string) => {
    setIsProcessing(true);
    
    try {
      // TODO: Call backend /api/v1/companies/lookup
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock company data
      const companyData = {
        founding_year: 2018,
        employees: 25,
        business_model: 'B2B SaaS',
      };
      
      updateFormData(companyData as any);
      
      // If we have gaps, go to AI conversation
      if (extractedData?.gaps && extractedData.gaps.length > 0) {
        setCurrentStep('conversation');
        startAIConversation();
      } else {
        setCurrentStep('review');
      }
      
    } catch (error) {
      console.error('Lookup failed:', error);
      setCurrentStep('conversation');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 3: AI Conversation to fill gaps
  const startAIConversation = () => {
    const initialMessage = {
      role: 'ai' as const,
      text: `I've extracted most of your data! Just need a few more details to ensure accuracy. ${
        extractedData?.gaps?.join(', ') || 'Let me verify the information'
      }. Should I proceed with the current data, or would you like to provide additional details?`,
    };
    setConversationMessages([initialMessage]);
  };

  const handleUserMessage = async (message: string) => {
    setConversationMessages(prev => [...prev, { role: 'user', text: message }]);
    setIsProcessing(true);
    
    // TODO: Send to AI to extract any additional data from user response
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const aiResponse = {
      role: 'ai' as const,
      text: 'Perfect! I have all the information needed. Ready to calculate your valuation?',
    };
    
    setConversationMessages(prev => [...prev, aiResponse]);
    setCurrentStep('review');
    setIsProcessing(false);
  };

  // Step 4: Review and Calculate
  const handleCalculate = async () => {
    await calculateValuation();
  };

  return (
    <div className="space-y-6">
      {/* Progress Indicator */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <StepIndicator step="upload" current={currentStep} label="Upload" icon="📄" />
          <div className="flex-1 h-1 bg-gray-200 mx-4">
            <div 
              className="h-1 bg-primary-500 transition-all duration-500"
              style={{ 
                width: currentStep === 'upload' ? '0%' : 
                       currentStep === 'company' ? '33%' : 
                       currentStep === 'conversation' ? '66%' : '100%' 
              }}
            />
          </div>
          <StepIndicator step="company" current={currentStep} label="Lookup" icon="🔍" />
          <div className="flex-1 h-1 bg-gray-200 mx-4">
            <div 
              className="h-1 bg-primary-500 transition-all duration-500"
              style={{ 
                width: currentStep === 'conversation' || currentStep === 'review' ? '100%' : '0%' 
              }}
            />
          </div>
          <StepIndicator step="conversation" current={currentStep} label="AI Chat" icon="💬" />
          <div className="flex-1 h-1 bg-gray-200 mx-4">
            <div 
              className="h-1 bg-primary-500 transition-all duration-500"
              style={{ width: currentStep === 'review' ? '100%' : '0%' }}
            />
          </div>
          <StepIndicator step="review" current={currentStep} label="Review" icon="✅" />
        </div>
      </div>

      {/* Step Content */}
      {currentStep === 'upload' && (
        <UploadStep onUpload={handleDocumentUpload} isProcessing={isProcessing} />
      )}

      {currentStep === 'company' && (
        <CompanyStep extractedData={extractedData} isProcessing={isProcessing} />
      )}

      {currentStep === 'conversation' && (
        <ConversationStep 
          messages={conversationMessages}
          onSendMessage={handleUserMessage}
          isProcessing={isProcessing}
        />
      )}

      {currentStep === 'review' && (
        <ReviewStep 
          formData={formData}
          extractedData={extractedData}
          onCalculate={handleCalculate}
          isCalculating={isCalculating}
          onEdit={() => setCurrentStep('conversation')}
        />
      )}
    </div>
  );
};

// Step Indicator Component
const StepIndicator: React.FC<{
  step: FlowStep;
  current: FlowStep;
  label: string;
  icon: string;
}> = ({ step, current, label, icon }) => {
  const steps: FlowStep[] = ['upload', 'company', 'conversation', 'review'];
  const currentIndex = steps.indexOf(current);
  const stepIndex = steps.indexOf(step);
  const isActive = step === current;
  const isComplete = stepIndex < currentIndex;

  return (
    <div className="flex flex-col items-center">
      <div className={`
        w-12 h-12 rounded-full flex items-center justify-center text-2xl mb-2 transition-all
        ${isActive ? 'bg-primary-500 text-white ring-4 ring-primary-100' : 
          isComplete ? 'bg-green-500 text-white' : 
          'bg-gray-200 text-gray-400'}
      `}>
        {isComplete ? '✓' : icon}
      </div>
      <span className={`text-xs font-medium ${isActive ? 'text-primary-600' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
};

// Upload Step Component
const UploadStep: React.FC<{
  onUpload: (file: File) => void;
  isProcessing: boolean;
}> = ({ onUpload, isProcessing }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onUpload(files[0]);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload Your Financial Documents
        </h2>
        <p className="text-gray-600">
          Our AI will extract revenue, EBITDA, and other key metrics automatically
        </p>
      </div>

      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer
          ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}
          ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
        `}
      >
        {isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
            <p className="text-lg font-medium text-gray-900">AI is analyzing your document...</p>
            <p className="text-sm text-gray-500">This usually takes 10-30 seconds</p>
          </div>
        ) : (
          <>
            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drag & drop your files here
            </p>
            <p className="text-sm text-gray-500 mb-4">
              or click to browse
            </p>
            <label className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg font-medium cursor-pointer hover:bg-primary-700 transition-colors">
              Choose Files
              <input
                type="file"
                className="hidden"
                accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg"
                onChange={handleFileInput}
                disabled={isProcessing}
              />
            </label>
            <p className="text-xs text-gray-500 mt-4">
              Supports: PDF, Excel, CSV, Images (P&L, Balance Sheet, Financial Statements)
            </p>
          </>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div className="p-4 bg-primary-50 rounded-lg">
          <div className="text-2xl mb-2">🤖</div>
          <p className="text-sm font-medium text-gray-900">AI-Powered</p>
          <p className="text-xs text-gray-600">GPT-4 Vision</p>
        </div>
        <div className="p-4 bg-primary-50 rounded-lg">
          <div className="text-2xl mb-2">⚡</div>
          <p className="text-sm font-medium text-gray-900">Fast</p>
          <p className="text-xs text-gray-600">10-30 seconds</p>
        </div>
        <div className="p-4 bg-primary-50 rounded-lg">
          <div className="text-2xl mb-2">🔒</div>
          <p className="text-sm font-medium text-gray-900">Secure</p>
          <p className="text-xs text-gray-600">Encrypted</p>
        </div>
      </div>
    </div>
  );
};

// Company Lookup Step
const CompanyStep: React.FC<{
  extractedData: ExtractedData | null;
  isProcessing: boolean;
}> = ({ extractedData, isProcessing }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="text-center">
        {isProcessing ? (
          <div className="space-y-4">
            <div className="animate-spin w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full mx-auto" />
            <h2 className="text-2xl font-bold text-gray-900">
              Looking up company information...
            </h2>
            <p className="text-gray-600">
              Searching {extractedData?.company_name} in {extractedData?.country_code} company registry
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-900">Company Found!</h2>
            <p className="text-gray-600">
              Successfully matched with company records
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// AI Conversation Step
const ConversationStep: React.FC<{
  messages: Array<{role: 'ai' | 'user', text: string}>;
  onSendMessage: (message: string) => void;
  isProcessing: boolean;
}> = ({ messages, onSendMessage, isProcessing }) => {
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (input.trim() && !isProcessing) {
      onSendMessage(input);
      setInput('');
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">AI Assistant</h2>
      
      <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[80%] p-4 rounded-lg
              ${msg.role === 'ai' ? 'bg-primary-50 text-gray-900' : 'bg-primary-600 text-white'}
            `}>
              {msg.role === 'ai' && <div className="text-sm font-medium mb-1">🤖 AI Assistant</div>}
              <p>{msg.text}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Type your response..."
          className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          disabled={isProcessing}
        />
        <button
          onClick={handleSend}
          disabled={isProcessing || !input.trim()}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
};

// Review Step
const ReviewStep: React.FC<{
  formData: any;
  extractedData: ExtractedData | null;
  onCalculate: () => void;
  isCalculating: boolean;
  onEdit: () => void;
}> = ({ formData, extractedData, onCalculate, isCalculating, onEdit }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Review Your Information</h2>
        <button
          onClick={onEdit}
          className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Edit
        </button>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Company Name</label>
          <p className="text-lg font-semibold text-gray-900">{formData.company_name || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Country</label>
          <p className="text-lg font-semibold text-gray-900">{formData.country_code || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Revenue</label>
          <p className="text-lg font-semibold text-gray-900">
            €{formData.revenue?.toLocaleString() || 'N/A'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">EBITDA</label>
          <p className="text-lg font-semibold text-gray-900">
            €{formData.ebitda?.toLocaleString() || 'N/A'}
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Industry</label>
          <p className="text-lg font-semibold text-gray-900">{formData.industry || 'N/A'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-500 mb-1">Confidence Score</label>
          <p className="text-lg font-semibold text-gray-900">
            {extractedData?.confidence ? `${(extractedData.confidence * 100).toFixed(0)}%` : 'N/A'}
          </p>
        </div>
      </div>

      <button
        onClick={onCalculate}
        disabled={isCalculating}
        className="w-full px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-3"
      >
        {isCalculating ? (
          <>
            <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full" />
            Calculating...
          </>
        ) : (
          <>
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Calculate Valuation
          </>
        )}
      </button>
    </div>
  );
};

