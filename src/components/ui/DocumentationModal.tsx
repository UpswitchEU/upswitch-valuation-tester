import React, { useEffect } from 'react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose,
  title,
  content
}) => {
  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-3xl max-h-[85vh] overflow-hidden mx-4 shadow-2xl border border-gray-100 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-6 border-b border-gray-100">
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">{title}</h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-lg hover:bg-gray-50"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto px-8 py-6 flex-1">
          <div className="documentation-content">
            {content}
          </div>
        </div>
      </div>
      
      <style>{`
        .documentation-content {
          color: #374151;
          line-height: 1.7;
        }
        
        .documentation-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
        }
        
        .documentation-content h3:first-child {
          margin-top: 0;
        }
        
        .documentation-content h4 {
          font-size: 1.125rem;
          font-weight: 600;
          color: #1f2937;
          margin-top: 1.75rem;
          margin-bottom: 0.75rem;
        }
        
        .documentation-content h5 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #374151;
          margin-top: 1.25rem;
          margin-bottom: 0.25rem;
        }
        
        .documentation-content p {
          margin-bottom: 1rem;
          color: #4b5563;
        }
        
        .documentation-content ul {
          margin-top: 0.75rem;
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        
        .documentation-content li {
          margin-bottom: 0.5rem;
          color: #4b5563;
        }
        
        .documentation-content strong {
          font-weight: 600;
          color: #111827;
        }
      `}</style>
    </div>
  );
};
