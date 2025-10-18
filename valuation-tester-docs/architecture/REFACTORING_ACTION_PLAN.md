# 🎯 Refactoring Action Plan - Valuation Tester

**Last Updated:** October 10, 2025  
**Status:** Ready for implementation  
**Owner:** Engineering Team  
**Scope:** Preventive improvements (not crisis management)

---

## 📋 Table of Contents

1. [Priority Files for Improvement](#priority-files)
2. [Sprint-by-Sprint Breakdown](#sprint-breakdown)
3. [File-by-File Action Items](#file-by-file-actions)
4. [Quick Wins (Start Here)](#quick-wins)

---

## 🎯 Philosophy

**Unlike the main frontend (crisis mode), this is preventive maintenance.**

The valuation-tester is **already well-architected**. These improvements will:
- Add observability (centralized logging)
- Add safety net (tests)
- Improve maintainability (types, component size)
- Prevent debt accumulation

**This is a success story.** Let's keep it that way! 🚀

---

## 🚨 Priority Files for Improvement

### **P0 - Critical (Week 1)**

| File | Lines | Issues | Effort | Owner |
|------|-------|--------|--------|-------|
| **Test Setup** | - | No tests | 3 days | TBD |
| All files with console.log | 104 | Need logger | 1 day | TBD |

### **P1 - High (Week 2-3)**

| File | Lines | Issues | Effort | Owner |
|------|-------|--------|--------|-------|
| `EnhancedConversationalChat.tsx` | 733 | Split into sections | 1 day | TBD |
| `Results.tsx` | 590 | Split into sections | 1 day | TBD |
| `ConversationalFinancialInput.tsx` | 622 | Extract hooks | 1 day | TBD |
| `AuthContext.tsx` | 457 | Extract service | 1 day | TBD |
| `useValuationStore.ts` | 343 | Fix any types | 1 day | TBD |

---

## 🗓️ Sprint-by-Sprint Breakdown

### **Sprint 1: Observability & Safety Net (Week 1-2)**

**Goal:** Add logging and tests

#### **Task 1.1: Create Centralized Logger (1 day)**

**Create logger utility:**

```typescript
// utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private enabled: boolean;
  private minLevel: LogLevel;
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor() {
    this.enabled = import.meta.env.DEV || import.meta.env.VITE_ENABLE_LOGS === 'true';
    this.minLevel = (import.meta.env.VITE_LOG_LEVEL as LogLevel) || 'info';
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.enabled) return false;
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const emoji = {
      debug: '🐛',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
    }[level];

    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `${emoji} [${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, context?: LogContext) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context));
    }
  }

  error(message: string, context?: LogContext) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message, context));
    }
  }

  // Domain-specific loggers
  api = {
    request: (method: string, endpoint: string, data?: any) => {
      this.debug(`[API] ${method} ${endpoint}`, data);
    },
    success: (endpoint: string, response?: any) => {
      this.info(`[API] Success: ${endpoint}`, response);
    },
    error: (endpoint: string, error: any) => {
      this.error(`[API] Error: ${endpoint}`, { error: error.message, stack: error.stack });
    },
  };

  valuation = {
    started: (method: string) => {
      this.info('[Valuation] Started', { method });
    },
    completed: (companyName: string, value: number) => {
      this.info('[Valuation] Completed', { companyName, value });
    },
    failed: (error: any) => {
      this.error('[Valuation] Failed', { error: error.message });
    },
  };

  auth = {
    login: (userId: string) => {
      this.info('[Auth] User logged in', { userId });
    },
    logout: () => {
      this.info('[Auth] User logged out');
    },
    error: (error: string) => {
      this.error('[Auth] Error', { error });
    },
  };
}

export const logger = new Logger();
```

#### **Task 1.2: Replace All console.log (1 day)**

**Files to update (in priority order):**

1. **contexts/AuthContext.tsx** (26 instances)
2. **store/useValuationStore.ts** (12 instances)
3. **services/registryService.ts** (12 instances)
4. **controllers/chat/valuationChatController.ts** (11 instances)
5. **components/registry/AIAssistedValuation.tsx** (10 instances)
6. **components/registry/ConversationalChat.tsx** (10 instances)
7. **services/chat/companyLookupService.ts** (9 instances)

**Example replacements:**

```typescript
// ❌ Before - contexts/AuthContext.tsx
console.log('🔐 [SubdomainAuth] Checking authentication...');
console.log('✅ [SubdomainAuth] User authenticated:', user.email);
console.error('❌ [SubdomainAuth] Authentication failed:', error);

// ✅ After
import { logger } from '@/utils/logger';

logger.auth.info('Checking authentication');
logger.auth.info('User authenticated', { email: user.email });
logger.auth.error('Authentication failed', { error: error.message });
```

```typescript
// ❌ Before - store/useValuationStore.ts
console.log('Sending valuation request:', request);
console.log('✅ Valuation auto-saved to database:', saveResult.id);
console.warn('⚠️ Failed to auto-save to database:', saveError);
console.error('Valuation error:', error);

// ✅ After
import { logger } from '@/utils/logger';

logger.valuation.started(request.company_name);
logger.info('[Save] Valuation auto-saved', { id: saveResult.id });
logger.warn('[Save] Failed to auto-save', { error: saveError.message });
logger.valuation.failed(error);
```

**Automation script (optional):**

```bash
# Find all console.log
grep -rn "console\.(log|error|warn|info)" src/

# Use sed to do bulk replacements (careful!)
# Better to do manually for context-specific replacements
```

#### **Task 1.3: Set Up Test Infrastructure (3 days)**

**Day 1: Setup**

```bash
# Install test dependencies
yarn add -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event happy-dom
```

**Create test setup:**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

```typescript
// src/test/setup.ts
import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});
```

```typescript
// src/test/utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  );
};

export const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { renderWithProviders as render };
```

**Day 2: Write Critical Tests**

```typescript
// store/useValuationStore.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useValuationStore } from './useValuationStore';
import { api } from '../services/api';

describe('useValuationStore', () => {
  beforeEach(() => {
    // Reset store
    const { resetFormData, setResult, setError } = useValuationStore.getState();
    resetFormData();
    setResult(null);
    setError(null);
  });

  describe('calculateValuation', () => {
    it('should calculate valuation successfully', async () => {
      // Mock API
      const mockResponse = {
        equity_value_mid: 1_000_000,
        equity_value_low: 800_000,
        equity_value_high: 1_200_000,
        primary_method: 'multiples',
        methodology: 'Industry multiples',
      };
      
      vi.spyOn(api, 'calculateValuation').mockResolvedValue(mockResponse);
      
      const { result } = renderHook(() => useValuationStore());
      
      // Set form data
      act(() => {
        result.current.updateFormData({
          company_name: 'Test Company',
          revenue: 500_000,
          ebitda: 100_000,
          industry: 'services',
          country_code: 'BE',
        });
      });
      
      // Calculate
      await act(async () => {
        await result.current.calculateValuation();
      });
      
      // Assert
      await waitFor(() => {
        expect(result.current.result).toEqual(mockResponse);
        expect(result.current.isCalculating).toBe(false);
        expect(result.current.error).toBeNull();
      });
      
      // Verify API was called with correct data
      expect(api.calculateValuation).toHaveBeenCalledWith(
        expect.objectContaining({
          company_name: 'Test Company',
          current_year_data: expect.objectContaining({
            revenue: 500_000,
            ebitda: 100_000,
          }),
        })
      );
    });

    it('should handle validation errors', async () => {
      const { result } = renderHook(() => useValuationStore());
      
      // Set invalid data (no company name)
      act(() => {
        result.current.updateFormData({
          company_name: '',
          revenue: 500_000,
          ebitda: 100_000,
        });
      });
      
      // Calculate
      await act(async () => {
        await result.current.calculateValuation();
      });
      
      // Assert
      expect(result.current.error).toContain('Company name is required');
      expect(result.current.result).toBeNull();
    });

    it('should handle API errors gracefully', async () => {
      const errorMessage = 'API Connection Failed';
      vi.spyOn(api, 'calculateValuation').mockRejectedValue(new Error(errorMessage));
      
      const { result } = renderHook(() => useValuationStore());
      
      // Set valid data
      act(() => {
        result.current.updateFormData({
          company_name: 'Test Company',
          revenue: 500_000,
          ebitda: 100_000,
          industry: 'services',
        });
      });
      
      // Calculate
      await act(async () => {
        await result.current.calculateValuation();
      });
      
      // Assert
      expect(result.current.error).toContain(errorMessage);
      expect(result.current.result).toBeNull();
      expect(result.current.isCalculating).toBe(false);
    });
  });

  describe('prefillFromBusinessCard', () => {
    it('should prefill form data correctly', () => {
      const { result } = renderHook(() => useValuationStore());
      
      const businessCard = {
        company_name: 'Acme Corp',
        industry: 'technology',
        business_model: 'saas',
        founding_year: 2015,
        country_code: 'BE',
        employee_count: 50,
      };
      
      act(() => {
        result.current.prefillFromBusinessCard(businessCard);
      });
      
      expect(result.current.formData).toMatchObject({
        company_name: 'Acme Corp',
        industry: 'technology',
        business_model: 'saas',
        founding_year: 2015,
        country_code: 'BE',
        number_of_employees: 50,
      });
    });
  });
});
```

**Day 3: More Tests**

```typescript
// services/transformationService.test.ts
import { describe, it, expect } from 'vitest';
import { transformToValuationRequest } from './transformationService';
import type { CompanyFinancialData } from '../types/registry';

describe('transformationService', () => {
  it('should transform registry data to valuation request', () => {
    const registryData: CompanyFinancialData = {
      company_name: 'Test Company',
      vat_number: 'BE0123456789',
      legal_form: 'NV',
      address: {
        street: 'Test Street 1',
        postal_code: '1000',
        city: 'Brussels',
        country: 'Belgium',
      },
      founding_date: '2015-01-01',
      status: 'active',
      years: [
        {
          year: 2023,
          revenue: 1_000_000,
          operating_profit: 200_000,
          net_profit: 150_000,
          total_assets: 500_000,
          total_equity: 300_000,
        },
        {
          year: 2022,
          revenue: 800_000,
          operating_profit: 150_000,
          net_profit: 100_000,
          total_assets: 400_000,
          total_equity: 250_000,
        },
      ],
    };

    const request = transformToValuationRequest(registryData);

    expect(request.company_name).toBe('Test Company');
    expect(request.country_code).toBe('BE');
    expect(request.founding_year).toBe(2015);
    expect(request.current_year_data.year).toBe(2023);
    expect(request.current_year_data.revenue).toBe(1_000_000);
    expect(request.current_year_data.ebitda).toBe(200_000);
    expect(request.historical_years_data).toHaveLength(1);
    expect(request.historical_years_data[0].year).toBe(2022);
  });

  it('should handle missing historical data', () => {
    const registryData: CompanyFinancialData = {
      company_name: 'New Company',
      vat_number: 'BE0987654321',
      legal_form: 'BVBA',
      founding_date: '2023-01-01',
      status: 'active',
      years: [
        {
          year: 2023,
          revenue: 500_000,
          operating_profit: 100_000,
          net_profit: 75_000,
        },
      ],
    };

    const request = transformToValuationRequest(registryData);

    expect(request.historical_years_data).toEqual([]);
  });
});
```

**Update package.json:**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:run": "vitest run"
  }
}
```

#### **Task 1.4: Add Error Boundaries (1 day)**

**Create error boundary:**

```typescript
// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '@/utils/logger';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'component';
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('[ErrorBoundary] Component error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      level: this.props.level || 'component',
    });

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isPageLevel = this.props.level === 'page';

      return (
        <div className={`flex items-center justify-center ${isPageLevel ? 'min-h-screen bg-gray-50' : 'p-8'}`}>
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">
                Something went wrong
              </h2>
            </div>
            
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>

            {import.meta.env.DEV && this.state.errorInfo && (
              <details className="mb-4">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  Technical Details (dev only)
                </summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-40">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              <button
                onClick={this.handleReset}
                className="flex-1 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              {isPageLevel && (
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 flex items-center justify-center gap-2"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**Add to router:**

```typescript
// router/index.tsx
import { ErrorBoundary } from '../components/ErrorBoundary';

export const Router = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary level="page">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/reports" element={
            <ErrorBoundary level="component">
              <Reports />
            </ErrorBoundary>
          } />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/privacy" element={<PrivacyExplainer />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </BrowserRouter>
  );
};
```

---

### **Sprint 2: Component Refactoring (Week 3)**

**Goal:** Split large components

#### **Task 2.1: Refactor Results.tsx (1 day)**

**Current:** 590 lines, everything in one file

**Strategy:**
```
components/results/
├── Results.tsx (main, 100 lines)
├── ValuationHeader.tsx
├── EnterpriseValue.tsx
├── OwnershipAdjustment.tsx
├── GrowthMetrics.tsx
├── ValueDrivers.tsx
├── RiskFactors.tsx
├── MethodologyBreakdown.tsx
└── utils/
    └── formatting.ts
```

**Implementation:**

```typescript
// components/results/utils/formatting.ts
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export const formatCurrencyCompact = (value: number) => {
  if (value >= 1000000) {
    return `€${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `€${(value / 1000).toFixed(0)}K`;
  }
  return formatCurrency(value);
};

export const formatPercent = (value: number) => {
  return `${value.toFixed(1)}%`;
};
```

```typescript
// components/results/Results.tsx (now ~100 lines)
import React from 'react';
import { useValuationStore } from '@/store/useValuationStore';
import { ValuationHeader } from './ValuationHeader';
import { EnterpriseValue } from './EnterpriseValue';
import { OwnershipAdjustment } from './OwnershipAdjustment';
import { GrowthMetrics } from './GrowthMetrics';
import { ValueDrivers } from './ValueDrivers';
import { RiskFactors } from './RiskFactors';
import { MethodologyBreakdown } from './MethodologyBreakdown';

export const Results: React.FC = () => {
  const { result } = useValuationStore();

  if (!result) {
    return null;
  }

  return (
    <div className="space-y-4 sm:space-y-6 mt-4 sm:mt-8">
      <ValuationHeader result={result} />
      <EnterpriseValue result={result} />
      <OwnershipAdjustment result={result} />
      <GrowthMetrics result={result} />
      <ValueDrivers result={result} />
      <RiskFactors result={result} />
      <MethodologyBreakdown result={result} />
    </div>
  );
};
```

```typescript
// components/results/EnterpriseValue.tsx (~80 lines)
import React from 'react';
import type { ValuationResponse } from '@/types/valuation';
import { formatCurrency, formatCurrencyCompact } from './utils/formatting';

interface Props {
  result: ValuationResponse;
}

export const EnterpriseValue: React.FC<Props> = ({ result }) => {
  return (
    <div className="bg-white rounded-lg border-2 border-primary-500 p-4 sm:p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Enterprise Value</h3>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
          Big 4 Methodology
        </span>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
        <div className="text-center p-3 sm:p-4 bg-gray-50 rounded">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">Low Estimate</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-words">
            {formatCurrencyCompact(result.equity_value_low)}
          </p>
          <p className="text-xs text-gray-500 mt-1 hidden sm:block">
            {formatCurrency(result.equity_value_low)}
          </p>
        </div>
        
        <div className="text-center p-3 sm:p-4 bg-primary-50 rounded border-2 border-primary-500">
          <p className="text-xs sm:text-sm text-primary-600 mb-1">Mid-Point</p>
          <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-primary-600 break-words">
            {formatCurrencyCompact(result.equity_value_mid)}
          </p>
          <p className="text-xs text-primary-500 mt-1 hidden sm:block">
            {formatCurrency(result.equity_value_mid)}
          </p>
        </div>
        
        <div className="text-center p-3 sm:p-4 bg-gray-50 rounded">
          <p className="text-xs sm:text-sm text-gray-600 mb-1">High Estimate</p>
          <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-words">
            {formatCurrencyCompact(result.equity_value_high)}
          </p>
          <p className="text-xs text-gray-500 mt-1 hidden sm:block">
            {formatCurrency(result.equity_value_high)}
          </p>
        </div>
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded p-3 sm:p-4">
        <p className="text-xs sm:text-sm text-blue-800">
          <strong>Recommended Price Range:</strong> The mid-point represents our recommended asking price, 
          with low/high estimates providing negotiation boundaries.
        </p>
      </div>
    </div>
  );
};
```

**Similar pattern for:**
- `ValuationHeader.tsx`
- `OwnershipAdjustment.tsx`
- `GrowthMetrics.tsx`
- `ValueDrivers.tsx`
- `RiskFactors.tsx`
- `MethodologyBreakdown.tsx`

#### **Task 2.2: Refactor EnhancedConversationalChat.tsx (1 day)**

**Current:** 733 lines

**Strategy:**
```
components/registry/enhanced-chat/
├── EnhancedConversationalChat.tsx (main, 150 lines)
├── hooks/
│   ├── useChat.ts
│   ├── useFinancialQuestions.ts
│   └── useHealthMonitoring.ts
├── components/
│   ├── ChatMessage.tsx
│   ├── ChatInput.tsx
│   ├── HealthIndicator.tsx
│   └── FinancialQuestion.tsx
└── types.ts
```

**Implementation:**

```typescript
// components/registry/enhanced-chat/hooks/useChat.ts
import { useState, useCallback, useRef } from 'react';
import { CompanyLookupService, type ChatMessage } from '@/services/chat/companyLookupService';

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([...]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messageIdsRef = useRef(new Set<string>());
  const lookupService = useRef(new CompanyLookupService()).current;
  
  const addUniqueMessage = useCallback((message: ChatMessage) => {
    if (!messageIdsRef.current.has(message.id)) {
      messageIdsRef.current.add(message.id);
      setMessages(prev => [...prev, message]);
    }
  }, []);
  
  const handleSubmit = useCallback(async (input: string) => {
    setIsLoading(true);
    try {
      const response = await lookupService.lookupCompany(input);
      // Handle response
    } finally {
      setIsLoading(false);
    }
  }, [lookupService]);
  
  return {
    messages,
    inputValue,
    setInputValue,
    isLoading,
    addUniqueMessage,
    handleSubmit,
  };
};
```

```typescript
// components/registry/enhanced-chat/EnhancedConversationalChat.tsx (now ~150 lines)
import React from 'react';
import { useChat } from './hooks/useChat';
import { useFinancialQuestions } from './hooks/useFinancialQuestions';
import { useHealthMonitoring } from './hooks/useHealthMonitoring';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { HealthIndicator } from './components/HealthIndicator';
import type { CompanyFinancialData } from '@/types/registry';

interface Props {
  onCompanyFound: (data: CompanyFinancialData) => void;
}

export const EnhancedConversationalChat: React.FC<Props> = ({
  onCompanyFound
}) => {
  const chat = useChat();
  const financialQuestions = useFinancialQuestions();
  const health = useHealthMonitoring();
  
  return (
    <div className="flex flex-col h-[600px] border border-gray-300 rounded-lg">
      {/* Health indicator */}
      <HealthIndicator status={health.status} />
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {chat.messages.map(message => (
          <ChatMessage key={message.id} message={message} />
        ))}
      </div>
      
      {/* Input */}
      <ChatInput
        value={chat.inputValue}
        onChange={chat.setInputValue}
        onSubmit={chat.handleSubmit}
        isLoading={chat.isLoading}
      />
    </div>
  );
};
```

---

### **Sprint 3: Type Safety & Polish (Week 4)**

**Goal:** Fix any types and add performance monitoring

#### **Task 3.1: Fix Top 30 `any` Types (2 days)**

**Priority files:**
1. hooks/useAnalytics.ts (6 instances)
2. components/registry/EnhancedConversationalChat.tsx (6 instances)
3. components/AIConversation.tsx (6 instances)
4. store/useValuationStore.ts (4 instances)
5. components/CompanyLookup.tsx (3 instances)

**Example fixes:**

```typescript
// ❌ Before - hooks/useAnalytics.ts
const trackEvent = (event: string, properties?: any) => {
  // ...
};

// ✅ After
type AnalyticsEvent = 
  | { event: 'valuation_started'; method: 'instant' | 'manual' | 'registry' }
  | { event: 'valuation_completed'; company: string; value: number; method: string }
  | { event: 'company_lookup'; query: string; found: boolean }
  | { event: 'financial_input'; field: string; value: number }
  | { event: 'error_occurred'; error: string; context: string; stack?: string };

const trackEvent = (event: AnalyticsEvent) => {
  // ...
};
```

```typescript
// ❌ Before - store/useValuationStore.ts
} catch (error: any) {
  console.error('Valuation error:', error);
}

// ✅ After
} catch (error) {
  const err = error as Error;
  logger.valuation.failed(err);
  
  let errorMessage = 'Failed to calculate valuation';
  if ('response' in err && typeof err.response === 'object') {
    const apiError = err as { response: { data: { detail: string } } };
    errorMessage = apiError.response.data.detail;
  } else {
    errorMessage = err.message;
  }
  
  setError(errorMessage);
}
```

#### **Task 3.2: Extract URL Configuration (1 day)**

```typescript
// config/api.ts
export const API_CONFIG = {
  // Backend (Node.js for auth/saving)
  BACKEND: import.meta.env.VITE_BACKEND_URL || 
           import.meta.env.VITE_API_BASE_URL || 
           'https://web-production-8d00b.up.railway.app',
  
  // Valuation Engine (Python)
  VALUATION_ENGINE: import.meta.env.VITE_VALUATION_ENGINE_URL || 
                    import.meta.env.VITE_VALUATION_API_URL || 
                    'https://upswitch-valuation-engine-production.up.railway.app',
  
  // Parent domain (for PostMessage)
  PARENT_DOMAIN: import.meta.env.VITE_PARENT_DOMAIN || 
                 'https://upswitch.biz',
  
  // Timeouts & Retries
  TIMEOUT: 30_000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1_000,
} as const;

export type ApiConfigKey = keyof typeof API_CONFIG;
```

**Update all files:**

```typescript
// ❌ Before
const API_URL = import.meta.env.VITE_BACKEND_URL || '...';

// ✅ After
import { API_CONFIG } from '@/config/api';
const API_URL = API_CONFIG.BACKEND;
```

#### **Task 3.3: Add Performance Monitoring (1 day)**

```typescript
// utils/performance.ts
import { logger } from './logger';

export const measurePerformance = (name: string, threshold = 100) => {
  const start = performance.now();
  
  return () => {
    const duration = performance.now() - start;
    
    if (duration > threshold) {
      logger.warn('[Performance] Slow operation', { name, duration, threshold });
    } else {
      logger.debug('[Performance] Operation completed', { name, duration });
    }
    
    return duration;
  };
};

export const usePerformance = (name: string) => {
  const [duration, setDuration] = useState<number | null>(null);
  
  const start = useRef<number>(0);
  
  const startMeasure = useCallback(() => {
    start.current = performance.now();
  }, []);
  
  const endMeasure = useCallback(() => {
    const d = performance.now() - start.current;
    setDuration(d);
    
    if (d > 100) {
      logger.warn('[Performance] Slow component render', { name, duration: d });
    }
  }, [name]);
  
  return { duration, startMeasure, endMeasure };
};
```

**Usage:**

```typescript
// In calculateValuation
const stopMeasuring = measurePerformance('calculateValuation');
try {
  await api.calculateValuation(request);
} finally {
  stopMeasuring();
}
```

---

## 🚀 Quick Wins (Start Here)

### **1. Create and Use Logger (1 day)**

**Step 1: Create logger (1 hour)**
```bash
# Create file
touch src/utils/logger.ts

# Copy logger code from Task 1.1 above
```

**Step 2: Update top 5 files (6 hours)**
1. contexts/AuthContext.tsx
2. store/useValuationStore.ts  
3. services/registryService.ts
4. controllers/chat/valuationChatController.ts
5. components/registry/AIAssistedValuation.tsx

**Step 3: Test (1 hour)**
```bash
yarn dev
# Test that logging still works in console
# Verify no errors
```

### **2. Extract URL Config (1-2 hours)**

```typescript
// 1. Create config/api.ts
// 2. Copy API_CONFIG code from Task 3.2
// 3. Find/replace in 3 files:
//    - contexts/AuthContext.tsx
//    - store/useValuationStore.ts
//    - services/api.ts
```

### **3. Add Error Boundary (2 hours)**

```typescript
// 1. Create components/ErrorBoundary.tsx
// 2. Copy code from Task 1.4
// 3. Wrap routes in router/index.tsx
// 4. Test by throwing error in component
```

---

## 📊 Progress Tracking

### **Sprint 1 Checklist:**
- [ ] Create centralized logger
- [ ] Replace all 104 console.log calls
- [ ] Set up Vitest testing infrastructure
- [ ] Write tests for useValuationStore
- [ ] Write tests for transformationService
- [ ] Add error boundaries to routes

### **Sprint 2 Checklist:**
- [ ] Split Results.tsx into sections
- [ ] Split EnhancedConversationalChat.tsx
- [ ] Extract hooks from large components
- [ ] Extract formatting utilities
- [ ] Update imports across codebase

### **Sprint 3 Checklist:**
- [ ] Fix top 30 `any` types
- [ ] Extract URL configuration
- [ ] Add performance monitoring
- [ ] Add JSDoc comments to public APIs
- [ ] Final testing and documentation

---

## ✅ Definition of Done

For each task:

- [ ] Code changes implemented
- [ ] No new console.log (use logger)
- [ ] Types properly defined (minimal `any`)
- [ ] Tests added/updated
- [ ] No linter warnings
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Peer reviewed

---

**Ready to start? Begin with [Quick Wins](#quick-wins)!**

**Remember:** This is preventive maintenance, not crisis management. Take time to do it right! 🚀

