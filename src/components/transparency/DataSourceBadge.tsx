import React, { useState } from 'react';

/**
 * DataSourceBadge - Subtle transparency indicator
 * 
 * Shows WHERE data came from (KBO, OECD, ECB, user input, etc.)
 * Design: Small, inline badge with optional tooltip/modal on click
 * 
 * Strategy: Visible but not overwhelming - builds trust without clutter
 */

interface DataSourceBadgeProps {
  source: 'kbo_registry' | 'oecd_database' | 'ecb_data' | 'fmp_api' | 'world_bank' | 'user_input' | 'calculated' | 'estimated';
  confidence?: number; // 0-100
  tooltip?: string;
  url?: string;
  reference?: string;
  onClick?: () => void;
  size?: 'xs' | 'sm' | 'md';
}

const SOURCE_CONFIG = {
  kbo_registry: {
    label: 'KBO',
    icon: '🏛️',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    hoverColor: 'hover:bg-blue-200',
    description: 'Belgian Company Registry (Official)',
    defaultUrl: 'https://kbopub.economie.fgov.be',
  },
  oecd_database: {
    label: 'OECD',
    icon: '📊',
    color: 'bg-purple-100 text-purple-700 border-purple-300',
    hoverColor: 'hover:bg-purple-200',
    description: 'OECD Industry Database',
    defaultUrl: 'https://data.oecd.org',
  },
  ecb_data: {
    label: 'ECB',
    icon: '💶',
    color: 'bg-green-100 text-green-700 border-green-300',
    hoverColor: 'hover:bg-green-200',
    description: 'European Central Bank',
    defaultUrl: 'https://www.ecb.europa.eu/stats/',
  },
  fmp_api: {
    label: 'FMP',
    icon: '📈',
    color: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    hoverColor: 'hover:bg-indigo-200',
    description: 'Financial Modeling Prep',
    defaultUrl: 'https://financialmodelingprep.com',
  },
  world_bank: {
    label: 'World Bank',
    icon: '🌍',
    color: 'bg-teal-100 text-teal-700 border-teal-300',
    hoverColor: 'hover:bg-teal-200',
    description: 'World Bank Data',
    defaultUrl: 'https://data.worldbank.org',
  },
  user_input: {
    label: 'User',
    icon: '👤',
    color: 'bg-gray-100 text-gray-700 border-gray-300',
    hoverColor: 'hover:bg-gray-200',
    description: 'Manually entered by user',
    defaultUrl: null,
  },
  calculated: {
    label: 'Calc',
    icon: '🧮',
    color: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    hoverColor: 'hover:bg-yellow-200',
    description: 'Calculated from other data',
    defaultUrl: null,
  },
  estimated: {
    label: 'Est',
    icon: '📐',
    color: 'bg-orange-100 text-orange-700 border-orange-300',
    hoverColor: 'hover:bg-orange-200',
    description: 'Estimated by system',
    defaultUrl: null,
  },
};

const SIZE_CONFIG = {
  xs: 'text-[9px] px-1 py-0.5 gap-0.5',
  sm: 'text-[10px] px-1.5 py-0.5 gap-1',
  md: 'text-xs px-2 py-1 gap-1',
};

export const DataSourceBadge: React.FC<DataSourceBadgeProps> = ({
  source,
  confidence,
  tooltip,
  url,
  reference,
  onClick,
  size = 'xs',
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = SOURCE_CONFIG[source];
  const sizeClasses = SIZE_CONFIG[size];

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick();
    } else if (url || config.defaultUrl) {
      window.open(url || config.defaultUrl || undefined, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="relative inline-flex">
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          inline-flex items-center font-medium rounded border 
          ${config.color} ${config.hoverColor}
          ${sizeClasses}
          transition-colors cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400
        `}
        title={tooltip || config.description}
      >
        <span className="leading-none">{config.icon}</span>
        <span className="leading-none">{config.label}</span>
        {confidence !== undefined && confidence >= 90 && (
          <span className="leading-none">✓</span>
        )}
      </button>

      {/* Tooltip (Desktop only) */}
      {showTooltip && (tooltip || reference) && (
        <div className="absolute left-0 bottom-full mb-1 z-50 hidden sm:block">
          <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-2.5 max-w-xs whitespace-normal shadow-lg">
            <p className="font-semibold mb-0.5">{config.description}</p>
            {tooltip && <p className="text-gray-300 mb-0.5">{tooltip}</p>}
            {reference && <p className="text-gray-400 text-[10px]">{reference}</p>}
            {confidence !== undefined && (
              <p className="text-gray-400 text-[10px] mt-1">
                Confidence: {confidence}%
              </p>
            )}
            {/* Tooltip arrow */}
            <div className="absolute left-2 top-full w-0 h-0 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

