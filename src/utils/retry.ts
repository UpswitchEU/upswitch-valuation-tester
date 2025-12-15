/**
 * Retry Utility
 *
 * Retries an async function with exponential backoff
 * Useful for handling transient network failures
 *
 * @param fn - The async function to retry
 * @param maxAttempts - Maximum number of attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns Result of the function or throws error after all attempts fail
 */
export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      // If this was the last attempt, throw the error
      if (attempt === maxAttempts - 1) {
        throw error
      }

      // Exponential backoff: baseDelay * 2^attempt
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  // This should never be reached, but TypeScript requires it
  throw new Error('Retry failed after all attempts')
}
