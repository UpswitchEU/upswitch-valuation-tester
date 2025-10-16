import React, { useState } from 'react';

export interface OwnerProfileData {
  hours_per_week: number;
  primary_tasks: string[];
  delegation_capability: number; // 1-10 scale
  succession_plan: boolean;
  succession_details?: string;
}

interface OwnerProfilingQuestionsProps {
  onComplete: (profile: OwnerProfileData) => void;
  onCancel?: () => void;
}

export const OwnerProfilingQuestions: React.FC<OwnerProfilingQuestionsProps> = ({
  onComplete,
  onCancel
}) => {
  const [profile, setProfile] = useState<Partial<OwnerProfileData>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const questions = [
    {
      question: "How many hours per week do you personally work in the business?",
      field: "hours_per_week",
      inputType: "number",
      helpText: "This helps us understand owner dependency",
      validation: { min: 0, max: 168, required: true }
    },
    {
      question: "What are your primary tasks in the business? (select all that apply)",
      field: "primary_tasks",
      inputType: "multiselect",
        options: [
        "Sales & Marketing",
        "Operations Management",
        "Financial Management",
        "Customer Service",
        "Product Development",
        "Human Resources",
        "Strategic Planning",
        "Other"
      ],
      helpText: "Select all tasks you personally handle"
    },
    {
      question: "On a scale of 1-10, how easily could someone else do your job?",
      field: "delegation_capability",
      inputType: "slider",
      min: 1,
      max: 10,
      helpText: "1 = Only you can do it, 10 = Anyone could do it"
    },
    {
      question: "Do you have a succession plan in place?",
      field: "succession_plan",
      inputType: "boolean",
      helpText: "A plan for who would run the business if you left"
    }
  ];

  const handleNext = () => {
    const currentQuestion = questions[currentStep];
    setError(null);

    // Validate current step
    if (currentQuestion.validation?.required && !profile[currentQuestion.field as keyof OwnerProfileData]) {
      setError('This field is required');
      return;
    }

    if (currentStep < questions.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Complete the profile
      if (profile.hours_per_week && profile.primary_tasks && profile.delegation_capability !== undefined && profile.succession_plan !== undefined) {
        onComplete(profile as OwnerProfileData);
      } else {
        setError('Please complete all required fields');
      }
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
    setError(null);
  };

  const handleTaskToggle = (task: string) => {
    setProfile(prev => ({
      ...prev,
      primary_tasks: prev.primary_tasks?.includes(task)
        ? prev.primary_tasks.filter(t => t !== task)
        : [...(prev.primary_tasks || []), task]
    }));
  };

  const currentQuestion = questions[currentStep];

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-zinc-200">
        <h2 className="text-xl font-semibold text-zinc-900 mb-2">Owner Profiling</h2>
            <p className="text-sm text-zinc-600">
          Understanding your role helps us provide a more accurate valuation
        </p>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 bg-zinc-200 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-zinc-500">
            {currentStep + 1} of {questions.length}
          </span>
        </div>
      </div>

      {/* Question Content */}
      <div className="flex-1 p-6">
        <div className="max-w-2xl">
          <h3 className="text-lg font-medium text-zinc-900 mb-4">
          {currentQuestion.question}
        </h3>
        
        {currentQuestion.helpText && (
            <p className="text-sm text-zinc-600 mb-6">
            💡 {currentQuestion.helpText}
          </p>
        )}

          {/* Input Fields */}
          <div className="space-y-4">
            {currentQuestion.inputType === 'number' && (
              <input
                type="number"
                value={profile[currentQuestion.field as keyof OwnerProfileData] || ''}
                onChange={(e) => handleInputChange(currentQuestion.field, parseInt(e.target.value) || 0)}
                min={currentQuestion.validation?.min}
                max={currentQuestion.validation?.max}
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                placeholder="Enter number..."
              />
            )}

            {currentQuestion.inputType === 'multiselect' && (
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => (
                  <label key={option} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={profile.primary_tasks?.includes(option) || false}
                      onChange={() => handleTaskToggle(option)}
                      className="w-4 h-4 text-primary-600 border-zinc-300 rounded focus:ring-primary-500"
                    />
                    <span className="text-zinc-700">{option}</span>
                  </label>
                ))}
          </div>
        )}

            {currentQuestion.inputType === 'slider' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600">1 - Only you can do it</span>
                  <span className="text-sm text-zinc-600">10 - Anyone could do it</span>
      </div>
                <input
                  type="range"
                  min={currentQuestion.min}
                  max={currentQuestion.max}
                  value={profile.delegation_capability || 5}
                  onChange={(e) => handleInputChange('delegation_capability', parseInt(e.target.value))}
                  className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-center">
                  <span className="text-2xl font-bold text-primary-600">
                    {profile.delegation_capability || 5}
                  </span>
          </div>
        </div>
      )}

            {currentQuestion.inputType === 'boolean' && (
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('succession_plan', true)}
                  className={`flex-1 py-3 px-6 rounded-lg border-2 transition-all ${
                    profile.succession_plan === true
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-zinc-300 text-zinc-700 hover:border-zinc-400'
                  }`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('succession_plan', false)}
                  className={`flex-1 py-3 px-6 rounded-lg border-2 transition-all ${
                    profile.succession_plan === false
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-zinc-300 text-zinc-700 hover:border-zinc-400'
                  }`}
                >
                  No
                </button>
              </div>
            )}

            {/* Succession Details */}
            {currentQuestion.field === 'succession_plan' && profile.succession_plan && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  Please describe your succession plan:
                </label>
                <textarea
                  value={profile.succession_details || ''}
                  onChange={(e) => handleInputChange('succession_details', e.target.value)}
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  rows={3}
                  placeholder="Describe who would take over and how..."
                />
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-zinc-200 flex justify-between">
        <button
          type="button"
          onClick={currentStep === 0 ? onCancel : handlePrevious}
          className="px-6 py-2 text-zinc-600 hover:text-zinc-800 transition-colors"
        >
          {currentStep === 0 ? 'Cancel' : 'Previous'}
        </button>

          <button
          type="button"
            onClick={handleNext}
          className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          {currentStep === questions.length - 1 ? 'Complete' : 'Next'}
          </button>
      </div>
    </div>
  );
};