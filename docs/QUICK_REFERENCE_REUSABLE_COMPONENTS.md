# 🗺️ Quick Reference: Reusable Components from Ilara

**Purpose**: Exact file-by-file mapping of what to copy and where  
**Last Updated**: October 5, 2025  
**Use Case**: Quick lookup during implementation

---

## 📋 File Copy Matrix

### **Priority 1: Caching System** 🔥🔥🔥

| Source File (Ilara) | Destination (Upswitch) | Adaptations Needed | Effort |
|---------------------|------------------------|-------------------|--------|
| `ilara-aphrodite/src/services/keyword_cache_service.py` | `upswitch-valuation-engine/src/services/market_cache_service.py` | • Rename class<br>• Change TTL strategies<br>• Update cache keys | 2h |
| `ilara-aphrodite/src/database/http_supabase_client.py` | `upswitch-valuation-engine/src/database/supabase_client.py` | • Optional (if using Supabase)<br>• Update table names | 1h |

### **Priority 2: Report Generation** 🔥🔥

| Source File (Ilara) | Destination (Upswitch) | Adaptations Needed | Effort |
|---------------------|------------------------|-------------------|--------|
| `ilara-artemis/src/ilara/services/report_service.py` | `upswitch-valuation-engine/src/services/valuation_report_service.py` | • Rename methods<br>• Add privacy guard<br>• Change data sources | 4h |
| `ilara-artemis/src/ilara/services/validation_service.py` | `upswitch-valuation-engine/src/services/validation_service.py` | • Update validation rules<br>• Add financial data validation | 2h |
| `ilara-artemis/src/ilara/services/openai_service.py` | `upswitch-valuation-engine/src/services/ai_service.py` | • Update prompts for valuation<br>• Add privacy checks | 3h |

### **Priority 3: Data Collection Flows** 🟡

| Source File (Ilara) | Destination (Upswitch) | Adaptations Needed | Effort |
|---------------------|------------------------|-------------------|--------|
| `ilara-aphrodite/src/flows/trend_collector.py` | `upswitch-market-data-service/src/flows/market_collector.py` | • Change data sources<br>• Update flow logic<br>• Modify storage | 6h |
| `ilara-aphrodite/src/flows/prefect_setup.py` | `upswitch-market-data-service/src/flows/prefect_setup.py` | • Update configuration<br>• Change schedules | 2h |

### **Priority 4: Template Engine** 🟡

| Source Directory (Ilara) | Destination (Upswitch) | Adaptations Needed | Effort |
|--------------------------|------------------------|-------------------|--------|
| `ilara-artemis/src/ilara/template_engine/` | `upswitch-valuation-engine/src/template_engine/` | • Entire directory<br>• Customize themes<br>• Add financial charts | 10h |
| `ilara-artemis/src/ilara/template_engine/components/` | `upswitch-valuation-engine/src/template_engine/components/` | • Add valuation-specific components | 4h |
| `ilara-artemis/src/ilara/template_engine/visualization/` | `upswitch-valuation-engine/src/template_engine/visualization/` | • Add financial chart types | 4h |

---

## 🎯 Copy Commands (Ready to Run)

### Phase 1: Caching System

```bash
# Navigate to Upswitch root
cd /Users/matthiasmandiau/Downloads/upswitch

# Create target directory
mkdir -p apps/upswitch-valuation-engine/src/services

# Copy cache service
cp "apps/archive/IlaraAI copy/ilara-aphrodite/src/services/keyword_cache_service.py" \
   "apps/upswitch-valuation-engine/src/services/market_cache_service.py"

# Open for editing
code apps/upswitch-valuation-engine/src/services/market_cache_service.py
```

**Edit Checklist:**
- [ ] Rename `KeywordCacheService` → `MarketDataCacheService`
- [ ] Update `TTL_STRATEGIES` with market-specific durations
- [ ] Change `keyword` parameters → `industry`, `country`
- [ ] Update cache key prefixes: `ilara:trend:` → `upswitch:market:`
- [ ] Test with Redis locally

---

### Phase 2: Report Service

```bash
# Copy report service
cp "apps/archive/IlaraAI copy/ilara-artemis/src/ilara/services/report_service.py" \
   "apps/upswitch-valuation-engine/src/services/valuation_report_service.py"

# Copy validation service
cp "apps/archive/IlaraAI copy/ilara-artemis/src/ilara/services/validation_service.py" \
   "apps/upswitch-valuation-engine/src/services/validation_service.py"

# Copy AI service
cp "apps/archive/IlaraAI copy/ilara-artemis/src/ilara/services/openai_service.py" \
   "apps/upswitch-valuation-engine/src/services/ai_service.py"

# Open for editing
code apps/upswitch-valuation-engine/src/services/valuation_report_service.py
```

**Edit Checklist:**
- [ ] Rename `ReportService` → `ValuationReportService`
- [ ] Replace `trend_service` → `market_service`
- [ ] Add `privacy_guard` parameter
- [ ] Update method names: `generate_report` → `generate_valuation_report`
- [ ] Change data models: `ProcessPromptRequest` → `ValuationRequest`
- [ ] Add financial calculation step
- [ ] Test privacy boundaries

---

### Phase 3: Data Collection Flows

```bash
# Create new market data service
mkdir -p apps/upswitch-market-data-service/src/flows

# Copy flow files
cp "apps/archive/IlaraAI copy/ilara-aphrodite/src/flows/trend_collector.py" \
   "apps/upswitch-market-data-service/src/flows/market_collector.py"

cp "apps/archive/IlaraAI copy/ilara-aphrodite/src/flows/prefect_setup.py" \
   "apps/upswitch-market-data-service/src/flows/prefect_setup.py"

# Open for editing
code apps/upswitch-market-data-service/src/flows/market_collector.py
```

**Edit Checklist:**
- [ ] Rename flows: `daily_trend_collection` → `daily_market_collection`
- [ ] Replace data sources: Google Trends → OECD, ECB, FMP
- [ ] Update storage targets
- [ ] Change validation logic
- [ ] Test with Prefect locally

---

### Phase 4: Template Engine

```bash
# Copy entire template engine directory
cp -r "apps/archive/IlaraAI copy/ilara-artemis/src/ilara/template_engine" \
      "apps/upswitch-valuation-engine/src/template_engine"

# Navigate to customize
cd apps/upswitch-valuation-engine/src/template_engine
ls -la
```

**Directory Structure After Copy:**
```
template_engine/
├── __init__.py
├── components/
│   ├── component_base.py      ← Keep as-is
│   ├── data_blocks.py         ← Customize for financial data
│   ├── headers.py             ← Customize for valuation reports
│   ├── insights.py            ← Keep AI insight structure
│   └── layouts.py             ← Keep layout engine
├── generators/
│   ├── template_generator.py  ← Keep core logic
│   ├── openai_component_generator.py  ← Keep AI generation
│   └── theme_manager.py       ← Customize themes
├── themes/
│   ├── colors.py              ← Add Upswitch brand colors
│   └── styles/                ← Add financial report styles
└── visualization/
    ├── chart_enhancer.py      ← Keep and extend
    └── graph_generator.py     ← Add financial chart types
```

**Edit Checklist:**
- [ ] Update brand colors in `themes/colors.py`
- [ ] Add valuation-specific components
- [ ] Create financial chart templates
- [ ] Update CSS with Upswitch styling
- [ ] Test report generation

---

## 🔑 Key Patterns to Extract

### 1. **Caching Pattern**

```python
# From: ilara-aphrodite/src/services/keyword_cache_service.py
# Lines: 45-120

class KeywordCacheService:
    async def get_or_fetch_trend_data(
        self,
        keyword: str,
        query_params: Dict[str, Any]
    ) -> Dict[str, Any]:
        # Check cache first
        cache_key = self._generate_cache_key(keyword, query_params)
        cached_data = await self.redis.get(cache_key)
        
        if cached_data:
            return cached_data  # Cache HIT
        
        # Cache MISS - fetch fresh
        fresh_data = await self._fetch_from_apis(keyword)
        await self.redis.set(cache_key, fresh_data, ttl=86400)
        
        return fresh_data
```

**Adapt to:**
```python
# upswitch-valuation-engine/src/services/market_cache_service.py

class MarketDataCacheService:
    async def get_or_fetch_industry_data(
        self,
        industry: str,
        country: str
    ) -> Dict[str, float]:
        cache_key = f"upswitch:market:multiples:{industry}:{country}"
        cached_data = await self.redis.get(cache_key)
        
        if cached_data:
            return cached_data
        
        fresh_data = await self._fetch_from_fmp(industry, country)
        await self.redis.set(cache_key, fresh_data, ttl=604800)  # 7 days
        
        return fresh_data
```

---

### 2. **Report Generation Pattern**

```python
# From: ilara-artemis/src/ilara/services/report_service.py
# Lines: 40-91

class ReportService:
    async def generate_report(self, request):
        # Step 1: Validate
        await self._validate_request(request)
        
        # Step 2: Extract keywords
        keywords = await self.keyword_service.extract_keywords(request.prompt)
        
        # Step 3: Fetch trends
        trends = await self.trend_service.fetch_trends(keywords)
        
        # Step 4: AI insights
        insights = await self.ai_service.generate_insights(request.prompt, trends)
        
        # Step 5: Generate HTML
        html = await self.template_service.generate_report(insights, trends)
        
        # Step 6: Validate
        validated = await self.validation_service.validate_html(html)
        
        return ProcessPromptResponse(html_report=validated)
```

**Adapt to:**
```python
# upswitch-valuation-engine/src/services/valuation_report_service.py

class ValuationReportService:
    async def generate_valuation_report(self, request):
        # Step 1: Validate private data
        await self._validate_financial_data(request)
        
        # Step 2: Fetch public market context (cached!)
        market_context = await self.market_service.get_market_context(
            request.industry, request.country
        )
        
        # Step 3: Calculate metrics (private)
        metrics = await self.calculation_service.calculate_metrics(
            request.financial_data
        )
        
        # Step 4: AI insights (public data only!)
        public_context = self.privacy_guard.sanitize_for_ai({
            'industry': request.industry,
            'market_context': market_context
        })
        insights = await self.ai_service.generate_insights(public_context)
        
        # Step 5: Perform valuation
        valuation = await self.valuation_engine.calculate(
            request.financial_data, market_context
        )
        
        # Step 6: Generate report
        report = await self.template_service.generate_report(
            valuation, metrics, insights
        )
        
        return ValuationReport(report=report)
```

---

### 3. **Concurrent Collection Pattern**

```python
# From: ilara-aphrodite/src/flows/trend_collector.py
# Lines: 330-346

@flow(name="daily_trend_collection")
async def daily_trend_collection(niche):
    # PHASE 1: Parallel collection
    google_data = collect_google_trends_raw(niche)
    youtube_data = collect_youtube_trends_raw(niche)
    
    results = await asyncio.gather(google_data, youtube_data)
    
    # PHASE 2: Store
    await store_raw_data(results)
    
    # PHASE 3: Process
    standardized = await generate_standardized_trends(niche)
    
    return {"status": "success"}
```

**Adapt to:**
```python
# upswitch-market-data-service/src/flows/market_collector.py

@flow(name="daily_market_collection")
async def daily_market_collection(industries):
    # PHASE 1: Parallel collection
    oecd_data = collect_oecd_indicators()
    ecb_data = collect_ecb_rates()
    fmp_multiples = collect_industry_multiples(industries)
    
    results = await asyncio.gather(oecd_data, ecb_data, fmp_multiples)
    
    # PHASE 2: Store in database
    await store_market_data(results)
    
    # PHASE 3: Update cache
    await refresh_redis_cache(results)
    
    return {"status": "success", "industries": industries}
```

---

## 📊 Verification Checklist

### After Implementing Caching
- [ ] Redis is running and accessible
- [ ] Cache hit rate >90% after warmup
- [ ] Response time <5 seconds
- [ ] No cache-related errors in logs
- [ ] Cache statistics endpoint working
- [ ] Cache invalidation working

### After Implementing Reports
- [ ] Reports generate successfully
- [ ] Privacy guard blocks private data
- [ ] AI insights appear in reports
- [ ] Validation passes all checks
- [ ] Report quality meets standards
- [ ] Performance meets targets

### After Implementing Data Collection
- [ ] Flows execute successfully
- [ ] Data is collected daily
- [ ] Storage is working correctly
- [ ] Error handling is robust
- [ ] Monitoring is in place
- [ ] Alerts are configured

---

## 🚨 Common Pitfalls to Avoid

### 1. **Don't Copy-Paste Without Reading**
❌ **Wrong**: Copy entire files blindly  
✅ **Right**: Understand the pattern, then adapt

### 2. **Don't Skip Privacy Checks**
❌ **Wrong**: Send financial data to AI  
✅ **Right**: Always use `PrivacyGuard` before AI calls

### 3. **Don't Use Same Cache TTLs**
❌ **Wrong**: 24h TTL for all market data  
✅ **Right**: Different TTLs based on data volatility
- Industry multiples: 7 days
- Economic indicators: 24 hours
- Exchange rates: 1 hour

### 4. **Don't Forget to Test Locally**
❌ **Wrong**: Deploy directly to production  
✅ **Right**: Test with local Redis, validate performance

---

## 📞 Quick Help

### "Which file do I need for caching?"
**Answer**: `ilara-aphrodite/src/services/keyword_cache_service.py`

### "Which file for report generation?"
**Answer**: `ilara-artemis/src/ilara/services/report_service.py`

### "Where are the Prefect flows?"
**Answer**: `ilara-aphrodite/src/flows/trend_collector.py`

### "Where's the template engine?"
**Answer**: `ilara-artemis/src/ilara/template_engine/` (entire directory)

### "How do I know if I'm done?"
**Answer**: Check the verification checklist for each phase

---

## 🎯 Start Here

**New to this?** Start with Phase 1 (Caching):
1. Copy `keyword_cache_service.py` → `market_cache_service.py`
2. Follow the edit checklist
3. Test locally with Redis
4. Benchmark performance
5. Celebrate 80-90% improvement! 🎉

**Need more detail?** See:
- Full analysis: `CTO_ARCHITECTURAL_ALIGNMENT_ILARA_UPSWITCH.md`
- Implementation guide: `ILARA_PATTERNS_IMPLEMENTATION_GUIDE.md`
- Executive summary: `EXECUTIVE_SUMMARY_ILARA_UPSWITCH.md`

---

**Last Updated**: October 5, 2025  
**Status**: Ready to Use ✅  
**Questions?** Review the detailed implementation guide.
