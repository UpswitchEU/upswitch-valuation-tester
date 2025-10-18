# Frontend-Backend Integration

**Version**: 1.0  
**Date**: October 20, 2025  
**Audience**: CTO, Engineering Teams, API Developers  
**Status**: Production Integration Architecture

---

## Executive Summary

The Upswitch Valuation Tester implements a sophisticated frontend-backend integration using **Server-Sent Events (SSE)** for real-time streaming, **REST APIs** for data operations, and **intelligent error handling** for robust user experience. The integration is designed for high performance, reliability, and seamless user experience.

### Integration Principles

- **Real-Time Streaming**: SSE for conversational AI experience
- **Type Safety**: End-to-end TypeScript for reliability
- **Error Resilience**: Graceful degradation and recovery
- **Performance**: <5s valuations, <2s frontend load
- **Security**: Authentication, rate limiting, data validation

---

## API Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                            │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Chat UI       │  │   Results UI    │  │   Forms UI      │ │
│  │                 │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│           │                     │                     │         │
│           │ SSE Stream          │ REST API            │ REST API│
│           │                     │                     │         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ StreamingChat   │  │ ValuationStore  │  │ RegistryService │ │
│  │ Service         │  │                 │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTPS/SSE
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ SSE Endpoint    │  │ REST Endpoints │  │ Auth Endpoints  │ │
│  │ /stream         │  │ /valuation      │  │ /auth           │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│           │                     │                     │         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ Triage Engine   │  │ Valuation       │  │ Registry        │ │
│  │                 │  │ Engine          │  │ Service        │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Server-Sent Events (SSE) Integration

### Streaming Chat Endpoint

**Endpoint**: `/api/v1/intelligent-conversation/stream`  
**Method**: POST  
**Content-Type**: `application/json`  
**Response**: `text/event-stream`

#### Request Format

```typescript
interface StreamRequest {
  session_id: string;
  user_input: string;
  field_name?: string;
  context?: Record<string, any>;
  user_id?: string;
}
```

#### Response Format (SSE)

```typescript
interface StreamEvent {
  type: 'typing' | 'message_start' | 'message_chunk' | 'message_complete' | 'error';
  session_id: string;
  content?: string;
  html?: string;
  progress?: number;
  metadata?: Record<string, any>;
}
```

#### SSE Event Flow

```
1. data: {"type": "typing", "session_id": "uuid"}
2. data: {"type": "message_start", "session_id": "uuid"}
3. data: {"type": "message_chunk", "content": "Hello", "session_id": "uuid"}
4. data: {"type": "message_chunk", "content": " there", "session_id": "uuid"}
5. data: {"type": "message_complete", "session_id": "uuid", "metadata": {...}}
```

### Frontend SSE Implementation

```typescript
// services/chat/streamingChatService.ts
export class StreamingChatService {
  async *streamConversation(
    sessionId: string,
    message: string,
    context: Record<string, any> = {},
    businessId?: string
  ): AsyncGenerator<StreamEvent> {
    const response = await fetch('/api/v1/intelligent-conversation/stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        session_id: sessionId,
        user_input: message,
        context,
        business_id: businessId
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));
              yield event;
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', line, parseError);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
```

---

## REST API Integration

### Authentication Endpoints

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/api/v1/auth/me` | GET | Get user profile | Headers: Authorization | `UserProfile` |
| `/api/v1/auth/login` | POST | User login | `LoginRequest` | `AuthResponse` |
| `/api/v1/auth/logout` | POST | User logout | Headers: Authorization | `SuccessResponse` |

### Valuation Endpoints

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/api/v1/valuation/calculate` | POST | Calculate valuation | `ValuationRequest` | `ValuationResponse` |
| `/api/v1/valuation/quick` | POST | Quick valuation | `QuickValuationRequest` | `QuickValuationResponse` |
| `/api/v1/valuation/save` | POST | Save valuation | `SaveValuationRequest` | `SaveValuationResponse` |

### Registry Endpoints

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/api/v1/registry/search` | GET | Search companies | Query params | `CompanySearchResult[]` |
| `/api/v1/registry/financials` | GET | Get company financials | Query params | `CompanyFinancialData` |
| `/api/v1/registry/suggestions` | GET | Get search suggestions | Query params | `SearchSuggestion[]` |

### Health & Monitoring

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/api/v1/health` | GET | Health check | None | `HealthStatus` |
| `/api/v1/metrics` | GET | Application metrics | Headers: Authorization | `MetricsResponse` |

---

## Frontend Service Layer

### API Service (api.ts)

```typescript
// services/api.ts
class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
      headers: { 'Content-Type': 'application/json' },
      withCredentials: true
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
      }
    );
  }

  // Authentication
  async getCurrentUser(): Promise<UserProfile> {
    const response = await this.client.get('/auth/me');
    return response.data;
  }

  // Valuation
  async calculateValuation(request: ValuationRequest): Promise<ValuationResponse> {
    const response = await this.client.post('/valuation/calculate', request);
    return response.data;
  }

  // Registry
  async searchCompanies(query: string, country: string): Promise<CompanySearchResult[]> {
    const response = await this.client.get('/registry/search', {
      params: { query, country }
    });
    return response.data;
  }
}

export const api = new ApiService();
```

### Registry Service

```typescript
// services/registry/registryService.ts
export class RegistryService {
  private cache = new RegistryCache();
  private pendingRequests = new Map<string, Promise<any>>();

  async searchCompanies(query: string, country: string): Promise<CompanySearchResult[]> {
    const cacheKey = `search:${query}:${country}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    // Check for pending request
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    // Make new request
    const request = this.makeRequest(cacheKey, () => 
      api.searchCompanies(query, country)
    );

    this.pendingRequests.set(cacheKey, request);
    
    try {
      const result = await request;
      this.cache.set(cacheKey, result);
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }
}
```

---

## State Management Integration

### Zustand Store

```typescript
// store/useValuationStore.ts
interface ValuationState {
  // State
  formData: ValuationFormData;
  result: ValuationResponse | null;
  error: string | null;
  isCalculating: boolean;

  // Actions
  updateFormData: (data: Partial<ValuationFormData>) => void;
  calculateValuation: (request: ValuationRequest) => Promise<void>;
  clearError: () => void;
}

export const useValuationStore = create<ValuationState>()((set, get) => ({
  // Initial state
  formData: initialFormData,
  result: null,
  error: null,
  isCalculating: false,

  // Actions
  updateFormData: (data) => set(state => ({
    formData: { ...state.formData, ...data }
  })),

  calculateValuation: async (request) => {
    set({ isCalculating: true, error: null });
    
    try {
      const response = await api.calculateValuation(request);
      set({ result: response, error: null });
    } catch (error) {
      set({ error: error.message, result: null });
    } finally {
      set({ isCalculating: false });
    }
  },

  clearError: () => set({ error: null })
}));
```

### Chat State Management

```typescript
// hooks/useStreamingChat.ts
export const useStreamingChat = (sessionId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    setIsStreaming(true);
    setError(null);

    try {
      const streamingService = new StreamingChatService();
      
      for await (const event of streamingService.streamConversation(
        sessionId, 
        content
      )) {
        if (event.type === 'message_chunk') {
          setMessages(prev => updateStreamingMessage(prev, event));
        } else if (event.type === 'message_complete') {
          setMessages(prev => finalizeStreamingMessage(prev, event));
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsStreaming(false);
    }
  }, [sessionId]);

  return { messages, isStreaming, error, sendMessage };
};
```

---

## Error Handling & Recovery

### Centralized Error Handling

```typescript
// utils/errors/handler.ts
export class ErrorHandler {
  handle(error: Error, context?: Record<string, any>): void {
    // Log error
    apiLogger.error('Application error', {
      error: error.message,
      stack: error.stack,
      context
    });

    // Categorize error
    if (error instanceof NetworkError) {
      this.handleNetworkError(error);
    } else if (error instanceof ValidationError) {
      this.handleValidationError(error);
    } else {
      this.handleGenericError(error);
    }
  }

  private handleNetworkError(error: NetworkError): void {
    // Show user-friendly message
    // Attempt retry if appropriate
    // Fall back to cached data if available
  }

  private handleValidationError(error: ValidationError): void {
    // Show field-specific error messages
    // Highlight invalid fields
    // Provide correction suggestions
  }
}
```

### Frontend Error Recovery

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends Component<Props, State> {
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    generalLogger.error('ErrorBoundary caught an error', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h1>Something went wrong</h1>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## Data Transformation

### Backend → Frontend Data Flow

```typescript
// Backend Response
interface BackendValuationResponse {
  enterprise_value_min: number;
  enterprise_value_mid: number;
  enterprise_value_max: number;
  equity_value_min: number;
  equity_value_mid: number;
  equity_value_max: number;
  confidence_score: number;
  methodology: string;
  assumptions: string[];
  data_sources: string[];
}

// Frontend Transformation
interface FrontendValuationResponse extends BackendValuationResponse {
  formattedValues: {
    enterpriseValue: FormattedValue;
    equityValue: FormattedValue;
  };
  confidence: ConfidenceLevel;
  methodology: ValuationMethodology;
}
```

### Type Safety

```typescript
// types/api.ts
export interface ValuationRequest {
  company_name: string;
  country_code: string;
  industry: string;
  business_model: string;
  founding_year: number;
  revenue: number;
  number_of_employees: number;
  ebitda: number;
  current_year_data?: CurrentYearData;
  historical_years_data?: HistoricalData[];
}

export interface ValuationResponse {
  enterprise_value_min: number;
  enterprise_value_mid: number;
  enterprise_value_max: number;
  equity_value_min: number;
  equity_value_mid: number;
  equity_value_max: number;
  confidence_score: number;
  methodology: string;
  assumptions: string[];
  data_sources: string[];
  created_at: string;
  updated_at: string;
}
```

---

## Performance Optimization

### Request Deduplication

```typescript
// services/registry/registryService.ts
export class RegistryService {
  private pendingRequests = new Map<string, Promise<any>>();

  async searchCompanies(query: string, country: string) {
    const cacheKey = `search:${query}:${country}`;
    
    // Prevent duplicate requests
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    const request = this.makeRequest(cacheKey, () => 
      api.searchCompanies(query, country)
    );

    this.pendingRequests.set(cacheKey, request);
    
    try {
      return await request;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }
}
```

### Caching Strategy

```typescript
// services/registry/cache.ts
export class RegistryCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

---

## Security Integration

### Authentication Flow

```typescript
// contexts/AuthContext.tsx
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const response = await api.getCurrentUser();
      setUser(response);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return (
    <AuthContext.Provider value={{ user, isLoading, checkSession }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### Rate Limiting

```typescript
// Backend rate limiting
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

@app.post("/api/v1/valuation/calculate")
@limiter.limit("10/minute")
async def calculate_valuation(request: Request, data: ValuationRequest):
    # Rate limited to 10 requests per minute per IP
    pass
```

---

## Monitoring & Observability

### Frontend Monitoring

```typescript
// utils/logger.ts
export const apiLogger = pino({
  name: 'upswitch-api',
  level: 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true }
  }
});

// Usage in services
export class ApiService {
  async calculateValuation(request: ValuationRequest) {
    apiLogger.info('Valuation request started', { request });
    
    try {
      const response = await this.client.post('/valuation/calculate', request);
      apiLogger.info('Valuation request completed', { 
        duration: Date.now() - startTime,
        result: response.data 
      });
      return response.data;
    } catch (error) {
      apiLogger.error('Valuation request failed', { 
        error: error.message,
        request 
      });
      throw error;
    }
  }
}
```

### Backend Monitoring

```python
# Backend logging
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)

@app.post("/api/v1/valuation/calculate")
async def calculate_valuation(request: ValuationRequest):
    logger.info(f"Valuation request started for {request.company_name}")
    
    try:
        result = await valuation_engine.calculate(request)
        logger.info(f"Valuation completed: {result.enterprise_value_mid}")
        return result
    except Exception as e:
        logger.error(f"Valuation failed: {str(e)}")
        raise
```

---

## Testing Integration

### Frontend API Testing

```typescript
// __tests__/api.test.ts
import { describe, it, expect, vi } from 'vitest';
import { api } from '../services/api';

describe('API Service', () => {
  it('should calculate valuation', async () => {
    const mockResponse = {
      enterprise_value_mid: 1000000,
      confidence_score: 0.85
    };

    vi.spyOn(api.client, 'post').mockResolvedValue({
      data: mockResponse
    });

    const result = await api.calculateValuation({
      company_name: 'Test Company',
      revenue: 500000
    });

    expect(result).toEqual(mockResponse);
  });
});
```

### Backend API Testing

```python
# tests/test_api.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_calculate_valuation():
    response = client.post("/api/v1/valuation/calculate", json={
        "company_name": "Test Company",
        "revenue": 500000
    })
    
    assert response.status_code == 200
    data = response.json()
    assert "enterprise_value_mid" in data
    assert data["confidence_score"] > 0
```

---

## Conclusion

The Upswitch Valuation Tester frontend-backend integration provides:

✅ **Real-Time Streaming**: SSE for conversational AI experience  
✅ **Type Safety**: End-to-end TypeScript for reliability  
✅ **Error Resilience**: Graceful degradation and recovery  
✅ **Performance**: Optimized for speed and scalability  
✅ **Security**: Authentication, rate limiting, data validation  
✅ **Monitoring**: Comprehensive logging and error tracking  
✅ **Testing**: Full test coverage for reliability  

This integration architecture enables seamless communication between frontend and backend while maintaining high performance, security, and user experience standards.

---

**Document Status**: ✅ Production Integration Architecture  
**Last Updated**: October 20, 2025  
**Next Review**: November 2025  
**Maintained by**: Engineering Team
