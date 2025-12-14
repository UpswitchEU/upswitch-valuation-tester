/**
 * Fullscreen Service
 *
 * Single Responsibility: Handle fullscreen modal operations
 * SOLID Principles: SRP - Only handles fullscreen state management
 *
 * @module services/toolbar/fullscreenService
 */

import { generalLogger } from '../../utils/logger'

/**
 * Service for managing fullscreen modal state
 * Note: Actual modal rendering is handled by FullScreenModal component
 * This service provides utilities for fullscreen operations
 */
export class FullscreenService {
  /**
   * Check if fullscreen mode is currently active
   *
   * @returns True if fullscreen is active
   */
  static isFullscreen(): boolean {
    if (typeof document === 'undefined') return false

    return !!(
      document.fullscreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).msFullscreenElement
    )
  }

  /**
   * Request browser fullscreen API (if needed for native fullscreen)
   * Note: This is separate from the modal fullscreen used in the app
   *
   * @param element - Element to make fullscreen
   * @returns Promise resolving when fullscreen is activated
   */
  static async requestFullscreen(element: HTMLElement): Promise<void> {
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen()
      } else if ((element as any).webkitRequestFullscreen) {
        await (element as any).webkitRequestFullscreen()
      } else if ((element as any).mozRequestFullScreen) {
        await (element as any).mozRequestFullScreen()
      } else if ((element as any).msRequestFullscreen) {
        await (element as any).msRequestFullscreen()
      } else {
        generalLogger.warn('Fullscreen API not supported')
      }
    } catch (error) {
      generalLogger.error('Failed to request fullscreen', { error })
      throw error
    }
  }

  /**
   * Exit browser fullscreen API
   *
   * @returns Promise resolving when fullscreen is exited
   */
  static async exitFullscreen(): Promise<void> {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen()
      }
    } catch (error) {
      generalLogger.error('Failed to exit fullscreen', { error })
      throw error
    }
  }

  /**
   * Toggle browser fullscreen API
   *
   * @param element - Element to toggle fullscreen
   * @returns Promise resolving when toggle completes
   */
  static async toggleFullscreen(element: HTMLElement): Promise<void> {
    if (this.isFullscreen()) {
      await this.exitFullscreen()
    } else {
      await this.requestFullscreen(element)
    }
  }
}
