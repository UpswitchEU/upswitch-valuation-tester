import React from 'react';
import { Bot, Brain } from 'lucide-react';
import { getTypingMessage, getThinkingMessage } from '../utils/typingMessages';

interface TypingIndicatorProps {
  context?: string;
  isThinking?: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ context, isThinking = false }) => {
  const message = isThinking ? getThinkingMessage(context) : getTypingMessage(context);
  
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
        
        @keyframes brain-pulse {
          0%, 100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        
        .brain-pulse {
          animation: brain-pulse 2s ease-in-out infinite;
        }
      `}</style>
      
      <div className="max-w-[80%] mr-auto">
        <div className="flex items-start gap-3">
          {/* Bot Icon */}
          <div className="flex-shrink-0 w-8 h-8 bg-primary-600/20 rounded-full flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary-400" />
          </div>
          
          {/* Typing/Thinking Bubble */}
          <div className="rounded-lg px-4 py-3 bg-zinc-700/50 text-white">
            <div className="flex items-center gap-2">
              {isThinking ? (
                /* Thinking State - Brain Icon with Pulse */
                <Brain className="w-4 h-4 text-primary-400 brain-pulse" />
              ) : (
                /* Typing State - Animated Dots */
                <div className="flex gap-1">
                  <span className="typing-dot typing-dot-1 w-2 h-2 bg-zinc-400 rounded-full"></span>
                  <span className="typing-dot typing-dot-2 w-2 h-2 bg-zinc-400 rounded-full"></span>
                  <span className="typing-dot typing-dot-3 w-2 h-2 bg-zinc-400 rounded-full"></span>
                </div>
              )}
              
              {/* Contextual Message */}
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

