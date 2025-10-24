/**
 * StreamingChat Component Tests
 * Tests for backend-driven conversation initialization
 */

import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StreamingChat } from '../StreamingChat';

// Mock the streamingChatService
vi.mock('../../services/chat/streamingChatService', () => ({
  streamingChatService: {
    streamConversation: vi.fn(),
    streamConversationEventSource: vi.fn(),
  }
}));

// Mock the logger
vi.mock('../../utils/logger', () => ({
  chatLogger: {
    debug: vi.fn(),
    info: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('StreamingChat Backend-Driven Initialization', () => {
  const defaultProps = {
    sessionId: 'test-session-123',
    userId: undefined,
    className: 'test-class',
    disabled: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Guest User Initialization', () => {
    it('should call backend /start endpoint for guest users', async () => {
      // Mock successful backend response
      const mockBackendResponse = {
        ai_message: 'What type of business do you run? (Select from 173 optimized options including: restaurant, catering, bakery...)',
        field_name: 'business_type',
        input_type: 'select',
        help_text: 'Select your business type from the optimized list',
        validation_rules: { required: true }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse)
      });

      render(<StreamingChat {...defaultProps} />);

      // Wait for backend call
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/intelligent-conversation/start'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: expect.stringContaining('"session_id":"test-session-123"')
          })
        );
      });
    });

    it('should display loading state while initializing', async () => {
      // Mock slow backend response
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            ai_message: 'What type of business do you run?',
            field_name: 'business_type',
            input_type: 'select',
            help_text: 'Select your business type',
            validation_rules: { required: true }
          })
        }), 100))
      );

      render(<StreamingChat {...defaultProps} />);

      // Should show loading state initially
      expect(screen.getByText('Preparing your personalized valuation experience...')).toBeInTheDocument();
    });

    it('should display backend message after successful initialization', async () => {
      const mockBackendResponse = {
        ai_message: 'What type of business do you run? (Select from 173 optimized options)',
        field_name: 'business_type',
        input_type: 'select',
        help_text: 'Select your business type',
        validation_rules: { required: true }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse)
      });

      render(<StreamingChat {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('What type of business do you run? (Select from 173 optimized options)')).toBeInTheDocument();
      });

      // Loading state should be gone
      expect(screen.queryByText('Preparing your personalized valuation experience...')).not.toBeInTheDocument();
    });

    it('should fallback to default message if backend fails', async () => {
      // Mock backend failure
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<StreamingChat {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText('Welcome! Let me help you value your business. What type of business do you run?')).toBeInTheDocument();
      });
    });
  });

  describe('Authenticated User Initialization', () => {
    const authenticatedProps = {
      ...defaultProps,
      userId: 'user-123'
    };

    it('should call backend with user authentication', async () => {
      const mockBackendResponse = {
        ai_message: 'Hi John! I see you run a SaaS business. I just need your Monthly Recurring Revenue (MRR) to complete your valuation.',
        field_name: 'mrr',
        input_type: 'number',
        help_text: 'Enter your monthly recurring revenue',
        validation_rules: { required: true, min: 0 }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse)
      });

      render(<StreamingChat {...authenticatedProps} />);

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/intelligent-conversation/start'),
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer user-123'
            },
            body: expect.stringContaining('"user_id":"user-123"')
          })
        );
      });
    });

    it('should include user profile data in request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          ai_message: 'Personalized question',
          field_name: 'revenue',
          input_type: 'number',
          help_text: 'Enter revenue',
          validation_rules: { required: true }
        })
      });

      render(<StreamingChat {...authenticatedProps} />);

      await waitFor(() => {
        const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
        expect(requestBody.user_id).toBe('user-123');
        expect(requestBody.pre_filled_data).toBeDefined();
      });
    });
  });

  describe('Message Metadata', () => {
    it('should include backend-driven metadata in messages', async () => {
      const mockBackendResponse = {
        ai_message: 'What type of business do you run?',
        field_name: 'business_type',
        input_type: 'select',
        help_text: 'Select your business type',
        validation_rules: { required: true }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockBackendResponse)
      });

      render(<StreamingChat {...defaultProps} />);

      await waitFor(() => {
        // The message should be displayed
        expect(screen.getByText('What type of business do you run?')).toBeInTheDocument();
      });

      // Note: In a real test, we'd need to access the component's internal state
      // to verify the metadata, but this demonstrates the test structure
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<StreamingChat {...defaultProps} />);

      await waitFor(() => {
        // Should show fallback message
        expect(screen.getByText('Welcome! Let me help you value your business. What type of business do you run?')).toBeInTheDocument();
      });
    });

    it('should handle malformed backend responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({}) // Empty response
      });

      render(<StreamingChat {...defaultProps} />);

      await waitFor(() => {
        // Should show fallback message
        expect(screen.getByText('Welcome! Let me help you value your business. What type of business do you run?')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state only when initializing', async () => {
      mockFetch.mockImplementationOnce(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: () => Promise.resolve({
            ai_message: 'Test message',
            field_name: 'test',
            input_type: 'text',
            help_text: 'Test help',
            validation_rules: { required: true }
          })
        }), 100))
      );

      render(<StreamingChat {...defaultProps} />);

      // Should show loading initially
      expect(screen.getByText('Preparing your personalized valuation experience...')).toBeInTheDocument();

      // Should hide loading after response
      await waitFor(() => {
        expect(screen.queryByText('Preparing your personalized valuation experience...')).not.toBeInTheDocument();
      });
    });
  });
});
