import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { AuthModal } from './AuthModal';

interface FlowSelectionScreenProps {
  onSelectFlow: (flow: 'manual' | 'ai-guided') => void;
}

export const FlowSelectionScreen: React.FC<FlowSelectionScreenProps> = ({ onSelectFlow }) => {
  const { isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <h1 className="text-4xl font-bold text-white text-center mb-4">
          Choose Your Valuation Method
        </h1>
        <p className="text-zinc-400 text-center mb-12">
          Select the method that works best for you
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manual Flow Card */}
          <button
            onClick={() => onSelectFlow('manual')}
            className="group relative p-8 bg-zinc-900 border border-zinc-800 rounded-2xl hover:border-green-500/50 transition-all hover:scale-105"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                <span className="text-green-400 text-sm">✓</span>
              </div>
              <span className="text-sm font-semibold text-green-300">FREE</span>
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">Manual Entry</h3>
            <p className="text-zinc-400 mb-6">
              Enter your financial data directly in a form
            </p>
            
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>✓ Quick estimates</li>
              <li>✓ Full control over data</li>
              <li>✓ No credit cost</li>
              <li>✓ Good accuracy (70-80%)</li>
            </ul>
            
            <div className="mt-6 text-center">
              <span className="text-green-400 font-medium">Start Free Valuation</span>
            </div>
          </button>
          
          {/* AI-Guided Flow Card */}
          <button
            onClick={() => {
              if (isAuthenticated) {
                onSelectFlow('ai-guided');
              } else {
                setShowAuthModal(true);
              }
            }}
            className={`group relative p-8 bg-zinc-900 border border-zinc-800 rounded-2xl transition-all ${
              isAuthenticated 
                ? 'hover:border-purple-500/50 hover:scale-105 cursor-pointer' 
                : 'border-zinc-700 cursor-not-allowed opacity-60'
            }`}
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center">
                <span className="text-purple-400 text-sm">✨</span>
              </div>
              <span className="text-sm font-semibold text-purple-300">PREMIUM - 1 Credit</span>
              {!isAuthenticated && (
                <span className="text-xs bg-orange-500/20 text-orange-300 px-2 py-1 rounded">Login Required</span>
              )}
            </div>
            
            <h3 className="text-2xl font-bold text-white mb-2">AI-Guided</h3>
            <p className="text-zinc-400 mb-6">
              {isAuthenticated 
                ? 'Let AI guide you through the process'
                : 'Sign in to use AI-guided valuation'
              }
            </p>
            
            <ul className="space-y-2 text-sm text-zinc-300">
              <li>✓ Conversational experience</li>
              <li>✓ Real-time validation</li>
              <li>✓ Smart pre-population</li>
              <li>✓ Excellent accuracy (85-95%)</li>
            </ul>
            
            <div className="mt-6 text-center">
              <span className={`font-medium ${
                isAuthenticated ? 'text-purple-400' : 'text-zinc-500'
              }`}>
                {isAuthenticated ? 'Start AI-Guided Valuation' : 'Sign in to Continue'}
              </span>
            </div>
          </button>
        </div>
        
        <div className="mt-12 text-center">
          <p className="text-zinc-500 text-sm">
            Both methods use the same professional valuation engine
          </p>
        </div>
      </div>
      
      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSignIn={() => {
          setShowAuthModal(false);
          // TODO: Implement actual sign-in flow
          console.log('Sign in clicked');
        }}
      />
    </div>
  );
};
