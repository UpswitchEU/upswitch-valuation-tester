# Info Tab Architecture Documentation

**Date**: January 2025  
**Version**: 2.0  
**Status**: ✅ IMPLEMENTED

---

## Overview

The Info tab provides detailed calculation breakdowns and analysis for both manual and AI-guided valuation flows. **All calculation data is generated server-side in Python and rendered as HTML for optimal performance and consistency.**

---

## Architecture Overview

### High-Level Data Flow

```
User Input (ManualValuationFlow/AIAssistedValuation)
    ↓
Node.js Backend → Python Engine
    ↓
Python Engine: Calculate Valuation (Triage System - 11 steps)
    ↓
Python Engine: Generate info_tab_html (Server-side HTML)
    ├─ Transform ValuationResponse → template_data
    ├─ Render 12-step calculation breakdown
    └─ Include all calculation details, waterfalls, adjustments
    ↓
Streaming Response (SSE)
    └─ Include info_tab_html in completion event
    ↓
Frontend: Store in useValuationStore
    ↓
User Clicks "Info" Tab (Lazy Loading)
    ↓
ValuationInfoPanel: Render HTML via dangerouslySetInnerHTML
```

### Component Structure

```
ValuationInfoPanel (Simple HTML Renderer)
└── Server-Generated HTML (info_tab_html)
    ├── 12-Step Calculation Journey
    │   ├── Step 0: Historical Trend Analysis
    │   ├── Step 1: Input Validation & Normalization
    │   ├── Step 2: Industry Benchmarking
    │   ├── Step 3: Base Enterprise Value
    │   ├── Step 4: Owner Concentration
    │   ├── Step 5: Size Discount
    │   ├── Step 6: Liquidity Discount
    │   ├── Step 7: EV to Equity Conversion
    │   ├── Step 8: Confidence Score Analysis
    │   ├── Step 9: Range Methodology Selection
    │   ├── Step 10: Final Valuation Synthesis
    │   └── Step 11: Final Output
    ├── Valuation Waterfalls
    ├── Adjustment Breakdowns
    ├── Methodology Explanations
    └── Academic References
```

---

## Data Types

### ValuationResponse Interface

```typescript
export interface ValuationResponse {
  // ... other fields
  info_tab_html?: string;  // Server-generated HTML (30-50KB)
  html_report?: string;    // Main report HTML (50-80KB)
  // Calculation data NOT included (contained in HTML)
}
```

**Purpose**: Contains server-generated HTML with all calculation details  
**Usage**: Rendered directly via `dangerouslySetInnerHTML`  
**Source**: Python engine generates complete HTML from templates

---

## Core Components

### 1. ValuationInfoPanel

**File**: `src/components/ValuationInfoPanel.tsx`

**Purpose**: Simple HTML renderer for server-generated Info Tab content  
**Props**:
- `result: ValuationResponse` - Contains `info_tab_html` field

**Key Features**:
- Lazy loading: Only renders when user clicks "Info" tab
- Server-generated HTML: All calculation data embedded in HTML
- Direct rendering: Uses `dangerouslySetInnerHTML` for performance
- Error handling: Shows error state if HTML not available

**Implementation**:
```typescript
export const ValuationInfoPanel: React.FC<ValuationInfoPanelProps> = ({
  result
}) => {
  // Server-generated HTML (required)
  if (result.info_tab_html && result.info_tab_html.length > 0) {
    return (
      <div 
        className="h-full overflow-y-auto info-tab-html"
        dangerouslySetInnerHTML={{ __html: result.info_tab_html }}
      />
    );
  }
  
  // Error state: info_tab_html should always be present
  return <ErrorState />;
};
```

**Lazy Loading Behavior**:
- HTML is included in streaming response but not rendered until tab is clicked
- No separate API call needed (HTML already in response)
- Trigger: User clicks "Info" tab in `ManualValuationFlow.tsx`

---

## Store Integration

### useValuationStore

**File**: `src/store/useValuationStore.ts`

**New State**:
```typescript
interface ValuationStore {
  // ... existing state
  inputData: ValuationInputData | null;
  setInputData: (data: ValuationInputData | null) => void;
}
```

**Data Capture**:
```typescript
// In calculateValuation action
const inputData: ValuationInputData = {
  revenue: revenue,
  ebitda: ebitda,
  industry: industry,
  country_code: countryCode,
  founding_year: foundingYear,
  employees: formData.number_of_employees,
  business_model: businessModel,
  historical_years_data: formData.historical_years_data,
};
setInputData(inputData);
```

---

## Flow-Specific Implementations

### Manual Flow

**File**: `src/components/ManualValuationFlow.tsx`

**Data Flow**:
1. User fills form
2. Form data captured in store
3. inputData created before API call
4. Passed to ValuationInfoPanel
5. Displayed in Info tab

**Key Code**:
```typescript
const { result, inputData } = useValuationStore();

// Business profile with real data
<p className="text-sm text-zinc-400">
  {inputData?.industry || 'Industry'} • {inputData?.country_code || 'BE'} • Founded {inputData?.founding_year || 'N/A'}
</p>

// Info panel with real data
<ValuationInfoPanel result={result} inputData={inputData} />
```

### AI-Guided Flow

**File**: `src/components/AIAssistedValuation.tsx`

**Data Extraction**:
```typescript
const extractInputData = useCallback((businessProfile, conversationContext, valuationResult) => {
  // Extract data from multiple sources
  const inputData: ValuationInputData = {
    revenue: businessProfile?.revenue || conversationContext?.revenue || valuationResult?.revenue || 0,
    ebitda: businessProfile?.ebitda || conversationContext?.ebitda || valuationResult?.ebitda || 0,
    industry: businessProfile?.industry || conversationContext?.industry || 'Unknown',
    country_code: businessProfile?.country_code || conversationContext?.country_code || 'BE',
    founding_year: businessProfile?.founding_year || conversationContext?.founding_year,
    employees: businessProfile?.employees || conversationContext?.employees,
    business_model: businessProfile?.business_model || conversationContext?.business_model,
    historical_years_data: businessProfile?.historical_years_data || conversationContext?.historical_years_data,
  };
  return inputData;
}, []);
```

**Data Flow**:
1. AI conversation completes
2. extractInputData consolidates data from multiple sources
3. inputData set in component state
4. Passed to ValuationInfoPanel
5. Displayed in Info tab

---

## Data Validation & Error Handling

### Input Data Validation

```typescript
// Graceful fallbacks for missing data
const revenue = inputData?.revenue || 0;
const ebitda = inputData?.ebitda || 0;
const industry = inputData?.industry || 'Unknown';
```

### Error Boundaries

```typescript
// CalculationBreakdown wrapped in ErrorBoundary
<ErrorBoundary fallback={<div>Error loading calculation details</div>}>
  <CalculationBreakdown result={result} inputData={inputData || null} />
</ErrorBoundary>
```

### Type Safety

```typescript
// Proper null checking
{inputData?.revenue ? formatCurrency(inputData.revenue) : 'N/A'}
{inputData?.ebitda ? formatCurrency(inputData.ebitda) : 'N/A'}
```

---

## Performance Considerations

### Data Passing

- **Efficient**: inputData passed down through props
- **Memoization**: Components use React.memo where appropriate
- **Lazy Loading**: Heavy calculations only when needed

### Memory Usage

- **Minimal**: inputData is lightweight object
- **Cleanup**: No memory leaks in data passing
- **Efficient**: No unnecessary re-renders

---

## Testing Strategy

### Unit Tests

- **ValuationInputData**: Type validation
- **Data Extraction**: AI-guided flow extraction logic
- **Component Props**: Proper data passing

### Integration Tests

- **Data Flow**: Form → Store → Components
- **Real Data Display**: Info tab shows actual values
- **Error Handling**: Graceful fallbacks

### E2E Tests

- **Manual Flow**: Complete flow with real data
- **AI-Guided Flow**: Complete flow with extracted data
- **Cross-Browser**: All major browsers

---

## Future Enhancements

### Short-term

1. **Enhanced Validation**: More sophisticated input validation
2. **Loading States**: Better loading indicators
3. **Error Recovery**: Improved error handling

### Medium-term

1. **Caching**: Cache calculation results
2. **Optimization**: Performance improvements
3. **Accessibility**: Enhanced screen reader support

### Long-term

1. **Advanced Calculations**: More sophisticated financial modeling
2. **Customization**: User-customizable parameters
3. **Export**: Enhanced export capabilities

---

## Migration Notes

### Breaking Changes

- **None**: All changes are additive
- **Backward Compatible**: Existing functionality preserved
- **Type Safe**: Proper TypeScript integration

### Rollback Plan

1. **Simple**: Remove inputData passing
2. **Quick**: Revert to hardcoded values
3. **Safe**: No data loss or corruption

---

## Dependencies

### Internal

- `useValuationStore` - State management
- `ValuationResponse` - API response type
- `YearDataInput` - Historical data type
- `formatCurrency` - Utility functions

### External

- **React** - Component framework
- **TypeScript** - Type safety
- **Zustand** - State management

---

## Conclusion

The Info tab architecture provides a clean, maintainable way to display real calculation data instead of hardcoded placeholders. The design ensures type safety, proper error handling, and seamless integration with both manual and AI-guided flows.

**Key Benefits**:
- **Data Accuracy**: Real user inputs displayed
- **Type Safety**: Proper TypeScript integration
- **Maintainability**: Clean, readable code
- **Extensibility**: Easy to add new features
- **Performance**: Efficient data flow

---

**End of Architecture Documentation**
