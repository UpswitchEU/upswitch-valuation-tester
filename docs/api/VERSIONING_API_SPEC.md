# Versioning API Specification

**Purpose**: Backend API specification for valuation versioning system  
**Target Backend**: upswitch-backend (Node.js/Express)  
**Status**: Specification (Implementation Required)  
**Date**: December 13, 2025

---

## Overview

This specification defines the backend API endpoints required to support valuation versioning for M&A due diligence workflows.

### Requirements

- Auto-versioning on regeneration
- Version history tracking
- Audit trail for compliance
- Version comparison
- Performance: <500ms per request

---

## Database Schema

### Table: `valuation_versions`

```sql
CREATE TABLE valuation_versions (
  id VARCHAR(255) PRIMARY KEY,                    -- version_uuid
  report_id VARCHAR(255) NOT NULL,                -- FK to valuation_sessions
  version_number INTEGER NOT NULL,                -- Sequential: 1, 2, 3...
  version_label VARCHAR(500),                     -- User-friendly label
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255),                        -- User ID or NULL for guest
  
  -- Snapshot data
  form_data JSONB NOT NULL,                       -- ValuationRequest
  valuation_result JSONB,                         -- ValuationResponse
  html_report TEXT,                               -- Generated HTML
  
  -- Changes tracking
  changes_summary JSONB,                          -- VersionChanges
  
  -- Version state
  is_active BOOLEAN DEFAULT false,                -- Current version
  is_pinned BOOLEAN DEFAULT false,                -- User-pinned
  
  -- Metadata
  calculation_duration_ms INTEGER,
  tags TEXT[],
  notes TEXT,
  
  -- Indexes
  CONSTRAINT unique_report_version UNIQUE (report_id, version_number),
  FOREIGN KEY (report_id) REFERENCES valuation_sessions(report_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_versions_report_id ON valuation_versions(report_id);
CREATE INDEX idx_versions_created_at ON valuation_versions(created_at);
CREATE INDEX idx_versions_active ON valuation_versions(report_id, is_active) WHERE is_active = true;
```

### Table: `valuation_audit_log`

```sql
CREATE TABLE valuation_audit_log (
  id VARCHAR(255) PRIMARY KEY,
  report_id VARCHAR(255) NOT NULL,
  operation VARCHAR(50) NOT NULL,                 -- EDIT, REGENERATE, VERSION_CREATE
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  user_id VARCHAR(255),
  
  -- Operation details
  field VARCHAR(255),                             -- For EDIT operations
  old_value JSONB,
  new_value JSONB,
  percent_change DECIMAL(10, 2),
  
  -- Version tracking
  version_number INTEGER,
  
  -- Metadata
  correlation_id VARCHAR(255),
  metadata JSONB,
  
  -- Index
  FOREIGN KEY (report_id) REFERENCES valuation_sessions(report_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_audit_report_id ON valuation_audit_log(report_id);
CREATE INDEX idx_audit_timestamp ON valuation_audit_log(timestamp);
CREATE INDEX idx_audit_operation ON valuation_audit_log(operation);
```

---

## API Endpoints

### 1. List Versions

**GET** `/api/valuation-sessions/:reportId/versions`

**Description**: Get all versions for a report

**Query Parameters**:
- `limit` (optional): Number of versions to return (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `tags` (optional): Filter by tags (comma-separated)
- `pinned` (optional): Filter pinned only (boolean)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "version_1765751234567_abc123",
        "report_id": "val_123",
        "version_number": 3,
        "version_label": "Q4 2025 Update",
        "created_at": "2025-12-13T10:30:00Z",
        "created_by": "user_456",
        "form_data": { /* ValuationRequest */ },
        "valuation_result": { /* ValuationResponse */ },
        "html_report": "<html>...</html>",
        "changes_summary": {
          "revenue": { "from": 2000000, "to": 2500000, "percentChange": 25 },
          "totalChanges": 2,
          "significantChanges": ["revenue", "ebitda"]
        },
        "is_active": true,
        "is_pinned": false,
        "calculation_duration_ms": 3245,
        "tags": ["q4-2025", "adjusted"],
        "notes": "Updated after Q4 financials received"
      }
    ],
    "total": 3,
    "active_version": 3,
    "has_more": false
  }
}
```

**Error Responses**:
- 404: Report not found
- 401: Unauthorized

---

### 2. Get Specific Version

**GET** `/api/valuation-sessions/:reportId/versions/:versionNumber`

**Description**: Get a specific version by number

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "version_1765751234567_abc123",
    "report_id": "val_123",
    "version_number": 2,
    // ... full version object ...
  }
}
```

**Error Responses**:
- 404: Version not found
- 401: Unauthorized

---

### 3. Create New Version

**POST** `/api/valuation-sessions/:reportId/versions`

**Description**: Create new version (called on regeneration)

**Request Body**:
```json
{
  "version_label": "Adjusted EBITDA",
  "form_data": { /* ValuationRequest */ },
  "valuation_result": { /* ValuationResponse */ },
  "html_report": "<html>...</html>",
  "changes_summary": {
    "ebitda": { "from": 500000, "to": 750000, "percentChange": 50 },
    "totalChanges": 1,
    "significantChanges": ["ebitda"]
  },
  "notes": "Updated EBITDA based on Q4 financials",
  "tags": ["q4-2025"]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "version_1765751234567_xyz789",
    "version_number": 4,
    // ... full version object ...
  }
}
```

**Business Logic**:
1. Get current max version number for report
2. Increment version number (N+1)
3. Mark previous version as `is_active=false`
4. Create new version with `is_active=true`
5. Log version creation to audit table
6. Return created version

**Error Responses**:
- 400: Invalid request body
- 404: Report not found
- 409: Concurrent version creation

---

### 4. Update Version Metadata

**PATCH** `/api/valuation-sessions/:reportId/versions/:versionNumber`

**Description**: Update version label, notes, tags, or pin status

**Request Body**:
```json
{
  "version_label": "Final Q4 2025",
  "notes": "Approved by CFO",
  "tags": ["final", "q4-2025", "approved"],
  "is_pinned": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    // ... updated version object ...
  }
}
```

**Error Responses**:
- 404: Version not found
- 400: Invalid updates

---

### 5. Delete Version

**DELETE** `/api/valuation-sessions/:reportId/versions/:versionNumber`

**Description**: Delete a version (soft delete, keep audit trail)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Version deleted"
}
```

**Business Logic**:
- Mark as deleted (soft delete)
- Keep in audit trail
- Cannot delete active version (must switch first)

**Error Responses**:
- 404: Version not found
- 400: Cannot delete active version
- 403: Insufficient permissions

---

### 6. Compare Versions

**GET** `/api/valuation-sessions/:reportId/versions/compare?v1=2&v2=3`

**Description**: Compare two versions side-by-side

**Query Parameters**:
- `v1`: First version number (required)
- `v2`: Second version number (required)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "version_a": { /* Full version object */ },
    "version_b": { /* Full version object */ },
    "changes": {
      "revenue": {
        "from": 2000000,
        "to": 2500000,
        "percentChange": 25,
        "timestamp": "2025-12-13T10:30:00Z"
      },
      "totalChanges": 2,
      "significantChanges": ["revenue", "ebitda"]
    },
    "valuation_delta": {
      "absolute_change": 625000,
      "percent_change": 15.6,
      "direction": "increase"
    },
    "highlights": [
      {
        "field": "revenue",
        "label": "Revenue",
        "old_value": 2000000,
        "new_value": 2500000,
        "impact": "+€500,000 (+25%)"
      }
    ]
  }
}
```

**Error Responses**:
- 404: Version not found
- 400: Invalid version numbers

---

### 7. Get Version Statistics

**GET** `/api/valuation-sessions/:reportId/versions/statistics`

**Description**: Get aggregated statistics about versions

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total_versions": 5,
    "avg_time_between_versions_hours": 48.5,
    "most_changed_fields": [
      { "field": "ebitda", "count": 3 },
      { "field": "revenue", "count": 2 }
    ],
    "avg_valuation_change_percent": 12.3,
    "first_version": {
      "number": 1,
      "created_at": "2025-10-01T10:00:00Z"
    },
    "latest_version": {
      "number": 5,
      "created_at": "2025-12-13T10:30:00Z"
    }
  }
}
```

---

### 8. Get Audit Log

**GET** `/api/valuation-sessions/:reportId/audit`

**Description**: Get complete audit trail for report

**Query Parameters**:
- `operation` (optional): Filter by operation (EDIT, REGENERATE, VERSION_CREATE)
- `start_date` (optional): Filter from date (ISO 8601)
- `end_date` (optional): Filter to date (ISO 8601)
- `limit` (optional): Number of entries (default: 100, max: 1000)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "audit_1765751234567_abc",
        "report_id": "val_123",
        "operation": "EDIT",
        "timestamp": "2025-12-13T10:25:00Z",
        "user_id": "user_456",
        "field": "ebitda",
        "old_value": 500000,
        "new_value": 750000,
        "percent_change": 50.0,
        "metadata": {
          "field_label": "EBITDA",
          "change_type": "modification"
        }
      }
    ],
    "total": 15,
    "has_more": false
  }
}
```

---

## Implementation Notes

### Transaction Safety

All version operations should be wrapped in database transactions:

```typescript
await db.transaction(async (trx) => {
  // 1. Mark current version as inactive
  await trx('valuation_versions')
    .where({ report_id: reportId, is_active: true })
    .update({ is_active: false })
  
  // 2. Create new version
  await trx('valuation_versions').insert(newVersion)
  
  // 3. Log to audit trail
  await trx('valuation_audit_log').insert(auditEntry)
})
```

### Performance Optimization

- Index on `(report_id, version_number)` for fast lookups
- Index on `(report_id, is_active)` for getting active version
- Cache latest version in Redis (invalidate on new version)
- Lazy-load HTML reports (don't include in list endpoint)

### Concurrency Handling

Use database constraints to prevent duplicate version numbers:

```sql
CONSTRAINT unique_report_version UNIQUE (report_id, version_number)
```

If concurrent creation attempts, return 409 Conflict and frontend will retry.

### Storage Limits

- Max 50 versions per report (soft limit)
- Archive old versions after 100 versions
- Compress HTML reports (gzip) for storage efficiency

---

## Migration Path

### Phase 1: MVP (Client-Side)
Frontend stores versions in `sessionData.versions[]` array.
No backend changes required.

### Phase 2: Backend Tables
1. Create `valuation_versions` table
2. Create `valuation_audit_log` table
3. Run migration on production

### Phase 3: API Implementation
1. Implement all 8 endpoints
2. Add transaction safety
3. Add indexes

### Phase 4: Migration
1. Migrate existing sessions to versioning system (v1 = original)
2. Update frontend to use backend API
3. Deprecate client-side storage

---

## Security Considerations

### Authorization

All endpoints require:
- User authentication OR
- Guest session validation

### Rate Limiting

- 100 requests/minute per user for list/get
- 20 requests/minute for create (prevent spam)
- 10 requests/minute for compare (expensive operation)

### Data Validation

- Validate `formData` against ValuationRequest schema
- Validate `versionNumber` is sequential
- Validate `reportId` exists in `valuation_sessions`
- Sanitize HTML reports before storage

---

## Testing Requirements

### Unit Tests
- Version CRUD operations
- Transaction rollback on error
- Duplicate version number handling

### Integration Tests
- Create version → verify in database
- List versions → verify pagination
- Compare versions → verify diff accuracy
- Concurrent creation → verify 409 handling

### Load Tests
- 1000 versions per report (stress test)
- 100 concurrent regenerations
- Compare large reports (100+ fields)

---

## Monitoring

### Metrics to Track
- Version creation rate
- Average versions per report
- Version retrieval latency (p95 <500ms)
- Storage growth rate
- Most active reports (by version count)

### Alerts
- Storage exceeds 10GB
- Single report exceeds 100 versions
- Version creation latency >1s
- Comparison latency >2s

---

## Example Implementation (Node.js/Express)

```typescript
// Example endpoint implementation
router.post('/api/valuation-sessions/:reportId/versions', async (req, res) => {
  const { reportId } = req.params
  const { version_label, form_data, valuation_result, html_report, changes_summary } = req.body
  
  try {
    // Start transaction
    const version = await db.transaction(async (trx) => {
      // Get next version number
      const maxVersion = await trx('valuation_versions')
        .where({ report_id: reportId })
        .max('version_number as max')
        .first()
      
      const nextVersion = (maxVersion?.max || 0) + 1
      
      // Mark current as inactive
      await trx('valuation_versions')
        .where({ report_id: reportId, is_active: true })
        .update({ is_active: false })
      
      // Create new version
      const newVersion = {
        id: `version_${Date.now()}_${generateUuid()}`,
        report_id: reportId,
        version_number: nextVersion,
        version_label: version_label || `Version ${nextVersion}`,
        form_data,
        valuation_result,
        html_report,
        changes_summary,
        is_active: true,
        created_at: new Date(),
      }
      
      await trx('valuation_versions').insert(newVersion)
      
      // Log to audit
      await trx('valuation_audit_log').insert({
        id: `audit_${Date.now()}_${generateUuid()}`,
        report_id: reportId,
        operation: 'VERSION_CREATE',
        version_number: nextVersion,
        timestamp: new Date(),
      })
      
      return newVersion
    })
    
    res.status(201).json({ success: true, data: version })
  } catch (error) {
    console.error('Failed to create version:', error)
    res.status(500).json({ success: false, error: 'Failed to create version' })
  }
})
```

---

**Contact**: Backend Team Lead  
**Review**: CTO Approval Required  
**Implementation Timeline**: 2 weeks

# Versioning API Specification

**Purpose**: Backend API specification for valuation versioning system  
**Target Backend**: upswitch-backend (Node.js/Express)  
**Status**: Specification (Implementation Required)  
**Date**: December 13, 2025

---

## Overview

This specification defines the backend API endpoints required to support valuation versioning for M&A due diligence workflows.

### Requirements

- Auto-versioning on regeneration
- Version history tracking
- Audit trail for compliance
- Version comparison
- Performance: <500ms per request

---

## Database Schema

### Table: `valuation_versions`

```sql
CREATE TABLE valuation_versions (
  id VARCHAR(255) PRIMARY KEY,                    -- version_uuid
  report_id VARCHAR(255) NOT NULL,                -- FK to valuation_sessions
  version_number INTEGER NOT NULL,                -- Sequential: 1, 2, 3...
  version_label VARCHAR(500),                     -- User-friendly label
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_by VARCHAR(255),                        -- User ID or NULL for guest
  
  -- Snapshot data
  form_data JSONB NOT NULL,                       -- ValuationRequest
  valuation_result JSONB,                         -- ValuationResponse
  html_report TEXT,                               -- Generated HTML
  
  -- Changes tracking
  changes_summary JSONB,                          -- VersionChanges
  
  -- Version state
  is_active BOOLEAN DEFAULT false,                -- Current version
  is_pinned BOOLEAN DEFAULT false,                -- User-pinned
  
  -- Metadata
  calculation_duration_ms INTEGER,
  tags TEXT[],
  notes TEXT,
  
  -- Indexes
  CONSTRAINT unique_report_version UNIQUE (report_id, version_number),
  FOREIGN KEY (report_id) REFERENCES valuation_sessions(report_id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX idx_versions_report_id ON valuation_versions(report_id);
CREATE INDEX idx_versions_created_at ON valuation_versions(created_at);
CREATE INDEX idx_versions_active ON valuation_versions(report_id, is_active) WHERE is_active = true;
```

### Table: `valuation_audit_log`

```sql
CREATE TABLE valuation_audit_log (
  id VARCHAR(255) PRIMARY KEY,
  report_id VARCHAR(255) NOT NULL,
  operation VARCHAR(50) NOT NULL,                 -- EDIT, REGENERATE, VERSION_CREATE
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  user_id VARCHAR(255),
  
  -- Operation details
  field VARCHAR(255),                             -- For EDIT operations
  old_value JSONB,
  new_value JSONB,
  percent_change DECIMAL(10, 2),
  
  -- Version tracking
  version_number INTEGER,
  
  -- Metadata
  correlation_id VARCHAR(255),
  metadata JSONB,
  
  -- Index
  FOREIGN KEY (report_id) REFERENCES valuation_sessions(report_id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX idx_audit_report_id ON valuation_audit_log(report_id);
CREATE INDEX idx_audit_timestamp ON valuation_audit_log(timestamp);
CREATE INDEX idx_audit_operation ON valuation_audit_log(operation);
```

---

## API Endpoints

### 1. List Versions

**GET** `/api/valuation-sessions/:reportId/versions`

**Description**: Get all versions for a report

**Query Parameters**:
- `limit` (optional): Number of versions to return (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)
- `tags` (optional): Filter by tags (comma-separated)
- `pinned` (optional): Filter pinned only (boolean)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "versions": [
      {
        "id": "version_1765751234567_abc123",
        "report_id": "val_123",
        "version_number": 3,
        "version_label": "Q4 2025 Update",
        "created_at": "2025-12-13T10:30:00Z",
        "created_by": "user_456",
        "form_data": { /* ValuationRequest */ },
        "valuation_result": { /* ValuationResponse */ },
        "html_report": "<html>...</html>",
        "changes_summary": {
          "revenue": { "from": 2000000, "to": 2500000, "percentChange": 25 },
          "totalChanges": 2,
          "significantChanges": ["revenue", "ebitda"]
        },
        "is_active": true,
        "is_pinned": false,
        "calculation_duration_ms": 3245,
        "tags": ["q4-2025", "adjusted"],
        "notes": "Updated after Q4 financials received"
      }
    ],
    "total": 3,
    "active_version": 3,
    "has_more": false
  }
}
```

**Error Responses**:
- 404: Report not found
- 401: Unauthorized

---

### 2. Get Specific Version

**GET** `/api/valuation-sessions/:reportId/versions/:versionNumber`

**Description**: Get a specific version by number

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "id": "version_1765751234567_abc123",
    "report_id": "val_123",
    "version_number": 2,
    // ... full version object ...
  }
}
```

**Error Responses**:
- 404: Version not found
- 401: Unauthorized

---

### 3. Create New Version

**POST** `/api/valuation-sessions/:reportId/versions`

**Description**: Create new version (called on regeneration)

**Request Body**:
```json
{
  "version_label": "Adjusted EBITDA",
  "form_data": { /* ValuationRequest */ },
  "valuation_result": { /* ValuationResponse */ },
  "html_report": "<html>...</html>",
  "changes_summary": {
    "ebitda": { "from": 500000, "to": 750000, "percentChange": 50 },
    "totalChanges": 1,
    "significantChanges": ["ebitda"]
  },
  "notes": "Updated EBITDA based on Q4 financials",
  "tags": ["q4-2025"]
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "version_1765751234567_xyz789",
    "version_number": 4,
    // ... full version object ...
  }
}
```

**Business Logic**:
1. Get current max version number for report
2. Increment version number (N+1)
3. Mark previous version as `is_active=false`
4. Create new version with `is_active=true`
5. Log version creation to audit table
6. Return created version

**Error Responses**:
- 400: Invalid request body
- 404: Report not found
- 409: Concurrent version creation

---

### 4. Update Version Metadata

**PATCH** `/api/valuation-sessions/:reportId/versions/:versionNumber`

**Description**: Update version label, notes, tags, or pin status

**Request Body**:
```json
{
  "version_label": "Final Q4 2025",
  "notes": "Approved by CFO",
  "tags": ["final", "q4-2025", "approved"],
  "is_pinned": true
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    // ... updated version object ...
  }
}
```

**Error Responses**:
- 404: Version not found
- 400: Invalid updates

---

### 5. Delete Version

**DELETE** `/api/valuation-sessions/:reportId/versions/:versionNumber`

**Description**: Delete a version (soft delete, keep audit trail)

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Version deleted"
}
```

**Business Logic**:
- Mark as deleted (soft delete)
- Keep in audit trail
- Cannot delete active version (must switch first)

**Error Responses**:
- 404: Version not found
- 400: Cannot delete active version
- 403: Insufficient permissions

---

### 6. Compare Versions

**GET** `/api/valuation-sessions/:reportId/versions/compare?v1=2&v2=3`

**Description**: Compare two versions side-by-side

**Query Parameters**:
- `v1`: First version number (required)
- `v2`: Second version number (required)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "version_a": { /* Full version object */ },
    "version_b": { /* Full version object */ },
    "changes": {
      "revenue": {
        "from": 2000000,
        "to": 2500000,
        "percentChange": 25,
        "timestamp": "2025-12-13T10:30:00Z"
      },
      "totalChanges": 2,
      "significantChanges": ["revenue", "ebitda"]
    },
    "valuation_delta": {
      "absolute_change": 625000,
      "percent_change": 15.6,
      "direction": "increase"
    },
    "highlights": [
      {
        "field": "revenue",
        "label": "Revenue",
        "old_value": 2000000,
        "new_value": 2500000,
        "impact": "+€500,000 (+25%)"
      }
    ]
  }
}
```

**Error Responses**:
- 404: Version not found
- 400: Invalid version numbers

---

### 7. Get Version Statistics

**GET** `/api/valuation-sessions/:reportId/versions/statistics`

**Description**: Get aggregated statistics about versions

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "total_versions": 5,
    "avg_time_between_versions_hours": 48.5,
    "most_changed_fields": [
      { "field": "ebitda", "count": 3 },
      { "field": "revenue", "count": 2 }
    ],
    "avg_valuation_change_percent": 12.3,
    "first_version": {
      "number": 1,
      "created_at": "2025-10-01T10:00:00Z"
    },
    "latest_version": {
      "number": 5,
      "created_at": "2025-12-13T10:30:00Z"
    }
  }
}
```

---

### 8. Get Audit Log

**GET** `/api/valuation-sessions/:reportId/audit`

**Description**: Get complete audit trail for report

**Query Parameters**:
- `operation` (optional): Filter by operation (EDIT, REGENERATE, VERSION_CREATE)
- `start_date` (optional): Filter from date (ISO 8601)
- `end_date` (optional): Filter to date (ISO 8601)
- `limit` (optional): Number of entries (default: 100, max: 1000)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "entries": [
      {
        "id": "audit_1765751234567_abc",
        "report_id": "val_123",
        "operation": "EDIT",
        "timestamp": "2025-12-13T10:25:00Z",
        "user_id": "user_456",
        "field": "ebitda",
        "old_value": 500000,
        "new_value": 750000,
        "percent_change": 50.0,
        "metadata": {
          "field_label": "EBITDA",
          "change_type": "modification"
        }
      }
    ],
    "total": 15,
    "has_more": false
  }
}
```

---

## Implementation Notes

### Transaction Safety

All version operations should be wrapped in database transactions:

```typescript
await db.transaction(async (trx) => {
  // 1. Mark current version as inactive
  await trx('valuation_versions')
    .where({ report_id: reportId, is_active: true })
    .update({ is_active: false })
  
  // 2. Create new version
  await trx('valuation_versions').insert(newVersion)
  
  // 3. Log to audit trail
  await trx('valuation_audit_log').insert(auditEntry)
})
```

### Performance Optimization

- Index on `(report_id, version_number)` for fast lookups
- Index on `(report_id, is_active)` for getting active version
- Cache latest version in Redis (invalidate on new version)
- Lazy-load HTML reports (don't include in list endpoint)

### Concurrency Handling

Use database constraints to prevent duplicate version numbers:

```sql
CONSTRAINT unique_report_version UNIQUE (report_id, version_number)
```

If concurrent creation attempts, return 409 Conflict and frontend will retry.

### Storage Limits

- Max 50 versions per report (soft limit)
- Archive old versions after 100 versions
- Compress HTML reports (gzip) for storage efficiency

---

## Migration Path

### Phase 1: MVP (Client-Side)
Frontend stores versions in `sessionData.versions[]` array.
No backend changes required.

### Phase 2: Backend Tables
1. Create `valuation_versions` table
2. Create `valuation_audit_log` table
3. Run migration on production

### Phase 3: API Implementation
1. Implement all 8 endpoints
2. Add transaction safety
3. Add indexes

### Phase 4: Migration
1. Migrate existing sessions to versioning system (v1 = original)
2. Update frontend to use backend API
3. Deprecate client-side storage

---

## Security Considerations

### Authorization

All endpoints require:
- User authentication OR
- Guest session validation

### Rate Limiting

- 100 requests/minute per user for list/get
- 20 requests/minute for create (prevent spam)
- 10 requests/minute for compare (expensive operation)

### Data Validation

- Validate `formData` against ValuationRequest schema
- Validate `versionNumber` is sequential
- Validate `reportId` exists in `valuation_sessions`
- Sanitize HTML reports before storage

---

## Testing Requirements

### Unit Tests
- Version CRUD operations
- Transaction rollback on error
- Duplicate version number handling

### Integration Tests
- Create version → verify in database
- List versions → verify pagination
- Compare versions → verify diff accuracy
- Concurrent creation → verify 409 handling

### Load Tests
- 1000 versions per report (stress test)
- 100 concurrent regenerations
- Compare large reports (100+ fields)

---

## Monitoring

### Metrics to Track
- Version creation rate
- Average versions per report
- Version retrieval latency (p95 <500ms)
- Storage growth rate
- Most active reports (by version count)

### Alerts
- Storage exceeds 10GB
- Single report exceeds 100 versions
- Version creation latency >1s
- Comparison latency >2s

---

## Example Implementation (Node.js/Express)

```typescript
// Example endpoint implementation
router.post('/api/valuation-sessions/:reportId/versions', async (req, res) => {
  const { reportId } = req.params
  const { version_label, form_data, valuation_result, html_report, changes_summary } = req.body
  
  try {
    // Start transaction
    const version = await db.transaction(async (trx) => {
      // Get next version number
      const maxVersion = await trx('valuation_versions')
        .where({ report_id: reportId })
        .max('version_number as max')
        .first()
      
      const nextVersion = (maxVersion?.max || 0) + 1
      
      // Mark current as inactive
      await trx('valuation_versions')
        .where({ report_id: reportId, is_active: true })
        .update({ is_active: false })
      
      // Create new version
      const newVersion = {
        id: `version_${Date.now()}_${generateUuid()}`,
        report_id: reportId,
        version_number: nextVersion,
        version_label: version_label || `Version ${nextVersion}`,
        form_data,
        valuation_result,
        html_report,
        changes_summary,
        is_active: true,
        created_at: new Date(),
      }
      
      await trx('valuation_versions').insert(newVersion)
      
      // Log to audit
      await trx('valuation_audit_log').insert({
        id: `audit_${Date.now()}_${generateUuid()}`,
        report_id: reportId,
        operation: 'VERSION_CREATE',
        version_number: nextVersion,
        timestamp: new Date(),
      })
      
      return newVersion
    })
    
    res.status(201).json({ success: true, data: version })
  } catch (error) {
    console.error('Failed to create version:', error)
    res.status(500).json({ success: false, error: 'Failed to create version' })
  }
})
```

---

**Contact**: Backend Team Lead  
**Review**: CTO Approval Required  
**Implementation Timeline**: 2 weeks

