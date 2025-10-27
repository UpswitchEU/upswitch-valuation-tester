import React, { useState } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

interface DependencyLevel {
  value: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
  label: string;
  description: string;
}

interface Question {
  id: string;
  title: string;
  question: string;
  options: DependencyLevel[];
  helpText?: string;
}

export interface OwnerDependencyFactors {
  client_concentration: string;
  operational_knowledge: string;
  sales_relationship: string;
  technical_expertise: string;
  industry_network: string;
  decision_making: string;
  process_documentation: string;
  team_capability: string;
  succession_planning: string;
  business_scalability: string;
  brand_reputation: string;
  contract_transferability: string;
}

interface OwnerDependencyQuestionsProps {
  onComplete: (factors: OwnerDependencyFactors) => void;
  prefillData?: Partial<OwnerDependencyFactors>;
  onSkip?: () => void;
}

export const OwnerDependencyQuestions: React.FC<OwnerDependencyQuestionsProps> = ({
  onComplete,
  prefillData,
  onSkip
}) => {
  const [factors, setFactors] = useState<Partial<OwnerDependencyFactors>>(prefillData || {});
  const [currentQuestion, setCurrentQuestion] = useState(0);

  const questions: Question[] = [
    {
      id: 'client_concentration',
      title: 'Client Concentration',
      question: 'What percentage of your annual revenue comes from your top 3 clients?',
      helpText: 'Lower concentration reduces dependency risk',
      options: [
        { value: 'very_low', label: '<10%', description: 'Highly diversified client base' },
        { value: 'low', label: '10-25%', description: 'Well-diversified' },
        { value: 'medium', label: '25-50%', description: 'Moderate concentration' },
        { value: 'high', label: '50-75%', description: 'High concentration' },
        { value: 'very_high', label: '>75%', description: 'Critical dependency' }
      ]
    },
    {
      id: 'operational_knowledge',
      title: 'Operational Knowledge',
      question: 'How critical is the owner\'s unique operational knowledge to daily business functioning?',
      helpText: 'Documentation and delegation reduce this risk',
      options: [
        { value: 'very_high', label: 'Essential', description: 'Only the owner knows how things work' },
        { value: 'high', label: 'Important', description: 'Some documentation exists' },
        { value: 'medium', label: 'Moderate', description: 'Team has some knowledge' },
        { value: 'low', label: 'Low', description: 'Well documented and delegated' },
        { value: 'very_low', label: 'Minimal', description: 'Fully documented and transferable' }
      ]
    },
    {
      id: 'sales_relationship',
      title: 'Sales Relationships',
      question: 'To what extent are key sales relationships and new business generation dependent on the owner?',
      helpText: 'Team-driven sales reduce owner dependency',
      options: [
        { value: 'very_high', label: 'Highly dependent', description: 'Owner is primary contact for all sales' },
        { value: 'high', label: 'Moderately dependent', description: 'Owner leads, team supports' },
        { value: 'medium', label: 'Shared responsibility', description: 'Team handles most sales' },
        { value: 'low', label: 'Low dependence', description: 'Systems and team drive sales' },
        { value: 'very_low', label: 'Not dependent', description: 'Fully systematized sales process' }
      ]
    },
    {
      id: 'technical_expertise',
      title: 'Technical Expertise',
      question: 'Does the business rely on the owner\'s unique technical expertise that is not easily replaceable?',
      helpText: 'Specialized skills can be transferred or hired',
      options: [
        { value: 'very_high', label: 'Yes, highly specialized', description: 'Critical and unique expertise' },
        { value: 'high', label: 'Somewhat', description: 'Can be learned by others over time' },
        { value: 'medium', label: 'Partially', description: 'External resources can assist' },
        { value: 'low', label: 'Limited', description: 'Common expertise in market' },
        { value: 'very_low', label: 'No', description: 'Expertise is documented or common' }
      ]
    },
    {
      id: 'industry_network',
      title: 'Industry Network',
      question: 'How crucial is the owner\'s personal industry network for business development and partnerships?',
      helpText: 'Company brand and team relationships reduce this risk',
      options: [
        { value: 'very_high', label: 'Extremely critical', description: 'No alternative network exists' },
        { value: 'high', label: 'Important', description: 'Provides significant leads and deals' },
        { value: 'medium', label: 'Moderately important', description: 'One of several sources' },
        { value: 'low', label: 'Limited importance', description: 'Company brand drives network' },
        { value: 'very_low', label: 'Not critical', description: 'Team and brand drive relationships' }
      ]
    },
    {
      id: 'decision_making',
      title: 'Decision Making',
      question: 'How centralized is strategic and operational decision-making with the owner?',
      helpText: 'Empowered teams reduce single-point dependency',
      options: [
        { value: 'very_high', label: 'Highly centralized', description: 'Owner makes all key decisions' },
        { value: 'high', label: 'Moderately centralized', description: 'Owner leads, team contributes' },
        { value: 'medium', label: 'Shared decision-making', description: 'Team empowered for many decisions' },
        { value: 'low', label: 'Decentralized', description: 'Owner oversees, rarely intervenes' },
        { value: 'very_low', label: 'Fully delegated', description: 'Team operates independently' }
      ]
    },
    {
      id: 'process_documentation',
      title: 'Process Documentation',
      question: 'How well are critical business processes and procedures documented?',
      helpText: 'Better documentation = easier transition',
      options: [
        { value: 'very_low', label: 'Poorly documented', description: 'Mostly in owner\'s head' },
        { value: 'low', label: 'Partially documented', description: 'Some key processes covered' },
        { value: 'medium', label: 'Well documented', description: 'Most processes documented' },
        { value: 'high', label: 'Comprehensively documented', description: 'All critical processes covered' },
        { value: 'very_high', label: 'Fully documented', description: 'Complete and accessible documentation' }
      ]
    },
    {
      id: 'team_capability',
      title: 'Team Capability',
      question: 'How capable is the existing team of operating the business effectively without the owner\'s daily involvement?',
      helpText: 'Stronger teams enable smoother transitions',
      options: [
        { value: 'very_low', label: 'Not capable', description: 'Business would halt without owner' },
        { value: 'low', label: 'Limited capability', description: 'Significant disruption expected' },
        { value: 'medium', label: 'Moderately capable', description: 'Some challenges expected' },
        { value: 'high', label: 'Highly capable', description: 'Smooth transition possible' },
        { value: 'very_high', label: 'Fully capable', description: 'Team can operate independently' }
      ]
    },
    {
      id: 'succession_planning',
      title: 'Succession Planning',
      question: 'Is there a formal succession plan in place for the owner\'s role?',
      helpText: 'Succession planning demonstrates preparedness',
      options: [
        { value: 'very_low', label: 'No plan', description: 'No succession planning done' },
        { value: 'low', label: 'Informal discussion', description: 'Discussed but not documented' },
        { value: 'medium', label: 'Basic plan', description: 'Plan exists but not tested' },
        { value: 'high', label: 'Solid plan', description: 'Documented and partially tested' },
        { value: 'very_high', label: 'Comprehensive plan', description: 'Regularly updated and tested' }
      ]
    },
    {
      id: 'business_scalability',
      title: 'Business Scalability',
      question: 'To what extent can the business scale without direct, continuous involvement from the owner?',
      helpText: 'Scalable systems reduce owner dependency',
      options: [
        { value: 'very_low', label: 'Not scalable', description: 'Owner is bottleneck to all growth' },
        { value: 'low', label: 'Limited scalability', description: 'Heavy owner involvement needed' },
        { value: 'medium', label: 'Moderately scalable', description: 'Some owner input needed' },
        { value: 'high', label: 'Highly scalable', description: 'Systems/team drive most growth' },
        { value: 'very_high', label: 'Fully scalable', description: 'Business scales independently' }
      ]
    },
    {
      id: 'brand_reputation',
      title: 'Brand vs Personal Reputation',
      question: 'Is the company\'s brand and reputation primarily tied to the owner\'s personal brand?',
      helpText: 'Strong company brand reduces owner dependency',
      options: [
        { value: 'very_high', label: 'Heavily reliant', description: 'Owner is the brand' },
        { value: 'high', label: 'Somewhat reliant', description: 'Owner\'s brand is significant asset' },
        { value: 'medium', label: 'Partially tied', description: 'Company brand is growing' },
        { value: 'low', label: 'Mostly independent', description: 'Company brand stands alone' },
        { value: 'very_low', label: 'Fully independent', description: 'Company brand dominates' }
      ]
    },
    {
      id: 'contract_transferability',
      title: 'Contract Transferability',
      question: 'How easy is it to transfer key contracts and agreements to a new owner?',
      helpText: 'Transferable contracts enable smoother transitions',
      options: [
        { value: 'very_low', label: 'Very difficult', description: 'Contracts tied to owner personally' },
        { value: 'low', label: 'Difficult', description: 'Some contracts require renegotiation' },
        { value: 'medium', label: 'Moderately easy', description: 'Most contracts transferable' },
        { value: 'high', label: 'Easy', description: 'Contracts designed for transfer' },
        { value: 'very_high', label: 'Very easy', description: 'All contracts fully transferable' }
      ]
    }
  ];

  const handleAnswer = (value: string) => {
    const newFactors = { ...factors, [questions[currentQuestion].id]: value };
    setFactors(newFactors);

    // Auto-advance after selection
    if (currentQuestion < questions.length - 1) {
      setTimeout(() => setCurrentQuestion(currentQuestion + 1), 400);
    } else {
      // All questions answered
      setTimeout(() => onComplete(newFactors as OwnerDependencyFactors), 400);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Owner Dependency Assessment</h2>
        <p className="text-gray-600">
          12 questions to understand key person risk (3-5 minutes)
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span className="font-semibold">Question {currentQuestion + 1} of {questions.length}</span>
          <span className="font-semibold">{Math.round(progress)}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white border-2 border-blue-400 rounded-xl shadow-lg p-8 mb-6">
        <div className="mb-6">
          <div className="text-sm font-semibold text-blue-600 mb-2">{currentQ.title}</div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{currentQ.question}</h3>
          {currentQ.helpText && (
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">{currentQ.helpText}</p>
            </div>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQ.options.map((option) => {
            const isSelected = factors[currentQ.id as keyof OwnerDependencyFactors] === option.value;
            
            return (
              <button
                key={option.value}
                onClick={() => handleAnswer(option.value)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className={`font-semibold mb-1 ${isSelected ? 'text-blue-900' : 'text-gray-900'}`}>
                      {option.label}
                    </div>
                    <div className={`text-sm ${isSelected ? 'text-blue-700' : 'text-gray-600'}`}>
                      {option.description}
                    </div>
                  </div>
                  {isSelected && (
                    <CheckCircle className="w-6 h-6 text-blue-600 flex-shrink-0 ml-3" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
            currentQuestion === 0
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ← Previous
        </button>

        {onSkip && (
          <button
            onClick={onSkip}
            className="px-6 py-3 text-gray-600 hover:text-gray-900 font-semibold transition-colors"
          >
            Skip for now
          </button>
        )}

        <div className="text-sm text-gray-500">
          {currentQuestion < questions.length - 1 ? 'Select an answer to continue' : 'Select to complete'}
        </div>
      </div>

      {/* Info Banner */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <strong className="text-purple-900">Why this matters:</strong> Owner dependency can impact valuation by 
            up to 40%. This assessment helps identify key person risks and provides actionable recommendations to 
            reduce dependency and increase business value.
          </div>
        </div>
      </div>
    </div>
  );
};

