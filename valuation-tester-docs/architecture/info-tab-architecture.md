# Info Tab Architecture Documentation

**Date**: October 26, 2025  
**Version**: 1.0  
**Status**: ✅ IMPLEMENTED

---

## Overview

The Info tab provides detailed calculation breakdowns and analysis for both manual and AI-guided valuation flows. This document describes the architecture, data flow, and component structure of the Info tab system.

---

## Architecture Overview

### High-Level Data Flow

```
Form Input (ManualValuationFlow/AIAssistedValuation)
    ↓
Zustand Store (useValuationStore)
    ↓
Capture inputData before API call
    ↓
Pass to ValuationInfoPanel
    ↓
Display in CalculationBreakdown
    ↓
Show real calculations with user data
```

### Component Hierarchy

```
ValuationInfoPanel
├── Input Parameters Section
├── CalculationBreakdown
│   ├── DCF Approach
│   │   ├── WACC Calculation
│   │   ├── Projected FCF
│   │   └── Terminal Value
│   ├── Multiples Approach
│   │   ├── Revenue Multiple
│   │   ├── EBITDA Multiple
│   │   └── Comparables Analysis
│   └── Weighted Average
├── SensitivityAnalysis
└── MethodologyBreakdown
```

---

## Data Types

### ValuationInputData Interface

```typescript
export interface ValuationInputData {
  revenue: number;
  ebitda: number;
  industry: string;
  country_code: string;
  founding_year?: number;
  employees?: number;
  business_model?: string;
  historical_years_data?: YearDataInput[];
}
```

**Purpose**: Captures raw form input data for display in Info tab  
**Usage**: Passed from store to components for real data display  
**Type Safety**: Ensures all input data is properly typed

---

## Core Components

### 1. ValuationInfoPanel

**File**: `src/components/ValuationInfoPanel.tsx`

**Purpose**: Main container for Info tab content  
**Props**:
- `result: ValuationResponse` - Valuation calculation results
- `inputData?: ValuationInputData | null` - Raw form input data

**Key Features**:
- Displays input parameters section
- Renders calculation breakdown
- Shows sensitivity analysis
- Handles both manual and AI-guided flows

**Data Flow**:
```typescript
// Receives inputData from parent component
<ValuationInfoPanel result={result} inputData={inputData} />

// Passes inputData to CalculationBreakdown
<CalculationBreakdown result={result} inputData={inputData || null} />
```

### 2. CalculationBreakdown

**File**: `src/components/InfoTab/CalculationBreakdown.tsx`

**Purpose**: Detailed calculation breakdown with real data  
**Props**:
- `result: ValuationResponse` - Valuation results
- `inputData: ValuationInputData | null` - Real input data

**Key Features**:
- DCF approach with real WACC and projections
- Multiples approach with actual revenue/EBITDA
- Weighted average calculation
- Real data instead of hardcoded values

**Data Usage**:
```typescript
// Uses real revenue and EBITDA from inputData
const revenue = inputData?.revenue || 0;
const ebitda = inputData?.ebitda || 0;

// Displays actual values in calculations
<span className="font-mono">{formatCurrency(revenue)}</span>
<span className="font-mono">{formatCurrency(ebitda)}</span>
```

### 3. SensitivityAnalysis

**File**: `src/components/InfoTab/SensitivityAnalysis.tsx`

**Purpose**: Sensitivity analysis with real data  
**Features**:
- WACC sensitivity table
- Growth rate sensitivity table
- Real base values from inputData

### 4. MethodologyBreakdown

**File**: `src/components/InfoTab/MethodologyBreakdown.tsx`

**Purpose**: Methodology explanation and confidence factors  
**Features**:
- Dynamic methodology descriptions
- Confidence score breakdown
- Tooltips and documentation links
- Progressive disclosure

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
