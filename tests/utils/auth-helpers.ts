/**
 * Auth Testing Utilities (Valuation Tester)
 * 
 * Helper functions for testing authentication flows
 * Makes test writing easier and more consistent
 */

import { BrowserContext, Page } from '@playwright/test';
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:8080';
const APP_URL = process.env.BASE_URL || 'http://localhost:3001';

export interface TestUser {
  email: string;
  password: string;
  name: string;
  role?: 'buyer' | 'seller' | 'both' | 'accountant';
}

/**
 * Create a test user via API
 */
export async function createTestUser(userData?: Partial<TestUser>): Promise<TestUser> {
  const defaultUser: TestUser = {
    email: `test-${Date.now()}@playwright.test`,
    password: 'TestPass123!@#',
    name: 'Test User',
    role: 'buyer',
    ...userData,
  };
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, defaultUser, {
      withCredentials: true,
    });
    
    if (response.data.success) {
      console.log('✅ Test user created:', defaultUser.email);
      return defaultUser;
    } else {
      throw new Error('Failed to create test user: ' + response.data.error);
    }
  } catch (error: any) {
    // If user already exists, return it anyway
    if (error.response?.data?.code === 'EMAIL_EXISTS') {
      console.log('ℹ️ Test user already exists:', defaultUser.email);
      return defaultUser;
    }
    throw error;
  }
}

/**
 * Login a test user via API (faster for setup)
 */
export async function loginTestUserViaAPI(page: Page, user: TestUser): Promise<void> {
  const response = await page.request.post(`${API_URL}/api/auth/login`, {
    data: {
      email: user.email,
      password: user.password,
    },
  });
  
  if (!response.ok()) {
    throw new Error('Failed to login test user via API');
  }
  
  console.log('✅ Test user logged in via API:', user.email);
}

/**
 * Verify auth cookie is present
 */
export async function verifyAuthCookie(context: BrowserContext): Promise<boolean> {
  const cookies = await context.cookies();
  const authCookie = cookies.find(c => c.name === 'upswitch_session');
  
  if (!authCookie) {
    console.warn('⚠️ Auth cookie not found');
    return false;
  }
  
  console.log('✅ Auth cookie verified:', {
    domain: authCookie.domain,
    sameSite: authCookie.sameSite,
    httpOnly: authCookie.httpOnly,
    secure: authCookie.secure,
  });
  
  return true;
}

/**
 * Get auth cookie value
 */
export async function getAuthCookie(context: BrowserContext): Promise<string | null> {
  const cookies = await context.cookies();
  const authCookie = cookies.find(c => c.name === 'upswitch_session');
  return authCookie?.value || null;
}

/**
 * Clear all auth cookies
 */
export async function clearAuthCookies(context: BrowserContext): Promise<void> {
  await context.clearCookies();
  console.log('✅ Auth cookies cleared');
}

/**
 * Wait for auth to resolve (useful for subdomain auth)
 */
export async function waitForAuthToResolve(page: Page, timeout = 5000): Promise<boolean> {
  try {
    // Wait for either authenticated state or guest mode
    await page.waitForSelector('[data-testid="user-menu"], [data-testid="guest-mode"]', { 
      timeout 
    });
    
    const isAuthenticated = await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false);
    
    if (isAuthenticated) {
      console.log('✅ Auth resolved: Authenticated');
    } else {
      console.log('ℹ️ Auth resolved: Guest mode');
    }
    
    return isAuthenticated;
  } catch (error) {
    console.warn('⚠️ Auth resolution timeout');
    return false;
  }
}

/**
 * Generate subdomain token for testing
 */
export async function generateSubdomainToken(page: Page): Promise<string | null> {
  try {
    const response = await page.request.post(`${API_URL}/api/auth/generate-subdomain-token`, {
      data: {},
    });
    
    if (response.ok()) {
      const data = await response.json();
      return data.data.token;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to generate subdomain token:', error);
    return null;
  }
}

/**
 * Test token exchange flow
 */
export async function testTokenExchange(page: Page, token: string): Promise<boolean> {
  await page.goto(`${APP_URL}?token=${token}`);
  
  // Wait for token exchange to complete
  await page.waitForTimeout(2000);
  
  // Check if authenticated
  const isAuthenticated = await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false);
  
  if (isAuthenticated) {
    console.log('✅ Token exchange successful');
    return true;
  } else {
    console.error('❌ Token exchange failed');
    return false;
  }
}

/**
 * Test suite setup helper
 */
export async function setupAuthTestSuite(page: Page) {
  // Clear cookies
  await page.context().clearCookies();
  
  // Create test user
  const user = await createTestUser();
  
  console.log('✅ Auth test suite setup complete');
  
  return { user };
}

/**
 * Test suite teardown helper
 */
export async function teardownAuthTestSuite(page: Page, user?: TestUser) {
  // Clear cookies
  await page.context().clearCookies();
  
  console.log('✅ Auth test suite teardown complete');
}

/**
 * Simulate network error (for testing retry logic)
 */
export async function simulateNetworkError(page: Page, endpoint: string) {
  await page.route(endpoint, route => {
    route.abort('failed');
  });
  
  console.log('✅ Network error simulated for:', endpoint);
}

/**
 * Assert user is authenticated
 */
export async function assertAuthenticated(page: Page) {
  const isAuthenticated = await page.locator('[data-testid="user-menu"]').isVisible();
  
  if (!isAuthenticated) {
    throw new Error('Expected user to be authenticated, but they are not');
  }
  
  console.log('✅ Assertion passed: User is authenticated');
}

/**
 * Assert user is not authenticated
 */
export async function assertNotAuthenticated(page: Page) {
  const isAuthenticated = await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false);
  
  if (isAuthenticated) {
    throw new Error('Expected user to NOT be authenticated, but they are');
  }
  
  console.log('✅ Assertion passed: User is not authenticated');
}

/**
 * Get auth state from page
 */
export async function getAuthState(page: Page) {
  const isAuthenticated = await page.locator('[data-testid="user-menu"]').isVisible().catch(() => false);
  const isGuest = await page.locator('[data-testid="guest-mode"]').isVisible().catch(() => false);
  const isLoading = await page.locator('[data-testid="auth-loading"]').isVisible().catch(() => false);
  
  return {
    isAuthenticated,
    isGuest,
    isLoading,
  };
}
