import { useEffect, useState } from 'react'
import { generalLogger } from '../utils/logger'

// Note: Owner Dependency UI has been removed. This hook is kept for backward compatibility
// and future backend integration, but the assessment is now handled conversationally.
type OwnerDependencyFactors = Record<string, any>

interface ProfileData {
  owner_dependency_assessment?: OwnerDependencyFactors
  // Add other profile fields as needed
  company_name?: string
  industry?: string
  country?: string
}

interface UseProfileDataReturn {
  profileData: ProfileData | null
  loading: boolean
  error: Error | null
  hasOwnerDependency: boolean
  refetch: () => Promise<void>
}

/**
 * Hook to fetch user profile data including Owner Dependency assessment
 * from the main upswitch app if the user has already completed it.
 *
 * This enables intelligent triage by skipping questions that have already been answered.
 */
export const useProfileData = (): UseProfileDataReturn => {
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      // TODO: Replace with actual API endpoint once backend is ready
      // Example: const response = await fetch('/api/profile/owner-dependency');
      // const data = await response.json();
      // setProfileData(data);

      // For now, return null (no profile data available)
      // This allows the tester to work standalone without backend integration
      generalLogger.debug('[useProfileData] Profile data fetch not yet implemented')
      setProfileData(null)
    } catch (err) {
      generalLogger.error('[useProfileData] Error fetching profile', { error: err })
      setError(err as Error)
      setProfileData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return {
    profileData,
    loading,
    error,
    hasOwnerDependency: !!profileData?.owner_dependency_assessment,
    refetch: fetchProfile,
  }
}
