/**
 * useConversationActions Hook
 *
 * Provides action creators and business logic for conversational valuation.
 * Acts as a facade over the raw dispatch calls with business logic.
 */

import { useCallback } from 'react';
import { Message } from '../../../hooks/useStreamingChatState';
import { ValuationResponse } from '../../../types/valuation';
import { useConversationDispatch } from '../context/ConversationContext';

interface UseConversationActionsReturn {
  // Session actions
  setSessionId: (sessionId: string) => void;
  setPythonSessionId: (pythonSessionId: string | null) => void;
  setRestored: (isRestored: boolean) => void;

  // Conversation actions
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: string | null) => void;
  addMessage: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  clearMessages: () => void;

  // Valuation actions
  setValuationResult: (result: ValuationResponse | null) => void;
  setGenerating: (generating: boolean) => void;

  // Business profile actions
  setBusinessProfile: (profile: any) => void;
  setProfileLoading: (loading: boolean) => void;

  // UI actions
  setActiveTab: (tab: 'preview' | 'source' | 'info') => void;
  setFullScreen: (fullScreen: boolean) => void;
  setRegenerationWarning: (show: boolean) => void;
  setPendingResult: (result: ValuationResponse | null) => void;

  // Complex actions (business logic)
  initializeSession: (sessionId: string, pythonSessionId?: string | null, isRestored?: boolean) => void;
  startConversation: (businessProfile: any) => void;
  completeValuation: (result: ValuationResponse) => void;
  resetConversation: () => void;
}

/**
 * Hook providing action creators for conversational valuation
 *
 * Encapsulates business logic and provides a clean API for components.
 */
export function useConversationActions(): UseConversationActionsReturn {
  const dispatch = useConversationDispatch();

  // Basic actions (direct dispatch)
  const setSessionId = useCallback((sessionId: string) => {
    dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
  }, [dispatch]);

  const setPythonSessionId = useCallback((pythonSessionId: string | null) => {
    dispatch({ type: 'SET_PYTHON_SESSION_ID', payload: pythonSessionId });
  }, [dispatch]);

  const setRestored = useCallback((isRestored: boolean) => {
    dispatch({ type: 'SET_RESTORED', payload: isRestored });
  }, [dispatch]);

  const setLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, [dispatch]);

  const setInitialized = useCallback((initialized: boolean) => {
    dispatch({ type: 'SET_INITIALIZED', payload: initialized });
  }, [dispatch]);

  const setError = useCallback((error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, [dispatch]);

  const addMessage = useCallback((message: Message) => {
    dispatch({ type: 'ADD_MESSAGE', payload: message });
  }, [dispatch]);

  const setMessages = useCallback((messages: Message[]) => {
    dispatch({ type: 'SET_MESSAGES', payload: messages });
  }, [dispatch]);

  const clearMessages = useCallback(() => {
    dispatch({ type: 'CLEAR_MESSAGES' });
  }, [dispatch]);

  const setValuationResult = useCallback((result: ValuationResponse | null) => {
    dispatch({ type: 'SET_VALUATION_RESULT', payload: result });
  }, [dispatch]);

  const setGenerating = useCallback((generating: boolean) => {
    dispatch({ type: 'SET_GENERATING', payload: generating });
  }, [dispatch]);

  const setBusinessProfile = useCallback((profile: any) => {
    dispatch({ type: 'SET_BUSINESS_PROFILE', payload: profile });
  }, [dispatch]);

  const setProfileLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_PROFILE_LOADING', payload: loading });
  }, [dispatch]);

  const setActiveTab = useCallback((tab: 'preview' | 'source' | 'info') => {
    dispatch({ type: 'SET_ACTIVE_TAB', payload: tab });
  }, [dispatch]);

  const setFullScreen = useCallback((fullScreen: boolean) => {
    dispatch({ type: 'SET_FULLSCREEN', payload: fullScreen });
  }, [dispatch]);

  const setRegenerationWarning = useCallback((show: boolean) => {
    dispatch({ type: 'SET_REGENERATION_WARNING', payload: show });
  }, [dispatch]);

  const setPendingResult = useCallback((result: ValuationResponse | null) => {
    dispatch({ type: 'SET_PENDING_RESULT', payload: result });
  }, [dispatch]);

  // Complex actions (business logic)
  const initializeSession = useCallback((
    sessionId: string,
    pythonSessionId?: string | null,
    isRestored?: boolean
  ) => {
    dispatch({ type: 'SET_SESSION_ID', payload: sessionId });
    if (pythonSessionId !== undefined) {
      dispatch({ type: 'SET_PYTHON_SESSION_ID', payload: pythonSessionId });
    }
    if (isRestored !== undefined) {
      dispatch({ type: 'SET_RESTORED', payload: isRestored });
    }
    dispatch({ type: 'SET_LOADING', payload: true });
  }, [dispatch]);

  const startConversation = useCallback((businessProfile: any) => {
    dispatch({ type: 'SET_BUSINESS_PROFILE', payload: businessProfile });
    dispatch({ type: 'SET_LOADING', payload: false });
    dispatch({ type: 'SET_INITIALIZED', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });
  }, [dispatch]);

  const completeValuation = useCallback((result: ValuationResponse) => {
    dispatch({ type: 'SET_VALUATION_RESULT', payload: result });
    dispatch({ type: 'SET_GENERATING', payload: false });
    dispatch({ type: 'SET_LOADING', payload: false });
  }, [dispatch]);

  const resetConversation = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, [dispatch]);

  return {
    // Basic actions
    setSessionId,
    setPythonSessionId,
    setRestored,
    setLoading,
    setInitialized,
    setError,
    addMessage,
    setMessages,
    clearMessages,
    setValuationResult,
    setGenerating,
    setBusinessProfile,
    setProfileLoading,
    setActiveTab,
    setFullScreen,
    setRegenerationWarning,
    setPendingResult,

    // Complex actions
    initializeSession,
    startConversation,
    completeValuation,
    resetConversation,
  };
}
