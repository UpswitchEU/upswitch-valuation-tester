import React from 'react';
import { Bot } from 'lucide-react';

interface TypingIndicatorProps {
  context?: string;
  isThinking?: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = () => {
  // Always show "AI is thinking..." for both states
  const message = "AI is thinking...";
  
  return (
    <>
      <style>{`
        @keyframes dot-pulse {
          0%, 20% {
            opacity: 0.3;
            transform: scale(0.8);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
          100% {
            opacity: 0.3;
            transform: scale(0.8);
          }
        }
        
        .typing-dot {
          animation: dot-pulse 1.4s ease-in-out infinite;
        }
        
        .typing-dot-1 {
          animation-delay: 0s;
        }
        
        .typing-dot-2 {
          animation-delay: 0.2s;
        }
        
        .typing-dot-3 {
          animation-delay: 0.4s;
        }
        
      `}</style>
      
      <div className="max-w-[80%] mr-auto">
        <div className="flex items-start gap-3">
          {/* Bot Icon */}
          <div className="flex-shrink-0 w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-400" />
          </div>
          
          {/* AI Thinking Bubble - Always show animated dots */}
          <div className="rounded-lg px-4 py-3 bg-zinc-700/50 text-white">
            <div className="flex items-center gap-2">
              {/* Always show animated dots for both thinking and typing */}
              <div className="flex gap-1">
                <span className="typing-dot typing-dot-1 w-2 h-2 bg-zinc-400 rounded-full"></span>
                <span className="typing-dot typing-dot-2 w-2 h-2 bg-zinc-400 rounded-full"></span>
                <span className="typing-dot typing-dot-3 w-2 h-2 bg-zinc-400 rounded-full"></span>
              </div>
              
              {/* Always show "AI is thinking..." */}
              <span className="text-sm text-zinc-300">{message}</span>
            </div>
          </div>
        </div>
        
        {/* Timestamp */}
        <div className="text-xs text-zinc-500 mt-1 text-left ml-11">
          {new Date().toLocaleTimeString()}
        </div>
      </div>
    </>
  );
};

