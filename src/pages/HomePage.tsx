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
      description: 'AI-powered company lookup with automatic data retrieval from official registries',
      badge: 'Recommended',
      badgeColor: 'bg-green-500/20 text-green-300 border-green-500/30',
      features: [
        'Automatic data retrieval',
        'No manual input needed',
        'Results in under 30 seconds',
        'Verified registry data'
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
      badge: 'Beta',
      badgeColor: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
      features: [
        'PDF & Excel support',
        'Automatic data extraction',
        'Review before valuation',
        '60-70% accuracy (improving)'
      ],
      path: '/document-upload',
      bgGradient: 'from-yellow-900/10 via-orange-900/10 to-yellow-900/10',
      borderColor: 'border-yellow-600/30 hover:border-yellow-500/50',
      glowColor: 'group-hover:shadow-yellow-500/20',
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
            return (
              <button
                key={method.id}
                onClick={() => navigate(method.path)}
                className={`group relative bg-gradient-to-br ${method.bgGradient} rounded-2xl border ${method.borderColor} p-8 transition-all duration-300 hover:scale-105 ${method.glowColor} hover:shadow-2xl text-left`}
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
                <div className="w-14 h-14 rounded-xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-6 group-hover:bg-zinc-700/50 transition-colors">
                  <IconComponent className="w-7 h-7 text-zinc-300 group-hover:text-white transition-colors" />
                </div>

                {/* Title */}
                <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-primary-300 transition-colors">
                  {method.title}
                </h3>

                {/* Description */}
                <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
                  {method.description}
                </p>

                {/* Features */}
                <ul className="space-y-2 mb-6">
                  {method.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-zinc-300 text-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="flex items-center justify-between pt-6 border-t border-zinc-700/50">
                  <span className="text-zinc-400 text-sm font-medium group-hover:text-primary-300 transition-colors">
                    Get Started
                  </span>
                  <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-primary-400 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            );
          })}
        </div>


        {/* Beta Disclaimer */}
        <div className="mt-12 max-w-3xl mx-auto">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="text-yellow-300 font-semibold mb-2">Beta Testing Tool</h4>
                <p className="text-yellow-200/80 text-sm leading-relaxed">
                  This is a beta version for evaluation purposes. Valuations are estimates and should not be considered professional financial advice or used as the sole basis for business decisions. Always consult with qualified financial advisors for important transactions.{' '}
                  <Link 
                    to="/privacy-explainer" 
                    className="font-semibold underline hover:text-yellow-300 transition-colors"
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
