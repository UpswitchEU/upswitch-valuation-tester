# Testing Guide

This project uses **Vitest** and **React Testing Library** for testing Next.js App Router components.

## Setup

- **Test Runner**: Vitest (blazing fast, Vite-native)
- **Testing Library**: React Testing Library (RTL) for component testing
- **Environment**: jsdom for browser-like environment

## Running Tests

```bash
# Run tests in watch mode (recommended for development)
npm run test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

## Writing Tests

### Component Test Example

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { MyComponent } from '../components/MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Testing Next.js App Router Components

For components using Next.js hooks (`useRouter`, `usePathname`, etc.), mock them:

```tsx
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))
```

### Testing Client Components

Components marked with `'use client'` work out of the box. Just import and test them normally.

### Best Practices

1. **Test behavior, not implementation**: Use queries like `getByRole`, `getByLabelText` instead of `getByTestId`
2. **Accessibility first**: Testing with RTL helps ensure your components are accessible
3. **Mock external dependencies**: Mock API calls, Next.js hooks, and browser APIs
4. **Keep tests focused**: One test should verify one behavior

## Configuration

- **Config file**: `vitest.config.ts`
- **Setup file**: `src/__tests__/setup.ts`
- **Test files**: `**/*.{test,spec}.{ts,tsx}`

## Test Structure

Tests are organized alongside the code they test:
- Component tests: `src/components/__tests__/ComponentName.test.tsx`
- Utility tests: `src/utils/__tests__/utilityName.test.ts`
- Hook tests: `src/hooks/__tests__/hookName.test.ts`

## Common Patterns

### Testing Client Components

```tsx
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { MyComponent } from '../MyComponent'

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})
```

### Testing with User Interactions

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

it('should handle button click', async () => {
  const user = userEvent.setup()
  render(<MyComponent />)
  const button = screen.getByRole('button')
  await user.click(button)
  expect(screen.getByText('Clicked!')).toBeInTheDocument()
})
```

### Testing Async Operations

```tsx
import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

it('should load data asynchronously', async () => {
  render(<AsyncComponent />)
  await waitFor(() => {
    expect(screen.getByText('Data loaded')).toBeInTheDocument()
  })
})
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)
- [Testing Library Queries](https://testing-library.com/docs/queries/about/)

