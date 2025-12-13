/**
 * Error Utilities
 *
 * Centralized error handling exports
 */

// Export all error types
export * from './types'

// Export error handler
export { ErrorHandler } from './handler'
export type { ErrorHandlingResult } from './handler'

// Export recovery manager
export { ErrorRecoveryManager } from './recovery'
export type { RetryConfig, RecoveryStrategy } from './recovery'

// Re-export commonly used errors for convenience
export {
  AppError,
  NetworkError,
  RegistryError,
  ValidationError,
  AuthenticationError,
  TimeoutError,
  RateLimitError,
  ServerError,
  NotFoundError,
  ConfigurationError,
  CacheError,
  TransformationError,
  StreamingError,
  BusinessLogicError,
  DataQualityError,
  ExternalServiceError,
  DatabaseError,
  FileSystemError,
  SecurityError,
  PermissionError,
  QuotaExceededError,
  MaintenanceError,
  DeprecatedError,
  ConflictError,
  UnsupportedError,
  DependencyError,
  CircuitBreakerError,
  RetryExhaustedError,
  ConcurrencyError,
  SerializationError,
  DeserializationError,
  FormatError,
  DataEncodingError,
  DataDecodingError,
  DataCompressionError,
  DataDecompressionError,
  EncryptionError,
  DecryptionError,
  HashError,
  SignatureError,
  TokenError,
  SessionError,
  CookieError,
  HeaderError,
  BodyError,
  QueryError,
  ParameterError,
  PathError,
  MethodError,
  ContentTypeError,
  AcceptError,
  LanguageError,
  CharsetError,
  RangeError,
  ExpectationError,
  TeapotError,
  MisdirectedError,
  UnprocessableEntityError,
  LockedError,
  FailedDependencyError,
  TooEarlyError,
  UpgradeRequiredError,
  PreconditionRequiredError,
  TooManyRequestsError,
  RequestHeaderFieldsTooLargeError,
  UnavailableForLegalReasonsError,
  InternalServerError,
  NotImplementedError,
  BadGatewayError,
  ServiceUnavailableError,
  GatewayTimeoutError,
  HttpVersionNotSupportedError,
  VariantAlsoNegotiatesError,
  InsufficientStorageError,
  LoopDetectedError,
  NotExtendedError,
  NetworkAuthenticationRequiredError,
} from './types'
