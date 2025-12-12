/**
 * BusinessProfileSection Component
 *
 * Displays business profile information and manages profile-related state.
 * Single Responsibility: Business profile display and management.
 *
 * @module features/conversational-valuation/components/BusinessProfileSection
 */

import { Building2 } from 'lucide-react';
import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { businessDataService, type BusinessProfileData } from '../../../services/businessDataService';
import { chatLogger } from '../../../utils/logger';
import { useConversationActions } from '../hooks/useConversationActions';

interface BusinessProfileSectionProps {
  showPreConversationSummary: boolean;
  onTogglePreConversationSummary: () => void;
}

/**
 * Business Profile Section Component
 *
 * Handles business profile fetching, display, and pre-conversation summary.
 * Follows SRP - only responsible for business profile concerns.
 */
export const BusinessProfileSection: React.FC<BusinessProfileSectionProps> = React.memo(({
  showPreConversationSummary,
  onTogglePreConversationSummary,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { startConversation, setBusinessProfile, setProfileLoading } = useConversationActions();

  const [businessProfile, setLocalBusinessProfile] = useState<BusinessProfileData | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Fetch business profile data
  useEffect(() => {
    const fetchBusinessProfile = async () => {
      try {
        setIsLoadingProfile(true);
        setProfileError(null);

        // Check if user is authenticated
        if (!isAuthenticated || !user?.id) {
          chatLogger.info('No authenticated user, skipping profile fetch');
          setIsLoadingProfile(false);
          return;
        }

        const userId = user.id;

        chatLogger.debug('Fetching business profile for instant valuation');
        const profileData = await businessDataService.fetchUserBusinessData(userId);

        if (profileData) {
          setLocalBusinessProfile(profileData);
          setBusinessProfile(profileData); // Sync to global state
          chatLogger.info('Business profile loaded', { profileData });

          // Automatically start intelligent conversation with pre-filled data
          startIntelligentConversation(profileData);
        } else {
          chatLogger.info('No business profile found, starting fresh conversation');
          // For fresh conversations (guest users), start the conversation automatically
          startConversation(null);
        }

      } catch (error) {
        chatLogger.error('Error fetching business profile', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        setProfileError('Failed to load business profile. Starting fresh conversation.');
      } finally {
        setIsLoadingProfile(false);
        setProfileLoading(false);
      }
    };

    fetchBusinessProfile();
  }, [isAuthenticated, user?.id, setBusinessProfile, setProfileLoading, startConversation]);

  // Start intelligent conversation with pre-filled data
  const startIntelligentConversation = useCallback(async (profileData: BusinessProfileData) => {
    try {
      chatLogger.info('Starting intelligent conversation with pre-filled data');

      // Transform business data to conversation request
      const conversationRequest = businessDataService.transformToConversationStartRequest(profileData, {
        time_commitment: 'detailed',
        focus_area: 'all'
      });

      // Add user_id for intelligent triage
      if (user?.id) {
        conversationRequest.user_id = user.id;
        chatLogger.info('Added user_id for intelligent triage', { userId: user.id });
      }

      // Start conversation with valuation engine
      const { api } = await import('../../../services/api');
      const response = await api.startConversation(conversationRequest);

      chatLogger.info('Intelligent conversation started', { response });

      // If we have financial data from KBO lookup, go to results
      if (response.valuation_result) {
        // Update global state with valuation result
        // This will be handled by the conversation orchestrator
      } else {
        // Start with conversational data collection
        startConversation(profileData);
      }

    } catch (error) {
      chatLogger.error('Error starting intelligent conversation', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      setProfileError('Failed to start intelligent conversation. Using manual flow.');
      startConversation(null);
    }
  }, [user?.id, startConversation]);

  // Don't render anything if no profile and not loading
  if (!businessProfile && !isLoadingProfile && !profileError) {
    return null;
  }

  return (
    <>
      {/* Business Profile Summary */}
      {businessProfile && !isLoadingProfile && (
        <div className="border-b border-zinc-800 bg-zinc-900/30 px-3 sm:px-4 md:px-6 py-3 mx-4">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary-400 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-medium text-white truncate">
                {businessProfile.company_name || 'Your Business'}
              </h3>
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                {businessProfile.industry && (
                  <span className="bg-zinc-800 px-2 py-1 rounded">{businessProfile.industry}</span>
                )}
                {businessProfile.business_type && (
                  <span className="bg-zinc-800 px-2 py-1 rounded">{businessProfile.business_type}</span>
                )}
                {businessProfile.revenue_range && (
                  <span className="bg-zinc-800 px-2 py-1 rounded">{businessProfile.revenue_range}</span>
                )}
              </div>
            </div>
            <div className="text-xs text-zinc-500">
              {businessDataService.getDataCompleteness(businessProfile)}% complete
            </div>
          </div>
        </div>
      )}

      {/* Pre-Conversation Summary */}
      {showPreConversationSummary && businessProfile && (
        <div className="mx-4 mb-4">
          <div className="bg-primary-900/20 border border-primary-700/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary-400 text-sm">🧠</span>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-primary-300 mb-2">Intelligent Triage Active</h3>
                <p className="text-sm text-primary-200 mb-3">
                  We found your business profile! We'll skip the questions we already know and only ask for missing information.
                </p>

                  {(() => {
                     const analysis = useMemo(() =>
                       businessDataService.getFieldAnalysis(businessProfile),
                       [businessProfile]
                     );

                     return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-primary-300">Data completeness:</span>
                        <span className="font-semibold text-primary-200">{analysis.completeness}%</span>
                        <div className="flex-1 bg-zinc-700 rounded-full h-2">
                          <div
                            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${analysis.completeness}%` }}
                          />
                        </div>
                      </div>

                      <div className="text-sm text-primary-200">
                        <span className="text-primary-300">Estimated time:</span> {analysis.estimatedTime} minutes
                      </div>

                      {analysis.complete.length > 0 && (
                        <div className="text-sm">
                          <span className="text-primary-300">We already know:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {analysis.complete.map(field => (
                              <span key={field} className="bg-primary-800/50 px-2 py-1 rounded text-xs">
                                {field.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {analysis.priority.length > 0 && (
                        <div className="text-sm">
                          <span className="text-primary-300">We need to ask about:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {analysis.priority.map(field => (
                              <span key={field} className="bg-accent-800/50 px-2 py-1 rounded text-xs">
                                {field.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2 pt-2">
                        <button
                          onClick={() => {
                            onTogglePreConversationSummary();
                            startIntelligentConversation(businessProfile);
                          }}
                          className="px-4 py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Start Smart Conversation
                        </button>
                        <button
                          onClick={() => {
                            onTogglePreConversationSummary();
                            startConversation(null);
                          }}
                          className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-sm font-medium transition-colors"
                        >
                          Start Fresh
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {profileError && (
        <div className="border-b border-rust-700 bg-rust-500/20 px-3 sm:px-4 md:px-6 py-3 mx-4">
          <div className="flex items-center gap-2 text-sm text-rust-300">
            <span>⚠️</span>
            <span>{profileError}</span>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoadingProfile && (
        <div className="flex items-center justify-center h-32 mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto mb-4"></div>
            <p className="text-zinc-400 text-sm">Loading your business profile...</p>
          </div>
        </div>
      )}
    </>
  );
});

BusinessProfileSection.displayName = 'BusinessProfileSection';
