/**
 * ScrollToTop Component
 *
 * Automatically scrolls to the top of the page when the route changes.
 * This ensures that when users navigate to a new page via links in navigation,
 * footer, or anywhere else, the viewport starts at the top of the new page.
 *
 * Usage: Place this component at the root level of your app.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top when location changes
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant', // Use 'instant' for immediate scroll, 'smooth' for animated
    });
  }, [location.pathname, location.search]);

  return null; // This component doesn't render anything
};

export default ScrollToTop;
