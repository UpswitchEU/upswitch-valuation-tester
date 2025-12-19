/**
 * Authentication Context (Legacy - Re-exported from Zustand-based AuthProvider)
 *
 * This file maintains backward compatibility by re-exporting from the new
 * Zustand-based AuthProvider implementation.
 * 
 * The new implementation uses Zustand store for state management, eliminating
 * race conditions and request deduplication complexity.
 * 
 * Migration: All components should continue using `useAuth` hook from this file.
 * The implementation now uses Zustand store internally for atomic updates.
 */

// Re-export everything from the new Zustand-based AuthProvider
export { AuthContext } from './AuthContextTypes'
export type { AuthContextType, BusinessCard, User } from './AuthContextTypes'
export { AuthProvider, useAuth } from './AuthProvider'

