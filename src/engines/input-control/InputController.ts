/**
 * InputController Engine - User Input Handling & Validation
 *
 * Single Responsibility: Handle user input validation, submission, and auto-send logic
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/input-control/InputController
 */

import { useCallback, useState, useRef, useEffect } from 'react';
import { chatLogger } from '../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface InputValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  sanitizedInput?: string;
}

export interface InputConfig {
  minLength?: number;
  maxLength?: number;
  allowEmpty?: boolean;
  trimWhitespace?: boolean;
  validateRealTime?: boolean;
  debounceMs?: number;
  customValidators?: InputValidator[];
}

export interface InputState {
  value: string;
  isValid: boolean;
  isSubmitting: boolean;
  validation: InputValidation;
  lastSubmitted?: string;
  submitCount: number;
}

export interface InputController {
  // State
  getState(): InputState;

  // Input handling
  setValue(value: string): void;
  clearInput(): void;

  // Validation
  validate(input?: string): InputValidation;

  // Submission
  submit(): Promise<boolean>;
  canSubmit(): boolean;

  // Auto-send
  enableAutoSend(message: string): void;
  disableAutoSend(): void;
  isAutoSendEnabled(): boolean;
}

export type InputValidator = (input: string) => InputValidation;

// ============================================================================
// BUILT-IN VALIDATORS
// ============================================================================

export const createLengthValidator = (min: number = 1, max: number = 1000): InputValidator => {
  return (input: string): InputValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (input.length < min) {
      errors.push(`Input must be at least ${min} characters long`);
    }

    if (input.length > max) {
      errors.push(`Input must be at most ${max} characters long`);
    }

    if (input.length > max * 0.8) {
      warnings.push(`Input is getting long (${input.length}/${max} characters)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };
};

export const createContentValidator = (): InputValidator => {
  return (input: string): InputValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for potentially harmful content
    const harmfulPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
    ];

    for (const pattern of harmfulPatterns) {
      if (pattern.test(input)) {
        errors.push('Input contains potentially harmful content');
        break;
      }
    }

    // Check for excessive repetition
    const words = input.toLowerCase().split(/\s+/);
    const wordCounts = words.reduce((acc, word) => {
      if (word.length > 3) { // Only count meaningful words
        acc[word] = (acc[word] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    const maxRepetitions = Math.max(...Object.values(wordCounts));
    if (maxRepetitions > 5) {
      warnings.push('Input contains excessive word repetition');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };
};

export const createSpamValidator = (): InputValidator => {
  return (input: string): InputValidation => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for spam patterns
    const spamPatterns = [
      /(\w+)\s*\1\s*\1/, // Triple word repetition
      /(.{10,})\s*\1/, // Long phrase repetition
      /[A-Z]{10,}/, // Excessive caps
    ];

    for (const pattern of spamPatterns) {
      if (pattern.test(input)) {
        warnings.push('Input may contain spam-like content');
        break;
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  };
};

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class InputControllerImpl implements InputController {
  private state: InputState;
  private config: InputConfig;
  private validators: InputValidator[];
  private onSubmit?: (input: string) => Promise<void>;
  private autoSendEnabled: boolean = false;
  private autoSendMessage: string = '';
  private listeners: Set<(state: InputState) => void> = new Set();

  constructor(
    config: InputConfig = {},
    validators: InputValidator[] = [],
    onSubmit?: (input: string) => Promise<void>
  ) {
    this.config = {
      minLength: 1,
      maxLength: 1000,
      allowEmpty: false,
      trimWhitespace: true,
      validateRealTime: true,
      debounceMs: 300,
      ...config,
    };

    this.validators = [
      createLengthValidator(this.config.minLength, this.config.maxLength),
      createContentValidator(),
      createSpamValidator(),
      ...validators,
    ];

    this.onSubmit = onSubmit;

    this.state = {
      value: '',
      isValid: false,
      isSubmitting: false,
      validation: { isValid: false, errors: [], warnings: [] },
      submitCount: 0,
    };
  }

  // State Management
  getState(): InputState {
    return { ...this.state };
  }

  private updateState(updates: Partial<InputState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  onStateChange(listener: (state: InputState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Input Handling
  setValue(value: string): void {
    let processedValue = value;

    // Trim whitespace if configured
    if (this.config.trimWhitespace) {
      processedValue = processedValue.trim();
    }

    // Limit length
    if (this.config.maxLength && processedValue.length > this.config.maxLength) {
      processedValue = processedValue.substring(0, this.config.maxLength);
    }

    const validation = this.validate(processedValue);

    this.updateState({
      value: processedValue,
      isValid: validation.isValid,
      validation,
    });

    chatLogger.debug('[InputController] Value updated', {
      length: processedValue.length,
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
    });
  }

  clearInput(): void {
    this.updateState({
      value: '',
      isValid: false,
      validation: { isValid: false, errors: [], warnings: [] },
    });
  }

  // Validation
  validate(input?: string): InputValidation {
    const valueToValidate = input !== undefined ? input : this.state.value;

    // Early return for empty input
    if (!valueToValidate && !this.config.allowEmpty) {
      return {
        isValid: false,
        errors: ['Input cannot be empty'],
        warnings: [],
      };
    }

    // Run all validators
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    for (const validator of this.validators) {
      const result = validator(valueToValidate);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings,
      sanitizedInput: valueToValidate,
    };
  }

  // Submission
  async submit(): Promise<boolean> {
    if (!this.canSubmit()) {
      chatLogger.warn('[InputController] Cannot submit: validation failed or already submitting');
      return false;
    }

    this.updateState({ isSubmitting: true });

    try {
      const inputToSubmit = this.state.value;

      if (this.onSubmit) {
        await this.onSubmit(inputToSubmit);
      }

      this.updateState({
        isSubmitting: false,
        lastSubmitted: inputToSubmit,
        submitCount: this.state.submitCount + 1,
      });

      // Clear input after successful submission
      this.clearInput();

      chatLogger.info('[InputController] Input submitted successfully', {
        length: inputToSubmit.length,
        submitCount: this.state.submitCount + 1,
      });

      return true;
    } catch (error) {
      this.updateState({ isSubmitting: false });

      chatLogger.error('[InputController] Submission failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      return false;
    }
  }

  canSubmit(): boolean {
    return (
      this.state.isValid &&
      !this.state.isSubmitting &&
      (this.state.value.length > 0 || this.config.allowEmpty)
    );
  }

  // Auto-send
  enableAutoSend(message: string): void {
    this.autoSendEnabled = true;
    this.autoSendMessage = message;

    chatLogger.info('[InputController] Auto-send enabled', {
      messageLength: message.length,
    });
  }

  disableAutoSend(): void {
    this.autoSendEnabled = false;
    this.autoSendMessage = '';

    chatLogger.info('[InputController] Auto-send disabled');
  }

  isAutoSendEnabled(): boolean {
    return this.autoSendEnabled;
  }

  getAutoSendMessage(): string {
    return this.autoSendMessage;
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseInputControllerResult {
  controller: InputController;
  state: InputState;
  actions: {
    setValue: (value: string) => void;
    clearInput: () => void;
    validate: (input?: string) => InputValidation;
    submit: () => Promise<boolean>;
    enableAutoSend: (message: string) => void;
    disableAutoSend: () => void;
  };
  helpers: {
    canSubmit: boolean;
    hasErrors: boolean;
    hasWarnings: boolean;
    isAutoSendEnabled: boolean;
  };
}

/**
 * useInputController Hook
 *
 * React hook interface for InputController engine
 * Provides reactive input handling and validation
 */
export const useInputController = (
  config?: InputConfig,
  validators?: InputValidator[],
  onSubmit?: (input: string) => Promise<void>
): UseInputControllerResult => {
  const [controller] = useState(() =>
    new InputControllerImpl(config, validators, onSubmit)
  );
  const [state, setState] = useState<InputState>(controller.getState());

  // Subscribe to state changes
  useEffect(() => {
    const unsubscribe = controller.onStateChange(setState);
    return unsubscribe;
  }, [controller]);

  // Actions
  const actions = {
    setValue: useCallback((value: string) => controller.setValue(value), [controller]),
    clearInput: useCallback(() => controller.clearInput(), [controller]),
    validate: useCallback((input?: string) => controller.validate(input), [controller]),
    submit: useCallback(() => controller.submit(), [controller]),
    enableAutoSend: useCallback((message: string) => controller.enableAutoSend(message), [controller]),
    disableAutoSend: useCallback(() => controller.disableAutoSend(), [controller]),
  };

  // Helpers
  const helpers = {
    canSubmit: controller.canSubmit(),
    hasErrors: state.validation.errors.length > 0,
    hasWarnings: state.validation.warnings.length > 0,
    isAutoSendEnabled: controller.isAutoSendEnabled(),
  };

  return {
    controller,
    state,
    actions,
    helpers,
  };
};
