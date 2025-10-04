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

    </div>
  );
};
