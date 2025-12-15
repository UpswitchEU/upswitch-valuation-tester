/**
 * Business Data Services - Unified Export
 *
 * Provides access to all business data services:
 * - Fetching: Data retrieval from backend
 * - Transformation: Data format conversion
 * - Validation: Data completeness and quality checks
 *
 * @module services/businessData
 */

// Re-export for backward compatibility
export {
  businessDataFetchingService,
  businessDataFetchingService as businessDataService,
} from './businessDataFetchingService'
export { businessDataTransformationService } from './businessDataTransformationService'
export type { BusinessCardData, BusinessProfileData } from './businessDataTypes'
export { businessDataValidationService } from './businessDataValidationService'
