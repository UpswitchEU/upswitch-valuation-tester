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
      label: '🤖 Registry Lookup',
      title: 'AI-Powered Registry Lookup',
      subtitle: 'Fastest method - 30 seconds to valuation',
      benefits: [
        'Official registry data (Companies House, KVK, etc.)',
        '3+ years of historical financial data',
        'GDPR compliant - no sensitive data shared'
      ],
      color: 'primary',
      icon: '🤖'
    },
    {
      id: 'manual' as ViewMode,
      label: '📝 Manual Input',
      title: 'Manual Financial Input',
      subtitle: 'Enter your financial data directly',
      benefits: [
        'Full control over data entry',
        'Works for any business structure',
        'Private data processing'
      ],
      color: 'blue',
      icon: '📝'
    },
    {
      id: 'document-upload' as ViewMode,
      label: '📄 File Upload',
      title: 'Document Upload & Parse',
      subtitle: 'Upload financial documents for AI extraction',
      benefits: [
        'Supports PDF, Excel, CSV files',
        'AI-powered data extraction',
        'Secure processing on our servers'
      ],
      color: 'purple',
      icon: '📄'
    }
  ];

  const getColorClasses = (isActive: boolean) => {
    const baseClasses = 'flex-1 px-4 py-3 text-sm font-medium rounded-md transition-all';
    
    if (isActive) {
      return `${baseClasses} bg-white text-primary-600 shadow-sm`;
    }
    
    return `${baseClasses} text-gray-600 hover:text-gray-900`;
  };

  const getContentColorClasses = (color: string) => {
    switch (color) {
      case 'primary':
        return {
          bg: 'bg-primary-100',
          border: 'border-primary-200',
          text: 'text-primary-600',
          button: 'bg-primary-600 hover:bg-primary-700'
        };
      case 'blue':
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-200',
          text: 'text-blue-600',
          button: 'bg-blue-600 hover:bg-blue-700'
        };
      case 'purple':
        return {
          bg: 'bg-purple-100',
          border: 'border-purple-200',
          text: 'text-purple-600',
          button: 'bg-purple-600 hover:bg-purple-700'
        };
      default:
        return {
          bg: 'bg-gray-100',
          border: 'border-gray-200',
          text: 'text-gray-600',
          button: 'bg-gray-600 hover:bg-gray-700'
        };
    }
  };

  const activeTab = tabs.find(tab => tab.id === viewMode);
  const colors = activeTab ? getContentColorClasses(activeTab.color) : getContentColorClasses('primary');

  return (
    <div className="mb-8">
      {/* Clean header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Business Valuation</h2>
        <p className="text-gray-600">Choose your preferred method to get started</p>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onModeChange(tab.id)}
            className={getColorClasses(viewMode === tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center mb-6">
          <div className={`w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
            <span className="text-2xl">{activeTab?.icon}</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">{activeTab?.title}</h3>
          <p className="text-gray-600">{activeTab?.subtitle}</p>
        </div>
        
        <div className="space-y-4">
          {activeTab?.benefits.map((benefit, index) => (
            <div key={index} className={`flex items-center gap-3 p-3 ${colors.bg} rounded-lg border ${colors.border}`}>
              <span className={colors.text}>✓</span>
              <span className="text-sm text-gray-700">{benefit}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-6">
          <button 
            className={`w-full px-6 py-3 ${colors.button} text-white rounded-lg font-medium transition-colors`}
            onClick={() => {
              // The actual action will be handled by the parent component
              // This is just for visual feedback
            }}
          >
            Start {activeTab?.title.split(' ')[0]} Process
          </button>
        </div>
      </div>
    </div>
  );
};
