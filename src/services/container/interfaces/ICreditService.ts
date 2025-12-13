/**
 * ICreditService Interface - Credit Management Abstraction
 *
 * Defines the contract for credit checking and management.
 * Components depend on this interface, not concrete implementations.
 */

export interface ICreditService {
  hasCredits(userId?: string): Promise<boolean>;
  consumeCredit(userId?: string, amount?: number): Promise<boolean>;
  getCreditBalance(userId?: string): Promise<number>;
  addCredits(userId: string, amount: number): Promise<void>;
}