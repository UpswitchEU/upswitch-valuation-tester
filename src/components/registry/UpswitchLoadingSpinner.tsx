/**
 * UpswitchLoadingSpinner
 * 
 * Beautiful animated loading spinner for Upswitch branding.
 * Adapted from Ilara AI's sophisticated loading animation patterns.
 * 
 * Features:
 * - Pulsing glow effect
 * - Gradient animations
 * - Customizable size
 * - Progress message support
 */

import React from 'react';

interface UpswitchLoadingSpinnerProps {
  message?: string;
  submessage?: string;
  size?: 'small' | 'medium' | 'large';
}

export const UpswitchLoadingSpinner: React.FC<UpswitchLoadingSpinnerProps> = ({
  message = 'Processing your request...',
  submessage = 'Analyzing company data',
  size = 'medium'
}) => {
  const sizeStyles = {
    small: { width: '30px', height: '30px' },
    medium: { width: '40px', height: '40px' },
    large: { width: '60px', height: '60px' }
  };

  return (
    <div className="flex flex-col items-center justify-center py-4">
      {/* Animated Logo */}
      <svg
        className="animate-pulse"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        style={{
          ...sizeStyles[size],
          filter: 'drop-shadow(rgba(79, 70, 229, 0.3) 0px 0px 8px)',
          animation: '2s ease-in-out 0s infinite alternate none running upswitchGlow',
        }}
      >
        <defs>
          <style>
            {`
              @keyframes upswitchGlow {
                0% { 
                  filter: drop-shadow(0 0 8px rgba(79, 70, 229, 0.3));
                  transform: scale(1);
                }
                50% { 
                  filter: drop-shadow(0 0 16px rgba(79, 70, 229, 0.6));
                  transform: scale(1.05);
                }
                100% { 
                  filter: drop-shadow(0 0 8px rgba(79, 70, 229, 0.3));
                  transform: scale(1);
                }
              }
              @keyframes upswitchRotate {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
              .upswitch-spinner {
                animation: upswitchRotate 3s linear infinite;
                transform-origin: center;
              }
            `}
          </style>
          <linearGradient id="upswitchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="50%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        
        {/* Lightning bolt / arrow up symbol */}
        <g className="upswitch-spinner">
          <path
            fill="url(#upswitchGradient)"
            d="M50 10 L30 45 L45 45 L35 90 L70 50 L55 50 L50 10 Z"
            opacity="0.9"
          />
          {/* Inner glow */}
          <path
            fill="url(#upswitchGradient)"
            d="M50 20 L35 48 L45 48 L40 80 L65 52 L55 52 L50 20 Z"
            opacity="0.5"
          />
        </g>
      </svg>

      {/* Message */}
      <div className="mt-3 text-center">
        <p className="text-sm font-medium text-gray-700">{message}</p>
        {submessage && (
          <p className="text-xs text-gray-500 mt-1">{submessage}</p>
        )}
      </div>

      {/* Progress dots */}
      <div className="flex space-x-1 mt-2">
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};

/**
 * Compact version for inline use
 */
export const UpswitchLoadingSpinnerCompact: React.FC<{ text?: string }> = ({ text = 'Loading...' }) => {
  return (
    <div className="flex items-center gap-2">
      <svg
        className="animate-spin"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 100 100"
        style={{ width: '20px', height: '20px' }}
      >
        <defs>
          <linearGradient id="compactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
        <path
          fill="url(#compactGradient)"
          d="M50 10 L30 45 L45 45 L35 90 L70 50 L55 50 L50 10 Z"
        />
      </svg>
      <span className="text-sm text-gray-600">{text}</span>
    </div>
  );
};
