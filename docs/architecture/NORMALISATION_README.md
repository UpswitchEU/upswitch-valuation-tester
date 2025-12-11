# Normalisation Module Documentation

**The foundational primitive that transforms Upswitch from a valuation tool into the truth engine of the European SME economy.**

---

## 🎯 What is the Normalisation Module?

The normalisation module is Upswitch's core differentiator — the system that transforms tax-optimized SME financial statements into economic truth suitable for valuation.

**Problem:**  
SME financial statements are engineered for tax minimization, not valuation accuracy. Owner salaries are suppressed, personal expenses are booked as business costs, and one-time events distort the picture.

**Solution:**  
A guided system that helps accountants and business owners systematically identify and adjust for these distortions, revealing the true economic earning power of the business.

**Impact:**  
- 20-30% average increase in EBITDA after normalisation
- Builds trust with buyers (they see the full calculation)
- Positions Upswitch as Big 4-quality infrastructure
- Creates defensible competitive moat

---

## 📚 Documentation Structure

This normalisation module documentation consists of 4 comprehensive documents:

### 1. **Strategy & Architecture** (Start Here)
**File:** `NORMALISATION_MODULE_INTEGRATION_STRATEGY.md`

**What it covers:**
- Strategic context and "why now"
- Architecture options analysis (with recommendation)
- Data model design (frontend, backend, database)
- UI/UX design patterns
- 8-week implementation timeline
- Testing strategy
- Monitoring & observability
- Future enhancements roadmap

**For:** CTO, Tech Leads, Senior Engineers, Product Managers

**Key sections:**
- Context & Constraints
- Options Analysis (A/B/C)
- Recommendation: Option A (Inline Modal)
- Component Architecture
- Implementation Plan (8 weeks)
- Testing & Monitoring

---

### 2. **Conversational Flow Design**
**File:** `NORMALISATION_CONVERSATIONAL_FLOW.md`

**What it covers:**
- AI-guided normalisation conversation design
- Prompt engineering for each section
- Natural language → structured data extraction
- Conversation state management
- UX patterns for chat interface
- Error handling & edge cases
- Testing strategy for AI accuracy

**For:** AI Engineers, Product Designers, Conversational UX Specialists

**Key sections:**
- Conversation Phase Design (Phase 2B)
- AI Message Templates
- Extraction Logic (GPT-4 function calling)
- User Confusion Scenarios
- Testing Strategy

---

### 3. **Implementation Checklist**
**File:** `NORMALISATION_IMPLEMENTATION_CHECKLIST.md`

**What it covers:**
- Week-by-week task breakdown
- Component-level checklist
- Integration points (manual + conversational)
- Testing requirements
- Launch checklist
- Success metrics
- Troubleshooting guide

**For:** Engineers implementing the feature, QA, Project Managers

**Key sections:**
- Pre-Implementation Setup
- Phase 1: Foundation (Week 1-2)
- Phase 2: Manual Flow (Week 3-4)
- Phase 3: Conversational Flow (Week 5-6)
- Phase 4: Reporting (Week 7)
- Phase 5: Testing & Launch (Week 8)
- Definition of Done

---

### 4. **This README**
**File:** `NORMALISATION_README.md`

**What it covers:**
- Overview of normalisation module
- Documentation navigation
- Quick reference
- Key concepts glossary
- FAQs

**For:** Anyone new to the normalisation module

---

## 🚀 Quick Start

### For Product Managers

1. Read **Section A-C** of `NORMALISATION_MODULE_INTEGRATION_STRATEGY.md`
2. Review **Conversation Design** in `NORMALISATION_CONVERSATIONAL_FLOW.md`
3. Understand success metrics in **Implementation Checklist**

**Key questions to answer:**
- What user problem does this solve?
- How does it fit into the product vision?
- What are the success criteria?

---

### For Engineers

1. Read **Architecture** section of `NORMALISATION_MODULE_INTEGRATION_STRATEGY.md`
2. Review **Data Models** and **Component Structure**
3. Use `NORMALISATION_IMPLEMENTATION_CHECKLIST.md` as your daily guide

**Key questions to answer:**
- What am I building?
- Where does it fit in the codebase?
- What are my tasks for this week?

---

### For Designers

1. Read **UX Design Patterns** in `NORMALISATION_MODULE_INTEGRATION_STRATEGY.md`
2. Review **Conversational Flow** examples in `NORMALISATION_CONVERSATIONAL_FLOW.md`
3. Study **UX Patterns for Conversational Flow** section

**Key questions to answer:**
- What does the UI look like?
- How does the user flow work?
- What are the edge cases?

---

### For QA

1. Read **Testing Strategy** in `NORMALISATION_MODULE_INTEGRATION_STRATEGY.md`
2. Review **Testing** sections in `NORMALISATION_IMPLEMENTATION_CHECKLIST.md`
3. Create test plans for each phase

**Key questions to answer:**
- What needs to be tested?
- What are the test cases?
- What are the acceptance criteria?

---

## 🧩 Key Concepts

### Normalisation

The process of adjusting reported financial statements to reflect true economic earning power by adding back tax optimizations, personal expenses, and one-time costs, and subtracting unusual income.

**Example:**
```
Reported EBITDA: €100,000
+ Owner below-market salary: €40,000
+ One-time legal costs: €15,000
+ Depreciation add-back: €25,000
- COVID grant (one-time): -€10,000
━━━━━━━━━━━━━━━━━━━━━━━━━━━
Normalized EBITDA: €170,000
```

---

### The Four Adjustment Categories

1. **Owner Adjustments** — Add back below-market compensation and personal expenses
   - Owner salary below market rate
   - Personal car, travel, meals
   - Family members on payroll
   - Health insurance, benefits

2. **One-Off Adjustments** — Add back non-recurring costs
   - Legal fees, lawsuits
   - Extraordinary repairs
   - One-time consulting fees
   - Regulatory fines

3. **Accounting Reversals** — Add back non-cash items
   - Depreciation (non-cash)
   - Interest (capital structure, not operations)
   - Non-cash expenses

4. **Unusual Income** — Subtract non-recurring income
   - Grants, subsidies
   - Asset sales
   - Insurance payouts
   - One-time clients

---

### Reported vs Normalized EBITDA

**Reported EBITDA:**  
The EBITDA shown on tax returns, optimized for tax minimization.

**Normalized EBITDA:**  
The adjusted EBITDA that reflects true economic earning power, suitable for valuation.

**Why it matters:**  
Buyers care about future cash flows, not historical tax returns. Normalisation shows what the business CAN earn under normal conditions, not what it DID earn after tax optimization.

---

### The "Aha Moment"

The moment when a user (owner or accountant) sees the before/after comparison and realizes:

> "My business is worth significantly more than my tax return suggests."

This is the emotional core of the normalisation primitive. It's not just a feature — it's the moment Upswitch proves its value.

---

## 🎨 Design Principles

### 1. Educational, Not Extractive

We don't just ask for numbers. We explain WHY each adjustment matters and HOW it affects valuation.

**Bad:** "Enter owner salary adjustment:"  
**Good:** "Are you paying yourself below market rate for tax reasons? (This is common for SMEs)"

---

### 2. Progressive Disclosure

Don't overwhelm with 20 fields at once. Guide through one section at a time.

**Pattern:**
```
Section 1: Owner (most common) → Most users complete this
Section 2: One-Offs → Some users
Section 3: Reversals → Few users
Section 4: Unusual Income → Rare
```

---

### 3. Show Immediate Impact

Every adjustment updates the live total. Users see their value increasing in real-time.

**UX Pattern:**
```
[Adjustment added] → ✓ Added to normalized EBITDA
[Running total updates] → Normalized EBITDA: €170,000 (+70%)
```

---

### 4. Make it Optional (But Encouraged)

Never force users through normalisation. But make the value proposition so clear they WANT to do it.

**Pattern:**
```
[Prominent button] Normalize EBITDA (Recommended) [Big 4 Standard badge]
[Subtitle] Add back owner expenses, one-offs — usually increases value 20-30%

[User clicks] → "Let's do it"
[User skips] → Still allow calculation, but remind at end
```

---

### 5. Celebrate Discoveries

Each adjustment is framed as a win, not a correction.

**Language:**
- "Great catch! That's €40,000 of hidden value."
- "You just increased your valuation by 30%!"
- "This is exactly why Big 4 firms do normalisation."

---

## 📊 Success Metrics

### North Star Metric

**% of valuations with normalisation applied**

Target: 60% within 6 months

---

### Supporting Metrics

**Adoption:**
- % who see normalisation module: 100%
- % who open normalisation module: 50%
- % who complete at least one adjustment: 40%
- Average adjustments per user: 3.5

**Impact:**
- Average % increase in EBITDA: 25-30%
- Average $ impact on valuation: €150K - €300K
- Conversion to premium (normalised users): 2× vs control

**Quality:**
- User satisfaction (post-valuation): 4.5+/5
- Error rate: <0.5%
- Time to complete: <5 minutes
- Abandonment rate: <20%

---

## ❓ FAQs

### Why is this the MVP priority?

Because normalisation is our **primitive** — the foundational differentiator that makes everything else possible. Without it, we're just another valuation calculator. With it, we're the truth engine.

---

### Why not build AI auto-normalisation first?

**Two reasons:**

1. **Data collection** — We need thousands of manual normalisations to train good AI models
2. **Trust** — Users (especially accountants) need to feel in control first, automation second

Phase 1 (MVP): Manual/guided  
Phase 2 (Q2 2026): AI suggestions  
Phase 3 (Q3 2026): Auto-detection

---

### How is this different from competitors?

**Competitors:**  
- Ask for "EBITDA" directly
- No guidance on adjustments
- Opaque calculations
- "Black box" valuations

**Upswitch:**
- Guides through normalisation systematically
- Explains each adjustment category
- Shows full calculation transparency
- "Glass box" valuations

**Result:**  
Buyers trust Upswitch valuations because they can see HOW we got there.

---

### What if users skip normalisation?

**That's okay!** Normalisation is recommended but not required.

**Our approach:**
1. Make it highly visible and valuable
2. Track skip rate (if >50%, improve messaging)
3. Prompt again at end: "You might have missed €150K in value"
4. A/B test different messaging

**Goal:** Make the value proposition so clear that users WANT to do it, not that they HAVE to.

---

### How do we prevent gaming/fraud?

**Three layers:**

1. **Reasonable limits** — Flag adjustments >200% of reported EBITDA
2. **Audit trail** — Store every adjustment with timestamp
3. **Buyer visibility** — Buyers see full adjustment breakdown

**Philosophy:**  
We're not the police. We provide tools and transparency. Buyers do their own due diligence.

---

### What about international differences?

**MVP:** Focus on Belgium/EU accounting standards

**Future:**
- Country-specific adjustment templates
- Industry-specific benchmarks
- Regulatory compliance checks

For now, the core adjustments (owner salary, one-offs, depreciation) are universal.

---

## 🔗 Related Documentation

### Strategic Documents

- [`/docs/strategy/business/strategic/FIRST_PRINCIPLES_STRATEGY.md`](../../../../docs/strategy/business/strategic/FIRST_PRINCIPLES_STRATEGY.md) - Overall Upswitch first principles strategy (normalisation as primitive #1)

### Technical Documents

- `/docs/architecture/VALUATION_ENGINE_ARCHITECTURE.md` - How normalisation fits into valuation engine
- `/docs/architecture/DATA_MODEL.md` - Overall data model (includes normalisation schema)

### Product Documents

- `/docs/product/ACCOUNTANT_USER_JOURNEY.md` - Accountant workflow (includes normalisation)
- `/docs/product/MANUAL_FLOW_SPEC.md` - Manual flow specification
- `/docs/product/CONVERSATIONAL_FLOW_SPEC.md` - Conversational flow specification

---

## 👥 Contributors

### Document Authors

- **CTO** - Architecture, technical strategy, implementation plan
- **Product Manager** - User experience, success metrics
- **AI Engineer** - Conversational flow design, prompt engineering
- **Designer** - UI/UX patterns, visual design

### Reviewers

- Engineering team
- Product team
- Design team
- QA team

---

## 📅 Timeline

- **Week 0 (Dec 2025):** Planning & design
- **Week 1-2:** Foundation (data models, components, API)
- **Week 3-4:** Manual flow implementation
- **Week 5-6:** Conversational flow implementation
- **Week 7:** Reporting & analytics
- **Week 8:** Testing, polish, launch

**Target Launch:** End of Q1 2026

---

## 🎉 Vision

When normalisation is successful, we'll see:

1. **Accountants** using Upswitch as their standard normalisation tool
2. **Buyers** trusting Upswitch valuations because of transparency
3. **Banks** accepting Upswitch reports for lending decisions
4. **EU policymakers** recognizing Upswitch as infrastructure
5. **Upswitch** positioned as the valuation spine of Europe

The normalisation module is not a feature.  
It's the beginning of that future.

---

**Last Updated:** December 2025  
**Document Version:** 1.0  
**Status:** Ready for Implementation  

---

## 📝 Document Changelog

| Date | Version | Changes | Author |
|------|---------|---------|--------|
| Dec 2025 | 1.0 | Initial documentation | CTO |
| | | | |

---

**Need help?** 
- Slack: `#normalisation-module`
- Email: engineering@upswitch.com
- Office Hours: Daily standup 10:00 AM CET

---

*"Truth in. Trust out. Liquidity follows."*
