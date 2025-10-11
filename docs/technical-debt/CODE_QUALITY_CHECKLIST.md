# ✅ Code Quality Checklist - Valuation Tester

**Quick Reference for Developers**

---

## 🚫 Never Do This

### **1. Never use console.log**
```typescript
// ❌ NEVER
console.log('Valuation started');
console.error('Error:', error);
console.warn('Warning');

// ✅ ALWAYS use logger
import { logger } from '@/utils/logger';
logger.info('[Valuation] Started');
logger.error('[Error] Failed', { error });
logger.warn('[Warning] Issue detected');
```

### **2. Never use `any` type without justification**
```typescript
// ❌ NEVER
const data: any = fetchData();
const [state, setState] = useState<any>(null);

// ✅ ALWAYS define proper types
interface ValuationData {
  companyName: string;
  value: number;
}
const data: ValuationData = fetchData();
const [state, setState] = useState<ValuationData | null>(null);
```

### **3. Never hardcode URLs**
```typescript
// ❌ NEVER
const API_URL = 'https://web-production-8d00b.up.railway.app';

// ✅ ALWAYS use config
import { API_CONFIG } from '@/config/api';
const API_URL = API_CONFIG.BACKEND;
```

### **4. Never create files over 400 lines**
```typescript
// ❌ NEVER - 700+ line component
const HugeComponent = () => {
  // Too much logic
  // Too much JSX
};

// ✅ ALWAYS split into smaller pieces
// Component.tsx (150 lines)
// hooks/useComponent.ts (100 lines)
// components/Section1.tsx (80 lines)
// components/Section2.tsx (70 lines)
```

### **5. Never disable eslint** ✅
```typescript
// ❌ NEVER
/* eslint-disable */
// This codebase has ZERO eslint-disable - keep it that way!

// ✅ ALWAYS fix the issue properly
```

---

## ✅ Always Do This

### **1. Always use centralized logger**
```typescript
import { logger } from '@/utils/logger';

// ✅ Different log levels
logger.debug('Detailed debug info', { data });
logger.info('General info', { userId });
logger.warn('Warning message', { issue });
logger.error('Error occurred', { error, context });

// ✅ Domain-specific loggers
logger.api.request('POST', '/api/valuation', payload);
logger.api.success('Valuation calculated', response);
logger.api.error('API failed', error);

logger.valuation.started('instant');
logger.valuation.completed('Acme Corp', 1_000_000);
logger.valuation.failed(error);

logger.auth.login(userId);
logger.auth.logout();
logger.auth.error('Login failed');
```

### **2. Always use proper TypeScript types**
```typescript
// ✅ Define interfaces
interface ValuationRequest {
  company_name: string;
  revenue: number;
  ebitda: number;
  industry: string;
  country_code: string;
}

// ✅ Type all variables
const request: ValuationRequest = {
  company_name: 'Test Co',
  revenue: 1_000_000,
  ebitda: 200_000,
  industry: 'services',
  country_code: 'BE',
};

// ✅ Type function parameters and returns
async function calculateValuation(
  request: ValuationRequest
): Promise<ValuationResponse> {
  // ...
}
```

### **3. Always extract custom hooks**
```typescript
// ✅ Extract complex logic
// hooks/useValuationCalculation.ts
export const useValuationCalculation = () => {
  const [result, setResult] = useState<ValuationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const calculate = useCallback(async (request: ValuationRequest) => {
    setLoading(true);
    try {
      const response = await api.calculateValuation(request);
      setResult(response);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { result, loading, error, calculate };
};

// Component.tsx
const { result, loading, error, calculate } = useValuationCalculation();
```

### **4. Always use error boundaries**
```typescript
// ✅ Wrap routes
import { ErrorBoundary } from '@/components/ErrorBoundary';

<ErrorBoundary level="page">
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/reports" element={<Reports />} />
  </Routes>
</ErrorBoundary>

// ✅ Wrap risky components
<ErrorBoundary level="component">
  <ComplexChart data={data} />
</ErrorBoundary>
```

### **5. Always handle errors properly**
```typescript
// ✅ Standard pattern
try {
  const result = await api.calculateValuation(request);
  return result;
} catch (error) {
  const err = error as Error;
  
  logger.error('[Valuation] Calculation failed', {
    error: err.message,
    request,
  });
  
  setError(err.message);
  throw err; // Re-throw if needed
}
```

### **6. Always memoize expensive operations**
```typescript
// ✅ Memoize calculations
const filteredResults = useMemo(
  () => results.filter(r => r.equity_value_mid > threshold),
  [results, threshold]
);

// ✅ Memoize callbacks
const handleCalculate = useCallback(
  async () => {
    await calculate(formData);
  },
  [formData, calculate]
);

// ✅ Memoize components
const ResultsSection = React.memo<Props>(({ result }) => {
  return <div>{/* expensive render */}</div>;
});
```

### **7. Always use configuration constants**
```typescript
// config/api.ts
export const API_CONFIG = {
  BACKEND: import.meta.env.VITE_BACKEND_URL || 'https://...',
  VALUATION_ENGINE: import.meta.env.VITE_VALUATION_ENGINE_URL || 'https://...',
  PARENT_DOMAIN: import.meta.env.VITE_PARENT_DOMAIN || 'https://upswitch.biz',
  TIMEOUT: 30_000,
} as const;

// ✅ Use constants
import { API_CONFIG } from '@/config/api';
const response = await fetch(API_CONFIG.VALUATION_ENGINE, {
  signal: AbortSignal.timeout(API_CONFIG.TIMEOUT),
});
```

---

## 📏 Component Size Guidelines

### **Target:**
- **Components:** < 250 lines
- **Hooks:** < 100 lines
- **Services:** < 200 lines
- **Types:** < 150 lines per file

### **If exceeding limits:**

**1. Extract hooks:**
```typescript
// Before: 700-line component
const HugeComponent = () => {
  const [state1, setState1] = useState();
  const [state2, setState2] = useState();
  // ... 10 more useState
  
  useEffect(() => { /* 100 lines */ }, []);
  
  // ... huge JSX
};

// After: Split into hooks
const useComponentState = () => { /* 50 lines */ };
const useComponentLogic = () => { /* 80 lines */ };

const Component = () => {
  const state = useComponentState();
  const logic = useComponentLogic();
  
  return <div>/* clean JSX */</div>;
};
```

**2. Split into sections:**
```typescript
// Before: Monolithic Results component (590 lines)
const Results = () => {
  return (
    <div>
      {/* 100 lines of enterprise value */}
      {/* 100 lines of ownership */}
      {/* 100 lines of metrics */}
      {/* 100 lines of drivers */}
      {/* 100 lines of risks */}
    </div>
  );
};

// After: Split into sections
const Results = () => {
  return (
    <div>
      <EnterpriseValue result={result} />
      <OwnershipAdjustment result={result} />
      <GrowthMetrics result={result} />
      <ValueDrivers result={result} />
      <RiskFactors result={result} />
    </div>
  );
};
```

---

## 🎯 State Management Rules

### **When to use what:**

**1. Zustand Store (useValuationStore)**
- Valuation form data
- Calculation results
- Global app state
```typescript
const { formData, result, calculateValuation } = useValuationStore();
```

**2. Component State (useState)**
- Local UI state
- Form inputs
- Toggles, modals
```typescript
const [isOpen, setIsOpen] = useState(false);
const [inputValue, setInputValue] = useState('');
```

**3. Context (AuthContext)**
- User authentication
- Cross-domain auth
```typescript
const { user, isAuthenticated } = useAuth();
```

**4. Derived State (useMemo)**
- Computed from other state
- Expensive calculations
```typescript
const totalValue = useMemo(
  () => result.equity_value_mid * (sharesForSale / 100),
  [result, sharesForSale]
);
```

### **Never:**
- ❌ Don't use Zustand for local UI state
- ❌ Don't use useState for derived state
- ❌ Don't prop drill more than 2 levels

---

## 🔧 API Call Guidelines

### **Always use centralized API service:**
```typescript
// ✅ Use api service
import { api } from '@/services/api';

const response = await api.calculateValuation(request);
const quick = await api.quickValuation(quickRequest);

// ❌ Never use fetch directly in components
const response = await fetch('/api/valuation', { ... }); // NO!
```

### **Always handle loading, errors, and success:**
```typescript
// ✅ Proper pattern
const [data, setData] = useState<Data | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const result = await api.calculateValuation(request);
    setData(result);
    
    logger.valuation.completed(request.company_name, result.equity_value_mid);
  } catch (err) {
    const error = err as Error;
    setError(error.message);
    logger.valuation.failed(error);
  } finally {
    setLoading(false);
  }
};

// Render
if (loading) return <Spinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return null;

return <Results data={data} />;
```

---

## 📝 TypeScript Best Practices

### **1. Use strict types**
```typescript
// ✅ Specific types
type ValuationMethod = 'instant' | 'manual' | 'registry';
type Status = 'idle' | 'loading' | 'success' | 'error';

// ❌ Loose types
type Method = string; // Too loose!
```

### **2. Use interfaces for objects**
```typescript
// ✅ Interface
interface ValuationRequest {
  company_name: string;
  revenue: number;
  ebitda: number;
  industry: string;
}

// ✅ Type for unions
type Method = 'instant' | 'manual' | 'registry';
```

### **3. Use const objects instead of enums**
```typescript
// ❌ Avoid enums
enum Status {
  Idle,
  Loading,
  Success,
}

// ✅ Use const objects
export const STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export type Status = typeof STATUS[keyof typeof STATUS];
```

### **4. Use type guards**
```typescript
// ✅ Type guard
function isValuationResponse(value: unknown): value is ValuationResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'equity_value_mid' in value &&
    'equity_value_low' in value
  );
}

// Usage
if (isValuationResponse(data)) {
  console.log(data.equity_value_mid); // TypeScript knows the type
}
```

---

## 🧪 Testing Guidelines

### **1. Test critical paths**
```typescript
// ✅ Test valuation calculation
describe('useValuationStore', () => {
  it('should calculate valuation successfully', async () => {
    const { result } = renderHook(() => useValuationStore());
    
    act(() => {
      result.current.updateFormData({
        company_name: 'Test Co',
        revenue: 1_000_000,
        ebitda: 200_000,
        industry: 'services',
      });
    });
    
    await act(async () => {
      await result.current.calculateValuation();
    });
    
    expect(result.current.result).toBeDefined();
    expect(result.current.result?.equity_value_mid).toBeGreaterThan(0);
  });
});
```

### **2. Test error handling**
```typescript
// ✅ Test error states
it('should handle API errors gracefully', async () => {
  vi.spyOn(api, 'calculateValuation').mockRejectedValue(
    new Error('API Error')
  );
  
  const { result } = renderHook(() => useValuationStore());
  
  await act(async () => {
    await result.current.calculateValuation();
  });
  
  expect(result.current.error).toBe('API Error');
  expect(result.current.result).toBeNull();
});
```

### **3. Test data transformations**
```typescript
// ✅ Test transformation service
describe('transformationService', () => {
  it('should transform registry data correctly', () => {
    const registryData: CompanyFinancialData = { ... };
    const request = transformToValuationRequest(registryData);
    
    expect(request.company_name).toBe('Test Company');
    expect(request.current_year_data.revenue).toBe(1_000_000);
  });
});
```

---

## 🎨 Component Patterns

### **1. Container/Presentation Pattern**
```typescript
// ✅ Container (logic)
const ValuationContainer = () => {
  const { result, loading, error } = useValuationCalculation();
  
  if (loading) return <Spinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <ValuationResults result={result} />;
};

// ✅ Presentation (UI)
interface Props {
  result: ValuationResponse;
}

const ValuationResults: React.FC<Props> = ({ result }) => {
  return (
    <div>
      <h2>Value: {formatCurrency(result.equity_value_mid)}</h2>
    </div>
  );
};
```

### **2. Custom Hook Pattern**
```typescript
// ✅ Reusable logic in hook
const useCompanyLookup = () => {
  const [company, setCompany] = useState<CompanyFinancialData | null>(null);
  const [loading, setLoading] = useState(false);
  
  const lookup = useCallback(async (name: string) => {
    setLoading(true);
    try {
      const result = await service.lookupCompany(name);
      setCompany(result);
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { company, loading, lookup };
};

// Usage
const { company, loading, lookup } = useCompanyLookup();
```

---

## 📊 Performance Checklist

### **Before Committing:**

- [ ] No unnecessary re-renders (React DevTools Profiler)
- [ ] Expensive calculations memoized with `useMemo`
- [ ] Callbacks memoized with `useCallback`
- [ ] Images optimized and lazy-loaded
- [ ] No memory leaks (cleanup in useEffect)
- [ ] Bundle size acceptable

### **Performance Tips:**

```typescript
// ✅ Lazy load routes
import { lazy, Suspense } from 'react';

const Reports = lazy(() => import('@/pages/Reports'));

<Suspense fallback={<Spinner />}>
  <Route path="/reports" element={<Reports />} />
</Suspense>

// ✅ Measure performance
import { measurePerformance } from '@/utils/performance';

const stopMeasuring = measurePerformance('calculateValuation');
await calculateValuation();
stopMeasuring(); // Logs if > 100ms
```

---

## 🔒 Security Checklist

### **Before Committing:**

- [ ] No API keys in code
- [ ] All user input validated
- [ ] Authentication checked via cookies
- [ ] No sensitive data in logs
- [ ] HTTP-only cookies for auth
- [ ] CORS properly configured

---

## ✅ Pre-Commit Checklist

Before every commit, verify:

### **Code Quality:**
- [ ] No console.log (use logger)
- [ ] No unnecessary `any` types
- [ ] No files over 400 lines
- [ ] No hardcoded URLs
- [ ] No magic numbers

### **TypeScript:**
- [ ] All types properly defined
- [ ] No type errors (`yarn type-check`)
- [ ] Proper type guards where needed

### **Testing:**
- [ ] Tests added for new features
- [ ] All tests pass (`yarn test`)
- [ ] Critical paths have coverage

### **Performance:**
- [ ] No unnecessary re-renders
- [ ] Memoization where needed
- [ ] Images optimized
- [ ] Bundle size acceptable

### **Documentation:**
- [ ] JSDoc for complex functions
- [ ] README updated if needed
- [ ] Types exported properly

### **Git:**
- [ ] Meaningful commit message
- [ ] Changes logically grouped
- [ ] No debug code
- [ ] No commented-out code

---

## 🚀 Quick Commands

```bash
# Type check
yarn type-check

# Lint
yarn lint

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage

# Run tests in watch mode
yarn test

# Build for production
yarn build

# Preview production build
yarn preview

# Development
yarn dev

# Check bundle size
yarn build && npx vite-bundle-analyzer dist
```

---

## 🎯 This Codebase Is Already Good!

**Key Metrics:**
- ✅ **0 eslint-disable statements** (Perfect!)
- ✅ **53 `any` types** (vs 250+ in main frontend)
- ✅ **Clean architecture** (Controller → Service)
- ✅ **Small codebase** (57 files vs 529)
- 🟡 **104 console.log** (Fix with logger)
- 🔴 **0% test coverage** (Add tests)

**Goal:** Keep it this way! Follow these guidelines to maintain quality. 🚀

---

**Print this out and keep at your desk! 🖨️**


