import { useState, useEffect } from 'react';
import { businessDataService } from '../services/businessDataService';
import { chatLogger } from '../utils/logger';
// import type { BusinessProfileData } from '../types/business';

// Temporary interface until business types are defined
interface BusinessProfileData {
  user_id: string;
  company_name?: string;
  industry?: string;
  created_at: string;
  updated_at: string;
  // Add other properties as needed
}

export const useBusinessProfile = (userId?: string) => {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBusinessProfile = async () => {
      if (!userId) {
        chatLogger.debug('No user ID provided, skipping profile fetch');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        chatLogger.debug('Fetching business profile for instant valuation', { userId });
        const profileData = await businessDataService.fetchUserBusinessData(userId);
        
        if (profileData) {
          setBusinessProfile(profileData);
          chatLogger.info('Business profile loaded', { 
            profileData: {
              company_name: profileData.company_name,
              industry: profileData.industry,
              hasCompleteProfile: businessDataService.hasCompleteBusinessProfile(profileData)
            }
          });
        } else {
          chatLogger.info('No business profile found, starting fresh conversation');
        }
        
      } catch (error) {
        chatLogger.error('Error fetching business profile', { 
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        setError('Failed to load business profile. Starting fresh conversation.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBusinessProfile();
  }, [userId]);

  const hasCompleteProfile = businessProfile ? businessDataService.hasCompleteBusinessProfile(businessProfile) : false;
  const missingFields = businessProfile ? businessDataService.getMissingFields(businessProfile) : [];

  return { 
    businessProfile, 
    isLoading, 
    error, 
    hasCompleteProfile,
    missingFields
  };
};
