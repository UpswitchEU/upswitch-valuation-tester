/**
 * Web Workers - Centralized Exports
 * 
 * Provides easy access to Web Worker clients:
 * - HTML parser worker
 * - Data transform worker
 * 
 * @module utils/workers
 */

export { htmlParserWorker } from '../htmlParserWorker'
export type {
  HTMLMetadata,
  HTMLParseResult,
  HTMLSanitizeResult,
  HTMLTextResult,
  HTMLStructureResult,
} from '../htmlParserWorker'

export { dataTransformWorker } from '../dataTransformWorker'
export type {
  SortDataResult,
  FilterDataResult,
  AggregateDataResult,
  ChartDataResult,
  StatsResult,
} from '../dataTransformWorker'

