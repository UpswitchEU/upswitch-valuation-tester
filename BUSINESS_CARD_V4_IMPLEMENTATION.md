# Business Card V4 Implementation

## Overview
Successfully imported `BusinessProfileCardV4` (Airbnb-inspired design) from `apps/upswitch-frontend` to `apps/upswitch-valuation-tester` and integrated it as valuation report cards on the home page.

## Implementation Summary

### Files Created

1. **`src/components/business/BusinessProfileCardV4.tsx`**
   - Adapted Airbnb-inspired card component for valuation-tester
   - Replaced React Router with Next.js router
   - Removed listing badge (not needed in valuation-tester)
   - Added click handlers for navigation to reports
   - Handles profile badges (avatar for authenticated, prompt for guests)

2. **`src/utils/businessTypeDisplay.ts`**
   - Business type display utilities
   - Works with valuation-tester's business types API and cache
   - Provides `getBusinessTypeIcon()` and `getBusinessTypeTitle()` functions
   - Falls back to hardcoded types if cache unavailable

3. **`src/utils/valuationSessionMapper.ts`**
   - Maps `ValuationSession` to `BusinessInfo` format
   - Extracts valuation amounts from results
   - Formats valuation amounts (€500K, €1.2M, etc.)
   - Extracts profile data from user context

4. **`src/components/business/index.ts`**
   - Export file for business components

### Files Modified

1. **`src/features/reports/components/RecentReportsSection.tsx`**
   - Replaced `ReportCard` with `BusinessProfileCardV4`
   - Added filtering to only show reports with valuation results (stage 3)
   - Updated loading skeleton to match square card style
   - Updated empty state message
   - Added user prop for profile data

2. **`src/components/pages/HomePage.tsx`**
   - Added `user` prop to `RecentReportsSection` component

## Features Implemented

### Stage 3 Cards (Basic Info + Profile + Valuation)

Cards display three key elements:

1. **Basic Business Info**
   - Company name
   - Business type icon (large, centered)
   - Business type title
   - Founded year
   - Team size
   - Location

2. **Profile Badge (Top Right)**
   - **Authenticated users**: Shows avatar if available
   - **Guest users**: Shows profile prompt badge (👤 icon)
   - Hover tooltip shows owner name or "Guest user"

3. **Valuation Badge (Top Left)**
   - Shows valuation amount on hover (€500K format)
   - Amber colored badge with 💰 icon
   - Click navigates to report

### Card Behavior

- **Card Click**: Navigates to `/reports/[reportId]`
- **Edit Button**: Appears on hover, navigates to report
- **Valuation Badge Click**: Navigates to report
- **Profile Badge Click**: Navigates to report (for guests) or shows owner info

### Filtering

- Only reports with `valuationResult` are displayed (stage 3 requirement)
- Reports without valuations are filtered out
- Empty state shows when no completed valuations exist

## Data Mapping

### ValuationSession → BusinessInfo

```typescript
{
  name: sessionData.company_name || partialData.company_name || 'Untitled Business',
  industry: sessionData.business_type_id || partialData.business_type_id || '',
  description: sessionData.business_context || '',
  foundedYear: sessionData.founding_year || new Date().getFullYear(),
  teamSize: number_of_employees?.toString() || 'N/A',
  revenue: current_year_data?.revenue || 0,
  location: country_code || 'Unknown',
  isRemote: false,
  status: completedAt ? 'active' : 'draft'
}
```

### Valuation Amount Extraction

Priority order:
1. `equity_value_mid` (preferred)
2. `recommended_asking_price` (fallback)
3. `equity_value_high` (fallback)

### Profile Data Extraction

- Checks for `user.avatar` or `user.profileImage`
- Checks for `user.name` or extracts from `user.email`
- Returns `null` if no profile data (shows guest badge)

## Styling

- **Gradient Background**: Teal gradient (`#14B8A6` to `#0D9488`)
- **Square Aspect Ratio**: Cards maintain 1:1 aspect ratio
- **Responsive**: Mobile-optimized with breakpoints
- **Hover Effects**: Edit button, badge scaling, tooltips
- **Badge Colors**: 
  - Valuation: Amber (`bg-amber-500`)
  - Profile: White with teal border (`border-teal-500`)

## Navigation

All navigation uses Next.js router:
- Card click → `router.push(\`/reports/${reportId}\`)`
- Edit button → `router.push(\`/reports/${reportId}\`)`
- Valuation badge → `router.push(\`/reports/${reportId}\`)`
- Profile badge → `router.push(\`/reports/${reportId}\`)` (for guests)

## Dependencies

- ✅ `lucide-react` - Already installed (for Edit icon)
- ✅ `next/navigation` - Already available
- ✅ Tailwind CSS - Same config as frontend
- ✅ Business types API - Already integrated

## Testing Checklist

- [x] Component renders without errors
- [x] Business type icons display correctly
- [x] Valuation amounts format correctly (€500K, €1.2M)
- [x] Profile badges show correctly (avatar vs guest)
- [x] Card clicks navigate to report page
- [x] Loading skeleton matches card style
- [x] Empty state shows when no valuations
- [x] Only reports with valuations are shown
- [x] Responsive design works (mobile, tablet, desktop)
- [x] Hover tooltips work correctly

## Usage

Cards automatically appear on the home page when:
1. User has completed valuations (has `valuationResult`)
2. Reports are loaded from backend
3. User is authenticated or guest

Cards show:
- Business info (name, type, year, team, location)
- Profile badge (avatar or guest prompt)
- Valuation badge (amount on hover)

## Notes

- Cards only exist when valuation report is generated (stage 3 requirement)
- Profile badge adapts based on authentication status
- Valuation badge shows amount in hover tooltip
- All cards navigate to report page on click
- Square aspect ratio maintained for consistent grid layout

