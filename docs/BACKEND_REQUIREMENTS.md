# Backend Requirements for Session Management

**Date**: December 13, 2024  
**Priority**: High  
**Estimated Effort**: 8-10 hours  
**Status**: 🔴 Not Started

---

## Overview

The frontend session management is complete and waiting for backend endpoints. This document specifies exactly what the backend team needs to implement.

**Frontend Status**: ✅ 100% Complete (with placeholders)  
**Backend Status**: 🔴 0% Complete  
**Integration Risk**: Low (clean API contracts defined)

---

## Required Endpoints

### 1. List Sessions (Critical)

**Endpoint**: `GET /api/sessions`  
**Purpose**: Fetch recent sessions for home page  
**Estimated**: 2 hours

**Implementation Checklist**:
- [ ] Add database query with filters (user_id OR guest_session_id)
- [ ] Exclude DELETED status
- [ ] Sort by updated_at DESC
- [ ] Implement pagination (limit, offset)
- [ ] Return only summary fields (not full session data)
- [ ] Add unit tests
- [ ] Add integration tests

**Frontend Ready**: Yes - `reportService.listRecentReports()` calls this

---

### 2. Delete Session (High Priority)

**Endpoint**: `DELETE /api/sessions/:reportId`  
**Purpose**: Soft-delete sessions  
**Estimated**: 1 hour

**Implementation Checklist**:
- [ ] Verify ownership (user_id OR guest_session_id)
- [ ] Soft delete: Update status to DELETED
- [ ] Return success response
- [ ] Add unit tests
- [ ] Add integration tests

**Frontend Ready**: Yes - `reportService.deleteReport()` calls this

---

### 3. Business Cards (High Priority)

**Endpoint**: `GET /api/business-cards?token=...`  
**Purpose**: Fetch business card data for prefill  
**Estimated**: 2 hours

**Implementation Checklist**:
- [ ] Validate token parameter
- [ ] Query main database for business card
- [ ] Return relevant fields only
- [ ] Add caching (5 min TTL)
- [ ] Add unit tests
- [ ] Add integration tests

**Frontend Ready**: Yes - `businessCardService.fetchBusinessCard()` calls this

---

### 4. Database Schema (Critical)

**Task**: Add ValuationSession model  
**Estimated**: 1 hour (including migration)

**Implementation Checklist**:
- [ ] Add Prisma model (see SESSION_MANAGEMENT_API.md)
- [ ] Add indexes for performance
- [ ] Create migration
- [ ] Run migration on dev/staging
- [ ] Backfill existing sessions (if any)
- [ ] Test queries

**Frontend Ready**: Yes - expects session structure as defined

---

## Database Schema

### Prisma Schema

```prisma
model ValuationSession {
  id                   String    @id @default(uuid())
  report_id            String    @unique
  user_id              String?
  guest_session_id     String?
  
  status               SessionStatus @default(IN_PROGRESS)
  current_view         FlowType  @default(MANUAL)
  
  created_at           DateTime  @default(now())
  updated_at           DateTime  @updatedAt
  completed_at         DateTime?
  
  form_data            Json?
  collected_data       Json?
  conversation_history Json?
  valuation_result     Json?
  
  business_card_token  String?
  prefilled_from_card  Boolean   @default(false)
  
  @@index([user_id, updated_at])
  @@index([guest_session_id, updated_at])
  @@index([status])
}

enum SessionStatus {
  IN_PROGRESS
  COMPLETED
  ARCHIVED
  DELETED
}

enum FlowType {
  MANUAL
  CONVERSATIONAL
}
```

---

## Example Implementations

### 1. List Sessions Endpoint

```typescript
// apps/upswitch-backend/src/routes/sessions.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateOptional } from '../middleware/auth';

const router = Router();

router.get('/sessions', authenticateOptional, async (req, res) => {
  try {
    const { limit = 20, offset = 0, status = 'all' } = req.query;
    const userId = req.user?.id;
    const guestSessionId = req.guestSessionId;
    
    // Build where clause
    const whereClause: any = {
      AND: [
        // User OR guest sessions
        {
          OR: [
            userId ? { user_id: userId } : {},
            guestSessionId ? { guest_session_id: guestSessionId } : {},
          ].filter(obj => Object.keys(obj).length > 0)
        },
        // Status filter
        status !== 'all' ? { status: status.toUpperCase() } : {},
        // Exclude deleted
        { status: { not: 'DELETED' } }
      ]
    };
    
    // Query sessions
    const [sessions, total] = await Promise.all([
      prisma.valuationSession.findMany({
        where: whereClause,
        orderBy: { updated_at: 'desc' },
        take: Number(limit),
        skip: Number(offset),
        select: {
          id: true,
          report_id: true,
          status: true,
          current_view: true,
          created_at: true,
          updated_at: true,
          completed_at: true,
          form_data: true,
          valuation_result: true,
        }
      }),
      prisma.valuationSession.count({ where: whereClause })
    ]);
    
    res.json({
      sessions,
      total,
      has_more: Number(offset) + Number(limit) < total
    });
  } catch (error) {
    console.error('Failed to list sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

export default router;
```

### 2. Delete Session Endpoint

```typescript
router.delete('/sessions/:reportId', authenticateOptional, async (req, res) => {
  try {
    const { reportId } = req.params;
    const userId = req.user?.id;
    const guestSessionId = req.guestSessionId;
    
    // Fetch session
    const session = await prisma.valuationSession.findUnique({
      where: { report_id: reportId }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    // Verify ownership
    const isOwner = 
      (userId && session.user_id === userId) ||
      (guestSessionId && session.guest_session_id === guestSessionId);
    
    if (!isOwner) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Soft delete
    await prisma.valuationSession.update({
      where: { report_id: reportId },
      data: { status: 'DELETED', updated_at: new Date() }
    });
    
    res.json({ 
      success: true, 
      deleted_report_id: reportId 
    });
  } catch (error) {
    console.error('Failed to delete session:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});
```

### 3. Business Cards Endpoint

```typescript
// apps/upswitch-backend/src/routes/business-cards.ts
import { Router } from 'express';
import { prisma } from '../lib/prisma';
import NodeCache from 'node-cache';

const router = Router();
const cache = new NodeCache({ stdTTL: 300 }); // 5 min cache

router.get('/business-cards', async (req, res) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token required' });
    }
    
    // Check cache
    const cached = cache.get(token);
    if (cached) {
      return res.json(cached);
    }
    
    // Fetch from database
    const businessCard = await prisma.businessCard.findUnique({
      where: { token },
      select: {
        company_name: true,
        industry: true,
        business_type_id: true,
        revenue: true,
        employee_count: true,
        country_code: true,
        founding_year: true,
        description: true,
        city: true,
        business_highlights: true,
        reason_for_selling: true,
      }
    });
    
    if (!businessCard) {
      return res.status(404).json({ error: 'Business card not found' });
    }
    
    // Cache result
    cache.set(token, businessCard);
    
    res.json(businessCard);
  } catch (error) {
    console.error('Failed to fetch business card:', error);
    res.status(500).json({ error: 'Failed to fetch business card' });
  }
});

export default router;
```

---

## Integration Steps

### Step 1: Backend Implementation
1. Add Prisma schema
2. Run migrations
3. Implement endpoints
4. Add tests
5. Deploy to dev environment

### Step 2: Frontend Configuration
1. Update environment variables (if needed)
2. No code changes required (already integrated)
3. Test with real endpoints

### Step 3: End-to-End Testing
1. Create new valuation
2. Check appears in recent reports
3. Continue existing valuation
4. Delete report
5. Test business card prefill

### Step 4: Production Deployment
1. Deploy backend to staging
2. Test with staging frontend
3. Monitor performance
4. Deploy to production

---

## Risk Mitigation

### Risk 1: Performance with Many Sessions
**Mitigation**: 
- Implement pagination
- Add database indexes
- Cache recent sessions

### Risk 2: Data Loss During Migration
**Mitigation**:
- Backfill existing sessions
- Test migration on staging first
- Keep old endpoints during transition

### Risk 3: Business Card API Changes
**Mitigation**:
- Abstract business card service
- Version API if needed
- Handle missing fields gracefully

---

## Success Criteria

### Functional
- [ ] Users see recent reports on home page
- [ ] Users can continue existing valuations
- [ ] Users can delete reports
- [ ] Business card data prefills correctly
- [ ] Guest sessions work
- [ ] Auth sessions work
- [ ] Session migration on login works

### Performance
- [ ] List endpoint responds in <500ms
- [ ] Restore endpoint responds in <300ms
- [ ] Business cards endpoint responds in <200ms (with cache)
- [ ] No N+1 queries

### Security
- [ ] Users can only access their own sessions
- [ ] Guests can only access guest sessions
- [ ] Input validation prevents injection
- [ ] Rate limiting prevents abuse

---

**Contact**: Backend Team  
**Review Required**: CTO Approval  
**Documentation**: See [SESSION_MANAGEMENT_API.md](./SESSION_MANAGEMENT_API.md)
