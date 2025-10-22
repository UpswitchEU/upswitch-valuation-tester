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
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % LOADING_MESSAGES.length;
        setCurrentMessage(LOADING_MESSAGES[nextIndex]);
        return nextIndex;
      });
    }, intervalMs);

    return () => clearInterval(interval);
  }, [intervalMs]);

  return currentMessage;
};
