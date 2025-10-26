import { useEffect, useState } from 'react';

/**
 * Hook to detect user's preference for reduced motion
 * 
 * Returns true if user has set prefers-reduced-motion: reduce
 * This helps comply with WCAG 2.1 accessibility guidelines
 * 
 * @returns boolean indicating if reduced motion is preferred
 */
export const useReducedMotion = () => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    // Check if window is available (SSR safety)
    if (typeof window === 'undefined') return;
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    
    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    } 
    // Legacy browsers
    else if (mediaQuery.addListener) {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, []);
  
  return prefersReducedMotion;
};
