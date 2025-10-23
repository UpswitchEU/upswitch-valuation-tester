import React from 'react';

interface BrandedLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'gray' | 'blue';
  showText?: boolean;
  text?: string;
  className?: string;
}

export const BrandedLoading: React.FC<BrandedLoadingProps> = ({
  size = 'md',
  color = 'gray',
  showText = false,
  text = 'Loading...',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  const colorClasses = {
    white: 'text-white',
    gray: 'text-gray-500',
    blue: 'text-blue-500'
  };

  return (
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Animated gradient dot */}
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse`} />
      
      {showText && (
        <div className="mt-2">
          <p className={`text-sm font-medium ${colorClasses[color]} animate-pulse`}>
            {text}
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Loading spinner with dots animation
 */
export const LoadingDots: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}> = ({ size = 'md', color = 'text-gray-500', className = '' }) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3'
  };

  return (
    <div className={`flex space-x-1 ${className}`}>
      <div 
        className={`${sizeClasses[size]} ${color} rounded-full animate-bounce`}
        style={{ animationDelay: '0ms' }}
      />
      <div 
        className={`${sizeClasses[size]} ${color} rounded-full animate-bounce`}
        style={{ animationDelay: '150ms' }}
      />
      <div 
        className={`${sizeClasses[size]} ${color} rounded-full animate-bounce`}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
};

/**
 * Loading spinner with rotating border
 */
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}> = ({ size = 'md', color = 'text-blue-500', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`${sizeClasses[size]} ${color} ${className}`}>
      <div className="animate-spin rounded-full h-full w-full border-b-2 border-current" />
    </div>
  );
};
