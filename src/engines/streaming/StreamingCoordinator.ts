/**
 * StreamingCoordinator Engine - Real-time Connection Management
 *
 * Single Responsibility: Manage WebSocket/SSE connections and coordinate streaming events
 * SOLID Principles: SRP, OCP, LSP, ISP, DIP
 *
 * @module engines/streaming/StreamingCoordinator
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { chatLogger } from '../../utils/logger';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface StreamingConfig {
  url: string;
  sessionId: string;
  userId?: string;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  heartbeatInterval?: number;
  connectionTimeout?: number;
}

export interface StreamingEvent {
  type: string;
  data: any;
  timestamp: number;
  sequenceId?: number;
}

export interface ConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  lastConnectedAt?: Date;
  lastDisconnectedAt?: Date;
  reconnectAttempts: number;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  latency?: number;
}

export interface StreamingCoordinator {
  // Connection management
  connect(config: StreamingConfig): Promise<void>;
  disconnect(): Promise<void>;
  reconnect(): Promise<void>;

  // Message handling
  send(data: any): Promise<void>;

  // Event handling
  onEvent(type: string, callback: (event: StreamingEvent) => void): () => void;
  emitEvent(type: string, data: any): void;

  // State queries
  getConnectionState(): ConnectionState;
  isConnected(): boolean;
  getLatency(): number | undefined;

  // Diagnostics
  getConnectionStats(): {
    totalMessages: number;
    totalEvents: number;
    averageLatency: number;
    uptime: number;
    connectionDrops: number;
  };
}

export type MessageCallback = (event: StreamingEvent) => void;

// ============================================================================
// IMPLEMENTATION
// ============================================================================

export class StreamingCoordinatorImpl implements StreamingCoordinator {
  private config: StreamingConfig | null = null;
  private connection: WebSocket | EventSource | null = null;
  private connectionState: ConnectionState = {
    isConnected: false,
    isConnecting: false,
    reconnectAttempts: 0,
    connectionQuality: 'disconnected',
  };
  private eventListeners: Map<string, Set<MessageCallback>> = new Map();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastHeartbeat: number = 0;
  private connectionStats = {
    totalMessages: 0,
    totalEvents: 0,
    latencies: [] as number[],
    startTime: Date.now(),
    connectionDrops: 0,
  };

  // Connection management
  async connect(config: StreamingConfig): Promise<void> {
    if (this.connectionState.isConnected || this.connectionState.isConnecting) {
      chatLogger.warn('[StreamingCoordinator] Already connected or connecting');
      return;
    }

    this.config = config;
    this.connectionState.isConnecting = true;
    this.updateConnectionState({ isConnecting: true });

    try {
      // Determine connection type (WebSocket vs SSE)
      const useWebSocket = this.shouldUseWebSocket(config.url);

      if (useWebSocket) {
        await this.connectWebSocket(config);
      } else {
        await this.connectSSE(config);
      }

      this.connectionState.lastConnectedAt = new Date();
      this.updateConnectionState({
        isConnected: true,
        isConnecting: false,
        reconnectAttempts: 0,
        connectionQuality: 'excellent',
      });

      this.startHeartbeat();
      this.emitEvent('connected', { config });

      chatLogger.info('[StreamingCoordinator] Connected successfully', {
        type: useWebSocket ? 'websocket' : 'sse',
        sessionId: config.sessionId,
      });

    } catch (error) {
      this.connectionState.isConnecting = false;
      this.updateConnectionState({
        isConnected: false,
        isConnecting: false,
        lastDisconnectedAt: new Date(),
      });

      chatLogger.error('[StreamingCoordinator] Connection failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        sessionId: config.sessionId,
      });

      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connection) {
      return;
    }

    chatLogger.info('[StreamingCoordinator] Disconnecting');

    this.stopHeartbeat();

    if (this.connection instanceof WebSocket) {
      this.connection.close(1000, 'Client disconnect');
    } else if (this.connection instanceof EventSource) {
      this.connection.close();
    }

    this.connection = null;
    this.connectionState.lastDisconnectedAt = new Date();

    this.updateConnectionState({
      isConnected: false,
      isConnecting: false,
      connectionQuality: 'disconnected',
    });

    this.emitEvent('disconnected', { reason: 'client_disconnect' });
  }

  async reconnect(): Promise<void> {
    if (!this.config) {
      throw new Error('No connection configuration available for reconnection');
    }

    this.connectionState.reconnectAttempts++;

    chatLogger.info('[StreamingCoordinator] Attempting reconnection', {
      attempt: this.connectionState.reconnectAttempts,
      sessionId: this.config.sessionId,
    });

    await this.disconnect();
    await new Promise(resolve =>
      setTimeout(resolve, (this.config.reconnectDelay || 1000) * this.connectionState.reconnectAttempts)
    );
    await this.connect(this.config);
  }

  // Message handling
  async send(data: any): Promise<void> {
    if (!this.connection || !this.connectionState.isConnected) {
      throw new Error('Not connected');
    }

    if (this.connection instanceof WebSocket) {
      this.connection.send(JSON.stringify(data));
    } else {
      // For SSE, we might need to use a separate HTTP endpoint
      chatLogger.warn('[StreamingCoordinator] Send not supported for SSE connections');
      return;
    }

    this.connectionStats.totalMessages++;

    chatLogger.debug('[StreamingCoordinator] Message sent', {
      dataType: typeof data,
      totalMessages: this.connectionStats.totalMessages,
    });
  }

  // Event handling
  onEvent(type: string, callback: MessageCallback): () => void {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, new Set());
    }

    this.eventListeners.get(type)!.add(callback);

    return () => {
      const listeners = this.eventListeners.get(type);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this.eventListeners.delete(type);
        }
      }
    };
  }

  emitEvent(type: string, data: any): void {
    const event: StreamingEvent = {
      type,
      data,
      timestamp: Date.now(),
    };

    const listeners = this.eventListeners.get(type);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event);
        } catch (error) {
          chatLogger.error('[StreamingCoordinator] Event callback error', {
            type,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      });
    }

    this.connectionStats.totalEvents++;

    chatLogger.debug('[StreamingCoordinator] Event emitted', {
      type,
      totalEvents: this.connectionStats.totalEvents,
    });
  }

  // State queries
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  isConnected(): boolean {
    return this.connectionState.isConnected;
  }

  getLatency(): number | undefined {
    return this.connectionState.latency;
  }

  // Diagnostics
  getConnectionStats() {
    const averageLatency =
      this.connectionStats.latencies.length > 0
        ? this.connectionStats.latencies.reduce((a, b) => a + b, 0) / this.connectionStats.latencies.length
        : 0;

    return {
      totalMessages: this.connectionStats.totalMessages,
      totalEvents: this.connectionStats.totalEvents,
      averageLatency,
      uptime: this.connectionState.isConnected
        ? Date.now() - (this.connectionState.lastConnectedAt?.getTime() || Date.now())
        : 0,
      connectionDrops: this.connectionStats.connectionDrops,
    };
  }

  // Private methods
  private shouldUseWebSocket(url: string): boolean {
    // Use WebSocket for interactive connections, SSE for server-to-client only
    return url.startsWith('ws://') || url.startsWith('wss://');
  }

  private async connectWebSocket(config: StreamingConfig): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = config.url.includes('?')
        ? `${config.url}&sessionId=${config.sessionId}&userId=${config.userId || ''}`
        : `${config.url}?sessionId=${config.sessionId}&userId=${config.userId || ''}`;

      this.connection = new WebSocket(wsUrl);

      const ws = this.connection as WebSocket;
      const timeout = setTimeout(() => {
        ws.close();
        reject(new Error('Connection timeout'));
      }, config.connectionTimeout || 10000);

      ws.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (error) {
          chatLogger.error('[StreamingCoordinator] Failed to parse WebSocket message', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      };

      ws.onclose = (event) => {
        this.handleDisconnection('websocket_close', event.code, event.reason);
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });
  }

  private async connectSSE(config: StreamingConfig): Promise<void> {
    const sseUrl = config.url.includes('?')
      ? `${config.url}&sessionId=${config.sessionId}&userId=${config.userId || ''}`
      : `${config.url}?sessionId=${config.sessionId}&userId=${config.userId || ''}`;

    this.connection = new EventSource(sseUrl);

    const es = this.connection as EventSource;

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        es.close();
        reject(new Error('Connection timeout'));
      }, config.connectionTimeout || 10000);

      es.onopen = () => {
        clearTimeout(timeout);
        resolve();
      };

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleIncomingMessage(data);
        } catch (error) {
          chatLogger.error('[StreamingCoordinator] Failed to parse SSE message', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      };

      es.onerror = (event) => {
        this.handleDisconnection('sse_error', event.target.readyState, 'SSE error');
      };
    });
  }

  private handleIncomingMessage(data: any): void {
    // Update latency tracking
    const now = Date.now();
    if (this.lastHeartbeat > 0) {
      const latency = now - this.lastHeartbeat;
      this.connectionStats.latencies.push(latency);
      this.updateConnectionState({ latency });

      // Keep only last 10 latency measurements
      if (this.connectionStats.latencies.length > 10) {
        this.connectionStats.latencies.shift();
      }
    }

    this.emitEvent('message', data);
  }

  private handleDisconnection(reason: string, code?: number, message?: string): void {
    this.connectionStats.connectionDrops++;
    this.stopHeartbeat();

    this.updateConnectionState({
      isConnected: false,
      lastDisconnectedAt: new Date(),
      connectionQuality: 'disconnected',
    });

    this.emitEvent('disconnected', { reason, code, message });

    // Auto-reconnect if configured
    if (this.config && this.connectionState.reconnectAttempts < (this.config.reconnectAttempts || 3)) {
      setTimeout(() => {
        this.reconnect().catch(error => {
          chatLogger.error('[StreamingCoordinator] Reconnection failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        });
      }, (this.config.reconnectDelay || 1000) * (this.connectionState.reconnectAttempts + 1));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.lastHeartbeat = Date.now();
      this.send({ type: 'heartbeat' }).catch(error => {
        chatLogger.debug('[StreamingCoordinator] Heartbeat failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    }, this.config?.heartbeatInterval || 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private updateConnectionState(updates: Partial<ConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };

    // Update connection quality based on latency
    if (this.connectionState.isConnected && this.connectionState.latency !== undefined) {
      if (this.connectionState.latency < 100) {
        this.connectionState.connectionQuality = 'excellent';
      } else if (this.connectionState.latency < 500) {
        this.connectionState.connectionQuality = 'good';
      } else {
        this.connectionState.connectionQuality = 'poor';
      }
    }
  }
}

// ============================================================================
// HOOK INTERFACE
// ============================================================================

export interface UseStreamingCoordinatorResult {
  coordinator: StreamingCoordinator;
  state: ConnectionState;
  actions: {
    connect: (config: StreamingConfig) => Promise<void>;
    disconnect: () => Promise<void>;
    reconnect: () => Promise<void>;
    send: (data: any) => Promise<void>;
    onEvent: (type: string, callback: MessageCallback) => () => void;
  };
  helpers: {
    isConnected: boolean;
    connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
    stats: {
      totalMessages: number;
      totalEvents: number;
      averageLatency: number;
      uptime: number;
      connectionDrops: number;
    };
  };
}

/**
 * useStreamingCoordinator Hook
 *
 * React hook interface for StreamingCoordinator engine
 * Provides reactive streaming connection management
 */
export const useStreamingCoordinator = (
  initialConfig?: StreamingConfig
): UseStreamingCoordinatorResult => {
  const [coordinator] = useState(() => new StreamingCoordinatorImpl());
  const [state, setState] = useState<ConnectionState>(coordinator.getConnectionState());

  // Subscribe to state changes (simplified - in real implementation would need proper subscription)
  useEffect(() => {
    const interval = setInterval(() => {
      setState(coordinator.getConnectionState());
    }, 1000);

    return () => clearInterval(interval);
  }, [coordinator]);

  // Auto-connect if config provided
  useEffect(() => {
    if (initialConfig && !state.isConnected && !state.isConnecting) {
      coordinator.connect(initialConfig).catch(error => {
        chatLogger.error('[useStreamingCoordinator] Auto-connect failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      });
    }
  }, [initialConfig, coordinator, state.isConnected, state.isConnecting]);

  // Actions
  const actions = {
    connect: useCallback((config: StreamingConfig) => coordinator.connect(config), [coordinator]),
    disconnect: useCallback(() => coordinator.disconnect(), [coordinator]),
    reconnect: useCallback(() => coordinator.reconnect(), [coordinator]),
    send: useCallback((data: any) => coordinator.send(data), [coordinator]),
    onEvent: useCallback(
      (type: string, callback: MessageCallback) => coordinator.onEvent(type, callback),
      [coordinator]
    ),
  };

  // Helpers
  const helpers = {
    isConnected: coordinator.isConnected(),
    connectionQuality: state.connectionQuality,
    stats: coordinator.getConnectionStats(),
  };

  return {
    coordinator,
    state,
    actions,
    helpers,
  };
};
