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
      benefits: [],
      color: 'blue',
      icon: '📝'
    },
    {
      id: 'document-upload' as ViewMode,
      label: '📄 File Upload',
      title: 'Document Upload & Parse',
      subtitle: 'Upload financial documents for AI extraction',
      benefits: [],
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
      
    </div>
  );
};
