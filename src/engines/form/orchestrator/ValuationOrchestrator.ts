/**
 * ValuationOrchestrator Engine - Valuation Request Coordination
 *
 * Single Responsibility: Orchestrate valuation requests, handle regeneration warnings, coordinate with backend
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/form/orchestrator/ValuationOrchestrator
 */

import { useCallback, useState } from 'react';
import type { ValuationRequest, ValuationResponse } from '../../../types/valuation';
import { generalLogger } from '../../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface OrchestratorConfig {
  enableRegenerationWarning?: boolean;
  autoSaveToSession?: boolean;
  enableQuickValuation?: boolean;
  debounceMs?: number;
}

export interface ValuationState {
  isCalculating: boolean;
  isQuickValuing: boolean;
  error: string | null;
  lastRequest: ValuationRequest | null;
  lastResponse: ValuationResponse | null;
  regenerationWarning: {
    show: boolean;
    confirmed: boolean;
    lastValuation: ValuationResponse | null;
  };
}

export interface ValuationOrchestrator {
  // State
  getState(): ValuationState;

  // Valuation operations
  calculateValuation(request: ValuationRequest): Promise<ValuationResponse>;
  quickValuate(request: ValuationRequest): Promise<ValuationResponse>;
  regenerateValuation(request: ValuationRequest): Promise<ValuationResponse>;

  // Regeneration warning management
  showRegenerationWarning(lastValuation: ValuationResponse): void;
  confirmRegeneration(): void;
  cancelRegeneration(): void;
  isRegenerationConfirmed(): boolean;

  // State queries
  isCalculating(): boolean;
  hasError(): boolean;
  getLastResult(): ValuationResponse | null;

  // Callbacks
  onValuationStart?: () => void;
  onValuationComplete?: (result: ValuationResponse) => void;
  onValuationError?: (error: string) => void;
  onRegenerationWarning?: (lastValuation: ValuationResponse) => void;
}

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class ValuationOrchestratorImpl implements ValuationOrchestrator {
  private state: ValuationState;
  private config: OrchestratorConfig;
  private valuationService: {
    calculateValuation: (request: ValuationRequest) => Promise<ValuationResponse>;
    quickValuate?: (request: ValuationRequest) => Promise<ValuationResponse>;
  };

  // Callbacks
  onValuationStart?: () => void;
  onValuationComplete?: (result: ValuationResponse) => void;
  onValuationError?: (error: string) => void;
  onRegenerationWarning?: (lastValuation: ValuationResponse) => void;

  constructor(
    valuationService: {
      calculateValuation: (request: ValuationRequest) => Promise<ValuationResponse>;
      quickValuate?: (request: ValuationRequest) => Promise<ValuationResponse>;
    },
    config: OrchestratorConfig = {}
  ) {
    this.valuationService = valuationService;
    this.config = {
      enableRegenerationWarning: true,
      autoSaveToSession: true,
      enableQuickValuation: true,
      debounceMs: 300,
      ...config,
    };

    this.state = {
      isCalculating: false,
      isQuickValuing: false,
      error: null,
      lastRequest: null,
      lastResponse: null,
      regenerationWarning: {
        show: false,
        confirmed: false,
        lastValuation: null,
      },
    };
  }

  // State Management
  getState(): ValuationState {
    return { ...this.state };
  }

  private updateState(updates: Partial<ValuationState>): void {
    this.state = { ...this.state, ...updates };
  }

  // Valuation Operations
  async calculateValuation(request: ValuationRequest): Promise<ValuationResponse> {
    // Check if regeneration warning is needed
    if (this.config.enableRegenerationWarning && this.state.lastResponse) {
      this.showRegenerationWarning(this.state.lastResponse);
      throw new Error('REGENERATION_WARNING_REQUIRED');
    }

    return this.performValuation(request, false);
  }

  async quickValuate(request: ValuationRequest): Promise<ValuationResponse> {
    if (!this.config.enableQuickValuation || !this.valuationService.quickValuate) {
      throw new Error('Quick valuation not enabled or supported');
    }

    return this.performValuation(request, true);
  }

  async regenerateValuation(request: ValuationRequest): Promise<ValuationResponse> {
    if (!this.state.regenerationWarning.confirmed) {
      throw new Error('Regeneration not confirmed');
    }

    // Reset regeneration state
    this.updateState({
      regenerationWarning: {
        show: false,
        confirmed: false,
        lastValuation: null,
      },
    });

    return this.performValuation(request, false);
  }

  private async performValuation(request: ValuationRequest, isQuick: boolean): Promise<ValuationResponse> {
    const operation = isQuick ? 'quickValuate' : 'calculateValuation';

    this.updateState({
      isCalculating: !isQuick,
      isQuickValuing: isQuick,
      error: null,
      lastRequest: request,
    });

    // Notify start
    this.onValuationStart?.();

    generalLogger.info('[ValuationOrchestrator] Starting valuation', {
      operation,
      companyName: request.company_name,
      businessType: request.business_type,
    });

    try {
      const response = isQuick
        ? await this.valuationService.quickValuate!(request)
        : await this.valuationService.calculateValuation(request);

      this.updateState({
        isCalculating: false,
        isQuickValuing: false,
        lastResponse: response,
      });

      generalLogger.info('[ValuationOrchestrator] Valuation completed successfully', {
        operation,
        valuationId: response.valuation_id,
        equityValue: response.equity_value_mid,
      });

      // Notify completion
      this.onValuationComplete?.(response);

      return response;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown valuation error';

      this.updateState({
        isCalculating: false,
        isQuickValuing: false,
        error: errorMessage,
      });

      generalLogger.error('[ValuationOrchestrator] Valuation failed', {
        operation,
        error: errorMessage,
        companyName: request.company_name,
      });

      // Notify error
      this.onValuationError?.(errorMessage);

      throw error;
    }
  }

  // Regeneration Warning Management
  showRegenerationWarning(lastValuation: ValuationResponse): void {
    this.updateState({
      regenerationWarning: {
        show: true,
        confirmed: false,
        lastValuation,
      },
    });

    generalLogger.info('[ValuationOrchestrator] Showing regeneration warning', {
      lastValuationId: lastValuation.valuation_id,
      lastValuationDate: lastValuation.created_at,
    });

    this.onRegenerationWarning?.(lastValuation);
  }

  confirmRegeneration(): void {
    this.updateState({
      regenerationWarning: {
        ...this.state.regenerationWarning,
        confirmed: true,
      },
    });

    generalLogger.info('[ValuationOrchestrator] Regeneration confirmed');
  }

  cancelRegeneration(): void {
    this.updateState({
      regenerationWarning: {
        show: false,
        confirmed: false,
        lastValuation: null,
      },
    });

    generalLogger.info('[ValuationOrchestrator] Regeneration cancelled');
  }

  isRegenerationConfirmed(): boolean {
    return this.state.regenerationWarning.confirmed;
  }

  // State Queries
  isCalculating(): boolean {
    return this.state.isCalculating || this.state.isQuickValuing;
  }

  hasError(): boolean {
    return this.state.error !== null;
  }

  getLastResult(): ValuationResponse | null {
    return this.state.lastResponse;
  }

  // Configuration
  updateConfig(newConfig: Partial<OrchestratorConfig>): void {
    this.config = { ...this.config, ...newConfig };

    generalLogger.debug('[ValuationOrchestrator] Configuration updated', {
      newConfig,
    });
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseValuationOrchestratorResult {
  orchestrator: ValuationOrchestrator;
  state: ValuationState;
  actions: {
    calculateValuation: (request: ValuationRequest) => Promise<ValuationResponse>;
    quickValuate: (request: ValuationRequest) => Promise<ValuationResponse>;
    regenerateValuation: (request: ValuationRequest) => Promise<ValuationResponse>;
    showRegenerationWarning: (lastValuation: ValuationResponse) => void;
    confirmRegeneration: () => void;
    cancelRegeneration: () => void;
  };
  helpers: {
    canCalculate: boolean;
    canQuickValuate: boolean;
    canRegenerate: boolean;
    isCalculating: boolean;
    hasError: boolean;
    hasLastResult: boolean;
    regenerationWarningVisible: boolean;
  };
}

/**
 * useValuationOrchestrator Hook
 *
 * React hook interface for ValuationOrchestrator engine
 * Provides reactive valuation orchestration
 */
export const useValuationOrchestrator = (
  valuationService: {
    calculateValuation: (request: ValuationRequest) => Promise<ValuationResponse>;
    quickValuate?: (request: ValuationRequest) => Promise<ValuationResponse>;
  },
  config?: OrchestratorConfig
): UseValuationOrchestratorResult => {
  const [orchestrator] = useState(() => new ValuationOrchestratorImpl(valuationService, config));
  const [state, setState] = useState<ValuationState>(orchestrator.getState());

  // Subscribe to state changes (simplified - in real implementation would need proper subscription)
  const updateState = useCallback(() => {
    setState(orchestrator.getState());
  }, [orchestrator]);

  const actions = {
    calculateValuation: useCallback(async (request: ValuationRequest) => {
      try {
        return await orchestrator.calculateValuation(request);
      } finally {
        updateState();
      }
    }, [orchestrator, updateState]),

    quickValuate: useCallback(async (request: ValuationRequest) => {
      try {
        return await orchestrator.quickValuate(request);
      } finally {
        updateState();
      }
    }, [orchestrator, updateState]),

    regenerateValuation: useCallback(async (request: ValuationRequest) => {
      try {
        return await orchestrator.regenerateValuation(request);
      } finally {
        updateState();
      }
    }, [orchestrator, updateState]),

    showRegenerationWarning: useCallback((lastValuation: ValuationResponse) => {
      orchestrator.showRegenerationWarning(lastValuation);
      updateState();
    }, [orchestrator, updateState]),

    confirmRegeneration: useCallback(() => {
      orchestrator.confirmRegeneration();
      updateState();
    }, [orchestrator, updateState]),

    cancelRegeneration: useCallback(() => {
      orchestrator.cancelRegeneration();
      updateState();
    }, [orchestrator, updateState]),
  };

  const helpers = {
    canCalculate: !orchestrator.isCalculating() && !state.regenerationWarning.show,
    canQuickValuate: config?.enableQuickValuation && !orchestrator.isCalculating(),
    canRegenerate: state.regenerationWarning.confirmed,
    isCalculating: orchestrator.isCalculating(),
    hasError: orchestrator.hasError(),
    hasLastResult: orchestrator.getLastResult() !== null,
    regenerationWarningVisible: state.regenerationWarning.show,
  };

  return {
    orchestrator,
    state,
    actions,
    helpers,
  };
};
