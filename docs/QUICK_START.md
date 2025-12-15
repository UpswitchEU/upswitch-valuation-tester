# M&A Workflow - Quick Start Guide

**For**: Developers, Product Managers, QA  
**Time**: 5 minutes

---

## What Is This?

The M&A Workflow enables **iterative valuation refinement** over weeks or months. Users can:

1. Create a valuation
2. Return anytime to edit
3. Regenerate with new data
4. Compare versions side-by-side
5. Track complete audit trail

**Think**: Lovable.dev-style project workflow for business valuations.

---

## Key Features

### 1. Session Persistence ✅

- **Auto-Save**: Changes saved automatically
- **Resume Anytime**: Pick up where you left off
- **Fail-Proof**: Robust loading with retry logic

**UI**: Save status icon in toolbar (left section)
- 🟢 Green check = Saved
- 🟡 Yellow save icon = Unsaved changes
- 🔵 Blue spinner = Saving
- 🔴 Red alert = Error

### 2. Version History ✅

- **Auto-Versioning**: New version created on regeneration
- **Version Timeline**: See all versions
- **Version Labels**: "Q4 2025 Final", "Updated Revenue", etc.

**UI**: Version selector dropdown in toolbar (center section)
- Shows "Version X of Y"
- Only visible when versions exist

### 3. Version Comparison ✅

- **Side-by-Side**: Compare any two versions
- **Change Highlights**: See what changed
- **Valuation Delta**: See impact on valuation

**UI**: Version Timeline component → Compare button

### 4. Audit Trail ✅

- **Operation Logging**: All operations logged
- **Field-Level Tracking**: See what changed
- **Compliance-Ready**: Full audit history

**UI**: History tab in conversational flow

---

## User Flow

### Creating a Valuation

```
1. User starts valuation
   ↓
2. Enters data (manual) or converses (AI-guided)
   ↓
3. Auto-save triggers on changes
   ↓
4. User submits → Valuation calculated
   ↓
5. Version 1 created automatically
```

### Returning to Edit

```
1. User opens existing report
   ↓
2. Session loads (with retry logic)
   ↓
3. Form pre-filled with last data
   ↓
4. User edits assumptions
   ↓
5. User regenerates → Version 2 created
```

### Comparing Versions

```
1. User opens Version Timeline
   ↓
2. Selects two versions
   ↓
3. Clicks "Compare"
   ↓
4. Side-by-side view shows:
   - What changed (revenue, EBITDA, etc.)
   - Valuation delta (+15%, +€500K)
   - Highlighted differences
```

---

## Technical Overview

### Frontend

- **State**: Zustand stores (session + versions)
- **API**: VersionAPI service
- **UI**: Toolbar integration (minimalist)

### Backend

- **Database**: PostgreSQL tables
- **API**: REST endpoints
- **Service**: Business logic layer

### Data Flow

```
Frontend → API → Backend → Database
         ←     ←         ←
```

---

## Testing

### Manual Test

1. Create valuation → See Version 1
2. Edit revenue → Regenerate → See Version 2
3. Open Version Timeline → Compare V1 vs V2
4. See changes highlighted

### API Test

```bash
# List versions
curl http://localhost:3000/api/valuation-sessions/val_123/versions

# Create version
curl -X POST http://localhost:3000/api/valuation-sessions/val_123/versions \
  -H "Content-Type: application/json" \
  -d '{"form_data": {...}}'
```

---

## Next Steps

1. **Read**: [Complete Architecture](./architecture/MA_WORKFLOW_COMPLETE.md)
2. **Review**: [Strategy](./strategy/MA_WORKFLOW_STRATEGY.md)
3. **Check**: [API Spec](./api/VERSIONING_API_SPEC.md)

---

## Support

Questions? Check:
- [Architecture Docs](./architecture/MA_WORKFLOW_COMPLETE.md)
- [Implementation Summary](./implementation/MA_WORKFLOW_IMPLEMENTATION_SUMMARY.md)

# M&A Workflow - Quick Start Guide

**For**: Developers, Product Managers, QA  
**Time**: 5 minutes

---

## What Is This?

The M&A Workflow enables **iterative valuation refinement** over weeks or months. Users can:

1. Create a valuation
2. Return anytime to edit
3. Regenerate with new data
4. Compare versions side-by-side
5. Track complete audit trail

**Think**: Lovable.dev-style project workflow for business valuations.

---

## Key Features

### 1. Session Persistence ✅

- **Auto-Save**: Changes saved automatically
- **Resume Anytime**: Pick up where you left off
- **Fail-Proof**: Robust loading with retry logic

**UI**: Save status icon in toolbar (left section)
- 🟢 Green check = Saved
- 🟡 Yellow save icon = Unsaved changes
- 🔵 Blue spinner = Saving
- 🔴 Red alert = Error

### 2. Version History ✅

- **Auto-Versioning**: New version created on regeneration
- **Version Timeline**: See all versions
- **Version Labels**: "Q4 2025 Final", "Updated Revenue", etc.

**UI**: Version selector dropdown in toolbar (center section)
- Shows "Version X of Y"
- Only visible when versions exist

### 3. Version Comparison ✅

- **Side-by-Side**: Compare any two versions
- **Change Highlights**: See what changed
- **Valuation Delta**: See impact on valuation

**UI**: Version Timeline component → Compare button

### 4. Audit Trail ✅

- **Operation Logging**: All operations logged
- **Field-Level Tracking**: See what changed
- **Compliance-Ready**: Full audit history

**UI**: History tab in conversational flow

---

## User Flow

### Creating a Valuation

```
1. User starts valuation
   ↓
2. Enters data (manual) or converses (AI-guided)
   ↓
3. Auto-save triggers on changes
   ↓
4. User submits → Valuation calculated
   ↓
5. Version 1 created automatically
```

### Returning to Edit

```
1. User opens existing report
   ↓
2. Session loads (with retry logic)
   ↓
3. Form pre-filled with last data
   ↓
4. User edits assumptions
   ↓
5. User regenerates → Version 2 created
```

### Comparing Versions

```
1. User opens Version Timeline
   ↓
2. Selects two versions
   ↓
3. Clicks "Compare"
   ↓
4. Side-by-side view shows:
   - What changed (revenue, EBITDA, etc.)
   - Valuation delta (+15%, +€500K)
   - Highlighted differences
```

---

## Technical Overview

### Frontend

- **State**: Zustand stores (session + versions)
- **API**: VersionAPI service
- **UI**: Toolbar integration (minimalist)

### Backend

- **Database**: PostgreSQL tables
- **API**: REST endpoints
- **Service**: Business logic layer

### Data Flow

```
Frontend → API → Backend → Database
         ←     ←         ←
```

---

## Testing

### Manual Test

1. Create valuation → See Version 1
2. Edit revenue → Regenerate → See Version 2
3. Open Version Timeline → Compare V1 vs V2
4. See changes highlighted

### API Test

```bash
# List versions
curl http://localhost:3000/api/valuation-sessions/val_123/versions

# Create version
curl -X POST http://localhost:3000/api/valuation-sessions/val_123/versions \
  -H "Content-Type: application/json" \
  -d '{"form_data": {...}}'
```

---

## Next Steps

1. **Read**: [Complete Architecture](./architecture/MA_WORKFLOW_COMPLETE.md)
2. **Review**: [Strategy](./strategy/MA_WORKFLOW_STRATEGY.md)
3. **Check**: [API Spec](./api/VERSIONING_API_SPEC.md)

---

## Support

Questions? Check:
- [Architecture Docs](./architecture/MA_WORKFLOW_COMPLETE.md)
- [Implementation Summary](./implementation/MA_WORKFLOW_IMPLEMENTATION_SUMMARY.md)

