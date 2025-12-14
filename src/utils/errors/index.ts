/**
 * Error Utilities
 *
 * Centralized error handling exports
 */

export type { ErrorHandlingResult } from './handler'

// Export error handler
export { ErrorHandler } from './handler'
export type { RecoveryStrategy, RetryConfig } from './recovery'

// Export recovery manager
export { ErrorRecoveryManager } from './recovery'
// Export all error types
export * from './types'

// Re-export commonly used errors for convenience
export {
  AcceptError,
  AppError,
  AuthenticationError,
  BadGatewayError,
  BodyError,
  BusinessLogicError,
  CacheError,
  CharsetError,
  CircuitBreakerError,
  ConcurrencyError,
  ConfigurationError,
  ConflictError,
  ContentTypeError,
  CookieError,
  DatabaseError,
  DataCompressionError,
  DataDecodingError,
  DataDecompressionError,
  DataEncodingError,
  DataQualityError,
  DecryptionError,
  DependencyError,
  DeprecatedError,
  DeserializationError,
  EncryptionError,
  ExpectationError,
  ExternalServiceError,
  FailedDependencyError,
  FileSystemError,
  FormatError,
  GatewayTimeoutError,
  HashError,
  HeaderError,
  HttpRangeError,
  HttpVersionNotSupportedError,
  InsufficientStorageError,
  InternalServerError,
  LanguageError,
  LockedError,
  LoopDetectedError,
  MaintenanceError,
  MethodError,
  MisdirectedError,
  NetworkAuthenticationRequiredError,
  NetworkError,
  NotExtendedError,
  NotFoundError,
  NotImplementedError,
  ParameterError,
  PathError,
  PermissionError,
  PreconditionRequiredError,
  QueryError,
  QuotaExceededError,
  RateLimitError,
  RegistryError,
  RequestHeaderFieldsTooLargeError,
  RetryExhaustedError,
  SecurityError,
  SerializationError,
  ServerError,
  ServiceUnavailableError,
  SessionError,
  SignatureError,
  StreamingError,
  TeapotError,
  TimeoutError,
  TokenError,
  TooEarlyError,
  TooManyRequestsError,
  TransformationError,
  UnavailableForLegalReasonsError,
  UnprocessableEntityError,
  UnsupportedError,
  UpgradeRequiredError,
  ValidationError,
  VariantAlsoNegotiatesError,
} from './types'
