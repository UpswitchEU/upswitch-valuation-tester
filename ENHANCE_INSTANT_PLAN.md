# 🚀 Plan: Enhance /instant to Match /manual Quality

**Goal:** Achieve same data quality as /manual while keeping conversational UX  
**Target:** 85-95% confidence, ±15-20% accuracy, real historical data

---

## 📊 **DATA SOURCES**

### **1. From KBO Database (Already Available)**
```typescript
companyData = {
  company_name: "BTW-eenheid GROEP COLRUYT",
  registration_number: "0400378485",
  legal_form: "NV",  // ← Can help determine business type
  country_code: "BE",
  primary_activity_code: "47.11",
  primary_activity_description: "Retail sale in non-specialised stores",  // ← KEY for AI
  founding_date: "1965-03-15",  // ← Get founding year!
  address: "...",
  status: "active"
}
```

**What we can extract:**
- ✅ Company name (have it)
- ✅ Country code (have it)
- ✅ Founding year (from founding_date)
- ✅ Legal form (NV, BVBA, etc.)
- ✅ Industry hint (primary_activity_description)

---

### **2. From AI Inference (Backend)**

**Create new endpoint:** `POST /api/valuation/infer-context`

```python
# Backend: src/api/routes/valuation_inference.py

@router.post("/infer-context")
async def infer_business_context(request: InferContextRequest):
    """
    Use AI to infer industry and business model from company data.
    
    Input:
    - company_name
    - primary_activity_description
    - legal_form
    - country_code
    
    Output:
    - industry: IndustryCode (technology, retail, services, etc.)
    - business_model: BusinessModel (b2b_saas, marketplace, etc.)
    - confidence: 0-1
    - reasoning: Why these were chosen
    """
    
    prompt = f"""
    Based on this company information, determine the industry and business model:
    
    Company: {request.company_name}
    Activity: {request.primary_activity_description}
    Legal Form: {request.legal_form}
    Country: {request.country_code}
    
    Choose from these industries:
    - technology (software, IT services, SaaS)
    - manufacturing (production, assembly)
    - retail (stores, e-commerce)
    - services (consulting, professional services)
    - healthcare (medical, pharma)
    - finance (banking, insurance, fintech)
    - real_estate (property, construction)
    - hospitality (hotels, restaurants)
    - construction
    - other
    
    Choose from these business models:
    - b2b_saas (software as a service, B2B)
    - b2c (direct to consumer)
    - marketplace (platform connecting buyers/sellers)
    - ecommerce (online retail)
    - manufacturing (producing goods)
    - services (consulting, professional services)
    - other
    
    Return JSON:
    {
      "industry": "...",
      "business_model": "...",
      "confidence": 0.85,
      "reasoning": "Based on 'Retail sale in non-specialised stores', this is clearly a retail company..."
    }
    """
    
    response = await openai_client.complete(prompt)
    return parse_json(response)
```

**What we get:**
- ✅ Industry (correct, not guessed!)
- ✅ Business model (inferred from activity)
- ✅ Confidence in the inference

---

### **3. From User (Conversational Questions)**

**Expand from 6 questions to 15-18 questions:**

#### **Current Year Financials (10 questions)**
```typescript
const financialQuestions = [
  // Basic (required) - Questions 1-6
  { field: 'revenue', question: "What's your annual revenue?", required: true },
  { field: 'ebitda', question: "What's your EBITDA?", required: true },
  { field: 'net_income', question: "What's your net income?", required: false },
  { field: 'total_assets', question: "What are your total assets?", required: false },
  { field: 'total_debt', question: "What's your total debt?", required: false },
  { field: 'cash', question: "How much cash do you have?", required: false },
  
  // Detailed P&L - Questions 7-10 (OPTIONAL but boost confidence)
  { field: 'cogs', question: "What were your cost of goods sold (COGS)?", required: false, helpText: "Direct costs of producing your products/services" },
  { field: 'operating_expenses', question: "What were your operating expenses?", required: false, helpText: "Salaries, rent, marketing, etc." },
  { field: 'depreciation', question: "Depreciation amount?", required: false, helpText: "Can be 0 if not applicable" },
  { field: 'interest_expense', question: "Interest paid on loans?", required: false, helpText: "Interest on debt" },
];
```

#### **Company Context (3 questions)**
```typescript
const contextQuestions = [
  { field: 'number_of_employees', question: "How many employees do you have?", type: 'number', min: 0, max: 10000 },
  { field: 'recurring_revenue_percentage', question: "What percentage of your revenue is recurring?", type: 'percentage', min: 0, max: 100, helpText: "Subscriptions, contracts, repeat customers" },
  { field: 'founding_year_confirm', question: "Company founded in {year}, is that correct?", type: 'confirm', prefilled: true },
];
```

#### **Historical Data (2-3 years)**
```typescript
const historicalQuestions = [
  // Year 1 (Previous year)
  { year: -1, question: "Let's get last year's data. What was your revenue in {year}?" },
  { year: -1, question: "And EBITDA for {year}?" },
  
  // Year 2 (2 years ago) - OPTIONAL
  { year: -2, question: "To improve accuracy, what was your revenue in {year}?", optional: true },
  { year: -2, question: "And EBITDA for {year}?", optional: true },
  
  // Year 3 (3 years ago) - OPTIONAL
  { year: -3, question: "One more year of history? Revenue in {year}?", optional: true },
  { year: -3, question: "EBITDA for {year}?", optional: true },
];
```

---

## 🔄 **REVISED CONVERSATIONAL FLOW**

### **Stage 1: Company Discovery (Already Done)**
```
AI: "What's your company name?"
User: "colruyt"
AI: "✅ Found: BTW-eenheid GROEP COLRUYT"
     [KBO data loaded]
     [AI infers industry & business model in background]
```

### **Stage 2: Current Year Financials (Questions 1-6)**
```
AI: "Let's collect your 2023 financial data."
AI: "Question 1 of 6: What's your annual revenue?"
User: 1000000
AI: "✅ Got it! Question 2 of 6: What's your EBITDA?"
...
```

### **Stage 3: Optional Details (Questions 7-10)**
```
AI: "Great! I have the basics. Want to add more details for higher accuracy?"
    [Skip] [Yes, continue]
    
If Yes:
AI: "What were your cost of goods sold (COGS)?"
AI: "What were your operating expenses?"
AI: "Any depreciation?"
AI: "Interest paid on debt?"
```

### **Stage 4: Company Context (Questions 11-13)**
```
AI: "A few quick company questions:"
AI: "How many employees do you have?"
User: 50
AI: "What % of revenue is recurring (subscriptions, contracts)?"
User: 80
AI: "I see you were founded in 1965, is that correct?"
User: Yes
```

### **Stage 5: Historical Data (Questions 14-18)**
```
AI: "To improve accuracy, let's add 1-2 years of history."
AI: "What was your revenue in 2022?"
User: 900000
AI: "And EBITDA for 2022?"
User: 180000

AI: "Want to add another year? (Boosts confidence to 90%+)"
    [Skip] [Yes, add 2021 data]
```

### **Stage 6: AI Inference Summary**
```
AI: "Perfect! Here's what I gathered:

📊 Financial Data:
• 2023: €1.0M revenue, €200K EBITDA
• 2022: €900K revenue, €180K EBITDA
• 2021: €800K revenue, €160K EBITDA

🏢 Company Context:
• Industry: Retail (inferred from KBO activity) ✓
• Business Model: Retail (non-specialized stores) ✓
• Founded: 1965
• Employees: 50
• Recurring Revenue: 80%

📈 Data Quality: 95% complete
🎯 Confidence: High (87%)

Preparing your valuation..."
```

---

## 📦 **DATA STRUCTURE SENT TO BACKEND**

### **Before (Current /instant):**
```typescript
{
  company_name: "BTW-eenheid GROEP COLRUYT",
  country_code: "BE",
  industry: "technology",  // ❌ Wrong (guessed)
  business_model: "other",  // ❌ Wrong (default)
  founding_year: 2018,  // ❌ Wrong (assumed)
  current_year_data: {
    year: 2023,
    revenue: 1000000,
    ebitda: 200000,
    net_income: 150000,
    total_assets: 500000,
    total_debt: 100000,
    cash: 50000
  },
  historical_years_data: [{  // ❌ Fake data
    year: 2022,
    revenue: 900000,
    ebitda: 180000
  }]
}
```

### **After (Enhanced /instant):**
```typescript
{
  company_name: "BTW-eenheid GROEP COLRUYT",
  country_code: "BE",
  industry: "retail",  // ✅ AI inferred from KBO
  business_model: "retail",  // ✅ AI inferred from KBO
  founding_year: 1965,  // ✅ From KBO
  
  current_year_data: {
    year: 2023,
    revenue: 1000000,
    ebitda: 200000,
    net_income: 150000,
    total_assets: 500000,
    total_debt: 100000,
    cash: 50000,
    cogs: 400000,  // ✅ User provided
    operating_expenses: 400000,  // ✅ User provided
    depreciation: 50000,  // ✅ User provided
    interest_expense: 5000,  // ✅ User provided
  },
  
  historical_years_data: [  // ✅ Real data from user!
    {
      year: 2022,
      revenue: 900000,
      ebitda: 180000,
      net_income: 135000
    },
    {
      year: 2021,
      revenue: 800000,
      ebitda: 160000,
      net_income: 120000
    }
  ],
  
  number_of_employees: 50,  // ✅ User provided
  recurring_revenue_percentage: 0.8,  // ✅ User provided (80%)
  
  use_dcf: true,
  use_multiples: true,
  projection_years: 10
}
```

**Now matches /manual quality!** ✅

---

## 🎯 **EXPECTED RESULTS**

### **Data Completeness:**
- Before: 30-40% (6 fields)
- After: 85-95% (18+ fields)

### **Confidence Score:**
- Before: 60-70%
- After: 85-95% ✅

### **Accuracy:**
- Before: ±30-40%
- After: ±15-20% ✅

### **Time to Complete:**
- Before: 1-2 minutes (6 questions)
- After: 3-4 minutes (15-18 questions with optional skips)

**Trade-off:** +2 minutes for 25% better accuracy and 20% higher confidence

---

## 🛠️ **IMPLEMENTATION STEPS**

### **Step 1: Extract KBO Data**
- [x] Already have company data
- [ ] Parse `founding_date` to get `founding_year`
- [ ] Pass `primary_activity_description` to AI

### **Step 2: Create AI Inference Endpoint**
- [ ] Backend: `POST /api/valuation/infer-context`
- [ ] Use OpenAI to analyze KBO activity description
- [ ] Return industry + business_model + confidence

### **Step 3: Expand Financial Questions**
- [ ] Add 4 optional P&L questions (COGS, OpEx, Depreciation, Interest)
- [ ] Add "Skip" option for optional questions
- [ ] Track completion percentage

### **Step 4: Add Context Questions**
- [ ] Employees count
- [ ] Recurring revenue %
- [ ] Founding year confirmation (pre-filled from KBO)

### **Step 5: Collect Historical Data**
- [ ] Ask for previous year (required)
- [ ] Ask for 2 years ago (optional, boosts confidence)
- [ ] Ask for 3 years ago (optional, max confidence)
- [ ] Show progress: "2/3 years collected"

### **Step 6: Update Data Transformation**
- [ ] Map collected data to ValuationRequest format
- [ ] Include AI-inferred industry & business_model
- [ ] Include real historical data (not fake)
- [ ] Match /manual's data structure exactly

### **Step 7: Test & Validate**
- [ ] Test with real Belgian companies
- [ ] Verify confidence scores 85-95%
- [ ] Compare results with /manual
- [ ] Measure accuracy improvements

---

## 📊 **PROGRESSIVE DISCLOSURE**

Make it feel natural with "chunks":

```
Chunk 1: Basic Financials (2 min)
→ Questions 1-6
→ Show interim estimate: "€2.5M - €3.5M (Medium confidence: 65%)"
→ "Want higher accuracy? Continue →"

Chunk 2: Detailed Financials (1 min)
→ Questions 7-10 (optional)
→ Updated estimate: "€2.7M - €3.3M (Good confidence: 75%)"
→ "Add company context →"

Chunk 3: Company Context (30 sec)
→ Questions 11-13
→ Updated estimate: "€2.8M - €3.2M (High confidence: 82%)"
→ "Add historical data for investment-grade →"

Chunk 4: Historical Data (1 min)
→ Questions 14-18
→ Final estimate: "€3.0M - €3.1M (Very high confidence: 92%)" ✅
→ "Download professional report →"
```

**Users can stop at any chunk and get results!**

---

## ✅ **SUCCESS CRITERIA**

- [ ] AI correctly infers industry (90%+ accuracy)
- [ ] AI correctly infers business model (85%+ accuracy)
- [ ] Collects real historical data (not fake)
- [ ] Achieves 85-95% confidence scores
- [ ] Matches /manual accuracy (±15-20%)
- [ ] Completion time < 5 minutes
- [ ] User satisfaction > 4.5/5
- [ ] No decrease in completion rate (keep > 60%)

---

**Ready to implement?** This will make /instant produce investment-grade valuations while keeping the conversational UX! 🚀
