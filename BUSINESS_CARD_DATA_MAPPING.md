# Business Card Data Mapping

## Overview
This document describes how business card data flows from the backend to the frontend BusinessProfileCardV4 component, ensuring all fields are properly populated just like in the main frontend.

## Data Flow

### 1. Backend Response (`/api/reports`)
The backend returns reports with the following structure:
```typescript
{
  id: string,
  report_id: string,
  session_id: string,
  session_data: {
    company_name?: string,
    business_type_id?: string,
    business_type?: string,
    business_model?: string,
    industry?: string,
    business_description?: string,
    business_context?: string,
    founding_year?: number,
    founded_year?: number,
    number_of_employees?: number,
    employee_count?: number,
    current_year_data?: {
      revenue?: number
    },
    city?: string,
    country_code?: string,
    country?: string,
    is_remote?: boolean,
    // ... other fields
  },
  partial_data: {
    // Same structure as session_data (incremental updates)
  },
  valuation_result: {
    company_name?: string,
    equity_value_mid?: number,
    // ... other valuation fields
  },
  company_name?: string, // Top-level extracted field
  html_report?: string,
  info_tab_html?: string,
  calculated_at?: string,
  // ... other metadata
}
```

### 2. ReportService Transformation
`ReportService.ts` transforms backend response to `ValuationSession`:
- Maps `session_data` → `sessionData`
- Maps `partial_data` → `partialData`
- Maps `valuation_result` → `valuationResult`
- Includes `htmlReport`, `infoTabHtml`, `calculatedAt`
- Ensures `company_name` from top-level is included in `sessionData`

### 3. Mapper Function (`mapValuationSessionToBusinessInfo`)
Comprehensive mapping that checks multiple data sources and field name variations:

#### Company Name
- Priority: `valuationResult.company_name` > `sessionData.company_name` > `partialData.company_name` > top-level `company_name`
- Fallback: `'Untitled Business'`

#### Business Type (Industry)
- Checks: `business_type_id`, `business_type`, `business_model`, `industry`
- Searches in: `sessionData`, `partialData`, nested structures
- Fallback: `'other'`

#### Description
- Checks: `business_context`, `business_description`, `description`, `company_description`
- Searches in: `sessionData`, `partialData`, nested structures
- Fallback: `''`

#### Founded Year
- Checks: `founding_year`, `founded_year`
- Validates: Must be between 1900 and current year
- Fallback: Current year

#### Team Size
- Checks: `number_of_employees`, `employee_count`, `employees`
- Converts to string format
- Fallback: `'N/A'`

#### Revenue
- Checks: `current_year_data.revenue`, `revenue` (top-level)
- Searches in: `sessionData`, `partialData`, nested structures
- Fallback: `0`

#### Location
- Extracts: `city` and `country_code` / `country`
- Combines: `"City, Country"` or just `"City"` or `"Country"`
- Fallback: `'Unknown'`

#### Remote Status
- Checks: `is_remote`, `isRemote`
- Fallback: `false`

### 4. BusinessProfileCardV4 Display
The card component displays:
- **Business Icon**: Large centered icon from `getBusinessTypeIcon(businessInfo.industry)`
- **Business Name**: Bold white text at bottom
- **Business Type Title**: Subtitle from `getBusinessTypeTitle(businessInfo.industry)`
- **Founded Year**: 📅 icon with year
- **Team Size**: 👥 icon with count
- **Location**: 📍 icon with location or "Remote"
- **Valuation Badge**: 💰 icon (top-left) with hover tooltip showing amount
- **Profile Badge**: 👤 icon (top-right) if user has profile

## Field Mapping Table

| Card Display | Data Source | Field Names Checked | Fallback |
|-------------|-------------|-------------------|----------|
| Business Name | sessionData, partialData, valuationResult | `company_name` | 'Untitled Business' |
| Business Icon | sessionData, partialData | `business_type_id`, `business_type`, `business_model`, `industry` | 'other' → 🏢 |
| Business Type Title | sessionData, partialData | Same as icon | 'Business' |
| Founded Year | sessionData, partialData | `founding_year`, `founded_year` | Current year |
| Team Size | sessionData, partialData | `number_of_employees`, `employee_count`, `employees` | 'N/A' |
| Location | sessionData, partialData | `city`, `country_code`, `country` | 'Unknown' |
| Revenue | sessionData, partialData | `current_year_data.revenue`, `revenue` | 0 |
| Remote Status | sessionData, partialData | `is_remote`, `isRemote` | false |

## Validation & Fallbacks

All fields are validated and have sensible fallbacks:
- **Name**: Always has a value (never empty)
- **Industry**: Defaults to 'other' if not found
- **Founded Year**: Validated to be between 1900 and current year
- **Team Size**: Always displays something (even if 'N/A')
- **Location**: Always displays something (even if 'Unknown')
- **Revenue**: Always a number (defaults to 0)

## Comparison with Main Frontend

The valuation-tester implementation matches the main frontend:
- ✅ Same BusinessInfo interface
- ✅ Same BusinessProfileCardV4 component structure
- ✅ Same field extraction logic
- ✅ Same fallback values
- ✅ Same display format

## Debugging

In development mode, the `RecentReportsSection` component logs:
```javascript
console.debug('[RecentReportsSection] Mapping report to card:', {
  reportId,
  businessInfo,
  hasValuation,
  valuationAmount,
  hasProfileData,
})
```

This helps verify that data is being extracted correctly from backend responses.

## Testing Checklist

- [x] Company name displays correctly
- [x] Business type icon displays correctly
- [x] Business type title displays correctly
- [x] Founded year displays correctly
- [x] Team size displays correctly
- [x] Location displays correctly (city + country)
- [x] Remote status displays correctly
- [x] Valuation badge shows amount on hover
- [x] Profile badge shows when user has profile
- [x] All fields have proper fallbacks
- [x] Data extraction handles nested structures
- [x] Data extraction handles multiple field name variations

