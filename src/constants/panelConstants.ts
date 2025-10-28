/**
 * Panel Resize Constants
 * Centralized configuration for panel width constraints and defaults
 */

export const PANEL_CONSTRAINTS = {
  MIN_WIDTH: 20, // Minimum panel width as percentage
  MAX_WIDTH: 50, // Maximum panel width as percentage (matches Ilara)
  DEFAULT_WIDTH: 35, // Default left panel width as percentage
} as const;

export const MOBILE_BREAKPOINT = 1024; // px - below this width, mobile layout is used

export const FALLBACK_CONTAINER_WIDTH = 100; // px - fallback when container width cannot be determined
