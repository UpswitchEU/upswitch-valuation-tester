import { useState, useEffect } from 'react';

const LOADING_MESSAGES = [
  'Analyzing...',
  'Thinking...',
  'Processing...',
  'Understanding...',
  'Calculating...',
];

export const useLoadingMessage = (intervalMs: number = 2000) => {
  const [currentMessage, setCurrentMessage] = useState(LOADING_MESSAGES[0]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage((prevMessage) => {
        const currentIndex = LOADING_MESSAGES.indexOf(prevMessage);
        const nextIndex = (currentIndex + 1) % LOADING_MESSAGES.length;
        return LOADING_MESSAGES[nextIndex];
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return currentMessage;
};
