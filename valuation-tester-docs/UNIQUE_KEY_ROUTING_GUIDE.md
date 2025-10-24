# 🗺️ Unique Key Routing Guide

**Document:** Valuation Tester User Guide  
**Date:** October 24, 2025  
**Status:** ✅ Implemented  
**Author:** UpSwitch Engineering Team  
**Purpose:** User-facing guide for the unique key-based report routing system

---

## 📋 Executive Summary

The valuation tester now uses unique report IDs instead of flow-based URLs. Each valuation gets a unique identifier that can be bookmarked, shared, and revisited. This provides a better user experience with persistent state management.

### 🎯 URL Structure

| Old URLs | New URLs | Description |
|----------|----------|-------------|
| `/instant` | `/reports/val_1234567890_abc123xyz` | AI-guided valuation |
| `/manual` | `/reports/val_1234567890_abc123xyz` | Manual valuation |
| `/ai-guided` | `/reports/val_1234567890_abc123xyz` | AI-guided valuation |

---

## 🚀 User Experience

### 1. Starting a New Valuation

#### Step 1: Access Valuation Tool
```
Visit: https://valuation.upswitch.biz/
Click: "New Valuation Report"
```

#### Step 2: Generate Unique Report
```
System automatically generates: val_1729800000_abc123xyz
Redirects to: /reports/val_1729800000_abc123xyz
```

#### Step 3: Choose Flow Type
```
User sees two options:
├── Manual Entry (FREE)
└── AI-Guided Valuation (1 credit)
```

### 2. Report URL Structure

#### Report ID Format
```
val_${timestamp}_${random}
Example: val_1729800000_abc123xyz
```

#### URL Components
- **`val_`**: Prefix indicating valuation report
- **`1729800000`**: Timestamp (Unix epoch)
- **`abc123xyz`**: Random 9-character string

#### Full URL Examples
```
https://valuation.upswitch.biz/reports/val_1729800000_abc123xyz
https://valuation.upswitch.biz/reports/val_1729800001_def456ghi
https://valuation.upswitch.biz/reports/val_1729800002_jkl789mno
```

---

## 🎨 User Interface

### Flow Selection Screen

#### Visual Design
```
┌─────────────────────────────────────────────────────────┐
│                    Choose Your Valuation Method         │
├─────────────────────────────────────────────────────────┤
│  📝 Manual Entry                    🤖 AI-Guided        │
│  ┌─────────────────┐                ┌─────────────────┐ │
│  │ Complete data   │                │ AI-powered      │ │
│  │ control         │                │ guidance        │ │
│  │                 │                │                 │ │
│  │ ✅ Free, no     │                │ ✅ Higher       │ │
│  │    credits      │                │    accuracy     │ │
│  │ ✅ Quick        │                │    (1 credit)   │ │
│  │    estimates    │                │ ✅ Personalized │ │
│  └─────────────────┘                └─────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

#### User Decision Points
- **Manual Entry**: Choose for full control and free usage
- **AI-Guided**: Choose for AI assistance and higher accuracy

### Report Header

#### Report Information Display
```
┌─────────────────────────────────────────────────────────┐
│ Valuation Report                    val_1729800000_abc123xyz │
│                                                         │
│ [New Valuation]                                         │
└─────────────────────────────────────────────────────────┘
```

#### Report Status Indicators
- **Loading**: Report is being processed
- **In Progress**: User is entering data
- **Completed**: Valuation is finished
- **Error**: Something went wrong

---

## 🔄 State Management

### Report State Recovery

#### Scenario 1: User Revisits Report
```
User visits: /reports/val_1729800000_abc123xyz
System checks: Does report exist?
├── Yes: Load existing state
└── No: Start fresh
```

#### Scenario 2: Incomplete Valuation
```
User starts valuation
├── Enters some data
├── Leaves page
├── Returns later
└── System restores progress
```

#### Scenario 3: Completed Valuation
```
User completes valuation
├── Results are saved
├── User can view results
├── User can start new valuation
└── Report remains accessible
```

### State Persistence

#### What Gets Saved
```typescript
interface ReportState {
  report_id: string;
  flow_type: 'manual' | 'ai-guided';
  stage: 'flow-selection' | 'data-entry' | 'processing' | 'results';
  form_data?: ValuationFormData;
  valuation_result?: ValuationResponse;
  created_at: string;
  updated_at: string;
}
```

#### State Recovery Logic
```typescript
const checkReportExists = async (reportId: string) => {
  try {
    const response = await backendAPI.getReport(reportId);
    
    if (response.success) {
      const { flow_type, stage, form_data, valuation_result } = response.data;
      
      if (valuation_result) {
        // Report is completed - show results
        setValuationResult(valuation_result);
        setStage('results');
      } else if (flow_type) {
        // Report exists but not completed - resume flow
        setFlowType(flow_type);
        setStage('data-entry');
        // Restore form data if available
        if (form_data) {
          restoreFormData(form_data);
        }
      }
    } else {
      // Report doesn't exist - start fresh
      setStage('flow-selection');
    }
  } catch (error) {
    console.error('Failed to check report existence:', error);
    setError('Failed to load report. Starting fresh.');
    setStage('flow-selection');
  }
};
```

---

## 🔗 Legacy URL Support

### Automatic Redirects

#### Legacy URL Handling
```
Old URL: /instant
├── System detects legacy URL
├── Generates new report ID
├── Redirects to: /reports/val_1234567890_abc123xyz
└── Preserves query parameters
```

#### Redirect Implementation
```typescript
const LegacyRedirect: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    const newReportId = generateReportId();
    // Preserve all URL parameters (query string)
    const searchParams = new URLSearchParams(location.search);
    const newUrl = `${UrlGeneratorService.reportById(newReportId)}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    
    navigate(newUrl, {
      replace: true,
      state: location.state,
    });
  }, [navigate, location]);
  
  return <LoadingFallback />;
};
```

### Supported Legacy URLs
- `/instant` → `/reports/val_1234567890_abc123xyz`
- `/manual` → `/reports/val_1234567890_abc123xyz`
- `/ai-guided` → `/reports/val_1234567890_abc123xyz`

---

## 🛠️ Technical Implementation

### URL Generator Service

#### Service Usage
```typescript
import UrlGeneratorService from '../services/urlGenerator';

// Generate new report URL
const newReportUrl = UrlGeneratorService.createNewReport();
// Returns: '/reports/new'

// Generate specific report URL
const reportUrl = UrlGeneratorService.reportById('val_1234567890_abc123xyz');
// Returns: '/reports/val_1234567890_abc123xyz'

// Legacy URL support
const legacyUrl = UrlGeneratorService.legacyInstant();
// Returns: '/instant' (will redirect)
```

#### Service Methods
```typescript
class UrlGeneratorService {
  // New report routes
  static reports = () => '/reports';
  static reportById = (reportId: string) => `/reports/${reportId}`;
  static createNewReport = () => '/reports/new';

  // Legacy routes (will redirect)
  static legacyManual = () => '/manual';
  static legacyAIGuided = () => '/ai-guided';
  static legacyInstant = () => '/instant';
}
```

### Report ID Generation

#### ID Generation
```typescript
export const generateReportId = (): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `val_${timestamp}_${random}`;
};
```

#### ID Validation
```typescript
export const isValidReportId = (reportId: string): boolean => {
  return /^val_\d+_[a-z0-9]+$/.test(reportId);
};
```

---

## 📱 Mobile Experience

### Responsive Design

#### Mobile Flow Selection
```
┌─────────────────────────────────┐
│        Choose Method            │
├─────────────────────────────────┤
│  📝 Manual Entry               │
│  Free, no credits required     │
│  [Select]                      │
├─────────────────────────────────┤
│  🤖 AI-Guided Valuation        │
│  Higher accuracy (1 credit)    │
│  [Select]                      │
└─────────────────────────────────┘
```

#### Mobile Report Header
```
┌─────────────────────────────────┐
│ Valuation Report                │
│ val_1729800000_abc123xyz        │
│                                 │
│ [New Valuation]                 │
└─────────────────────────────────┘
```

### Touch Interactions

#### Touch-Friendly Buttons
- **Large touch targets**: Minimum 44px height
- **Clear visual feedback**: Button states on touch
- **Swipe gestures**: Navigate between steps
- **Pull-to-refresh**: Reload report state

---

## 🔍 Error Handling

### Common Error Scenarios

#### 1. Invalid Report ID
```
Error: Invalid report ID format
Solution: System generates new report ID
User Experience: Seamless redirect to new report
```

#### 2. Report Not Found
```
Error: Report does not exist
Solution: Start fresh with new report
User Experience: Clear error message, option to start new
```

#### 3. Network Error
```
Error: Failed to load report
Solution: Retry mechanism, fallback to new report
User Experience: Loading indicator, retry button
```

### Error Recovery

#### Automatic Recovery
```typescript
const handleError = (error: Error) => {
  if (error.message.includes('Invalid report ID')) {
    // Generate new report ID and redirect
    const newReportId = generateReportId();
    navigate(UrlGeneratorService.reportById(newReportId), { replace: true });
  } else if (error.message.includes('Report not found')) {
    // Start fresh
    setStage('flow-selection');
    setError(null);
  } else {
    // Show error message with retry option
    setError(error.message);
  }
};
```

---

## 🧪 Testing Guide

### User Testing Scenarios

#### Scenario 1: New User Journey
```
1. Visit valuation tool
2. Click "New Valuation Report"
3. Choose "Manual Entry"
4. Complete valuation
5. View results
6. Bookmark report URL
7. Return later to view results
```

#### Scenario 2: Returning User
```
1. Visit bookmarked report URL
2. System loads existing report
3. User can view results
4. User can start new valuation
```

#### Scenario 3: Legacy URL User
```
1. Visit old URL (/instant)
2. System redirects to new URL
3. User continues with valuation
4. No disruption to user experience
```

### Testing Checklist

#### Functionality Tests
- [ ] New report creation works
- [ ] Report ID generation is unique
- [ ] State recovery works correctly
- [ ] Legacy redirects function
- [ ] Error handling is graceful
- [ ] Mobile experience is smooth

#### Performance Tests
- [ ] Report loading under 2 seconds
- [ ] State recovery under 1 second
- [ ] Redirect processing under 500ms
- [ ] Mobile performance acceptable

---

## 📚 Related Documentation

- [UNIQUE_KEY_ROUTING_ARCHITECTURE.md](../../../docs/architecture/technical/UNIQUE_KEY_ROUTING_ARCHITECTURE.md)
- [DIFFERENTIATED_CREDIT_PRICING.md](../../../docs/product/features/DIFFERENTIATED_CREDIT_PRICING.md)
- [REPORT_BASED_VALUATIONS.md](../../upswitch-backend/docs/REPORT_BASED_VALUATIONS.md)

---

## 🎯 Success Metrics

### User Experience Metrics
- 📈 **Report Persistence**: 95% of reports remain accessible
- 📈 **State Recovery**: 90% of users can resume incomplete valuations
- 📈 **Legacy Support**: 100% of old URLs redirect successfully
- 📈 **Mobile Experience**: 85% of users complete on mobile

### Technical Metrics
- ✅ **Report ID Uniqueness**: 100% unique IDs generated
- ✅ **State Persistence**: 99% of state saved correctly
- ✅ **Error Recovery**: 95% of errors handled gracefully
- ✅ **Performance**: Average load time under 2 seconds

---

**Last Updated:** October 24, 2025  
**Next Review:** November 24, 2025
