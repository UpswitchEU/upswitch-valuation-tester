import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Zap, Edit3, Upload, ArrowRight } from 'lucide-react';
import { MinimalHeader } from '../components/MinimalHeader';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const valuationMethods = [
    {
      id: 'instant',
      icon: Zap,
      title: 'Instant Valuation',
      description: 'Conversational AI guides you through a quick valuation with smart company search',
      badge: 'Recommended',
      badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30',
      features: [
        'AI-powered company search',
        'Answer 2-4 quick questions',
        'Results in 1-2 minutes',
        'Verified KBO registry data'
      ],
      path: '/instant',
      bgGradient: 'from-primary-900/20 via-blue-900/20 to-cyan-900/20',
      borderColor: 'border-primary-500/30 hover:border-primary-400/50',
      glowColor: 'group-hover:shadow-primary-500/20',
    },
    {
      id: 'manual',
      icon: Edit3,
      title: 'Manual Input',
      description: 'Full control over your valuation with comprehensive financial data entry',
      badge: null,
      badgeColor: '',
      features: [
        'Complete data control',
        'Live preview as you type',
        'Historical data support',
        'Custom assumptions'
      ],
      path: '/manual',
      bgGradient: 'from-zinc-800/20 via-zinc-700/20 to-zinc-800/20',
      borderColor: 'border-zinc-600/30 hover:border-zinc-500/50',
      glowColor: 'group-hover:shadow-zinc-500/20',
    },
    {
      id: 'document',
      icon: Upload,
      title: 'File Upload',
      description: 'Extract financial data from your documents automatically (PDF, Excel, CSV)',
      badge: 'Coming soon',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      features: [
        'PDF & Excel support',
        'Automatic data extraction',
        'Review before valuation',
        '60-70% accuracy (improving)'
      ],
      path: '/upload',
      bgGradient: 'from-yellow-900/10 via-orange-900/10 to-yellow-900/10',
      borderColor: 'border-yellow-600/30 hover:border-yellow-500/50',
      glowColor: 'group-hover:shadow-yellow-500/20',
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950">
      <MinimalHeader />


      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16 max-w-7xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Business Valuation Engine
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            Professional-grade valuations powered by AI
          </p>

        </div>

        {/* Valuation Method Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {valuationMethods.map((method) => {
            const IconComponent = method.icon;
            const isDisabled = method.disabled;
            return (
              <button
                key={method.id}
                onClick={() => !isDisabled && navigate(method.path)}
                disabled={isDisabled}
                className={`group relative bg-gradient-to-br ${method.bgGradient} rounded-2xl border ${method.borderColor} p-8 transition-all duration-300 ${
                  isDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-105 hover:shadow-2xl'
                } ${method.glowColor} text-left`}
              >
                {/* Badge */}
                {method.badge && (
                  <div className="absolute top-4 right-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${method.badgeColor}`}>
                      {method.badge}
                    </span>
                  </div>
                )}

                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-6 transition-colors ${
                  isDisabled ? '' : 'group-hover:bg-zinc-700/50'
                }`}>
                  <IconComponent className={`w-7 h-7 transition-colors ${
                    isDisabled ? 'text-zinc-500' : 'text-zinc-300 group-hover:text-white'
                  }`} />
                </div>

                {/* Title */}
                <h3 className={`text-2xl font-bold mb-3 transition-colors ${
                  isDisabled ? 'text-zinc-500' : 'text-white group-hover:text-primary-300'
                }`}>
                  {method.title}
                </h3>

                {/* Description */}
                <p className={`text-sm mb-6 leading-relaxed ${
                  isDisabled ? 'text-zinc-600' : 'text-zinc-400'
                }`}>
                  {method.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {method.features.map((feature, idx) => (
                    <li key={idx} className={`flex items-center gap-2 text-sm ${
                      isDisabled ? 'text-zinc-600' : 'text-zinc-300'
                    }`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        isDisabled ? 'bg-zinc-600' : 'bg-primary-500'
                      }`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="flex items-center justify-between pt-6 border-t border-zinc-700/50">
                  <span className={`text-sm font-medium transition-colors ${
                    isDisabled ? 'text-zinc-600' : 'text-zinc-400 group-hover:text-primary-300'
                  }`}>
                    {isDisabled ? 'Coming Soon' : 'Get Started'}
                  </span>
                  <ArrowRight className={`w-5 h-5 transition-all ${
                    isDisabled 
                      ? 'text-zinc-600' 
                      : 'text-zinc-500 group-hover:text-primary-400 group-hover:translate-x-1'
                  }`} />
                </div>
              </button>
            );
          })}
        </div>


        {/* Professional Disclaimer */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-blue-300 font-semibold mb-2">Professional-Grade Valuation Engine</h4>
                <p className="text-blue-200/80 text-sm leading-relaxed">
                  This valuation engine uses institutional-quality methodologies (DCF + Market Multiples) with 85-95% accuracy, comparable to Big 4 advisory services. While our calculations are professional-grade and transparent, valuations should be considered as informed estimates. For critical business decisions, we recommend consulting with qualified financial advisors and conducting additional due diligence.{' '}
                  <Link 
                    to="/privacy-explainer" 
                    className="font-semibold underline hover:text-blue-300 transition-colors"
                  >
                    Learn how we protect your financial data →
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
