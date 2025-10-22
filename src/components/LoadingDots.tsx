import React from 'react';

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  color = 'text-primary-400',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const dotSize = sizeClasses[size];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div
        className={`${dotSize} ${color} rounded-full animate-bounce`}
        style={{
          animationDelay: '0ms',
          animationDuration: '1.4s',
          animationTimingFunction: 'ease-in-out',
        }}
      />
      <div
        className={`${dotSize} ${color} rounded-full animate-bounce`}
        style={{
          animationDelay: '150ms',
          animationDuration: '1.4s',
          animationTimingFunction: 'ease-in-out',
        }}
      />
      <div
        className={`${dotSize} ${color} rounded-full animate-bounce`}
        style={{
          animationDelay: '300ms',
          animationDuration: '1.4s',
          animationTimingFunction: 'ease-in-out',
        }}
      />
    </div>
  );
};
