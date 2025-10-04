import React, { useState } from 'react';
import { CheckCircle, Shield, MessageCircle } from 'lucide-react';
import { DataRoomUpload } from './DataRoomUpload';
import { AIConversation } from './AIConversation';
import { useValuationStore } from '../store/useValuationStore';

type Step = 1 | 2;

export const TwoStepFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [uploadedData, setUploadedData] = useState<any>(null);
  const { updateFormData, calculateValuation } = useValuationStore();

  const handleUploadComplete = (files: any[]) => {
    // Extract data from processed files
    const allExtractedData = files
      .filter(f => f.status === 'completed' && f.extractedData)
      .map(f => f.extractedData);

    if (allExtractedData.length > 0) {
      // Merge all extracted data
      const mergedData = allExtractedData.reduce((acc, curr) => ({
        ...acc,
        ...curr,
        revenue: curr.revenue || acc.revenue,
        ebitda: curr.ebitda || acc.ebitda,
        company_name: curr.company_name || acc.company_name,
      }), {});

      setUploadedData(mergedData);
      updateFormData(mergedData);
      
      // Move to step 2
      setTimeout(() => {
        setCurrentStep(2);
      }, 500);
    }
  };

  const handleConversationComplete = async (conversationData: any) => {
    // Merge conversation data with uploaded data
    const finalData = {
      ...uploadedData,
      ...conversationData,
    };

    updateFormData(finalData);

    // Trigger valuation calculation
    await calculateValuation();
  };

  return (
    <div className="space-y-8">
      {/* Progress Stepper */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between">
          {/* Step 1 */}
          <div className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                currentStep >= 1
                  ? 'bg-primary-600 border-primary-600'
                  : 'bg-white border-gray-300'
              }`}
            >
              {currentStep > 1 ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <Shield className={`w-6 h-6 ${currentStep === 1 ? 'text-white' : 'text-gray-400'}`} />
              )}
            </div>
            <div className="ml-3">
              <p
                className={`text-sm font-semibold ${
                  currentStep >= 1 ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                Step 1
              </p>
              <p
                className={`text-xs ${
                  currentStep >= 1 ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                Secure Upload
              </p>
            </div>
          </div>

          {/* Connecting Line */}
          <div className="flex-1 px-4">
            <div
              className={`h-0.5 transition-all ${
                currentStep >= 2 ? 'bg-primary-600' : 'bg-gray-300'
              }`}
            />
          </div>

          {/* Step 2 */}
          <div className="flex items-center flex-1">
            <div
              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                currentStep >= 2
                  ? 'bg-primary-600 border-primary-600'
                  : 'bg-white border-gray-300'
              }`}
            >
              <MessageCircle className={`w-6 h-6 ${currentStep >= 2 ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <div className="ml-3">
              <p
                className={`text-sm font-semibold ${
                  currentStep >= 2 ? 'text-gray-900' : 'text-gray-400'
                }`}
              >
                Step 2
              </p>
              <p
                className={`text-xs ${
                  currentStep >= 2 ? 'text-gray-600' : 'text-gray-400'
                }`}
              >
                AI Details
              </p>
            </div>
          </div>
        </div>

        {/* Step Descriptions */}
        <div className="mt-4 grid grid-cols-2 gap-4">
          <div
            className={`p-4 rounded-lg border transition-all ${
              currentStep === 1
                ? 'border-primary-200 bg-primary-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <Shield className={`w-5 h-5 flex-shrink-0 mt-0.5 ${currentStep === 1 ? 'text-primary-600' : 'text-gray-400'}`} />
              <div>
                <h4 className={`text-sm font-semibold ${currentStep === 1 ? 'text-gray-900' : 'text-gray-600'}`}>
                  Private Processing
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Your financial data is processed securely on our servers, never shared with
                  external AI services
                </p>
              </div>
            </div>
          </div>

          <div
            className={`p-4 rounded-lg border transition-all ${
              currentStep === 2
                ? 'border-primary-200 bg-primary-50'
                : 'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex items-start gap-3">
              <MessageCircle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${currentStep === 2 ? 'text-primary-600' : 'text-gray-400'}`} />
              <div>
                <h4 className={`text-sm font-semibold ${currentStep === 2 ? 'text-gray-900' : 'text-gray-600'}`}>
                  Public Data Only
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  AI assistant helps with company lookup and questions using only public
                  information
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="p-8">
          {currentStep === 1 && (
            <div className="animate-fadeIn">
              <DataRoomUpload onComplete={handleUploadComplete} />
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-fadeIn">
              <AIConversation
                extractedCompanyName={uploadedData?.company_name}
                onComplete={handleConversationComplete}
              />
            </div>
          )}
        </div>
      </div>

      {/* Privacy Summary Footer */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                🔒 Your Privacy is Our Priority
              </h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Step 1: Private Processing</p>
                  <p>
                    Financial documents are processed exclusively by our proprietary engine on secure
                    servers. No external AI services (OpenAI, etc.) see your sensitive data.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-900 mb-1">Step 2: Public Data Only</p>
                  <p>
                    The AI assistant only processes publicly available information like company names,
                    industry data, and registry information. Your financial numbers stay private.
                  </p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-gray-600">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>GDPR Compliant • SOC 2 Certified • Bank-Grade Encryption</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
