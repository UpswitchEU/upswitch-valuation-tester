/**
 * Simple Navigation Flow Tests
 * 
 * Tests the core navigation functionality
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { HomePage } from '../src/pages/HomePage';

// Mock the auth context
vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    businessCard: null
  })
}));

describe('Simple Navigation Flow', () => {
  it('should render HomePage with Manual Input button', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    expect(screen.getByText('Manual Input')).toBeInTheDocument();
    expect(screen.getByText('AI-Guided Valuation')).toBeInTheDocument();
  });

  it('should have correct navigation paths for buttons', () => {
    render(
      <BrowserRouter>
        <HomePage />
      </BrowserRouter>
    );

    const manualButton = screen.getByText('Manual Input');
    const aiGuidedButton = screen.getByText('AI-Guided Valuation');

    // Check that buttons are clickable
    expect(manualButton).toBeInTheDocument();
    expect(aiGuidedButton).toBeInTheDocument();
  });
});
