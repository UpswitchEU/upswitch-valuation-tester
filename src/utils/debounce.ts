/**
 * Debounce Utility
 * 
 * Delays execution of async functions until a specified time has passed
 * without any new calls. Useful for throttling API requests.
 * 
 * @param fn - The async function to debounce
 * @param delay - Delay in milliseconds before execution
 * @returns Debounced version of the function
 */
export function debounce<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout | null = null
  let lastPromise: Promise<any> | null = null
  
  return ((...args: any[]) => {
    // Clear any pending timeout
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
    
    // If there's no active promise, execute immediately
    if (!lastPromise) {
      lastPromise = fn(...args).finally(() => {
        lastPromise = null
      })
      return lastPromise
    }
    
    // Otherwise, debounce the call
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(() => {
        timeoutId = null
        fn(...args).then(resolve).catch(reject)
      }, delay)
    })
  }) as T
}
