# Normalisation Module: Executive Summary

**Prepared for:** Co-founders & Leadership Team  
**Prepared by:** CTO  
**Date:** December 2025  
**Status:** Ready for Review & Approval

---

## 🎯 What We're Building

A **guided normalisation system** that transforms tax-optimized SME financials into economic truth — the foundational primitive that differentiates Upswitch from every competitor.

---

## 📋 The Complete Strategy (4 Documents)

I've created comprehensive technical documentation covering every aspect of the normalisation module:

### 1. **Main Strategy Document** (22 pages)
`NORMALISATION_MODULE_INTEGRATION_STRATEGY.md`

**What it covers:**
- Full architecture design & component structure
- 8-week implementation timeline
- Data models (frontend, backend, database)
- UI/UX design patterns with code examples
- Testing & monitoring strategy
- Future enhancements roadmap

**Key Decision:** Inline modal in manual flow (Option A) — integrates naturally into existing `ValuationForm.tsx`

---

### 2. **Conversational Flow Design** (15 pages)
`NORMALISATION_CONVERSATIONAL_FLOW.md`

**What it covers:**
- AI-guided conversation design
- Prompt engineering for each adjustment category
- Natural language → structured data extraction
- Conversation state management
- Error handling & edge cases

**Key Innovation:** Phase 2B in conversation flow — the "aha moment" where users discover hidden value

---

### 3. **Implementation Checklist** (20 pages)
`NORMALISATION_IMPLEMENTATION_CHECKLIST.md`

**What it covers:**
- Week-by-week task breakdown
- Component-level development checklist
- Integration points (manual + conversational)
- Testing requirements
- Launch strategy (gradual rollout)

**For:** Engineers & project managers to execute

---

### 4. **Documentation Hub**
`NORMALISATION_README.md`

**What it covers:**
- Overview & navigation guide
- Key concepts glossary
- Quick start guides (by role)
- FAQs
- Design principles

**For:** Anyone new to the project

---

## 🏗️ How It Fits Into Each Flow

### Manual Flow Integration

**Where:** Collapsible section in `ValuationForm.tsx` between EBITDA input and Calculate button

**UX Pattern:**
```
Revenue Input ✓
EBITDA Input ✓

↓

[PROMINENT BUTTON]
✨ Normalize EBITDA (Recommended) [Big 4 Standard]
Add back owner expenses, one-offs — increases value 20-30%

[User clicks] →

[COLLAPSIBLE PANEL OPENS]
├── Tab 1: Owner Adjustments
├── Tab 2: One-Off Events  
├── Tab 3: Accounting Reversals
└── Tab 4: Unusual Income

[LIVE PREVIEW]
Before: €100,000
Adjustments: +€70,000
After: €170,000 ✨

↓

Historical Data (Optional)
Calculate Button
```

**Key Features:**
- Collapsible (no friction if user skips)
- Tabbed interface (progressive disclosure)
- Live before/after preview (immediate impact)
- Mobile-friendly modal overlay

---

### Conversational Flow Integration

**Where:** New Phase 2B inserted between financial data collection and risk assessment

**Conversation Pattern:**
```
Phase 2: Financial Data
  "What's your revenue?" → €1,000,000
  "What's your EBITDA?" → €100,000

↓

Phase 2B: Normalisation (NEW)
  
  AI: "Great! Now let's find the hidden value in these numbers.
       Most SME financials are optimized for tax, not valuation.
       Let me guide you through adjustments — like Big 4 firms do.
       Usually takes 2-3 minutes and increases value 20-30%.
       Ready?"
  
  User: "Yes"
  
  AI: "Perfect! Let's start with OWNER COMPENSATION...
       In your industry, typical owner salary is €80-120K.
       Are you paying yourself below market for tax reasons?"
  
  User: "Yes, I pay myself €40K"
  
  AI: "✓ Got it! Adding back €40K.
       
       Any other owner-related expenses?
       • Company car?
       • Personal travel/meals?
       • Family on payroll?"
  
  [Continues through 4 categories...]
  
  AI: "✨ Normalisation complete!
       
       REPORTED: €100,000
       + Adjustments: €70,000
       ━━━━━━━━━━━━━━━━━━━━
       NORMALIZED: €170,000
       
       That's 70% more value! 🚀
       Ready to continue?"

↓

Phase 3: Risk Assessment
  [Continues as normal...]
```

**Key Features:**
- Educational conversation (not interrogation)
- Natural language extraction (GPT-4 function calling)
- Live running total widget
- Celebrates each adjustment as a "win"

---

## 💡 Key Technical Decisions

### 1. Architecture: Inline Modal (Option A)

**Why:**
- ✅ Minimal friction (collapsible, optional)
- ✅ Matches accountant mental model
- ✅ Fastest to implement (8 weeks)
- ✅ Works within existing form structure
- ✅ Mobile-friendly

**Rejected alternatives:**
- ❌ Separate page (adds navigation complexity)
- ❌ Post-calculation (weakens primitive narrative)

---

### 2. Data Model: Extend Existing Schema

```typescript
interface ValuationFormData {
  ebitda: number; // Stores normalized if adjustments made
  
  // NEW fields
  ebitda_reported?: number; // Original reported EBITDA
  ebitda_normalized?: number; // Calculated normalized
  normalisation_adjustments?: {
    owner_adjustments: Adjustment[];
    one_off_adjustments: Adjustment[];
    accounting_reversals: Adjustment[];
    unusual_income_adjustments: Adjustment[];
  };
  normalisation_applied?: boolean; // Track usage
}
```

**Why:**
- ✅ Backward compatible
- ✅ Preserves audit trail
- ✅ Enables analytics
- ✅ Single source of truth

---

### 3. Conversational AI: GPT-4 Function Calling

**Extract structured data from natural language:**

```python
User: "We had a €15k legal issue and spent €8k on repairs"

# AI extracts:
[
  {
    category: 'legal',
    amount: 15000,
    description: 'legal dispute'
  },
  {
    category: 'repairs',
    amount: 8000,
    description: 'emergency repairs'
  }
]
```

**Why:**
- ✅ High accuracy (>95%)
- ✅ Natural conversation
- ✅ Flexible to user phrasing
- ✅ Can extract confidence scores

---

## 📅 Implementation Timeline

### 8-Week Plan

**Week 1-2: Foundation**
- Data models & interfaces
- Component structure
- Backend API & database schema
- Design approval

**Week 3-4: Manual Flow**
- Build normalisation components
- Integrate into `ValuationForm.tsx`
- Testing & refinement

**Week 5-6: Conversational Flow**
- AI prompt engineering
- Conversation state management
- Natural language extraction
- Testing accuracy

**Week 7: Reporting & Analytics**
- Update PDF reports
- Add normalisation section
- Analytics tracking
- Dashboard setup

**Week 8: Testing & Launch**
- End-to-end testing
- Beta testing with accountants
- Gradual rollout (1% → 10% → 50% → 100%)
- Marketing launch

**Target Go-Live:** End of Q1 2026

---

## 🎯 Success Criteria

### MVP Success (8 weeks post-launch)

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Adoption Rate | 40%+ | Shows feature resonates |
| Completion Rate | 25%+ | Shows UX works |
| Average Impact | 20-30% EBITDA increase | Validates value prop |
| Error Rate | <0.5% | Ensures accuracy |
| NPS Impact | No regression | Doesn't hurt experience |
| Time Added | <5 minutes | Minimal friction |

### Long-Term Success (6 months)

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Accountant Adoption | 60%+ | Core distribution channel |
| Premium Conversion | 2× vs control | Revenue impact |
| Data Points Collected | 10,000+ | Enables AI training |
| Competitive Moat | No competitor feature | Market leadership |
| Market Positioning | "Normalisation = Upswitch" | Brand association |

---

## 💰 Business Impact

### Short-Term (Q1-Q2 2026)

1. **Differentiation**
   - Only platform with guided normalisation
   - "Big 4 quality" positioning validated
   - Clear value prop for accountants

2. **User Engagement**
   - Increased time on platform
   - Higher completion rates
   - More data collected per user

3. **Trust Building**
   - Transparency = trust
   - Accountants feel empowered
   - Buyers trust valuations

### Long-Term (2026-2027)

1. **Network Effects**
   - 10,000+ normalisation data points
   - Train AI for auto-detection
   - Industry benchmarks emerge

2. **Category Creation**
   - "Normalisation" becomes standard term
   - Upswitch = default solution
   - Competitors forced to copy

3. **Infrastructure Position**
   - Becomes valuation spine of Europe
   - Banks require Upswitch normalisation
   - Policy makers reference our data

---

## 🚨 Risks & Mitigation

### Risk 1: Feature Adds Friction

**Risk:** Users abandon because it seems complicated

**Mitigation:**
- Make it optional but prominent
- Show clear value prop (20-30% increase)
- Track abandonment, iterate quickly
- A/B test messaging

### Risk 2: Low Adoption

**Risk:** <25% adoption means feature doesn't resonate

**Mitigation:**
- Beta test with accountants first
- Iterate on UX based on feedback
- Consider more aggressive prompting
- Educational content (videos, tutorials)

### Risk 3: AI Extraction Errors

**Risk:** Conversational flow extracts wrong amounts

**Mitigation:**
- Extensive testing with various phrasings
- Confirmation step before applying
- Allow easy editing
- Track accuracy, improve prompts

### Risk 4: Timeline Slips

**Risk:** 8 weeks becomes 12-16 weeks

**Mitigation:**
- Well-defined MVP scope
- Weekly checkpoints
- Feature flag for gradual rollout
- Can launch manual-only first, add conversational later

---

## 🎨 Why This Design?

### 1. Aligns with First Principles Strategy

Normalisation is **Primitive #1** in our strategy:
- Truth in → Trust out → Liquidity follows
- Can't build infrastructure without this foundation
- Everything else (AI, marketplace, credit scoring) depends on normalized data

### 2. Matches Accountant Mental Model

Accountants already do this manually:
- "Clean the books" before valuation
- Add back owner salary, one-offs
- Standard practice in M&A

We're just **digitizing their expertise**.

### 3. Creates Competitive Moat

**Why competitors can't copy easily:**
- Requires Big 4 methodology expertise (we have it)
- Need UX that doesn't overwhelm (hard to get right)
- Requires both manual AND conversational flow (technical complexity)
- Need data to train AI suggestions (network effect)

**Time to copy:** 24-36 months + €2M+

### 4. Enables Future Features

With normalized data, we can build:
- AI auto-detection (Phase 2)
- Industry benchmarks (Phase 3)
- Risk scoring (Phase 4)
- Credit underwriting (Phase 5)
- Public SME health index (Phase 6)

**Normalisation is the foundation for everything.**

---

## 💬 What Co-Founders Should Know

### For CEO (Matthias)

**Strategic Positioning:**
- This IS the primitive that makes us infrastructure
- Enables "Bloomberg Terminal for SME value" positioning
- Creates defensible moat competitors can't easily copy
- Unlocks accountant distribution channel

**Market Impact:**
- Accountants will love this (empowers them)
- Buyers will trust us more (transparency)
- Banks/lenders will require us (standardization)

### For CPO

**Product Strategy:**
- This is MVP #1 for 2026
- Everything else can wait
- Success metrics are clear
- User research validates need

**UX Philosophy:**
- Educate, don't interrogate
- Show value immediately
- Make it optional but irresistible
- Celebrate discoveries

### For COO

**Operational Impact:**
- Support team needs training
- FAQ and help docs required
- Beta testing with 10-20 accountants
- Monitor metrics daily after launch

**Risk Management:**
- Gradual rollout minimizes risk
- Can roll back if issues arise
- Clear escalation path

---

## ✅ Next Steps

### Immediate (This Week)

1. **Review & Approve** these documents
2. **Team alignment meeting** (2 hours)
3. **Assign ownership** (who owns what)
4. **Kickoff design** (Figma mockups)

### Week 1 Priorities

1. **Finalize data model** (frontend + backend)
2. **Create GitHub issues** (all tasks)
3. **Set up feature branch** (`feature/normalisation-module`)
4. **Design review** (approve UI/UX)

### Pre-Implementation Approvals Needed

- [ ] **Strategic approval** from CEO (is this the right priority?)
- [ ] **Technical approval** from CTO (architecture sound?)
- [ ] **Product approval** from CPO (UX appropriate?)
- [ ] **Resource approval** from COO (team capacity available?)
- [ ] **Timeline approval** (8 weeks realistic?)

---

## 📊 Investment Required

### Team Time (8 weeks)

- **Frontend Engineers:** 2 FTE × 8 weeks = 16 engineer-weeks
- **Backend Engineers:** 1 FTE × 6 weeks = 6 engineer-weeks
- **AI Engineer:** 0.5 FTE × 4 weeks = 2 engineer-weeks
- **Designer:** 0.5 FTE × 8 weeks = 4 designer-weeks
- **QA:** 1 FTE × 2 weeks = 2 engineer-weeks
- **Product Manager:** 0.25 FTE × 8 weeks = 2 PM-weeks

**Total:** ~30 person-weeks

### External Costs

- **Beta tester incentives:** €1,000 (10 accountants × €100 gift cards)
- **Analytics tools:** €0 (use existing)
- **Infrastructure:** €0 (marginal cost on existing)

**Total:** €1,000

### Opportunity Cost

**What we're NOT building:**
- Marketplace features
- Additional valuation methods
- Mobile app enhancements

**Why normalisation first:**
Because it's the FOUNDATION. Everything else is built on top.

---

## 🎉 Vision of Success

**3 months post-launch:**
- 40%+ of valuations use normalisation
- First accountant firm licenses white-label version
- Competitor analysis shows no equivalent feature

**6 months post-launch:**
- 60%+ accountant adoption
- "Normalisation" mentioned in 50%+ of sales calls
- First bank requests Upswitch normalisation for loan approval

**12 months post-launch:**
- Industry standard for SME valuation
- Competitors forced to build copycat features (12-18 months behind)
- Upswitch = "the normalized valuation"

**When normalisation succeeds, Upswitch becomes infrastructure.**

---

## 📞 Questions & Discussion

**For leadership review meeting:**

1. Is this the right strategic priority for Q1 2026?
2. Do we have team capacity for 8-week build?
3. Any concerns about timeline or scope?
4. What's our risk tolerance on gradual rollout?
5. How do we measure success beyond metrics?

**Ready to proceed?** Let's schedule alignment meeting.

---

**Prepared by:** CTO  
**Date:** December 2025  
**Status:** Awaiting Leadership Approval  
**Next Review:** Leadership Alignment Meeting

---

*"The normalisation module isn't a feature — it's the foundation of the European SME truth engine."*
