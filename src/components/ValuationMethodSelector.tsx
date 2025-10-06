import React from 'react';

type ViewMode = 'ai-assisted' | 'manual' | 'document-upload';

interface ValuationMethodSelectorProps {
  viewMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
}

export const ValuationMethodSelector: React.FC<ValuationMethodSelectorProps> = ({
  viewMode,
  onModeChange
}) => {
  const tabs = [
    {
      id: 'ai-assisted' as ViewMode,
      label: '⚡ Instant Valuation',
      title: 'AI-Powered Company Lookup',
      subtitle: 'Fastest & most accurate',
      description: 'Just enter your company name - our AI finds and analyzes your financials automatically',
      benefits: [
        'Automated financial data retrieval',
        'Multi-year historical analysis',
        'Results in under 30 seconds'
      ],
      color: 'primary',
      icon: '⚡',
      badge: 'Recommended'
    },
    {
      id: 'manual' as ViewMode,
      label: '📝 Manual Input',
      title: 'Manual Financial Entry',
      subtitle: 'For any company, anywhere',
      description: 'Enter financial data manually for full control and flexibility',
      benefits: [
        'Works for all countries',
        'Full control over inputs',
        'Same professional calculation'
      ],
      color: 'blue',
      icon: '📝',
      badge: null
    },
    {
      id: 'document-upload' as ViewMode,
      label: '📄 File Upload',
      title: 'Document Upload & Parse',
      subtitle: 'Experimental feature',
      description: 'Upload financial documents for AI extraction (for illustration purposes)',
      benefits: [],
      color: 'purple',
      icon: '📄',
      badge: 'Beta'
    }
  ];

  const getColorClasses = (isActive: boolean, tabId: ViewMode) => {
    const baseClasses = 'relative flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all';
    
    if (isActive) {
      return `${baseClasses} bg-white text-primary-600 shadow-sm`;
    }
    
    // Dim the document-upload tab when not active
    if (tabId === 'document-upload') {
      return `${baseClasses} text-gray-400 hover:text-gray-600`;
    }
    
    return `${baseClasses} text-gray-600 hover:text-gray-900`;
  };

  return (
    <div className="mb-8">
      {/* Clean header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Business Valuation Engine</h2>
        <p className="text-gray-600">Professional-grade valuations powered by AI</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onModeChange(tab.id)}
            className={getColorClasses(viewMode === tab.id, tab.id)}
          >
            <span className="flex items-center justify-center gap-1">
              {tab.label}
              {tab.badge && (
                <span className={`ml-1 px-1.5 py-0.5 text-[10px] font-semibold rounded ${
                  tab.badge === 'Recommended' ? 'bg-green-100 text-green-700' :
                  tab.badge === 'Beta' ? 'bg-yellow-100 text-yellow-700' : ''
                }`}>
                  {tab.badge}
                </span>
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Tab Description - REMOVED for cleaner UI */}
      
    </div>
  );
};
