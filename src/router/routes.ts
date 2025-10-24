/**
 * Route Definitions
 * 
 * Centralized route configuration for the valuation tester app.
 */

export const ROUTES = {
  // Main routes
  HOME: '/',
  
  // Valuation reports with unique keys
  REPORTS: '/reports',
  REPORT_BY_ID: '/reports/:reportId',
  NEW_REPORT: '/reports/new',
  
  // Legacy routes (will redirect to /reports/new)
  MANUAL_VALUATION: '/manual',
  AI_GUIDED_VALUATION: '/ai-guided',
  INSTANT_VALUATION: '/instant',
  DOCUMENT_UPLOAD: '/upload',
  
  // Results (legacy)
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
  [ROUTES.REPORTS]: {
    title: 'Valuation Reports',
    description: 'Your business valuation reports',
  },
  [ROUTES.REPORT_BY_ID]: {
    title: 'Valuation Report',
    description: 'View your business valuation report',
  },
  [ROUTES.NEW_REPORT]: {
    title: 'New Valuation',
    description: 'Create a new business valuation',
  },
  [ROUTES.MANUAL_VALUATION]: {
    title: 'Manual Valuation Entry',
    description: 'Enter financial data manually for full control',
  },
  [ROUTES.AI_GUIDED_VALUATION]: {
    title: 'AI-Guided Valuation',
    description: 'Get your business valuation with AI-powered conversational guidance',
  },
  [ROUTES.INSTANT_VALUATION]: {
    title: 'Instant Valuation',
    description: 'Quick AI-powered business valuation',
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
  'ai-assisted': ROUTES.AI_GUIDED_VALUATION,
  'manual': ROUTES.MANUAL_VALUATION,
  'document-upload': ROUTES.DOCUMENT_UPLOAD,
} as const;

export const ROUTE_TO_VIEW_MODE = {
  [ROUTES.AI_GUIDED_VALUATION]: 'ai-assisted',
  [ROUTES.MANUAL_VALUATION]: 'manual',
  [ROUTES.DOCUMENT_UPLOAD]: 'document-upload',
} as const;
