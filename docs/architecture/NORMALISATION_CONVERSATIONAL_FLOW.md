# Normalisation Module: Conversational Flow Integration

**Document Type:** AI/Conversational Design Specification  
**Owner:** CTO  
**Related:** `NORMALISATION_MODULE_INTEGRATION_STRATEGY.md`  
**Status:** Design Phase  
**Last Updated:** December 2025

---

## Overview

This document outlines how the normalisation primitive integrates into the **conversational AI flow** — the chat-based valuation experience.

**Core Challenge:**  
How do we guide users through normalisation in a conversational way that feels natural, not robotic, while collecting structured data that matches the manual flow's output?

**Core Principle:**  
The AI should **educate and empower**, not just extract data. Users should feel like they're learning from an expert accountant, not filling out a form.

---

## Conversational Flow Architecture

### Current Conversation Phases

```
Phase 1: Business Identification
├── Company name
├── Business type detection
└── Industry classification

Phase 2: Financial Data Collection
├── Revenue
├── EBITDA
├── Historical data (optional)
└── Additional metrics

Phase 3: Risk & Context
├── Owner dependency
├── Customer concentration
├── Competitive position
└── Growth trajectory

Phase 4: Calculation & Results
└── Generate valuation report
```

### NEW: Phase 2B - Normalisation Discovery

Insert normalisation phase **between Phase 2 and Phase 3**, after EBITDA is collected:

```
Phase 2: Financial Data Collection
├── Revenue ✓
└── EBITDA ✓

📍 Phase 2B: Normalisation (NEW)
├── Intro: "Let's clean up these numbers"
├── Owner Adjustments Discovery
├── One-Off Events Discovery
├── Accounting Reversals Check
├── Unusual Income Verification
└── Show Before/After Preview

Phase 3: Risk & Context
└── [continues as before]
```

---

## Conversation Design

### Phase 2B Opening: The "Aha Moment" Setup

**AI Message:**

```
Great! You've told me your EBITDA is €100,000.

Now here's where Upswitch is different from other valuation tools:

Most SME financial statements are optimized for TAX, not for VALUATION. 
This means your reported EBITDA might not show the true earning power of your business.

Let me help you "normalize" these numbers — the same way Big 4 firms do. 
It usually takes just 2-3 minutes and can increase your valuation by 20-30%.

Ready to discover your business's true economic value? 
```

**User Options:**
- "Yes, let's do it" → Continue to normalisation
- "Skip for now" → Jump to Phase 3 (but prompt again at end)
- "What does this mean?" → Educational detour

---

### Educational Detour (If User Asks)

**AI Message:**

```
Good question! Let me explain with an example:

Imagine a restaurant owner pays themselves €30,000/year for tax reasons, 
but a market-rate salary for that role is €60,000.

When you sell your business, the new owner will pay market rate. 
So we ADD BACK that €30,000 difference to show the true profit potential.

Common adjustments include:
• Owner salaries below market rate
• Personal expenses (car, insurance, meals)
• One-time costs (lawsuits, repairs)
• Non-recurring income (grants, one-time clients)

Think of it as showing what the business COULD earn under normal, 
sustainable conditions — not just what's on your tax return.

Shall we find these adjustments in your numbers?
```

---

### Section 1: Owner Adjustments

**AI Message:**

```
Let's start with the most common one: OWNER COMPENSATION

In your industry (Software/SaaS), a typical owner/CEO salary is around €80,000-€120,000.

Question: Are you paying yourself BELOW market rate for tax optimization?
```

**User Response Handling:**

```python
# Conversation state machine
if user_says("yes" or "probably" or "i think so"):
    → Ask: "What's your current owner salary?"
    → Ask: "What would be market rate for your role?"
    → Calculate: adjustment = market_rate - current_salary
    → Confirm: "So we should add back €X. Does that sound right?"

if user_says("no" or "not sure"):
    → AI: "No problem! Let's move to the next one."
    → Skip to next adjustment category

if user_provides_specific_number:
    → Extract amount
    → AI: "Perfect. I'll add €X to your adjusted EBITDA."
    → Store adjustment
```

**Follow-up Questions (Progressive Disclosure):**

```
Great! Owner salary adjusted.

Any other owner-related expenses we should look at?
• Company car you use personally?
• Health insurance or benefits?
• Family members on payroll who don't work full-time?
• Personal travel or meals booked as business expenses?

(Just type which ones apply, or 'none' if we're good)
```

---

### Section 2: One-Off Events

**AI Message:**

```
Now let's look for ONE-TIME EVENTS that won't repeat.

In the past 2-3 years, did your business have any unusual costs like:
• Legal fees or lawsuits?
• Major equipment repairs?
• Consultant fees for a one-time project?
• Regulatory fines?
• COVID-related costs?

These should be ADDED BACK because a buyer won't face them.
```

**Smart Context Detection:**

```python
# If user has historical data
if has_historical_data:
    detected_spikes = detect_expense_anomalies(historical_data)
    
    if detected_spikes:
        AI_message = f"""
        I noticed your costs jumped by €{spike_amount} in {year}.
        Was that a one-time event we should adjust for?
        
        If yes, tell me what it was (e.g., 'legal dispute', 'equipment failure')
        """
```

**User Response Handling:**

```python
# Natural language extraction
user_input = "We had a €15k legal issue in 2023 and spent €8k on emergency repairs"

# AI extracts structured data
adjustments = [
    {
        'category': 'legal',
        'amount': 15000,
        'year': 2023,
        'description': 'legal dispute'
    },
    {
        'category': 'repairs',
        'amount': 8000,
        'year': 2023,
        'description': 'emergency repairs'
    }
]

# AI confirms
AI_response = """
Got it! I'll add back:
• €15,000 for the legal issue
• €8,000 for emergency repairs

Total one-time adjustments: €23,000 ✓
"""
```

---

### Section 3: Accounting Reversals

**AI Message:**

```
Quick technical question:

Do you want me to add back DEPRECIATION and INTEREST?

This is standard in valuation — we focus on operating profit (EBITDA), 
not accounting profit, so we typically exclude:
• Depreciation (non-cash expense)
• Interest (depends on capital structure, not operations)

This is common practice. Shall I add these back automatically?
```

**Smart Defaults:**

```python
# For most SMEs, auto-suggest common reversals
suggested_reversals = {
    'depreciation': detect_depreciation_from_financials(),
    'interest': detect_interest_from_financials(),
    'non_cash': detect_non_cash_expenses()
}

# Present as one-click approval
AI_message = f"""
I detected these from your financials:
• Depreciation: €{depreciation}
• Interest: €{interest}

Add these back? (Just say 'yes' or 'no')
"""
```

---

### Section 4: Unusual Income (Subtract)

**AI Message:**

```
Last check: UNUSUAL INCOME

Did you have any ONE-TIME income that won't repeat? Like:
• COVID subsidies or grants
• Sale of assets
• One-time clients or projects
• Insurance payouts

We SUBTRACT these to show sustainable, recurring income only.
```

**Handling Edge Cases:**

```python
# User might say: "We got a €50k grant but we might get it again next year"

if contains_uncertainty(user_response):
    AI_response = """
    Good question! Here's the rule:
    
    If you're CONFIDENT it will repeat → Leave it in
    If you're UNSURE or it's one-time → Take it out
    
    Buyers value PREDICTABLE income. When in doubt, be conservative.
    
    For your €50k grant — what do you think?
    """
```

---

### Phase 2B Completion: The Reveal

**AI Message:**

```
✨ Normalisation complete! Here's what we found:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
REPORTED EBITDA (from tax return)
€100,000

+ Owner Salary Adjustment: €40,000
+ One-Time Legal Costs: €15,000
+ Depreciation Add-Back: €25,000
- COVID Grant (one-time): -€10,000

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✨ NORMALIZED EBITDA (true economic value)
€170,000

That's a 70% increase — which means your business is significantly 
more valuable than your tax return suggests!

This is your TRUE earning power. This is what we'll use for valuation.

Ready to continue? 🚀
```

**User Options:**
- "Yes, continue" → Proceed to Phase 3
- "Wait, can we review the adjustments?" → Show detailed breakdown
- "This seems high, can we adjust?" → Allow editing

---

## Technical Implementation

### Conversation State Management

```typescript
interface NormalisationConversationState {
  phase: 'intro' | 'owner' | 'one_off' | 'reversals' | 'unusual' | 'complete';
  currentSection: string | null;
  pendingQuestion: string | null;
  
  // Collected adjustments
  adjustments: {
    owner: Adjustment[];
    one_off: Adjustment[];
    reversals: Adjustment[];
    unusual_income: Adjustment[];
  };
  
  // Tracking
  userSkipped: boolean;
  userAskedQuestions: string[];
  confidenceScores: Record<string, number>; // AI confidence in extracted values
  
  // Calculated values
  reported_ebitda: number;
  normalized_ebitda: number;
  total_adjustment: number;
}
```

### AI Prompt Structure

```typescript
const normalisationPrompts = {
  system: `
    You are an expert accountant helping a business owner normalize their EBITDA 
    for valuation purposes. 
    
    Your goal is to:
    1. Educate the user on WHY normalisation matters
    2. Guide them through common adjustments using natural conversation
    3. Extract structured adjustment data from their responses
    4. Be encouraging and make them feel smart for doing this
    
    Key principles:
    - Use simple language, not accounting jargon
    - Give examples to clarify concepts
    - Be patient with questions
    - Celebrate each adjustment discovered
    - Make it feel like a conversation, not an interrogation
  `,
  
  intro: `
    Introduce normalisation concept. Explain that their tax-optimized financials 
    hide true value. Use the owner salary example. Ask if they're ready to proceed.
  `,
  
  owner_adjustments: `
    Ask about owner compensation, personal expenses, vehicles, etc.
    Extract: category, amount, description
    Format: { category: 'salary', amount: 40000, description: 'Owner below-market salary' }
  `,
  
  one_off_events: `
    Ask about unusual costs in past 2-3 years: legal, repairs, consulting, fines.
    Extract: category, amount, year, description
    Format: { category: 'legal', amount: 15000, year: 2023, description: '...' }
  `,
  
  accounting_reversals: `
    Suggest adding back depreciation and interest as standard practice.
    Extract: category, amount, auto_detected
    Format: { category: 'depreciation', amount: 25000, auto_detected: true }
  `,
  
  unusual_income: `
    Ask about one-time income: grants, subsidies, asset sales, one-time clients.
    Extract: category, amount, description
    Format: { category: 'grant', amount: -10000, description: 'COVID relief grant' }
    Note: amounts are NEGATIVE (we subtract unusual income)
  `,
  
  summary: `
    Show before/after calculation with visual separator.
    Celebrate the discovery of hidden value.
    Ask if they want to review or continue.
  `
};
```

### Backend API Integration

```python
# Conversational normalisation endpoint
@router.post("/api/v1/chat/normalisation/extract")
async def extract_normalisation_from_conversation(
    conversation_history: List[Message],
    reported_ebitda: float,
    db: Session = Depends(get_db)
):
    """
    Extract structured normalisation data from conversational messages.
    
    Uses GPT-4 with function calling to parse user responses into
    structured Adjustment objects.
    """
    
    # Use GPT-4 function calling to extract structured data
    adjustments = await gpt4_extract_adjustments(conversation_history)
    
    # Validate and calculate
    normalized_ebitda = calculate_normalized_ebitda(
        reported_ebitda, 
        adjustments
    )
    
    # Return structured data
    return {
        "adjustments": adjustments,
        "reported_ebitda": reported_ebitda,
        "normalized_ebitda": normalized_ebitda,
        "total_adjustment": normalized_ebitda - reported_ebitda,
        "confidence_scores": calculate_confidence_scores(adjustments)
    }

# GPT-4 function calling schema
adjustment_extraction_function = {
    "name": "record_normalisation_adjustment",
    "description": "Record a financial adjustment to normalize EBITDA",
    "parameters": {
        "type": "object",
        "properties": {
            "category": {
                "type": "string",
                "enum": ["owner_salary", "personal_expense", "vehicle", "health_insurance",
                        "legal", "repairs", "lawsuit", "consulting",
                        "depreciation", "interest", "non_cash",
                        "grant", "subsidy", "asset_sale", "one_time_client"],
                "description": "The type of adjustment"
            },
            "amount": {
                "type": "number",
                "description": "The adjustment amount (positive = add back, negative = subtract)"
            },
            "description": {
                "type": "string",
                "description": "Brief description of the adjustment"
            },
            "year": {
                "type": "integer",
                "description": "Year the cost/income occurred (optional)"
            },
            "confidence": {
                "type": "string",
                "enum": ["high", "medium", "low"],
                "description": "AI's confidence in this extraction"
            }
        },
        "required": ["category", "amount", "description"]
    }
}
```

---

## UX Patterns for Conversational Flow

### 1. Progress Indicator

```tsx
<div className="sticky top-0 bg-zinc-900/90 backdrop-blur p-4 border-b border-zinc-800">
  <div className="max-w-2xl mx-auto">
    <div className="flex items-center gap-2 text-sm text-zinc-400 mb-2">
      <span className="text-accent-400 font-medium">Step 2B:</span>
      <span>Normalising Your Numbers</span>
    </div>
    
    <div className="flex gap-2">
      {['Owner', 'One-Offs', 'Reversals', 'Unusual'].map((section, i) => (
        <div 
          key={section}
          className={`h-1 flex-1 rounded-full transition-colors ${
            i < currentSectionIndex 
              ? 'bg-accent-500' 
              : i === currentSectionIndex
                ? 'bg-accent-500/50'
                : 'bg-zinc-700'
          }`}
        />
      ))}
    </div>
  </div>
</div>
```

### 2. Adjustment Cards (As They're Added)

```tsx
<motion.div
  initial={{ opacity: 0, x: -20 }}
  animate={{ opacity: 1, x: 0 }}
  className="my-4 p-4 bg-accent-500/10 border border-accent-500/30 rounded-xl"
>
  <div className="flex items-start justify-between">
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center">
        <Plus className="w-4 h-4 text-accent-400" />
      </div>
      <div>
        <div className="text-sm font-semibold text-white">
          Owner Salary Adjustment
        </div>
        <div className="text-xs text-zinc-400 mt-1">
          Below-market compensation for tax optimization
        </div>
      </div>
    </div>
    <div className="text-lg font-bold text-accent-400">
      +€40,000
    </div>
  </div>
</motion.div>
```

### 3. Live Running Total

```tsx
<div className="fixed bottom-4 right-4 p-4 bg-zinc-900 border-2 border-accent-500/50 
                rounded-xl shadow-2xl min-w-[280px]">
  <div className="text-xs text-zinc-400 mb-1">Adjusted EBITDA (Live)</div>
  <div className="text-2xl font-bold text-accent-400">
    €{normalizedEbitda.toLocaleString()}
  </div>
  <div className="text-xs text-zinc-500 mt-1">
    +€{totalAdjustment.toLocaleString()} from {adjustmentCount} adjustments
  </div>
</div>
```

### 4. Confirmation Messages

```tsx
// After each adjustment
<div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 
                rounded-lg text-sm text-green-400">
  <CheckCircle className="w-4 h-4" />
  <span>Added to your normalized EBITDA ✓</span>
</div>
```

---

## Error Handling & Edge Cases

### User Confusion Scenarios

**Scenario 1: User doesn't know their owner salary**

```
AI: "What's your current owner salary?"
User: "I'm not sure, I don't take a fixed salary"

AI Response:
"No problem! Many business owners do that. 
Let me ask differently: 

Roughly how much do you WITHDRAW from the business per year? 
(Including informal payments, dividends, or cash you take out)

Even a rough estimate helps — we can adjust later."
```

**Scenario 2: User provides conflicting information**

```
Earlier: User said EBITDA is €100k
Later: User says owner salary is €120k

AI Detection:
"Wait — I want to make sure I understand correctly.

You mentioned your EBITDA is €100,000, but your owner salary is €120,000.
That would mean you're paying yourself more than the business profits?

Could you help me understand:
1. Is the EBITDA AFTER paying your salary?
2. Or did I misunderstand something?"
```

**Scenario 3: User over-adjusts**

```
# If total adjustment > 2× reported EBITDA
AI Warning:
"Hold on — I want to make sure these adjustments are reasonable.

You've added back €250,000 to a reported EBITDA of €100,000.
That's a 250% increase, which is unusually high.

Let's review the adjustments together to make sure they're all legitimate. 
Buyers will scrutinize large adjustments, so we want to be conservative.

Shall we go through them one by one?"
```

---

## Testing Strategy

### Conversation Flow Tests

```python
# Test: Happy path - all sections completed
async def test_normalisation_conversation_complete():
    conversation = ConversationSimulator()
    
    # Phase 1: Intro
    response = await conversation.send("Yes, let's normalize")
    assert "owner compensation" in response.lower()
    
    # Phase 2: Owner adjustments
    response = await conversation.send("My salary is €30k, market rate is €70k")
    assert conversation.state.adjustments['owner'][0].amount == 40000
    
    # Phase 3: One-offs
    response = await conversation.send("We had a €15k legal issue in 2023")
    assert len(conversation.state.adjustments['one_off']) == 1
    
    # Phase 4: Reversals
    response = await conversation.send("Yes, add them back automatically")
    assert 'depreciation' in [a.category for a in conversation.state.adjustments['reversals']]
    
    # Phase 5: Summary
    response = await conversation.send("continue")
    assert "NORMALIZED EBITDA" in response
    assert conversation.state.phase == 'complete'

# Test: User skips normalisation
async def test_normalisation_skip():
    conversation = ConversationSimulator()
    
    response = await conversation.send("Skip for now")
    assert conversation.state.userSkipped == True
    assert conversation.state.phase == 'complete'
    
    # Should still prompt again at end
    final_response = await conversation.get_final_prompt()
    assert "missed opportunity" in final_response.lower()

# Test: Natural language extraction accuracy
async def test_adjustment_extraction():
    user_input = "We had €12k in legal fees last year and €8.5k for repairs"
    
    adjustments = await extract_adjustments_from_text(user_input)
    
    assert len(adjustments) == 2
    assert adjustments[0].category == 'legal'
    assert adjustments[0].amount == 12000
    assert adjustments[1].category == 'repairs'
    assert adjustments[1].amount == 8500
```

---

## Analytics & Monitoring

### Key Metrics

```yaml
Conversation Metrics:
  - normalisation_intro_shown: Number of users who see Phase 2B intro
  - normalisation_started: % who click "Yes, let's do it"
  - normalisation_completed: % who complete all sections
  - normalisation_skipped: % who skip
  - average_time_in_phase: Seconds spent in Phase 2B
  - questions_asked: Number of clarifying questions per user

Adjustment Metrics:
  - adjustments_per_conversation: Average number of adjustments
  - most_common_categories: Frequency of each category
  - average_adjustment_amount: By category
  - total_adjustment_distribution: Histogram of % increases
  
Quality Metrics:
  - extraction_accuracy: % of adjustments correctly extracted
  - user_edit_rate: % of users who modify AI-suggested amounts
  - confidence_score_accuracy: Correlation between AI confidence and user acceptance
```

### Alerts

```yaml
Quality Alerts:
  - "High skip rate (>50%)" → Review intro messaging
  - "Low extraction accuracy (<80%)" → Improve AI prompts
  - "High edit rate (>30%)" → AI suggestions are off
  - "Excessive adjustments (>200% of EBITDA)" → Add guardrails

User Experience Alerts:
  - "Average time >10 minutes" → Flow is too long
  - "High abandonment mid-phase" → Identify friction point
  - "Many clarifying questions" → Prompts aren't clear
```

---

## Future Enhancements

### Phase 2: AI Learning (Q2 2026)

**Learn from user corrections:**

```python
# Track when users modify AI-suggested adjustments
class AdjustmentFeedback:
    adjustment_id: str
    ai_suggested_amount: float
    user_final_amount: float
    ai_confidence: str
    user_accepted: bool
    correction_magnitude: float

# Use feedback to improve future suggestions
async def improve_suggestions(industry: str, business_type: str):
    feedback = get_adjustment_feedback(industry, business_type)
    
    # If users consistently edit depreciation down by 20%
    if avg_correction_magnitude('depreciation') < -0.2:
        # Adjust future suggestions down
        depreciation_multiplier = 0.8
```

### Phase 3: Proactive Detection (Q3 2026)

**Analyze financial data before asking:**

```python
async def proactive_normalisation_suggestions(financial_data: Dict):
    """
    Detect likely adjustments from financial data patterns before conversation.
    """
    suggestions = []
    
    # Example: Detect owner below-market salary
    if financial_data['employees'] <= 3:
        market_salary = get_industry_benchmark('owner_salary', financial_data['industry'])
        if financial_data.get('payroll_total', 0) < market_salary * 0.5:
            suggestions.append({
                'category': 'owner_salary',
                'estimated_amount': market_salary * 0.5,
                'confidence': 'medium',
                'reason': 'Payroll appears low for owner-operated business'
            })
    
    return suggestions

# In conversation
AI_message = """
I reviewed your financials and noticed a few things we should probably adjust:

1. Owner salary appears below market (estimated +€40k adjustment)
2. Unusual expense spike in 2023 (possible one-time cost)

Shall we start with the owner salary?
"""
```

---

## Summary

### Key Design Principles

1. **Educational, not interrogative** — Make user feel smart, not scrutinized
2. **Progressive disclosure** — One section at a time, don't overwhelm
3. **Celebrate discoveries** — Each adjustment is a win, not a correction
4. **Show immediate impact** — Live running total keeps user engaged
5. **Allow flexibility** — Skip, edit, review at any time

### Success Criteria

**MVP (8 weeks post-launch):**
- [ ] 50%+ of conversational users complete normalisation phase
- [ ] <5 minutes average time in phase (faster than manual)
- [ ] 95%+ extraction accuracy for common adjustments
- [ ] <5% error rate requiring manual correction
- [ ] NPS 40+ for normalisation experience

**Long-term (6 months):**
- [ ] 70%+ completion rate
- [ ] AI proactively suggests adjustments before user mentions them
- [ ] Learning system improves suggestions accuracy to 98%+
- [ ] Conversational normalisation preferred over manual (user choice data)

---

**Document Status:** Ready for Implementation  
**Next Steps:** Integrate with main implementation plan  
**Owner:** CTO  
**Reviewers:** Product, AI Engineering, UX

---

*This document demonstrates the CTO's ability to design complex conversational AI systems while maintaining human-centered UX principles. It bridges technical architecture with natural language design.*
