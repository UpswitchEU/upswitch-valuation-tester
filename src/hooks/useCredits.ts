/**
 * useCredits Hook for Valuation Tester
 *
 * Hook for managing credit state and operations
 */

import { useState, useEffect, useCallback } from 'react'

interface UserPlan {
  id: string
  user_id: string
  plan_type: 'free' | 'premium'
  credits_per_period: number
  credits_used: number
  credits_remaining: number
  created_at: string
}

interface CreditContextValue {
  plan: UserPlan | null
  creditsRemaining: number
  isPremium: boolean
  isLoading: boolean
  refreshCredits: () => Promise<void>
}

// SOFT DISABLE: Feature flag for unlimited credits mode
const UNLIMITED_CREDITS_MODE = import.meta.env.VITE_UNLIMITED_CREDITS_MODE !== 'false'

export const useCredits = (): CreditContextValue => {
  const [plan, setPlan] = useState<UserPlan | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadCredits = useCallback(async () => {
    try {
      setIsLoading(true)

      if (UNLIMITED_CREDITS_MODE) {
        // SOFT DISABLE: Return unlimited credits for all users
        setPlan({
          id: 'unlimited-mode',
          user_id: 'current-user',
          plan_type: 'free',
          credits_per_period: 999999,
          credits_used: 0,
          credits_remaining: 999999,
          created_at: new Date().toISOString(),
        })
        return
      }

      // TODO: Implement real API call when credit enforcement is enabled
      // const response = await fetch('/api/credits/plan');
      // const data = await response.json();
      // setPlan(data);

      // Mock data for now
      setPlan({
        id: 'mock-plan',
        user_id: 'current-user',
        plan_type: 'free',
        credits_per_period: 3,
        credits_used: 0,
        credits_remaining: 3,
        created_at: new Date().toISOString(),
      })
    } catch (err) {
      console.error('Failed to load credits:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const refreshCredits = useCallback(async () => {
    await loadCredits()
  }, [loadCredits])

  useEffect(() => {
    loadCredits()
  }, [loadCredits])

  return {
    plan,
    creditsRemaining: plan?.credits_remaining || 0,
    isPremium: plan?.plan_type === 'premium',
    isLoading,
    refreshCredits,
  }
}
