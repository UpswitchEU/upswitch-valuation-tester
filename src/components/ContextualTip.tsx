import React from 'react';

interface ContextualTipProps {
  type: 'info' | 'success' | 'warning' | 'insight';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const ContextualTip: React.FC<ContextualTipProps> = React.memo(({ type, message, action }) => {
  const colorMap = {
    info: 'text-blue-400/70',
    success: 'text-green-400/70',
    warning: 'text-amber-400/70',
    insight: 'text-purple-400/70'
  };

  return (
    <div className="px-4 pb-2">
      <p className={`text-xs ${colorMap[type]} italic`}>
        {message}
        {action && (
          <button
            onClick={action.onClick}
            className="ml-2 underline hover:opacity-80"
          >
            {action.label}
          </button>
        )}
      </p>
    </div>
  );
});
