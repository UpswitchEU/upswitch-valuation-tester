/**
 * URL Generator Service
 * Centralized URL generation following Ilara Mercury pattern
 */
class UrlGeneratorService {
  static root = () => '/';
  static home = () => '/home';

  // Valuation Reports Routes with unique keys
  static reports = () => '/reports';
  static reportById = (reportId: string) => `/reports/${reportId}`;
  static createNewReport = () => '/reports/new';

  // Legacy routes for backward compatibility (will redirect)
  static legacyManual = () => '/manual';
  static legacyAIGuided = () => '/ai-guided';
  static legacyInstant = () => '/instant';

  // Info pages
  static privacy = () => '/privacy';
  static about = () => '/about';
  static howItWorks = () => '/how-it-works';

  // Error pages
  static notFound = () => '/404';
}

export default UrlGeneratorService;
