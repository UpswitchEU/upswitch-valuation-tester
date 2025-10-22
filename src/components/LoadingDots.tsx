import React from 'react';

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
  layout?: 'inline' | 'block';
}

const DOTS_CONFIG = [
  { delay: '0ms' },
  { delay: '150ms' },
  { delay: '300ms' },
];

export const LoadingDots: React.FC<LoadingDotsProps> = ({
  size = 'md',
  color = 'text-primary-400',
  className = '',
  layout = 'inline',
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
  };

  const dotSize = sizeClasses[size];
  const layoutClass = layout === 'block' ? 'flex-col' : 'flex-row';

  return (
    <div className={`flex items-center gap-1 ${layoutClass} ${className}`}>
      {DOTS_CONFIG.map((config, index) => (
        <div
          key={index}
          className={`${dotSize} ${color} rounded-full animate-bounce`}
          style={{
            animationDelay: config.delay,
            animationDuration: '1.4s',
            animationTimingFunction: 'ease-in-out',
          }}
        />
      ))}
    </div>
  );
};
