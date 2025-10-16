/**
 * Owner Profiling Questions Component
 * 
 * Collects owner-specific information for valuation analysis including
 * time commitment, technical requirements, succession planning, and risk factors.
 * 
 * Author: Upswitch Engineering Team
 * Date: October 2025
 */

import React, { useState } from 'react';
import { User, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import type { OwnerProfile, OwnerProfileRequest, OwnerProfileResponse } from '../types/valuation';

interface OwnerProfilingQuestionsProps {
  businessType?: string;
  industry?: string;
  companyName?: string;
  onComplete: (profile: OwnerProfile, analysis: OwnerProfileResponse) => void;
  onSkip: () => void;
}

interface Question {
  id: string;
  question: string;
  type: 'multiple_choice' | 'number' | 'yes_no' | 'rating' | 'text';
  options?: string[];
  required: boolean;
  helpText?: string;
  industrySpecific?: boolean;
  businessTypeSpecific?: string[];
}

export const OwnerProfilingQuestions: React.FC<OwnerProfilingQuestionsProps> = ({
  businessType,
  industry,
  companyName,
  onComplete,
  onSkip
}) => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate industry-specific questions
  const generateQuestions = (): Question[] => {
    const baseQuestions: Question[] = [
      {
        id: 'hours_per_week',
        question: 'How many hours per week do you personally work in the business?',
        type: 'number',
        required: true,
        helpText: 'Include all time spent on business operations, management, and strategic planning'
      },
      {
        id: 'primary_responsibilities',
        question: 'What are your primary responsibilities in the business?',
        type: 'multiple_choice',
        options: [
          'Strategic planning and vision',
          'Sales and customer relationships',
          'Operations and day-to-day management',
          'Financial management and accounting',
          'Marketing and business development',
          'Product/service development',
          'Human resources and team management',
          'All of the above'
        ],
        required: true,
        helpText: 'Select all that apply'
      },
      {
        id: 'delegation_capability',
        question: 'How well can you delegate tasks to others?',
        type: 'rating',
        options: ['1 - Poor', '2', '3 - Average', '4', '5 - Excellent'],
        required: true,
        helpText: 'Rate your ability to delegate and trust others with important tasks'
      },
      {
        id: 'succession_plan',
        question: 'Do you have a succession plan for the business?',
        type: 'yes_no',
        required: true,
        helpText: 'A succession plan identifies who will take over the business when you leave'
      },
      {
        id: 'management_team_strength',
        question: 'How would you rate the strength of your management team?',
        type: 'rating',
        options: ['1 - Weak', '2', '3 - Adequate', '4', '5 - Strong', '6', '7', '8', '9', '10 - Excellent'],
        required: true,
        helpText: 'Consider their ability to run the business without you'
      },
      {
        id: 'key_man_risk',
        question: 'Is the business dependent on you personally for its success?',
        type: 'yes_no',
        required: true,
        helpText: 'Consider if customers, suppliers, or operations would be significantly impacted if you left'
      },
      {
        id: 'personal_guarantees',
        question: 'Do you have personal guarantees on business loans or contracts?',
        type: 'yes_no',
        required: true,
        helpText: 'Personal guarantees make you personally liable for business debts'
      },
      {
        id: 'industry_experience',
        question: 'How many years of experience do you have in this industry?',
        type: 'number',
        required: true,
        helpText: 'Include all relevant industry experience, not just with this business'
      },
      {
        id: 'growth_ambition',
        question: 'What are your growth ambitions for the business?',
        type: 'multiple_choice',
        options: [
          'Maintain current size and profitability',
          'Moderate growth (10-20% annually)',
          'Aggressive growth (20%+ annually)',
          'Prepare for sale or exit',
          'Pass to family members',
          'Unsure'
        ],
        required: true,
        helpText: 'This helps assess the business growth potential and owner motivation'
      }
    ];

    // Add industry-specific questions
    const industrySpecificQuestions: Question[] = [];

    // Brewery-specific questions
    if (businessType === 'brewery' || industry?.toLowerCase().includes('brewery')) {
      industrySpecificQuestions.push({
        id: 'brewer_requirement',
        question: 'Does the business require a qualified brewer to operate?',
        type: 'yes_no',
        required: true,
        helpText: 'Breweries often require specialized brewing knowledge and certifications',
        industrySpecific: true,
        businessTypeSpecific: ['brewery']
      });
      industrySpecificQuestions.push({
        id: 'brewing_certification',
        question: 'Do you or your team have brewing certifications or formal training?',
        type: 'yes_no',
        required: false,
        helpText: 'Professional brewing certifications can add significant value',
        industrySpecific: true,
        businessTypeSpecific: ['brewery']
      });
    }

    // Restaurant-specific questions
    if (businessType === 'restaurant' || industry?.toLowerCase().includes('restaurant')) {
      industrySpecificQuestions.push({
        id: 'chef_requirement',
        question: 'Does the business require a qualified chef to maintain quality?',
        type: 'yes_no',
        required: true,
        helpText: 'Restaurants often depend on culinary expertise for their reputation',
        industrySpecific: true,
        businessTypeSpecific: ['restaurant']
      });
      industrySpecificQuestions.push({
        id: 'location_dependency',
        question: 'How dependent is the business on its current location?',
        type: 'rating',
        options: ['1 - Not dependent', '2', '3', '4', '5 - Very dependent'],
        required: true,
        helpText: 'Location dependency affects transferability and risk',
        industrySpecific: true,
        businessTypeSpecific: ['restaurant']
      });
    }

    // SaaS/Technology-specific questions
    if (businessType === 'saas' || businessType === 'technology' || industry?.toLowerCase().includes('technology')) {
      industrySpecificQuestions.push({
        id: 'technical_expertise',
        question: 'How critical is your technical expertise to the business?',
        type: 'rating',
        options: ['1 - Not critical', '2', '3', '4', '5 - Very critical'],
        required: true,
        helpText: 'Technical businesses often depend on founder expertise',
        industrySpecific: true,
        businessTypeSpecific: ['saas', 'technology', 'software']
      });
      industrySpecificQuestions.push({
        id: 'code_ownership',
        question: 'Do you personally own the core intellectual property/code?',
        type: 'yes_no',
        required: true,
        helpText: 'IP ownership affects business transferability',
        industrySpecific: true,
        businessTypeSpecific: ['saas', 'technology', 'software']
      });
    }

    // Manufacturing-specific questions
    if (businessType === 'manufacturing' || industry?.toLowerCase().includes('manufacturing')) {
      industrySpecificQuestions.push({
        id: 'equipment_dependency',
        question: 'How dependent is the business on specialized equipment?',
        type: 'rating',
        options: ['1 - Not dependent', '2', '3', '4', '5 - Very dependent'],
        required: true,
        helpText: 'Equipment dependency affects asset value and transferability',
        industrySpecific: true,
        businessTypeSpecific: ['manufacturing']
      });
      industrySpecificQuestions.push({
        id: 'technical_processes',
        question: 'Do you have proprietary technical processes or know-how?',
        type: 'yes_no',
        required: true,
        helpText: 'Proprietary processes can add significant value',
        industrySpecific: true,
        businessTypeSpecific: ['manufacturing']
      });
    }

    // Consulting/Professional Services questions
    if (businessType === 'consulting' || businessType === 'legal' || businessType === 'accounting') {
      industrySpecificQuestions.push({
        id: 'client_relationships',
        question: 'How dependent are clients on your personal relationships?',
        type: 'rating',
        options: ['1 - Not dependent', '2', '3', '4', '5 - Very dependent'],
        required: true,
        helpText: 'Client relationship dependency affects business transferability',
        industrySpecific: true,
        businessTypeSpecific: ['consulting', 'legal', 'accounting']
      });
      industrySpecificQuestions.push({
        id: 'professional_certifications',
        question: 'Do you have professional certifications or licenses?',
        type: 'yes_no',
        required: true,
        helpText: 'Professional certifications are often required and add value',
        industrySpecific: true,
        businessTypeSpecific: ['consulting', 'legal', 'accounting']
      });
    }

    return [...baseQuestions, ...industrySpecificQuestions];
  };

  const questions = generateQuestions();
  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  const handleAnswer = (answer: any) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Transform answers to OwnerProfile format
      const ownerProfile: OwnerProfile = {
        involvement_level: getInvolvementLevel(answers.hours_per_week),
        time_commitment: answers.hours_per_week || 0,
        succession_plan: getSuccessionPlan(answers.succession_plan, answers.growth_ambition),
        risk_tolerance: getRiskTolerance(answers.growth_ambition),
        growth_ambition: answers.growth_ambition || 'maintain',
        industry_experience: answers.industry_experience || 0,
        management_team_strength: getManagementTeamStrength(answers.management_team_strength),
        key_man_risk: answers.key_man_risk || false,
        personal_guarantees: answers.personal_guarantees || false,
        additional_context: buildAdditionalContext()
      };

      // Submit to valuation engine
      const profileRequest: OwnerProfileRequest = {
        profile: ownerProfile,
        business_context: {
          company_name: companyName,
          business_type: businessType,
          industry: industry
        }
      };

      const response = await api.submitOwnerProfile(profileRequest);
      
      console.log('✅ Owner profile submitted:', response);
      onComplete(ownerProfile, response);
      
    } catch (error) {
      console.error('❌ Error submitting owner profile:', error);
      setError('Failed to submit owner profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInvolvementLevel = (hoursPerWeek: number): 'hands_on' | 'strategic' | 'passive' | 'absentee' => {
    if (hoursPerWeek >= 50) return 'hands_on';
    if (hoursPerWeek >= 20) return 'strategic';
    if (hoursPerWeek >= 5) return 'passive';
    return 'absentee';
  };

  const getSuccessionPlan = (hasPlan: boolean, growthAmbition: string): 'family' | 'management' | 'sale' | 'none' | 'uncertain' => {
    if (hasPlan) {
      if (growthAmbition?.includes('family')) return 'family';
      if (growthAmbition?.includes('sale')) return 'sale';
      return 'management';
    }
    if (growthAmbition?.includes('sale')) return 'sale';
    if (growthAmbition?.includes('family')) return 'family';
    return 'none';
  };

  const getRiskTolerance = (growthAmbition: string): 'conservative' | 'moderate' | 'aggressive' => {
    if (growthAmbition?.includes('aggressive')) return 'aggressive';
    if (growthAmbition?.includes('moderate')) return 'moderate';
    return 'conservative';
  };

  const getManagementTeamStrength = (rating: number): 'weak' | 'adequate' | 'strong' | 'excellent' => {
    if (rating >= 8) return 'excellent';
    if (rating >= 6) return 'strong';
    if (rating >= 4) return 'adequate';
    return 'weak';
  };

  const buildAdditionalContext = (): string => {
    const context: string[] = [];
    
    if (answers.primary_responsibilities) {
      context.push(`Primary responsibilities: ${Array.isArray(answers.primary_responsibilities) ? answers.primary_responsibilities.join(', ') : answers.primary_responsibilities}`);
    }
    
    if (answers.delegation_capability) {
      context.push(`Delegation capability: ${answers.delegation_capability}/5`);
    }

    // Add industry-specific context
    if (businessType === 'brewery' && answers.brewer_requirement !== undefined) {
      context.push(`Brewer requirement: ${answers.brewer_requirement ? 'Yes' : 'No'}`);
    }
    
    if (businessType === 'restaurant' && answers.chef_requirement !== undefined) {
      context.push(`Chef requirement: ${answers.chef_requirement ? 'Yes' : 'No'}`);
    }
    
    if (businessType === 'saas' && answers.technical_expertise !== undefined) {
      context.push(`Technical expertise critical: ${answers.technical_expertise}/5`);
    }

    return context.join('. ');
  };

  const renderQuestionInput = () => {
    switch (currentQuestion.type) {
      case 'multiple_choice':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(option)}
                  onChange={(e) => {
                    const currentAnswers = answers[currentQuestion.id] || [];
                    if (e.target.checked) {
                      handleAnswer([...currentAnswers, option]);
                    } else {
                      handleAnswer(currentAnswers.filter((a: string) => a !== option));
                    }
                  }}
                  className="w-4 h-4 text-primary-600 border-zinc-300 rounded focus:ring-primary-500"
                />
                <span className="text-sm text-zinc-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'rating':
        return (
          <div className="space-y-3">
            {currentQuestion.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="radio"
                  name={currentQuestion.id}
                  value={index + 1}
                  checked={answers[currentQuestion.id] === index + 1}
                  onChange={(e) => handleAnswer(parseInt(e.target.value))}
                  className="w-4 h-4 text-primary-600 border-zinc-300 focus:ring-primary-500"
                />
                <span className="text-sm text-zinc-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'yes_no':
        return (
          <div className="flex space-x-6">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={currentQuestion.id}
                value="yes"
                checked={answers[currentQuestion.id] === true}
                onChange={() => handleAnswer(true)}
                className="w-4 h-4 text-primary-600 border-zinc-300 focus:ring-primary-500"
              />
              <span className="text-sm text-zinc-700">Yes</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="radio"
                name={currentQuestion.id}
                value="no"
                checked={answers[currentQuestion.id] === false}
                onChange={() => handleAnswer(false)}
                className="w-4 h-4 text-primary-600 border-zinc-300 focus:ring-primary-500"
              />
              <span className="text-sm text-zinc-700">No</span>
            </label>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswer(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter number"
            min="0"
          />
        );

      case 'text':
        return (
          <textarea
            value={answers[currentQuestion.id] || ''}
            onChange={(e) => handleAnswer(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Enter your answer"
            rows={3}
          />
        );

      default:
        return null;
    }
  };

  const isCurrentQuestionAnswered = () => {
    const answer = answers[currentQuestion.id];
    if (currentQuestion.type === 'multiple_choice') {
      return Array.isArray(answer) && answer.length > 0;
    }
    return answer !== undefined && answer !== null && answer !== '';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-zinc-900">Owner Profiling</h2>
            <p className="text-sm text-zinc-600">
              Help us understand your role and the business's dependency on you
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-zinc-200 rounded-full h-2">
          <div 
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-zinc-500 mt-2">
          Question {currentQuestionIndex + 1} of {questions.length}
        </p>
      </div>

      {/* Question */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-zinc-900 mb-3">
          {currentQuestion.question}
        </h3>
        
        {currentQuestion.helpText && (
          <p className="text-sm text-zinc-600 mb-4 bg-zinc-50 p-3 rounded-lg">
            💡 {currentQuestion.helpText}
          </p>
        )}

        {currentQuestion.industrySpecific && (
          <div className="flex items-center gap-2 text-sm text-primary-600 mb-4">
            <Shield className="w-4 h-4" />
            <span>Industry-specific question for {businessType}</span>
          </div>
        )}

        {renderQuestionInput()}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <button
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
          className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="flex gap-3">
          <button
            onClick={onSkip}
            className="px-4 py-2 text-sm text-zinc-600 hover:text-zinc-800"
          >
            Skip Profiling
          </button>
          
          <button
            onClick={handleNext}
            disabled={!isCurrentQuestionAnswered() || isSubmitting}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Submitting...
              </>
            ) : currentQuestionIndex === questions.length - 1 ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Complete Profiling
              </>
            ) : (
              'Next'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
