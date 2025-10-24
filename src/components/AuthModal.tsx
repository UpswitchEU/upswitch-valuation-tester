import React from 'react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSignIn }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-purple-400 text-2xl">🔐</span>
          </div>
          
          <h2 className="text-2xl font-bold text-white mb-2">
            Sign In Required
          </h2>
          
          <p className="text-zinc-400 mb-6">
            AI-Guided valuation requires authentication to access your business profile and provide personalized insights.
          </p>
          
          <div className="space-y-3">
            <button
              onClick={onSignIn}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Sign In to Continue
            </button>
            
            <button
              onClick={onClose}
              className="w-full bg-zinc-700 hover:bg-zinc-600 text-zinc-300 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
          
          <p className="text-xs text-zinc-500 mt-4">
            Or try our <span className="text-green-400">FREE Manual Entry</span> flow instead
          </p>
        </div>
      </div>
    </div>
  );
};
