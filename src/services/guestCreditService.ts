/**
 * Guest Credit Service
 * 
 * Manages guest user credits via localStorage
 * Provides 3 free credits for AI-guided valuations
 */

const GUEST_CREDITS_KEY = 'upswitch_guest_credits';
const INITIAL_CREDITS = 3;

export const guestCreditService = {
  /**
   * Get current credit count from localStorage
   */
  getCredits(): number {
    const stored = localStorage.getItem(GUEST_CREDITS_KEY);
    if (!stored) {
      this.initializeCredits();
      return INITIAL_CREDITS;
    }
    return parseInt(stored, 10);
  },
  
  /**
   * Initialize credits in localStorage
   */
  initializeCredits(): void {
    localStorage.setItem(GUEST_CREDITS_KEY, INITIAL_CREDITS.toString());
  },
  
  /**
   * Use one credit (returns false if no credits available)
   */
  useCredit(): boolean {
    const current = this.getCredits();
    if (current <= 0) return false;
    localStorage.setItem(GUEST_CREDITS_KEY, (current - 1).toString());
    return true;
  },
  
  /**
   * Check if user has credits available
   */
  hasCredits(): boolean {
    return this.getCredits() > 0;
  },
  
  /**
   * Reset credits (for testing or admin purposes)
   */
  resetCredits(): void {
    localStorage.setItem(GUEST_CREDITS_KEY, INITIAL_CREDITS.toString());
  },
  
  /**
   * Set credit count directly (for backend synchronization)
   */
  setCredits(count: number): void {
    localStorage.setItem(GUEST_CREDITS_KEY, Math.max(0, count).toString());
  },
  
  /**
   * Get remaining credits count
   */
  getCreditsRemaining(): number {
    return this.getCredits();
  },
  
  /**
   * Get credit status for display
   */
  getCreditStatus(): {
    remaining: number;
    total: number;
    hasCredits: boolean;
    isFirstTime: boolean;
  } {
    const remaining = this.getCredits();
    const isFirstTime = !localStorage.getItem(GUEST_CREDITS_KEY);
    
    return {
      remaining,
      total: INITIAL_CREDITS,
      hasCredits: remaining > 0,
      isFirstTime
    };
  }
};
