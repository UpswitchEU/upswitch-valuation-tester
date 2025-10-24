# 🔐 AI-Guided Authentication Guide

**Document:** Valuation Tester Authentication  
**Date:** October 24, 2025  
**Status:** ✅ Implemented  
**Author:** UpSwitch Engineering Team  
**Purpose:** Authentication requirements and user experience for AI-guided valuations

---

## 📋 Executive Summary

AI-guided valuations require user authentication to access the premium feature. This ensures proper credit management and provides a personalized experience. Manual valuations remain free and accessible to all users.

### 🎯 Authentication Requirements

| Flow Type | Authentication | Credit Cost | Access Level |
|-----------|----------------|-------------|--------------|
| **Manual Entry** | ❌ Not Required | FREE | Guest + Authenticated |
| **AI-Guided** | ✅ Required | 1 Credit | Authenticated Only |

---

## 🔐 Authentication Flow

### 1. User Journey Overview

#### Guest User Experience
```
Guest visits valuation tool
├── Can use Manual Entry (FREE)
├── Cannot use AI-Guided (requires auth)
└── Sees login prompts for AI-Guided
```

#### Authenticated User Experience
```
Authenticated user visits tool
├── Can use Manual Entry (FREE)
├── Can use AI-Guided (1 credit)
└── Sees credit balance and options
```

### 2. Authentication Check Implementation

#### Flow Selection Logic
```typescript
const handleFlowSelection = (flow: 'manual' | 'ai-guided') => {
  // Check authentication for AI-guided flow
  if (flow === 'ai-guided' && !isAuthenticated) {
    setError('AI-Guided valuation requires authentication. Please sign in to continue.');
    return;
  }
  
  setFlowType(flow);
  setStage('data-entry');
};
```

#### Authentication State Management
```typescript
const { user, isAuthenticated } = useAuth();

// Check authentication status
useEffect(() => {
  if (isAuthenticated) {
    // Load user credits and preferences
    loadUserData();
  } else {
    // Show guest options only
    setAvailableFlows(['manual']);
  }
}, [isAuthenticated]);
```

---

## 🎨 User Interface Design

### Authentication Prompts

#### AI-Guided Selection for Guests
```
┌─────────────────────────────────────────────────────────┐
│  🤖 AI-Guided Valuation                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ AI-powered guidance                            │   │
│  │ Higher accuracy (1 credit)                    │   │
│  │ Personalized experience                       │   │
│  │                                                 │   │
│  │ 🔒 Authentication Required                     │   │
│  │ Please sign in to access this feature         │   │
│  │                                                 │   │
│  │ [Sign In] [Sign Up]                            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

#### Error Message Display
```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Authentication Required                             │
│                                                         │
│  AI-Guided valuation requires authentication.           │
│  Please sign in to continue.                           │
│                                                         │
│  [Sign In] [Sign Up] [Cancel]                          │
└─────────────────────────────────────────────────────────┘
```

### Authentication Status Display

#### Authenticated User Header
```
┌─────────────────────────────────────────────────────────┐
│  👤 John Doe                    💳 5 credits remaining  │
│  Valuation Report                    val_1234567890_abc │
└─────────────────────────────────────────────────────────┘
```

#### Guest User Header
```
┌─────────────────────────────────────────────────────────┐
│  👤 Guest User                    💳 Sign in for credits │
│  Valuation Report                    val_1234567890_abc │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 Authentication Integration

### Token Handling

#### Token Validation
```typescript
const validateToken = async (token: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/auth/validate', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Token validation failed:', error);
    return false;
  }
};
```

#### Token Storage
```typescript
// Store token securely
const storeToken = (token: string) => {
  localStorage.setItem('auth_token', token);
  // Set token in API client
  apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};
```

### User Data Loading

#### Load User Profile
```typescript
const loadUserProfile = async () => {
  try {
    const response = await apiClient.get('/api/user/profile');
    const { user, credits, subscription } = response.data;
    
    setUser(user);
    setCredits(credits);
    setSubscription(subscription);
  } catch (error) {
    console.error('Failed to load user profile:', error);
    // Handle authentication error
    handleAuthError(error);
  }
};
```

#### Credit Balance Display
```typescript
const CreditDisplay = () => {
  const { creditsRemaining, isPremium } = useCredits();
  
  if (isPremium) {
    return <span className="text-green-400">Unlimited</span>;
  }
  
  return (
    <span className="text-white">
      {creditsRemaining} credits remaining
    </span>
  );
};
```

---

## 🚪 Login/Registration Flow

### Authentication Options

#### Login Methods
```
┌─────────────────────────────────────────────────────────┐
│  Sign In to Continue                                    │
│                                                         │
│  [Email & Password]                                     │
│  [Google] [GitHub] [LinkedIn]                          │
│  [Magic Link]                                           │
│                                                         │
│  Don't have an account? [Sign Up]                      │
└─────────────────────────────────────────────────────────┘
```

#### Registration Methods
```
┌─────────────────────────────────────────────────────────┐
│  Create Account                                        │
│                                                         │
│  [Email & Password]                                     │
│  [Google] [GitHub] [LinkedIn]                          │
│                                                         │
│  Already have an account? [Sign In]                    │
└─────────────────────────────────────────────────────────┘
```

### Authentication Modal

#### Modal Implementation
```typescript
const AuthenticationModal = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="auth-modal">
        <h2>{mode === 'login' ? 'Sign In' : 'Create Account'}</h2>
        
        {mode === 'login' ? (
          <LoginForm onSuccess={onSuccess} />
        ) : (
          <RegisterForm onSuccess={onSuccess} />
        )}
        
        <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'Create Account' : 'Sign In'}
        </button>
      </div>
    </Modal>
  );
};
```

---

## 💳 Credit Management

### Credit Requirements

#### AI-Guided Flow Credit Check
```typescript
const checkCreditsForAIGuided = async () => {
  const { creditsRemaining, isPremium } = useCredits();
  
  if (isPremium) {
    return true; // Unlimited credits
  }
  
  if (creditsRemaining < 1) {
    setError('Insufficient credits. You need 1 credit for AI-guided valuation.');
    return false;
  }
  
  return true;
};
```

#### Credit Display in UI
```typescript
const CreditStatus = () => {
  const { creditsRemaining, isPremium, isLoading } = useCredits();
  
  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-8 w-24 rounded" />;
  }
  
  if (isPremium) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-green-400">Unlimited</span>
        <span className="text-xs text-gray-400">Premium</span>
      </div>
    );
  }
  
  return (
    <div className="flex items-center gap-2">
      <span className="text-white">{creditsRemaining}</span>
      <span className="text-xs text-gray-400">credits</span>
    </div>
  );
};
```

### Credit Purchase Flow

#### Insufficient Credits Handling
```
┌─────────────────────────────────────────────────────────┐
│  ⚠️ Insufficient Credits                                │
│                                                         │
│  You need 1 credit for AI-guided valuation.            │
│  You have 0 credits remaining.                         │
│                                                         │
│  [Purchase Credits] [Upgrade to Premium]               │
└─────────────────────────────────────────────────────────┘
```

#### Credit Purchase Options
```
┌─────────────────────────────────────────────────────────┐
│  Purchase Credits                                       │
│                                                         │
│  💳 5 Credits - €9.99                                   │
│  💳 10 Credits - €19.99                                 │
│  💳 25 Credits - €49.99                                 │
│                                                         │
│  🚀 Premium - Unlimited Credits - €29.99/month         │
└─────────────────────────────────────────────────────────┘
```

---

## 🔄 State Management

### Authentication State

#### State Structure
```typescript
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  credits: number;
  subscription: Subscription;
}
```

#### State Updates
```typescript
const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  });
  
  const login = async (credentials: LoginCredentials) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await authAPI.login(credentials);
      const { user, token } = response.data;
      
      storeToken(token);
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  };
  
  return { ...state, login, logout };
};
```

### Flow Access Control

#### Available Flows Based on Auth
```typescript
const getAvailableFlows = (isAuthenticated: boolean, credits: number) => {
  const flows = [
    {
      id: 'manual',
      name: 'Manual Entry',
      available: true,
      cost: 0
    },
    {
      id: 'ai-guided',
      name: 'AI-Guided Valuation',
      available: isAuthenticated && credits >= 1,
      cost: 1
    }
  ];
  
  return flows;
};
```

---

## 🧪 Testing Scenarios

### Authentication Testing

#### Test Scenarios
```typescript
describe('AI-Guided Authentication', () => {
  it('should require authentication for AI-guided flow', () => {
    const { getByText } = render(<FlowSelectionScreen />);
    
    fireEvent.click(getByText('AI-Guided Valuation'));
    
    expect(getByText('Authentication Required')).toBeInTheDocument();
  });
  
  it('should allow manual flow for guests', () => {
    const { getByText } = render(<FlowSelectionScreen />);
    
    fireEvent.click(getByText('Manual Entry'));
    
    expect(getByText('Manual Entry')).toBeInTheDocument();
  });
  
  it('should show credit balance for authenticated users', () => {
    const { getByText } = render(<FlowSelectionScreen />, {
      authState: { isAuthenticated: true, credits: 5 }
    });
    
    expect(getByText('5 credits remaining')).toBeInTheDocument();
  });
});
```

#### E2E Testing
```typescript
describe('Authentication Flow', () => {
  it('should complete full authentication flow', async () => {
    // 1. Visit valuation tool as guest
    // 2. Try to select AI-guided flow
    // 3. See authentication prompt
    // 4. Click sign in
    // 5. Complete authentication
    // 6. Return to flow selection
    // 7. Select AI-guided flow
    // 8. Proceed with valuation
  });
});
```

---

## 📚 Related Documentation

- [DIFFERENTIATED_CREDIT_PRICING.md](../../../docs/product/features/DIFFERENTIATED_CREDIT_PRICING.md)
- [UNIQUE_KEY_ROUTING_GUIDE.md](./UNIQUE_KEY_ROUTING_GUIDE.md)
- [REPORT_BASED_VALUATIONS.md](../../upswitch-backend/docs/REPORT_BASED_VALUATIONS.md)

---

## 🎯 Success Metrics

### Authentication Metrics
- 📈 **Authentication Rate**: 85% of users authenticate when prompted
- 📈 **Conversion Rate**: 70% of authenticated users complete AI-guided flow
- 📈 **User Retention**: 90% of authenticated users return
- 📈 **Credit Usage**: 80% of credits used for AI-guided valuations

### User Experience Metrics
- 📈 **Clear Messaging**: 95% of users understand authentication requirements
- 📈 **Smooth Flow**: 90% of users complete authentication without issues
- 📈 **Error Handling**: 95% of authentication errors handled gracefully
- 📈 **Mobile Experience**: 85% of users complete authentication on mobile

---

**Last Updated:** October 24, 2025  
**Next Review:** November 24, 2025
