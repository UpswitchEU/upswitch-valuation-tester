# Normalisation Module Integration Strategy

**Document Type:** Technical Architecture & Implementation Plan  
**Owner:** CTO  
**Status:** Design Phase  
**Target:** Q1 2026 MVP Release  
**Last Updated:** December 2025

---

## Context

The normalisation primitive is the foundational differentiator for Upswitch. It transforms SME financial statements (engineered for tax) into economic truth (engineered for valuation).

**Current State:**
- Manual flow: Direct EBITDA input (no normalisation)
- Conversational flow: AI collects data but doesn't systematically normalize
- Backend: No normalisation logic or adjustments tracking

**Target State:**
- Manual flow: Guided normalisation module after financial input
- Conversational flow: AI-guided normalisation conversation
- Backend: Store adjustments, calculate normalized EBITDA, show before/after

**Strategic Goal:** 
Make normalisation the "aha moment" — the point where accountants and owners see Upswitch's true value and feel empowered rather than burdened.

---

## Risks & Constraints

### Technical Risks
1. **Complexity Creep** — Risk of over-engineering the MVP with too many adjustment categories
   - Mitigation: Start with 4-6 most common adjustments (80/20 rule)

2. **UI/UX Friction** — Adding a step could increase abandonment
   - Mitigation: Make it optional but strongly recommended, show immediate value

3. **Data Model Changes** — Need backend schema updates
   - Mitigation: Design backward-compatible schema with optional fields

4. **Calculation Integrity** — Adjustments must propagate correctly through valuation engine
   - Mitigation: Add comprehensive validation and audit trail

### Business Constraints
1. **Time to Market** — Need to ship within 8-12 weeks
2. **Accountant Mental Model** — Must match how accountants already think about adjustments
3. **Mobile Support** — Must work on tablets (accountants on the go)
4. **Performance** — No impact on current 2-3 second valuation speed

---

## Options Analysis

### Option A: Inline Normalisation Modal (RECOMMENDED)

**Description:**  
Add a collapsible normalisation section between EBITDA input and calculation button in `ValuationForm.tsx`. Opens as an accordion/modal overlay.

**Pros:**
- Minimal navigation changes
- Preserves existing flow
- Easy to make optional
- Fits naturally into manual workflow
- Can show before/after immediately

**Cons:**
- Could make form feel longer
- Requires UI redesign of form layout

**Trade-offs:**
- Speed of implementation vs completeness of features
- Keep MVP lean (4-6 adjustments) or comprehensive (12+ adjustments)?

---

### Option B: Separate Normalisation Step (Page)

**Description:**  
Add a dedicated step between financial input and calculation: `Financial Input → Normalisation → Calculate`

**Pros:**
- More space for UI/UX
- Clear separation of concerns
- Easier to add advanced features later
- Better for conversational flow parity

**Cons:**
- Adds navigation complexity
- Increases perceived time to value
- More development effort
- Could increase abandonment rate

**Trade-offs:**
- Better UX for power users vs faster flow for quick users

---

### Option C: Post-Calculation Enhancement

**Description:**  
Show normalisation opportunity after initial calculation, allow user to refine

**Pros:**
- Zero friction for first valuation
- Shows value proposition after they see baseline
- Can upsell as "improve accuracy"

**Cons:**
- Weakens the primitive narrative
- Requires recalculation flow
- Doesn't match "truth from the start" positioning
- Two-step calculation feels less professional

**Trade-offs:**
- Speed vs positioning as foundational infrastructure

---

## Recommendation: Option A (Inline Normalisation Modal)

**Why:**
1. **Aligns with primitive positioning** — Truth is built from the start, not adjusted after
2. **Minimal friction** — Collapsible section can be expanded/collapsed
3. **Fastest to implement** — Works within existing `ValuationForm.tsx`
4. **Accountant-friendly** — Matches mental model of "cleaning the books"
5. **Mobile-friendly** — Modal overlay works well on tablets

**Implementation:**  
Add normalisation module as collapsible section in `ValuationForm.tsx` after EBITDA field, before calculation button.

---

## Architecture

### High-Level Component Structure

```
ValuationForm.tsx
├── Company Name Input
├── Business Type Selector
├── Country Selector
├── Industry Dropdown
├── Revenue Input
├── EBITDA Input
│
├── ✨ NEW: NormalisationModule Component ✨
│   ├── Trigger Button: "Normalize EBITDA (Recommended)" 
│   ├── Collapsible Section / Modal
│   │   ├── Section 1: Owner Adjustments
│   │   ├── Section 2: One-Off Adjustments
│   │   ├── Section 3: Accounting Reversals
│   │   └── Section 4: Before/After Preview
│   └── Normalized EBITDA Display
│
├── Historical Data (Optional)
├── Additional Details
└── Calculate Button
```

### Component Hierarchy

```
<ValuationForm>
  <FormFields>
    ...
    <EBITDAInput />
    
    <NormalisationModule
      reportedEbitda={formData.ebitda}
      onNormalisationComplete={(adjustments, normalizedEbitda) => {
        updateFormData({
          ebitda_reported: formData.ebitda,
          ebitda_normalized: normalizedEbitda,
          normalisation_adjustments: adjustments
        });
      }}
    />
    
    <HistoricalDataInputs />
    <CalculateButton />
  </FormFields>
</ValuationForm>
```

---

## Data Model

### Frontend (FormData Schema Extension)

```typescript
interface ValuationFormData {
  // Existing fields...
  revenue: number;
  ebitda: number; // Will store normalized EBITDA if adjustments made
  
  // NEW: Normalisation fields
  ebitda_reported?: number; // Original reported EBITDA
  ebitda_normalized?: number; // Calculated normalized EBITDA
  normalisation_adjustments?: NormalisationAdjustments;
  normalisation_applied?: boolean; // Flag to track if user used normalisation
}

interface NormalisationAdjustments {
  owner_adjustments: OwnerAdjustment[];
  one_off_adjustments: OneOffAdjustment[];
  accounting_reversals: AccountingReversal[];
  unusual_income_adjustments: UnusualIncomeAdjustment[];
  total_adjustment: number; // Sum of all adjustments
  adjustment_notes?: string; // Optional user notes
}

interface OwnerAdjustment {
  category: 'salary' | 'personal_expenses' | 'vehicle' | 'health_insurance' | 'other';
  description: string;
  amount: number; // Positive = add back, Negative = subtract
  confidence: 'high' | 'medium' | 'low'; // For future AI suggestions
}

interface OneOffAdjustment {
  category: 'legal' | 'repairs' | 'lawsuit' | 'consulting' | 'other';
  description: string;
  amount: number;
  year?: number; // Optional: which year did this occur
}

interface AccountingReversal {
  category: 'depreciation' | 'interest' | 'non_cash' | 'other';
  description: string;
  amount: number;
  auto_detected: boolean; // Future: AI auto-detection
}

interface UnusualIncomeAdjustment {
  category: 'subsidy' | 'grant' | 'rebate' | 'spike' | 'other';
  description: string;
  amount: number; // Negative = subtract unusual income
}
```

### Backend API Extension

```python
# In valuation request model
class ValuationRequest(BaseModel):
    # Existing fields...
    revenue: float
    ebitda: float
    
    # NEW: Optional normalisation fields
    ebitda_reported: Optional[float] = None
    ebitda_normalized: Optional[float] = None
    normalisation_adjustments: Optional[Dict[str, Any]] = None
    normalisation_applied: Optional[bool] = False

# NEW: Normalisation calculation endpoint (optional for MVP)
@router.post("/api/v1/valuation/normalize-ebitda")
async def normalize_ebitda(
    reported_ebitda: float,
    adjustments: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """
    Calculate normalized EBITDA from reported EBITDA + adjustments.
    This can be called before full valuation for live preview.
    """
    normalized = calculate_normalized_ebitda(reported_ebitda, adjustments)
    return {
        "reported_ebitda": reported_ebitda,
        "normalized_ebitda": normalized,
        "total_adjustment": normalized - reported_ebitda,
        "adjustment_breakdown": format_adjustment_breakdown(adjustments)
    }
```

### Database Schema

```sql
-- Extend valuation_requests table
ALTER TABLE valuation_requests
ADD COLUMN ebitda_reported DECIMAL(15, 2),
ADD COLUMN ebitda_normalized DECIMAL(15, 2),
ADD COLUMN normalisation_adjustments JSONB,
ADD COLUMN normalisation_applied BOOLEAN DEFAULT FALSE;

-- Create index for analytics
CREATE INDEX idx_normalisation_applied ON valuation_requests(normalisation_applied);

-- NEW: Normalisation adjustments tracking table (for future analytics)
CREATE TABLE normalisation_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    valuation_request_id UUID REFERENCES valuation_requests(id),
    adjustment_category VARCHAR(50) NOT NULL, -- 'owner', 'one_off', 'reversal', 'unusual_income'
    adjustment_type VARCHAR(50) NOT NULL, -- 'salary', 'personal_expenses', etc.
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    confidence VARCHAR(20), -- 'high', 'medium', 'low'
    auto_detected BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_adjustments_valuation ON normalisation_adjustments(valuation_request_id);
CREATE INDEX idx_adjustments_category ON normalisation_adjustments(adjustment_category);
```

---

## UI/UX Design Patterns

### Visual Design Philosophy

**Inspiration:**
- Stripe's payment form (clean, progressive disclosure)
- Linear's keyboard-first UX (fast for power users)
- Notion's collapsible sections (hide complexity)

### Key UI Elements

#### 1. Normalisation Trigger Button

```tsx
{/* After EBITDA Input */}
<div className="mt-4 mb-6">
  <button
    type="button"
    onClick={() => setShowNormalisation(!showNormalisation)}
    className="w-full px-4 py-3 bg-gradient-to-r from-accent-600/10 to-accent-500/10 
               border-2 border-accent-500/30 rounded-xl hover:border-accent-500/50 
               transition-all duration-200 flex items-center justify-between group"
  >
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
        <TrendingUp className="w-5 h-5 text-accent-400" />
      </div>
      <div className="text-left">
        <div className="font-semibold text-white flex items-center gap-2">
          Normalize EBITDA (Recommended)
          <span className="px-2 py-0.5 bg-accent-500/20 text-accent-300 text-xs rounded-full">
            Big 4 Standard
          </span>
        </div>
        <div className="text-sm text-zinc-400">
          Add back owner expenses, one-offs, and tax optimizations
        </div>
      </div>
    </div>
    <ChevronDown 
      className={`w-5 h-5 text-zinc-400 transition-transform duration-200 
                  ${showNormalisation ? 'rotate-180' : ''}`} 
    />
  </button>
</div>
```

#### 2. Collapsible Normalisation Panel

```tsx
{showNormalisation && (
  <motion.div
    initial={{ height: 0, opacity: 0 }}
    animate={{ height: 'auto', opacity: 1 }}
    exit={{ height: 0, opacity: 0 }}
    className="mb-6 p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl"
  >
    <NormalisationForm
      reportedEbitda={formData.ebitda}
      onUpdate={(adjustments, normalized) => {
        setNormalisedEbitda(normalized);
        setAdjustments(adjustments);
      }}
    />
  </motion.div>
)}
```

#### 3. Before/After Preview Card

```tsx
<div className="mt-6 p-4 bg-zinc-900 border border-accent-500/30 rounded-xl">
  <div className="flex items-center justify-between mb-3">
    <span className="text-sm font-medium text-zinc-400">Reported EBITDA</span>
    <span className="text-lg font-semibold text-zinc-300">
      €{formatCurrency(reportedEbitda)}
    </span>
  </div>
  
  {adjustments.length > 0 && (
    <>
      <div className="flex items-center justify-between mb-3 text-accent-400">
        <span className="text-sm font-medium">+ Adjustments</span>
        <span className="text-lg font-semibold">
          €{formatCurrency(totalAdjustment)}
        </span>
      </div>
      
      <div className="h-px bg-gradient-to-r from-transparent via-accent-500/30 to-transparent my-3" />
      
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-white">Normalized EBITDA</span>
        <span className="text-2xl font-bold text-accent-400">
          €{formatCurrency(normalizedEbitda)}
        </span>
      </div>
      
      <div className="mt-3 text-xs text-zinc-500 text-center">
        {((totalAdjustment / reportedEbitda) * 100).toFixed(1)}% increase in valuation basis
      </div>
    </>
  )}
</div>
```

---

## Implementation Plan (8-Week Timeline)

### Week 1-2: Foundation

**Tasks:**
1. **Data Model Design** (2 days)
   - Finalize TypeScript interfaces
   - Design database schema
   - Review with team

2. **Component Architecture** (3 days)
   - Create `NormalisationModule.tsx` skeleton
   - Create sub-components:
     - `OwnerAdjustmentsForm.tsx`
     - `OneOffAdjustmentsForm.tsx`
     - `AccountingReversalsForm.tsx`
     - `NormalisationPreview.tsx`

3. **Backend API Design** (2 days)
   - Design normalisation calculation endpoint
   - Plan database migrations
   - Write API specifications

4. **Design Review** (1 day)
   - Review UX flows with team
   - Get design approval

**Deliverables:**
- [ ] Component specifications document
- [ ] API endpoint specifications
- [ ] Database migration scripts (draft)
- [ ] Figma designs for all UI states

---

### Week 3-4: Core Implementation (Manual Flow)

**Tasks:**
1. **Frontend: NormalisationModule Component** (5 days)
   - Build `NormalisationModule` with all sub-components
   - Implement state management (local state + form sync)
   - Add validation logic
   - Implement before/after calculation
   - Add animations and interactions

2. **Frontend: ValuationForm Integration** (2 days)
   - Integrate `NormalisationModule` into `ValuationForm.tsx`
   - Update form submission logic to include adjustments
   - Add localStorage persistence for adjustments

3. **Backend: Normalisation Logic** (3 days)
   - Implement `calculate_normalized_ebitda()` function
   - Add validation for adjustments
   - Update valuation calculation to use normalized EBITDA
   - Add audit trail logging

**Deliverables:**
- [ ] Working normalisation module in manual flow
- [ ] Backend API with normalisation support
- [ ] Unit tests for calculation logic
- [ ] Integration tests for full flow

---

### Week 5-6: Conversational Flow Integration

**Tasks:**
1. **AI Prompt Engineering** (3 days)
   - Design normalisation conversation flow
   - Write prompts for each adjustment category
   - Add fallback/clarification prompts
   - Test with various scenarios

2. **Conversation Flow Updates** (4 days)
   - Update `AIAssistedValuation.tsx` to include normalisation step
   - Add normalisation phase to conversation state machine
   - Implement adjustment suggestions from AI
   - Add user confirmation/override flow

3. **Parity Testing** (2 days)
   - Ensure both flows produce same data structure
   - Test switching between manual/conversational mid-flow
   - Verify data persistence

**Deliverables:**
- [ ] Normalisation prompts in AI system
- [ ] Updated conversational flow with normalisation
- [ ] Cross-flow compatibility tests

---

### Week 7: Backend Database & Reporting

**Tasks:**
1. **Database Migration** (1 day)
   - Run migrations on staging
   - Verify backward compatibility
   - Test with existing data

2. **Valuation Report Updates** (3 days)
   - Add normalisation section to PDF report
   - Show adjustment breakdown in HTML report
   - Add "Normalisation Bridge" visualization
   - Update email summaries to mention normalisation

3. **Analytics & Tracking** (1 day)
   - Add event tracking for normalisation usage
   - Create dashboard queries for adjustment patterns
   - Set up alerts for anomalies

**Deliverables:**
- [ ] Production database with new schema
- [ ] Updated PDF reports with normalisation section
- [ ] Analytics dashboard for normalisation metrics

---

### Week 8: Testing, Polish & Launch

**Tasks:**
1. **End-to-End Testing** (2 days)
   - Test all user journeys
   - Test mobile/tablet experience
   - Performance testing (no regression)
   - Cross-browser testing

2. **Accountant Beta Testing** (2 days)
   - Recruit 5-10 accountants for testing
   - Collect feedback on UX
   - Iterate on copy and tooltips
   - Fix critical bugs

3. **Documentation & Training** (1 day)
   - Write user documentation
   - Create demo video
   - Update help center
   - Prepare launch email

4. **Launch** (1 day)
   - Deploy to production
   - Monitor error rates
   - Collect initial user feedback
   - Prepare hot-fix capability

**Deliverables:**
- [ ] Production-ready normalisation feature
- [ ] User documentation and demos
- [ ] Launch announcement materials
- [ ] Monitoring dashboards

---

## Testing Strategy

### Unit Tests

```typescript
describe('Normalisation Calculations', () => {
  it('should correctly add back owner salary adjustment', () => {
    const reported = 100000;
    const adjustments = [{
      category: 'salary',
      amount: 50000
    }];
    const normalized = calculateNormalizedEbitda(reported, adjustments);
    expect(normalized).toBe(150000);
  });
  
  it('should handle negative adjustments (unusual income)', () => {
    const reported = 100000;
    const adjustments = [{
      category: 'grant',
      amount: -20000 // Subtract one-time grant
    }];
    const normalized = calculateNormalizedEbitda(reported, adjustments);
    expect(normalized).toBe(80000);
  });
  
  it('should preserve precision for decimal amounts', () => {
    const reported = 100000.50;
    const adjustments = [{
      category: 'vehicle',
      amount: 12345.67
    }];
    const normalized = calculateNormalizedEbitda(reported, adjustments);
    expect(normalized).toBe(112346.17);
  });
});
```

### Integration Tests

```typescript
describe('Normalisation Flow Integration', () => {
  it('should persist adjustments when switching between manual/conversational', async () => {
    // Start in manual, add adjustments
    await fillManualForm({ ebitda: 100000 });
    await addNormalisationAdjustment({ category: 'salary', amount: 50000 });
    
    // Switch to conversational
    await switchToConversational();
    
    // Verify adjustments persisted
    const sessionData = await getSessionData();
    expect(sessionData.normalisation_adjustments).toBeDefined();
    expect(sessionData.ebitda_normalized).toBe(150000);
  });
  
  it('should include normalisation in final valuation', async () => {
    await submitValuationWithNormalisation({
      reported_ebitda: 100000,
      adjustments: [{ category: 'salary', amount: 50000 }]
    });
    
    const result = await getValuationResult();
    expect(result.ebitda_used_in_valuation).toBe(150000);
    expect(result.normalisation_applied).toBe(true);
  });
});
```

### E2E Tests (Cypress)

```typescript
describe('Normalisation User Journey', () => {
  it('should allow user to normalize EBITDA and see impact on valuation', () => {
    cy.visit('/');
    cy.fillBasicInfo({ company: 'Test Co', revenue: 1000000, ebitda: 100000 });
    
    // Open normalisation
    cy.contains('Normalize EBITDA').click();
    
    // Add owner salary adjustment
    cy.get('[data-test="add-owner-adjustment"]').click();
    cy.get('[data-test="adjustment-category"]').select('salary');
    cy.get('[data-test="adjustment-amount"]').type('50000');
    
    // Verify preview
    cy.contains('Normalized EBITDA').should('be.visible');
    cy.contains('€150,000').should('be.visible');
    
    // Submit calculation
    cy.get('[data-test="calculate-button"]').click();
    
    // Verify report includes normalisation
    cy.get('[data-test="valuation-report"]').should('contain', 'Normalisation Bridge');
    cy.get('[data-test="adjustments-summary"]').should('contain', 'Owner Salary: €50,000');
  });
});
```

---

## Monitoring & Observability

### Key Metrics to Track

1. **Adoption Metrics:**
   - % of users who open normalisation module
   - % of users who complete at least one adjustment
   - Average number of adjustments per valuation
   - Most common adjustment categories

2. **Impact Metrics:**
   - Average % increase in EBITDA after normalisation
   - Distribution of adjustment amounts
   - Correlation between normalisation and premium subscriptions

3. **Technical Metrics:**
   - Normalisation module load time
   - API endpoint response times
   - Error rates for normalisation calculations
   - Form abandonment after opening normalisation

### Alerts

```yaml
alerts:
  - name: "Normalisation Calculation Errors"
    condition: "error_rate > 1% over 5 minutes"
    severity: "critical"
    notify: ["engineering-oncall"]
  
  - name: "High Normalisation Abandonment"
    condition: "abandonment_rate > 30% over 1 hour"
    severity: "warning"
    notify: ["product-team"]
  
  - name: "Unusual Adjustment Amounts"
    condition: "adjustment_amount > 10x reported_ebitda"
    severity: "warning"
    notify: ["data-team"]
```

### Dashboards

**Product Dashboard:**
- Normalisation funnel: Open → Add Adjustment → Calculate
- Adjustment category breakdown (pie chart)
- Before/after EBITDA distribution (histogram)
- User satisfaction scores (post-calculation survey)

**Engineering Dashboard:**
- API latency percentiles (p50, p90, p99)
- Error rates by endpoint
- Database query performance
- Frontend bundle size impact

---

## AI Automation Opportunities

### Phase 1: Smart Suggestions (Q2 2026)

**Auto-detect common adjustments from financial data:**

```python
def suggest_adjustments(financial_data: Dict) -> List[Adjustment]:
    """
    AI-powered adjustment suggestions based on industry patterns.
    """
    suggestions = []
    
    # Example: Detect likely owner salary normalization
    if financial_data['industry'] == 'small_business':
        # Industry benchmark for owner salary
        typical_salary = get_industry_benchmark('owner_salary', financial_data['industry'])
        if financial_data.get('employee_count', 0) <= 5:
            suggestions.append({
                'category': 'salary',
                'amount': typical_salary,
                'confidence': 'medium',
                'reason': 'Small business typically pays owner below market rate for tax reasons'
            })
    
    # Example: Detect one-time expenses from historical variance
    if has_historical_data(financial_data):
        anomalies = detect_expense_anomalies(financial_data['historical_years'])
        for anomaly in anomalies:
            suggestions.append({
                'category': 'one_off',
                'amount': anomaly['amount'],
                'year': anomaly['year'],
                'confidence': 'high',
                'reason': f'Unusual expense spike in {anomaly["year"]}: {anomaly["description"]}'
            })
    
    return suggestions
```

### Phase 2: Document Parsing (Q3 2026)

**Parse uploaded financial statements to auto-fill adjustments:**

- OCR financial PDFs
- Extract line items (depreciation, interest, unusual expenses)
- Pre-fill normalisation form with detected items
- User reviews and confirms

### Phase 3: Learning System (Q4 2026)

**Learn from accountant adjustments to improve suggestions:**

- Track which adjustments accountants accept/reject
- Build industry-specific adjustment patterns
- Improve confidence scores over time
- Personalize suggestions per user/firm

---

## Success Criteria

### MVP Success (8 weeks post-launch):

- [ ] **Adoption:** 40%+ of manual flow users open normalisation module
- [ ] **Completion:** 25%+ of users who open it complete at least one adjustment
- [ ] **Impact:** Average 20-30% increase in EBITDA for users who normalize
- [ ] **Quality:** <0.5% error rate on normalisation calculations
- [ ] **Performance:** <100ms added to form load time
- [ ] **NPS:** No negative impact on user satisfaction (maintain 40+ NPS)

### Long-term Success (6 months):

- [ ] **Market Positioning:** "Normalisation" becomes known Upswitch feature
- [ ] **Accountant Adoption:** 60%+ of accountant users utilize normalisation
- [ ] **Data Collection:** 10,000+ normalisation data points for ML training
- [ ] **Revenue Impact:** Normalisation users have 2x conversion to premium
- [ ] **Competitive Moat:** No competitor has comparable feature

---

## Rollout Strategy

### Phase 1: Internal Alpha (Week 1-2)

- Deploy to staging environment
- Internal team testing only
- Fix critical bugs
- Refine UX based on team feedback

### Phase 2: Accountant Beta (Week 3-4)

- Invite 10-20 accountants from waiting list
- Feature flag: `enable_normalisation_beta`
- Collect detailed feedback
- Iterate on copy, tooltips, and workflow
- Measure completion rates

### Phase 3: Gradual Rollout (Week 5-6)

- Enable for 10% of users (A/B test)
- Monitor metrics daily
- Increase to 25%, then 50%
- Compare conversion rates between control/treatment

### Phase 4: Full Launch (Week 7-8)

- Enable for 100% of users
- Launch marketing campaign
- Publish blog post: "Why Upswitch Normalizes EBITDA"
- Update all pitch materials
- Train customer support team

---

## Future Enhancements (Post-MVP)

### Q2 2026: Advanced Features

1. **Industry Templates**
   - Pre-filled adjustment checklists per industry
   - "Restaurant normalisation template" with 8 common adjustments

2. **Adjustment History**
   - Save user's common adjustments across valuations
   - "Apply my standard adjustments" button

3. **Collaborative Normalisation**
   - Share normalisation worksheet with clients
   - Client approves/rejects each adjustment
   - Audit trail for compliance

### Q3 2026: AI-Powered

1. **Document Upload**
   - Upload P&L PDF, auto-extract adjustments
   - "We detected 3 potential adjustments"

2. **Smart Suggestions**
   - AI suggests adjustments based on industry + financials
   - User reviews and confirms

3. **Benchmark Comparisons**
   - "Your owner salary adjustment is typical for this industry"
   - Show anonymized peer data

### Q4 2026: Integration & Scale

1. **Accounting Software Integration**
   - QuickBooks, Xero direct sync
   - Auto-populate adjustments from chart of accounts

2. **White-Label for Accountants**
   - Branded normalisation tool for accounting firms
   - Firm-specific adjustment templates

3. **Normalisation API**
   - External partners can use normalisation engine
   - "Normalized EBITDA as a Service"

---

## Appendix: Component Code Examples

### NormalisationModule.tsx (Skeleton)

```tsx
import React, { useState, useEffect } from 'react';
import { TrendingUp, Plus, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Adjustment {
  id: string;
  category: string;
  type: string;
  amount: number;
  description: string;
}

interface NormalisationModuleProps {
  reportedEbitda: number;
  onComplete: (adjustments: Adjustment[], normalizedEbitda: number) => void;
  initialAdjustments?: Adjustment[];
}

export const NormalisationModule: React.FC<NormalisationModuleProps> = ({
  reportedEbitda,
  onComplete,
  initialAdjustments = []
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [adjustments, setAdjustments] = useState<Adjustment[]>(initialAdjustments);
  const [activeSection, setActiveSection] = useState<string | null>('owner');

  // Calculate normalized EBITDA
  const normalizedEbitda = reportedEbitda + adjustments.reduce((sum, adj) => sum + adj.amount, 0);
  const totalAdjustment = normalizedEbitda - reportedEbitda;
  const adjustmentPercentage = ((totalAdjustment / reportedEbitda) * 100).toFixed(1);

  // Trigger callback when adjustments change
  useEffect(() => {
    onComplete(adjustments, normalizedEbitda);
  }, [adjustments, normalizedEbitda, onComplete]);

  const addAdjustment = (category: string, type: string, amount: number, description: string) => {
    setAdjustments([...adjustments, {
      id: `adj_${Date.now()}_${Math.random()}`,
      category,
      type,
      amount,
      description
    }]);
  };

  const removeAdjustment = (id: string) => {
    setAdjustments(adjustments.filter(adj => adj.id !== id));
  };

  return (
    <div className="my-6">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gradient-to-r from-accent-600/10 to-accent-500/10 
                   border-2 border-accent-500/30 rounded-xl hover:border-accent-500/50 
                   transition-all duration-200 flex items-center justify-between group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-accent-500/20 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-accent-400" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-white flex items-center gap-2">
              Normalize EBITDA (Recommended)
              <span className="px-2 py-0.5 bg-accent-500/20 text-accent-300 text-xs rounded-full">
                Big 4 Standard
              </span>
            </div>
            <div className="text-sm text-zinc-400">
              {adjustments.length > 0 
                ? `${adjustments.length} adjustment${adjustments.length > 1 ? 's' : ''} added`
                : 'Add back owner expenses, one-offs, and tax optimizations'
              }
            </div>
          </div>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-5 h-5 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </motion.div>
      </button>

      {/* Collapsible Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="mt-4 p-6 bg-zinc-900/50 border border-zinc-800 rounded-xl space-y-6">
              {/* Section Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-2">
                {[
                  { id: 'owner', label: 'Owner' },
                  { id: 'one-off', label: 'One-Offs' },
                  { id: 'reversals', label: 'Reversals' },
                  { id: 'unusual', label: 'Unusual Income' }
                ].map(section => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                      activeSection === section.id
                        ? 'bg-accent-500 text-white'
                        : 'bg-zinc-800/50 text-zinc-400 hover:text-zinc-300'
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>

              {/* Section Content */}
              <div className="min-h-[200px]">
                {activeSection === 'owner' && <OwnerAdjustmentsForm onAdd={addAdjustment} />}
                {activeSection === 'one-off' && <OneOffAdjustmentsForm onAdd={addAdjustment} />}
                {activeSection === 'reversals' && <AccountingReversalsForm onAdd={addAdjustment} />}
                {activeSection === 'unusual' && <UnusualIncomeForm onAdd={addAdjustment} />}
              </div>

              {/* Adjustments List */}
              {adjustments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-zinc-400">Current Adjustments</h4>
                  {adjustments.map(adj => (
                    <div 
                      key={adj.id} 
                      className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="text-sm font-medium text-white">{adj.description}</div>
                        <div className="text-xs text-zinc-500">{adj.category} • {adj.type}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-accent-400">
                          {adj.amount >= 0 ? '+' : ''}€{Math.abs(adj.amount).toLocaleString()}
                        </span>
                        <button
                          onClick={() => removeAdjustment(adj.id)}
                          className="p-1 hover:bg-zinc-700/50 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-zinc-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Before/After Preview */}
              <div className="p-4 bg-zinc-900 border border-accent-500/30 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-zinc-400">Reported EBITDA</span>
                  <span className="text-lg font-semibold text-zinc-300">
                    €{reportedEbitda.toLocaleString()}
                  </span>
                </div>
                
                {adjustments.length > 0 && (
                  <>
                    <div className="flex items-center justify-between mb-3 text-accent-400">
                      <span className="text-sm font-medium">
                        {totalAdjustment >= 0 ? '+' : ''} Adjustments
                      </span>
                      <span className="text-lg font-semibold">
                        €{Math.abs(totalAdjustment).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="h-px bg-gradient-to-r from-transparent via-accent-500/30 to-transparent my-3" />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Normalized EBITDA</span>
                      <span className="text-2xl font-bold text-accent-400">
                        €{normalizedEbitda.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="mt-3 text-xs text-center">
                      <span className="text-zinc-400">Impact: </span>
                      <span className="text-accent-400 font-semibold">
                        {adjustmentPercentage}% increase
                      </span>
                      <span className="text-zinc-400"> in valuation basis</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
```

---

## Summary & Next Steps

### Key Decisions Made

1. ✅ **Architecture:** Inline normalisation module in `ValuationForm.tsx`
2. ✅ **MVP Scope:** 4 adjustment categories, 4-6 common adjustments
3. ✅ **Timeline:** 8 weeks from design to launch
4. ✅ **Data Model:** Extend existing schema with backward compatibility
5. ✅ **UX Pattern:** Collapsible/expandable with clear before/after preview

### Immediate Next Steps

**Week 1 Actions:**
1. [ ] **Design Review Meeting** — Present this doc to team, get buy-in
2. [ ] **Create Figma Mockups** — Visual design of all states
3. [ ] **Backend Schema Finalization** — Review with data team
4. [ ] **Create GitHub Issues** — Break down into trackable tasks
5. [ ] **Set up Feature Flag** — `enable_normalisation_module`

**Engineering Kickoff:**
- Create feature branch: `feature/normalisation-module`
- Set up Storybook stories for new components
- Schedule daily standups for first 2 weeks
- Plan demo for end of Week 2

---

**Document Status:** Ready for Team Review  
**Next Review:** After Week 4 implementation checkpoint  
**Owner:** CTO  
**Contributors:** Product, Engineering, Design

---

*This document embodies the CTO persona's approach: structured thinking, clear architecture, pragmatic timelines, and executable plans. It balances technical depth with business context, and provides a complete roadmap from concept to production.*
