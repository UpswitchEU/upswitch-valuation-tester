/**
 * Route Definitions
 * 
 * Centralized route configuration for the valuation tester app.
 */

export const ROUTES = {
  // Main routes
  HOME: '/',
  
  // Valuation methods
  INSTANT_VALUATION: '/instant',
  MANUAL_VALUATION: '/manual',
  DOCUMENT_UPLOAD: '/upload',
  
  // Results
  RESULTS: '/results/:valuationId?',
  
  // Info pages
  PRIVACY: '/privacy',
  ABOUT: '/about',
  HOW_IT_WORKS: '/how-it-works',
  
  // Error
  NOT_FOUND: '/404',
} as const;

export type RoutePath = typeof ROUTES[keyof typeof ROUTES];

/**
 * Route metadata for navigation and SEO
 */
export const ROUTE_META = {
  [ROUTES.HOME]: {
    title: 'Business Valuation Engine',
    description: 'Professional-grade business valuations powered by AI',
  },
  [ROUTES.INSTANT_VALUATION]: {
    title: 'Instant Valuation - AI-Powered',
    description: 'Get your business valuation in under 30 seconds',
  },
  [ROUTES.MANUAL_VALUATION]: {
    title: 'Manual Valuation Entry',
    description: 'Enter financial data manually for full control',
  },
  [ROUTES.DOCUMENT_UPLOAD]: {
    title: 'Document Upload - Beta',
    description: 'Upload financial documents for AI extraction',
  },
  [ROUTES.RESULTS]: {
    title: 'Valuation Results',
    description: 'Your comprehensive business valuation report',
  },
  [ROUTES.PRIVACY]: {
    title: 'Privacy Policy',
    description: 'How we protect your data',
  },
  [ROUTES.ABOUT]: {
    title: 'About Us',
    description: 'Learn about our valuation methodology',
  },
  [ROUTES.HOW_IT_WORKS]: {
    title: 'How It Works',
    description: 'Understanding our Big 4 methodology',
  },
} as const;

/**
 * Tab to route mapping
 */
export const VIEW_MODE_TO_ROUTE = {
  'ai-assisted': ROUTES.INSTANT_VALUATION,
  'manual': ROUTES.MANUAL_VALUATION,
  'document-upload': ROUTES.DOCUMENT_UPLOAD,
} as const;

export const ROUTE_TO_VIEW_MODE = {
  [ROUTES.INSTANT_VALUATION]: 'ai-assisted',
  [ROUTES.MANUAL_VALUATION]: 'manual',
  [ROUTES.DOCUMENT_UPLOAD]: 'document-upload',
} as const;
