# Normalisation Module: Implementation Checklist

**Quick Reference Guide for Development Team**  
**Status:** Planning Phase  
**Timeline:** 8 Weeks  
**Last Updated:** December 2025

---

## 📋 Pre-Implementation Checklist

### Week 0: Planning & Design

- [ ] **Team alignment meeting**
  - Present strategy documents to full team
  - Get buy-in from Product, Design, Engineering
  - Assign owners for each work stream

- [ ] **Design assets**
  - Figma mockups for all UI states (manual flow)
  - Conversation flow diagrams (conversational)
  - Before/after preview designs
  - Mobile/tablet responsive designs

- [ ] **Technical specifications finalized**
  - TypeScript interfaces approved
  - Database schema reviewed and approved
  - API contracts defined
  - Feature flag strategy agreed

- [ ] **Repository setup**
  - Create feature branch: `feature/normalisation-module`
  - Set up Storybook for component development
  - Create GitHub project board with all tasks
  - Set up daily standup schedule

---

## 🏗️ Phase 1: Foundation (Week 1-2)

### Frontend - Data Models

**File:** `src/types/normalisation.ts`

- [ ] Create `NormalisationAdjustments` interface
- [ ] Create `OwnerAdjustment` interface
- [ ] Create `OneOffAdjustment` interface
- [ ] Create `AccountingReversal` interface
- [ ] Create `UnusualIncomeAdjustment` interface
- [ ] Add normalisation fields to `ValuationFormData`
- [ ] Export all types from index

**File:** `src/types/valuation.ts`

- [ ] Extend `ValuationFormData` with normalisation fields
  ```typescript
  ebitda_reported?: number;
  ebitda_normalized?: number;
  normalisation_adjustments?: NormalisationAdjustments;
  normalisation_applied?: boolean;
  ```

### Frontend - Component Structure

**Create new components:**

- [ ] `src/components/normalisation/NormalisationModule.tsx`
  - Main container component
  - Collapsible panel logic
  - State management
  - Before/after calculation

- [ ] `src/components/normalisation/OwnerAdjustmentsForm.tsx`
  - Owner salary, personal expenses, vehicle, insurance
  - Form validation
  - Add/remove adjustment logic

- [ ] `src/components/normalisation/OneOffAdjustmentsForm.tsx`
  - Legal, repairs, lawsuits, consulting
  - Year picker
  - Description field

- [ ] `src/components/normalisation/AccountingReversalsForm.tsx`
  - Depreciation, interest, non-cash
  - Auto-detection suggestions
  - One-click approval

- [ ] `src/components/normalisation/UnusualIncomeForm.tsx`
  - Grants, subsidies, asset sales
  - Negative adjustment handling

- [ ] `src/components/normalisation/NormalisationPreview.tsx`
  - Before/after display
  - Adjustment breakdown
  - Percentage impact calculation

- [ ] `src/components/normalisation/AdjustmentCard.tsx`
  - Individual adjustment display
  - Edit/delete actions
  - Confidence indicator

**Create utility functions:**

- [ ] `src/utils/normalisation.ts`
  ```typescript
  calculateNormalizedEbitda(reported: number, adjustments: Adjustment[]): number
  formatAdjustment(adjustment: Adjustment): string
  validateAdjustment(adjustment: Adjustment): ValidationResult
  getTotalAdjustment(adjustments: Adjustment[]): number
  ```

### Backend - API Endpoints

**File:** `src/api/endpoints/normalisation.py`

- [ ] Create `/api/v1/valuation/normalize-ebitda` endpoint
  - Request model with adjustments
  - Calculation logic
  - Validation
  - Response with breakdown

- [ ] Update `/api/v1/valuation/calculate` endpoint
  - Accept normalisation fields
  - Use normalized EBITDA if provided
  - Include normalisation in response

**File:** `src/models/normalisation.py`

- [ ] Create Pydantic models
  ```python
  class AdjustmentBase(BaseModel)
  class OwnerAdjustment(AdjustmentBase)
  class OneOffAdjustment(AdjustmentBase)
  class AccountingReversal(AdjustmentBase)
  class UnusualIncomeAdjustment(AdjustmentBase)
  class NormalisationRequest(BaseModel)
  class NormalisationResponse(BaseModel)
  ```

**File:** `src/services/normalisation_service.py`

- [ ] Implement `calculate_normalized_ebitda()`
- [ ] Implement `validate_adjustments()`
- [ ] Implement `format_adjustment_breakdown()`
- [ ] Add audit logging

### Backend - Database

**Create migration file:** `alembic/versions/XXX_add_normalisation_fields.py`

- [ ] Add columns to `valuation_requests`:
  ```sql
  ebitda_reported DECIMAL(15, 2)
  ebitda_normalized DECIMAL(15, 2)
  normalisation_adjustments JSONB
  normalisation_applied BOOLEAN DEFAULT FALSE
  ```

- [ ] Create `normalisation_adjustments` table (for analytics):
  ```sql
  id UUID PRIMARY KEY
  valuation_request_id UUID
  adjustment_category VARCHAR(50)
  adjustment_type VARCHAR(50)
  amount DECIMAL(15, 2)
  description TEXT
  confidence VARCHAR(20)
  created_at TIMESTAMP
  ```

- [ ] Create indexes
- [ ] Test rollback

**Run migrations:**

- [ ] Test on local database
- [ ] Test on staging database
- [ ] Verify backward compatibility
- [ ] Document any breaking changes

---

## 🎨 Phase 2: Manual Flow Implementation (Week 3-4)

### Integration Points

**File:** `src/components/ValuationForm.tsx`

- [ ] Import `NormalisationModule`
- [ ] Add normalisation state
  ```typescript
  const [normalisedEbitda, setNormalisedEbitda] = useState<number | null>(null);
  const [adjustments, setAdjustments] = useState<NormalisationAdjustments | null>(null);
  ```

- [ ] Add normalisation module after EBITDA input:
  ```tsx
  <CustomNumberInputField label="EBITDA" ... />
  
  <NormalisationModule
    reportedEbitda={formData.ebitda}
    onComplete={(adjustments, normalized) => {
      updateFormData({
        ebitda_reported: formData.ebitda,
        ebitda_normalized: normalized,
        normalisation_adjustments: adjustments,
        normalisation_applied: true
      });
    }}
    initialAdjustments={formData.normalisation_adjustments}
  />
  
  <HistoricalDataInputs ... />
  ```

- [ ] Update form submission
  - Include normalisation data in request
  - Use normalized EBITDA if available
  - Fall back to reported EBITDA if not

- [ ] Add localStorage persistence
  - Save adjustments to localStorage
  - Restore on page reload
  - Clear on session reset

**File:** `src/store/useValuationStore.ts`

- [ ] Add normalisation fields to store
- [ ] Update `calculateValuation()` to handle normalisation
- [ ] Add action: `setNormalisationData()`
- [ ] Add selector: `getNormalizedEbitda()`

### Testing

- [ ] **Unit tests:**
  - `normalisation.test.ts` - Calculation functions
  - `NormalisationModule.test.tsx` - Component behavior
  - `useValuationStore.test.ts` - Store integration

- [ ] **Integration tests:**
  - Form submission with normalisation
  - Data persistence across page reload
  - Validation error handling
  - Edge cases (negative EBITDA, huge adjustments)

- [ ] **E2E tests (Cypress):**
  - `normalisation-flow.cy.ts`
  - Complete normalisation journey
  - Skip normalisation journey
  - Edit and recalculate

---

## 🤖 Phase 3: Conversational Flow (Week 5-6)

### AI Prompt Engineering

**File:** `src/services/chat/prompts/normalisation.ts`

- [ ] Create system prompt for normalisation phase
- [ ] Create intro message prompt
- [ ] Create section prompts (owner, one-off, reversals, unusual)
- [ ] Create summary/reveal prompt
- [ ] Create error handling prompts
- [ ] Test with various user responses

**File:** `src/services/chat/extractors/normalisationExtractor.ts`

- [ ] Implement GPT-4 function calling
- [ ] Define extraction schema
- [ ] Handle natural language → structured data
- [ ] Add confidence scoring
- [ ] Test extraction accuracy

### Conversation State Management

**File:** `src/services/chat/states/normalisationState.ts`

- [ ] Create `NormalisationConversationState` interface
- [ ] Implement phase transitions
- [ ] Add adjustment tracking
- [ ] Add skip/resume logic
- [ ] Persist to session storage

**File:** `src/components/AIAssistedValuation.tsx`

- [ ] Add Phase 2B to conversation flow
- [ ] Add normalisation state to component
- [ ] Integrate normalisation prompts
- [ ] Add adjustment cards to chat UI
- [ ] Add live running total widget
- [ ] Update valuation request with normalisation data

### Backend Integration

**File:** `src/api/endpoints/chat.py`

- [ ] Add `/api/v1/chat/normalisation/extract` endpoint
  - Accept conversation history
  - Extract structured adjustments
  - Return formatted data

- [ ] Update conversation streaming
  - Include normalisation phase
  - Handle phase transitions
  - Stream adjustment confirmations

### Testing

- [ ] **Conversation tests:**
  - `conversationalNormalisation.test.ts`
  - Happy path (all sections)
  - Skip flow
  - Edit/revise adjustments
  - Natural language extraction accuracy

- [ ] **AI tests:**
  - Test various phrasings for same adjustment
  - Test edge cases (negative amounts, typos)
  - Test confidence scoring accuracy
  - Test multi-adjustment extraction

---

## 📊 Phase 4: Reporting & Analytics (Week 7)

### Valuation Report Updates

**File:** `src/components/Results.tsx`

- [ ] Add "Normalisation Bridge" section
  - Show reported vs normalized EBITDA
  - List all adjustments
  - Explain impact on valuation

**File:** `templates/pdf_report.html`

- [ ] Add normalisation section to PDF
- [ ] Include adjustment table
- [ ] Add before/after visualization
- [ ] Explain methodology

**File:** `src/services/reportGeneration.ts`

- [ ] Update report generation logic
- [ ] Include normalisation in executive summary
- [ ] Add normalisation metadata
- [ ] Update email summaries

### Analytics Implementation

**File:** `src/services/analytics.ts`

- [ ] Track normalisation events:
  ```typescript
  trackNormalisationOpened()
  trackNormalisationCompleted(adjustmentCount)
  trackNormalisationSkipped()
  trackAdjustmentAdded(category, amount)
  trackNormalisationImpact(percentIncrease)
  ```

**Backend analytics:**

- [ ] Create dashboard queries
  - Adoption rate over time
  - Most common adjustments by industry
  - Average impact by business type
  - User segments (power users vs casual)

- [ ] Set up alerts
  - High skip rate
  - Low completion rate
  - Unusual adjustment patterns
  - Error rate spikes

---

## 🧪 Phase 5: Testing & Polish (Week 8)

### Comprehensive Testing

- [ ] **Manual QA:**
  - Test all user journeys (manual + conversational)
  - Test on multiple devices (desktop, tablet, mobile)
  - Test on multiple browsers (Chrome, Firefox, Safari)
  - Test with screen readers (accessibility)

- [ ] **Performance testing:**
  - Measure impact on bundle size
  - Check API response times
  - Verify no regression in valuation speed
  - Test with 100+ adjustments (stress test)

- [ ] **Beta testing:**
  - Recruit 5-10 accountants
  - Collect detailed feedback
  - Watch screen recordings
  - Conduct user interviews

### Polish & Refinement

- [ ] **Copy review:**
  - Review all tooltips
  - Review all error messages
  - Review all confirmation messages
  - Get feedback from non-technical users

- [ ] **Design polish:**
  - Animation timing
  - Loading states
  - Empty states
  - Error states
  - Success celebrations

- [ ] **Mobile optimization:**
  - Touch targets (min 44x44px)
  - Keyboard behavior
  - Scroll performance
  - Responsive breakpoints

### Documentation

- [ ] **User documentation:**
  - Help center article: "What is EBITDA normalisation?"
  - Video tutorial (2-3 minutes)
  - FAQ section
  - Best practices guide

- [ ] **Developer documentation:**
  - Component API docs
  - Integration guide for new developers
  - Troubleshooting guide
  - Architecture diagram

- [ ] **Marketing materials:**
  - Feature announcement blog post
  - Social media graphics
  - Demo video for sales
  - Update pitch deck

---

## 🚀 Launch (End of Week 8)

### Pre-Launch Checklist

- [ ] **Code review:**
  - All PRs reviewed and approved
  - No critical or high severity issues
  - Code coverage >80%
  - Performance benchmarks met

- [ ] **Infrastructure:**
  - Feature flag configured: `enable_normalisation_module`
  - Database migrations tested in production
  - Rollback plan documented
  - On-call engineer assigned

- [ ] **Monitoring:**
  - Dashboards created in monitoring tool
  - Alerts configured and tested
  - Error tracking set up
  - Performance metrics baseline recorded

- [ ] **Support readiness:**
  - Customer support team trained
  - FAQ prepared
  - Canned responses ready
  - Escalation process defined

### Gradual Rollout

**Day 1-2: Internal + Alpha Testers (1%)**

- [ ] Enable for internal team
- [ ] Enable for alpha testers
- [ ] Monitor error rates every hour
- [ ] Collect immediate feedback
- [ ] Fix any critical bugs

**Day 3-5: Beta Expansion (10%)**

- [ ] Gradually increase to 10% of users
- [ ] A/B test vs control group
- [ ] Monitor key metrics daily
- [ ] Iterate on UX based on feedback

**Day 6-10: Wider Release (50%)**

- [ ] Increase to 50% of users
- [ ] Compare metrics across segments
- [ ] Prepare for full launch

**Day 11-14: Full Launch (100%)**

- [ ] Enable for all users
- [ ] Launch announcement email
- [ ] Publish blog post
- [ ] Social media campaign
- [ ] Monitor for 48 hours

### Post-Launch

**Week 1 after launch:**

- [ ] Daily metrics review
- [ ] Hot-fix any bugs
- [ ] Collect user feedback
- [ ] Schedule retrospective

**Week 2-4 after launch:**

- [ ] Analyze A/B test results
- [ ] Write impact report
- [ ] Plan Phase 2 features
- [ ] Celebrate with team! 🎉

---

## 📈 Success Metrics (Track Weekly)

### Adoption Metrics

- [ ] % of users who see normalisation module
- [ ] % of users who open normalisation module
- [ ] % of users who complete at least one adjustment
- [ ] Average number of adjustments per user
- [ ] Most common adjustment categories

### Impact Metrics

- [ ] Average % increase in EBITDA after normalisation
- [ ] Distribution of total adjustment amounts
- [ ] Valuation impact (average $ increase)
- [ ] Conversion to premium (normalisation users vs non-users)

### Quality Metrics

- [ ] Error rate for normalisation calculations
- [ ] User satisfaction score (post-valuation survey)
- [ ] Time spent in normalisation module
- [ ] Abandonment rate mid-normalisation
- [ ] Edit/revision rate

### Technical Metrics

- [ ] API latency (p50, p90, p99)
- [ ] Frontend bundle size impact
- [ ] Database query performance
- [ ] Error rates by component

---

## 🎯 Definition of Done

A task is considered "done" when:

- [ ] Code is written and follows style guide
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] E2E tests written and passing (if applicable)
- [ ] Code reviewed and approved by 2+ engineers
- [ ] Documentation updated
- [ ] Tested manually on dev environment
- [ ] Deployed to staging and verified
- [ ] Product owner has approved
- [ ] No high or critical severity bugs

Feature is ready for launch when:

- [ ] All tasks are "done"
- [ ] Beta testing completed successfully
- [ ] Performance benchmarks met
- [ ] Accessibility requirements met
- [ ] Security review passed
- [ ] Legal/compliance review passed (if needed)
- [ ] Marketing materials ready
- [ ] Support team trained
- [ ] Monitoring and alerts configured
- [ ] Rollback plan tested

---

## 🆘 Troubleshooting

### Common Issues & Solutions

**Issue:** Normalisation calculations don't match manual calculations

- Check: Adjustment sign (positive vs negative)
- Check: Rounding precision
- Check: Sum order (might affect floating point)
- Solution: Add comprehensive test cases with known values

**Issue:** High abandonment rate in normalisation

- Check: Time spent in module (too long?)
- Check: Number of fields (too many?)
- Check: Error messages (too aggressive validation?)
- Solution: Simplify or make optional

**Issue:** Users confused about what adjustments to make

- Check: Tooltip clarity
- Check: Examples provided
- Check: Industry guidance
- Solution: Add more examples, video tutorials

**Issue:** Conversational extraction accuracy low

- Check: Prompt engineering
- Check: Function calling schema
- Check: Test cases coverage
- Solution: Iterate on prompts, add more training examples

---

## 📞 Contact & Escalation

**Feature Owner:** [CTO Name]  
**Product Owner:** [Product Manager Name]  
**Tech Lead:** [Tech Lead Name]  
**Design Lead:** [Designer Name]

**Escalation Path:**
1. Post in #normalisation-module Slack channel
2. Tag @engineering-team for technical issues
3. Tag @product-team for UX/product questions
4. Page on-call engineer for production issues

**Office Hours:** Daily standup 10:00 AM CET during implementation

---

## ✅ Final Sign-off

Before moving to next phase, get sign-off from:

- [ ] **CTO** - Technical architecture and implementation approach
- [ ] **Product Manager** - Feature scope and user experience
- [ ] **Design Lead** - UI/UX designs and interaction patterns
- [ ] **Engineering Lead** - Technical feasibility and timeline
- [ ] **QA Lead** - Testing strategy and coverage
- [ ] **DevOps Lead** - Infrastructure and deployment plan

**Phase 1 Sign-off Date:** _________________  
**Phase 2 Sign-off Date:** _________________  
**Phase 3 Sign-off Date:** _________________  
**Go-Live Approval Date:** _________________

---

**Last Updated:** December 2025  
**Document Version:** 1.0  
**Status:** Ready for Implementation Kickoff

---

*This checklist is the operational manifestation of the strategy. It transforms vision into execution through clear, actionable steps that any engineer can follow.*
