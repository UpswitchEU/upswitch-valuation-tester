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

  const currentTab = tabs.find(tab => tab.id === viewMode);

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

      {/* Tab Description */}
      {currentTab && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0 text-3xl mr-4">
              {currentTab.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-gray-900">{currentTab.title}</h3>
                {currentTab.badge && (
                  <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    currentTab.badge === 'Recommended' ? 'bg-green-100 text-green-700' :
                    currentTab.badge === 'Beta' ? 'bg-yellow-100 text-yellow-700' : ''
                  }`}>
                    {currentTab.badge}
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mb-3">{currentTab.subtitle}</p>
              {currentTab.description && (
                <p className="text-sm text-gray-700 mb-3">{currentTab.description}</p>
              )}
              {currentTab.benefits && currentTab.benefits.length > 0 && (
                <ul className="space-y-1.5">
                  {currentTab.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-start text-sm text-gray-600">
                      <svg className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
};
