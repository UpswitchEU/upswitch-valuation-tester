import { Maximize2, X } from 'lucide-react';
import React, { useEffect } from 'react';

interface FullScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const FullScreenModal: React.FC<FullScreenModalProps> = ({
  isOpen,
  onClose,
  title = 'Valuation Report',
  children
}) => {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      
      // Store original values
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      // Prevent body scroll and compensate for scrollbar removal
      document.body.style.overflow = 'hidden';
      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        // Restore original values
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80"
        onClick={onClose}
        style={{
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          willChange: 'opacity'
        }}
      />
      
      {/* Modal Content */}
      <div className="relative w-full h-full bg-zinc-950 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900">
          <div className="flex items-center gap-3">
            <Maximize2 className="w-5 h-5 text-blue-400" />
            <h2 className="text-xl font-semibold text-white">{title}</h2>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div 
          className="flex-1 overflow-auto"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'contain',
            willChange: 'scroll-position'
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

