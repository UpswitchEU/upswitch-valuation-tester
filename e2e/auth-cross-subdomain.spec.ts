/**
 * E2E Test: Cross-Subdomain Authentication
 * 
 * Verifies that authentication works seamlessly across
 * upswitch.biz and valuation.upswitch.biz
 */

import { expect, test } from '@playwright/test'

test.describe('Cross-Subdomain Authentication', () => {
  test('should authenticate on subdomain when logged into main domain', async ({ page, context }) => {
    // Skip in CI if not configured
    if (!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD) {
      test.skip()
    }

    // 1. Login on main domain
    await page.goto('https://upswitch.biz/login')
    await page.fill('[name="email"]', process.env.E2E_TEST_EMAIL!)
    await page.fill('[name="password"]', process.env.E2E_TEST_PASSWORD!)
    await page.click('[type="submit"]')

    // Wait for auth to complete
    await page.waitForSelector('[data-testid="user-menu"]', { timeout: 5000 })

    // Verify cookie was set
    const cookies = await context.cookies()
    const sessionCookie = cookies.find((c) => c.name === 'upswitch_session')
    
    expect(sessionCookie).toBeDefined()
    expect(sessionCookie?.domain).toBe('.upswitch.biz')
    expect(sessionCookie?.sameSite).toBe('None')
    expect(sessionCookie?.secure).toBe(true)

    // 2. Navigate to subdomain
    await page.goto('https://valuation.upswitch.biz')

    // 3. Verify authenticated state appears quickly (<1s)
    await expect(page.locator('[data-testid="auth-status"]')).toContainText('Authenticated', {
      timeout: 1000,
    })

    // 4. Verify user email appears
    await expect(page.locator('[data-testid="auth-status"]')).toContainText(process.env.E2E_TEST_EMAIL!)

    // 5. Verify no console errors related to authentication
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    // Wait a moment for any errors to surface
    await page.waitForTimeout(500)

    // Should have no auth-related errors
    const authErrors = consoleErrors.filter((err) =>
      err.toLowerCase().includes('auth') || err.toLowerCase().includes('cookie')
    )
    expect(authErrors).toHaveLength(0)
  })

  test('should handle guest mode when not logged in', async ({ page }) => {
    // Navigate directly to subdomain without logging in
    await page.goto('https://valuation.upswitch.biz')

    // Verify guest mode
    await expect(page.locator('[data-testid="auth-status"]')).toContainText('guest', {
      timeout: 2000,
    })

    // Verify app still works
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should handle token-based authentication', async ({ page }) => {
    // Skip in CI if not configured
    if (!process.env.E2E_TEST_TOKEN) {
      test.skip()
    }

    // Navigate with token
    await page.goto(`https://valuation.upswitch.biz?token=${process.env.E2E_TEST_TOKEN}`)

    // Wait for token exchange and authentication
    await expect(page.locator('[data-testid="auth-status"]')).toContainText('Authenticated', {
      timeout: 2000,
    })

    // Verify token removed from URL
    expect(page.url()).not.toContain('token=')
  })

  test('should maintain authentication across page reloads', async ({ page, context }) => {
    // Skip in CI if not configured
    if (!process.env.E2E_TEST_EMAIL || !process.env.E2E_TEST_PASSWORD) {
      test.skip()
    }

    // 1. Login on main domain
    await page.goto('https://upswitch.biz/login')
    await page.fill('[name="email"]', process.env.E2E_TEST_EMAIL!)
    await page.fill('[name="password"]', process.env.E2E_TEST_PASSWORD!)
    await page.click('[type="submit"]')
    await page.waitForSelector('[data-testid="user-menu"]')

    // 2. Navigate to subdomain
    await page.goto('https://valuation.upswitch.biz')
    await expect(page.locator('[data-testid="auth-status"]')).toContainText('Authenticated')

    // 3. Reload page
    await page.reload()

    // 4. Verify still authenticated (should be fast, <500ms)
    await expect(page.locator('[data-testid="auth-status"]')).toContainText('Authenticated', {
      timeout: 500,
    })
  })
})

