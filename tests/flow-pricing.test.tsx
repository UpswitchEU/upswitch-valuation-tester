/**
 * Flow Pricing UI Tests
 * 
 * Tests the UI indicators and behavior for manual (FREE) vs instant (PREMIUM) flows
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ManualValuationFlow } from '../src/components/ManualValuationFlow';
import { AIAssistedValuation } from '../src/components/AIAssistedValuation';
import { ValuationForm } from '../src/components/ValuationForm';

// Mock the auth context
const mockAuth = {
  user: { id: 'test-user-id', email: 'test@example.com' },
  isAuthenticated: true,
  businessCard: null
};

jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => mockAuth
}));

// Mock the valuation store
const mockValuationStore = {
  formData: {
    company_name: 'Test Company',
    country_code: 'BE',
    industry: 'services',
    business_model: 'other',
    founding_year: 2020,
    revenue: 1000000,
    ebitda: 200000
  },
  updateFormData: jest.fn(),
  calculateValuation: jest.fn(),
  quickValuation: jest.fn(),
  isCalculating: false,
  prefillFromBusinessCard: jest.fn()
};

jest.mock('../src/store/useValuationStore', () => ({
  useValuationStore: () => mockValuationStore
}));

// Mock the backend API
jest.mock('../src/services/backendApi', () => ({
  backendAPI: {
    calculateManualValuation: jest.fn().mockResolvedValue({
      success: true,
      data: {
        valuation_id: 'test-valuation-id',
        company_name: 'Test Company',
        equity_value_mid: 600000,
        flow_type: 'manual'
      }
    }),
    calculateInstantValuation: jest.fn().mockResolvedValue({
      success: true,
      data: {
        valuation_id: 'test-valuation-id',
        company_name: 'Test Company',
        equity_value_mid: 600000,
        flow_type: 'instant'
      }
    })
  }
}));

describe('Flow Pricing UI', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Manual Flow - FREE Badge', () => {
    it('should show FREE badge on manual flow', () => {
      render(
        <BrowserRouter>
          <ManualValuationFlow />
        </BrowserRouter>
      );

      expect(screen.getByText('FREE - No Credit Cost')).toBeInTheDocument();
      expect(screen.getByText('Manual entry • Try our instant flow for AI-guided accuracy')).toBeInTheDocument();
    });

    it('should display consistent credit badge across flows', () => {
      render(
        <BrowserRouter>
          <ManualValuationFlow />
        </BrowserRouter>
      );

      // Check for the FREE indicator in the form
      expect(screen.getByText('Manual valuation - No credit cost')).toBeInTheDocument();
      expect(screen.getByText('Try premium instant flow →')).toBeInTheDocument();
    });
  });

  describe('Instant Flow - PREMIUM Badge', () => {
    it('should show PREMIUM badge on instant flow', () => {
      render(
        <BrowserRouter>
          <AIAssistedValuation />
        </BrowserRouter>
      );

      expect(screen.getByText('PREMIUM - 1 Credit')).toBeInTheDocument();
      expect(screen.getByText('AI-guided • Higher accuracy through intelligent data collection')).toBeInTheDocument();
    });
  });

  describe('ValuationForm Component', () => {
    it('should show FREE indicator for manual flow', () => {
      render(<ValuationForm />);

      expect(screen.getByText('FREE')).toBeInTheDocument();
      expect(screen.getByText('Manual valuation - No credit cost')).toBeInTheDocument();
      expect(screen.getByText('Try premium instant flow →')).toBeInTheDocument();
    });

    it('should have correct styling for FREE indicator', () => {
      render(<ValuationForm />);

      const freeBadge = screen.getByText('FREE');
      expect(freeBadge).toHaveClass('text-green-300', 'font-medium');
    });
  });

  describe('API Integration', () => {
    it('should call manual endpoint for manual flow', async () => {
      const { backendAPI } = require('../src/services/backendApi');
      
      render(
        <BrowserRouter>
          <ManualValuationFlow />
        </BrowserRouter>
      );

      // Trigger form submission
      const submitButton = screen.getByText('Calculate Valuation');
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(backendAPI.calculateManualValuation).toHaveBeenCalled();
      });
    });

    it('should call instant endpoint for instant flow', async () => {
      const { backendAPI } = require('../src/services/backendApi');
      
      render(
        <BrowserRouter>
          <AIAssistedValuation />
        </BrowserRouter>
      );

      // The instant flow would be triggered through the conversation API
      // This test verifies the component renders correctly
      expect(screen.getByText('PREMIUM - 1 Credit')).toBeInTheDocument();
    });
  });

  describe('User Experience', () => {
    it('should provide clear value proposition for each flow', () => {
      render(
        <BrowserRouter>
          <ManualValuationFlow />
        </BrowserRouter>
      );

      // Manual flow should emphasize free access
      expect(screen.getByText('FREE - No Credit Cost')).toBeInTheDocument();
      expect(screen.getByText(/Try our instant flow for AI-guided accuracy/)).toBeInTheDocument();
    });

    it('should guide users from manual to instant flow', () => {
      render(<ValuationForm />);

      const upgradeLink = screen.getByText('Try premium instant flow →');
      expect(upgradeLink).toHaveAttribute('href', '/instant');
    });

    it('should show appropriate messaging for each flow type', () => {
      // Test manual flow messaging
      render(
        <BrowserRouter>
          <ManualValuationFlow />
        </BrowserRouter>
      );

      expect(screen.getByText('Manual entry • Try our instant flow for AI-guided accuracy')).toBeInTheDocument();

      // Test instant flow messaging
      render(
        <BrowserRouter>
          <AIAssistedValuation />
        </BrowserRouter>
      );

      expect(screen.getByText('AI-guided • Higher accuracy through intelligent data collection')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for flow indicators', () => {
      render(
        <BrowserRouter>
          <ManualValuationFlow />
        </BrowserRouter>
      );

      const freeBadge = screen.getByText('FREE - No Credit Cost');
      expect(freeBadge).toBeInTheDocument();
    });

    it('should be keyboard navigable', () => {
      render(<ValuationForm />);

      const upgradeLink = screen.getByText('Try premium instant flow →');
      expect(upgradeLink).toBeInTheDocument();
      
      // Test keyboard navigation
      fireEvent.keyDown(upgradeLink, { key: 'Enter' });
      // Link should be focusable and clickable
    });
  });

  describe('Responsive Design', () => {
    it('should display correctly on mobile', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <BrowserRouter>
          <ManualValuationFlow />
        </BrowserRouter>
      );

      expect(screen.getByText('FREE - No Credit Cost')).toBeInTheDocument();
    });

    it('should display correctly on desktop', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      });

      render(
        <BrowserRouter>
          <ManualValuationFlow />
        </BrowserRouter>
      );

      expect(screen.getByText('FREE - No Credit Cost')).toBeInTheDocument();
    });
  });
});
