import React, { useEffect, useRef } from 'react';

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
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

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
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      
      // Focus the modal for accessibility
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = 'unset';
      // Return focus to previous element
      previousActiveElement.current?.focus();
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Focus trap implementation
  useEffect(() => {
    if (!isOpen) return;

    const modal = modalRef.current;
    if (!modal) return;

    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, [isOpen]);
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-2xl max-w-3xl w-full mx-4 max-h-[90vh] overflow-hidden shadow-2xl border border-gray-100 flex flex-col animate-scale-in focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 sm:px-8 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-gray-100 flex-shrink-0">
          <h2 id="modal-title" className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight pr-4">
            {title}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex-shrink-0"
            aria-label="Close modal"
            type="button"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="overflow-y-auto px-6 sm:px-8 py-6 flex-1 documentation-scrollable">
          <div className="documentation-content">
            {content}
          </div>
        </div>
      </div>
      
      <style>{`
        .documentation-content {
          color: #374151;
          line-height: 1.75;
        }
        
        .documentation-content h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #111827;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          line-height: 1.5;
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
          line-height: 1.5;
        }
        
        .documentation-content h5 {
          font-size: 0.9375rem;
          font-weight: 600;
          color: #374151;
          margin-top: 1.25rem;
          margin-bottom: 0.375rem;
          line-height: 1.4;
        }
        
        .documentation-content p {
          margin-bottom: 1rem;
          color: #4b5563;
          line-height: 1.7;
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

        /* Custom scrollbar styling */
        .documentation-scrollable {
          scrollbar-width: thin;
          scrollbar-color: #cbd5e1 #f1f5f9;
        }

        .documentation-scrollable::-webkit-scrollbar {
          width: 8px;
        }

        .documentation-scrollable::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }

        .documentation-scrollable::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }

        .documentation-scrollable::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }

        /* Respect reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in,
          .animate-scale-in {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
};
