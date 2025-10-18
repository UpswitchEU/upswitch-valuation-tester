import React from 'react';
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface ContextualTipProps {
  type: 'info' | 'success' | 'warning' | 'insight';
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const ContextualTip: React.FC<ContextualTipProps> = ({ type, message, action }) => {
  const config = {
    info: {
      icon: Lightbulb,
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/30',
      textColor: 'text-blue-400',
      iconColor: 'text-blue-400'
    },
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/30',
      textColor: 'text-green-400',
      iconColor: 'text-green-400'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
      iconColor: 'text-amber-400'
    },
    insight: {
      icon: TrendingUp,
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/30',
      textColor: 'text-purple-400',
      iconColor: 'text-purple-400'
    }
  };

  const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

  return (
    <div className={`flex items-start gap-3 p-3 rounded-lg border ${bgColor} ${borderColor} mb-3`}>
      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
      <div className="flex-1">
        <p className={`text-xs ${textColor}`}>{message}</p>
        {action && (
          <button
            onClick={action.onClick}
            className={`mt-2 text-xs font-medium ${textColor} hover:underline`}
          >
            {action.label} →
          </button>
        )}
      </div>
    </div>
  );
};
