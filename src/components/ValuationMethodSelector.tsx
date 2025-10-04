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
      label: '🇧🇪 Belgian Registry',
      title: 'Belgian Company Lookup',
      subtitle: 'Find your company in the Belgian registry',
      benefits: [
        'Official Belgian company registry data',
        '3+ years of historical financial data',
        'Secure and private processing'
      ],
      color: 'primary',
      icon: '🇧🇪'
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
        <h2 className="text-3xl font-bold text-gray-900 mb-2">🇧🇪 Belgian Business Valuation</h2>
        <p className="text-gray-600">Get your company valuation using Belgian registry data</p>
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
      
      {/* Minimal Content - Just show the selected method is active */}
      <div className="text-center py-8">
        <div className={`w-12 h-12 ${colors.bg} rounded-full flex items-center justify-center mx-auto mb-4`}>
          <span className="text-xl">{activeTab?.icon}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{activeTab?.title}</h3>
        <p className="text-gray-600 text-sm">{activeTab?.subtitle}</p>
      </div>
    </div>
  );
};
