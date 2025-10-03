# 📋 Phase 2 Requirements: AI-Powered Features

**Status**: 📝 **DOCUMENTED - NOT YET IMPLEMENTED**  
**Estimated Effort**: 2-3 weeks (backend + frontend)  
**Dependencies**: OpenAI API, Document storage, Company data APIs

---

## ⚠️ **IMPORTANT: Current Status**

| Feature | Frontend | Backend | Status |
|---------|----------|---------|--------|
| **Document Upload** | ⏸️ Not built | ❌ Not built | Phase 2 |
| **AI Document Parsing** | ⏸️ Not built | ❌ Not built | Phase 2 |
| **Company Lookup** | ⏸️ Not built | ❌ Not built | Phase 2 |
| **Real-Time Preview** | ✅ **DONE** | ✅ **DONE** | ✅ Live |

---

## 🎯 **Phase 2 Overview**

**Goal**: Reduce data entry from 5 minutes to 30 seconds using AI.

**Strategy**: 
1. Let users upload financial documents (PDF, Excel)
2. AI extracts all data automatically
3. User reviews and confirms
4. Instant valuation

**User Experience**:
```
Traditional: 5 minutes manual entry
AI-Powered:  30 seconds (upload → review → done)

Time savings: 90%
Completion rate: 60% → 85%
```

---

## 📄 **Feature 1: Document Upload & AI Parsing**

### **User Story**

> **As a** business owner  
> **I want to** upload my P&L statement as a PDF  
> **So that** I don't have to manually type all the numbers

### **Acceptance Criteria**

- [ ] User can drag & drop PDF, Excel, or CSV files
- [ ] User can select file from file picker
- [ ] User sees upload progress indicator
- [ ] AI extracts financial data in <10 seconds
- [ ] User can review and edit extracted data
- [ ] Extraction accuracy is >85%
- [ ] System handles bad documents gracefully

### **Frontend Requirements (2 hours)**

#### **UI Components Needed**

```tsx
// 1. File Upload Zone
<FileUploadZone
  accept=".pdf,.xlsx,.xls,.csv"
  maxSize={10 * 1024 * 1024} // 10MB
  onUpload={handleFileUpload}
  onError={handleError}
>
  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
    <CloudUploadIcon className="mx-auto h-12 w-12 text-gray-400" />
    <p className="mt-2 text-sm text-gray-600">
      Drop your financial documents here
    </p>
    <p className="mt-1 text-xs text-gray-500">
      PDF, Excel, or CSV up to 10MB
    </p>
  </div>
</FileUploadZone>

// 2. Upload Progress
<UploadProgress
  fileName="P&L_2024.pdf"
  progress={75}
  status="Analyzing with AI..."
/>

// 3. Extracted Data Review
<ExtractedDataReview
  data={extractedData}
  onConfirm={handleConfirm}
  onEdit={handleEdit}
  confidence={0.92}
/>
```

#### **API Integration**

```typescript
// src/services/document.service.ts
export const documentService = {
  async parseDocument(file: File): Promise<ExtractedData> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await axios.post<ExtractedData>(
      `${API_URL}/api/v1/documents/parse`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          updateProgress(percentCompleted);
        },
      }
    );
    
    return response.data;
  },
};
```

### **Backend Requirements (6 hours)**

#### **Endpoint: POST /api/v1/documents/parse**

```python
# src/api/routes/documents.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from src.services.document_parser import DocumentParserService

router = APIRouter()

@router.post("/parse")
async def parse_document(file: UploadFile = File(...)):
    """
    Parse financial document using GPT-4 Vision.
    
    Accepts: PDF, XLSX, CSV
    Returns: Structured financial data
    """
    
    # 1. Validate file type and size
    if file.content_type not in ["application/pdf", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"]:
        raise HTTPException(400, "Only PDF and Excel files are supported")
    
    if file.size > 10 * 1024 * 1024:  # 10MB
        raise HTTPException(413, "File too large (max 10MB)")
    
    # 2. Save to temp storage or S3
    file_path = await save_to_storage(file)
    
    # 3. Parse with AI
    parser = DocumentParserService()
    try:
        extracted_data = await parser.parse(file_path)
    except Exception as e:
        logger.error(f"Document parsing failed: {str(e)}")
        raise HTTPException(500, "Failed to parse document")
    
    # 4. Clean up temp file
    await cleanup_file(file_path)
    
    # 5. Return structured data
    return {
        "success": True,
        "confidence": extracted_data.confidence,
        "data": {
            "company_name": extracted_data.company_name,
            "revenue": extracted_data.revenue,
            "ebitda": extracted_data.ebitda,
            "cogs": extracted_data.cogs,
            "operating_expenses": extracted_data.operating_expenses,
            # ... all financial fields
        },
        "warnings": extracted_data.warnings,
        "suggestions": extracted_data.suggestions,
    }
```

#### **AI Document Parser Service**

```python
# src/services/document_parser.py
import openai
from typing import Dict, List, Optional
from pydantic import BaseModel

class ExtractedData(BaseModel):
    confidence: float
    company_name: Optional[str]
    revenue: Optional[float]
    ebitda: Optional[float]
    cogs: Optional[float]
    operating_expenses: Optional[float]
    warnings: List[str]
    suggestions: List[str]

class DocumentParserService:
    """
    Parse financial documents using GPT-4 Vision.
    """
    
    def __init__(self):
        self.client = openai.OpenAI(api_key=settings.openai_api_key)
    
    async def parse(self, file_path: str) -> ExtractedData:
        """
        Parse PDF/Excel using GPT-4 Vision.
        """
        
        # 1. Convert document to images (for PDFs)
        images = await self._document_to_images(file_path)
        
        # 2. Call GPT-4 Vision API
        prompt = self._build_extraction_prompt()
        
        response = await self.client.chat.completions.create(
            model="gpt-4-vision-preview",
            messages=[
                {
                    "role": "system",
                    "content": "You are a financial document parser. Extract data from P&L statements, balance sheets, and financial reports."
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        *[{"type": "image_url", "image_url": img} for img in images]
                    ]
                }
            ],
            response_format={"type": "json_object"},
            max_tokens=4096,
        )
        
        # 3. Parse AI response
        extracted = json.loads(response.choices[0].message.content)
        
        # 4. Validate and structure
        return ExtractedData(
            confidence=extracted.get("confidence", 0.0),
            company_name=extracted.get("company_name"),
            revenue=self._parse_currency(extracted.get("revenue")),
            ebitda=self._parse_currency(extracted.get("ebitda")),
            warnings=self._generate_warnings(extracted),
            suggestions=self._generate_suggestions(extracted),
        )
    
    def _build_extraction_prompt(self) -> str:
        return """
        Extract the following financial data from this document:
        
        REQUIRED:
        - Company name
        - Total revenue / sales
        - EBITDA (or calculate from: Operating Income + D&A)
        
        OPTIONAL (if available):
        - Cost of Goods Sold (COGS)
        - Operating expenses
        - Depreciation & Amortization
        - Interest expense
        - Taxes
        - Net income
        - Total assets
        - Total liabilities
        - Cash and cash equivalents
        
        Return as JSON with confidence score (0.0-1.0) for each field.
        If a field is not found, return null.
        Include warnings for any ambiguous or unclear values.
        """
    
    def _parse_currency(self, value: any) -> Optional[float]:
        """Convert currency strings to float"""
        if value is None:
            return None
        
        # Handle various formats: "$2,500,000", "2.5M", "€ 2500000"
        # ... parsing logic
        return float(cleaned_value)
```

#### **Required Infrastructure**

| Component | Purpose | Cost |
|-----------|---------|------|
| **OpenAI GPT-4 Vision** | Document parsing | $150-300/month |
| **S3 or Temp Storage** | Store uploaded files | $5-10/month |
| **PDF → Image Converter** | Convert PDFs for Vision API | Free (pdf2image) |

---

## 🔍 **Feature 2: Company Lookup**

### **User Story**

> **As a** business owner  
> **I want to** search for my company by name  
> **So that** industry, location, and founding year are auto-filled

### **Acceptance Criteria**

- [ ] User types company name in search box
- [ ] System searches multiple data sources
- [ ] Results show company logo, description, key facts
- [ ] User selects correct company
- [ ] Form auto-fills with public data
- [ ] Hit rate is >70% for European companies

### **Frontend Requirements (2 hours)**

#### **UI Components**

```tsx
// 1. Company Search
<CompanySearch
  placeholder="Search for your company..."
  onSelect={handleCompanySelect}
  countryFilter={["DE", "FR", "UK", "ES"]}
/>

// 2. Company Result Card
<CompanyResult
  name="Acme Software GmbH"
  logo="https://logo.clearbit.com/acme.de"
  description="B2B SaaS company providing..."
  industry="Technology"
  location="Berlin, Germany"
  founded={2018}
  employees="40-50"
  onSelect={() => prefillForm(company)}
/>

// 3. Auto-filled Field Indicator
<Input
  label="Industry"
  value="Technology"
  prefilled={true}
  icon={<SparklesIcon />} // Indicates AI-filled
  editable={true}
/>
```

#### **API Integration**

```typescript
// src/services/company.service.ts
export const companyService = {
  async searchCompany(query: string, country?: string): Promise<Company[]> {
    const response = await axios.get<Company[]>(
      `${API_URL}/api/v1/companies/lookup`,
      {
        params: { name: query, country },
      }
    );
    return response.data;
  },
  
  async getCompanyDetails(id: string): Promise<CompanyDetails> {
    const response = await axios.get<CompanyDetails>(
      `${API_URL}/api/v1/companies/${id}`
    );
    return response.data;
  },
};
```

### **Backend Requirements (4 hours)**

#### **Endpoint: GET /api/v1/companies/lookup**

```python
# src/api/routes/companies.py
from fastapi import APIRouter, Query
from src.services.company_lookup import CompanyLookupService

router = APIRouter()

@router.get("/lookup")
async def lookup_company(
    name: str = Query(..., min_length=2),
    country: Optional[str] = Query(None, regex="^[A-Z]{2}$")
):
    """
    Search for company across multiple data sources.
    
    Returns public company information including:
    - Company name
    - Industry
    - Location
    - Founding year
    - Employee count
    - Revenue estimate (if available)
    """
    
    service = CompanyLookupService()
    results = await service.search(name, country)
    
    return {
        "query": name,
        "count": len(results),
        "results": results,
    }
```

#### **Company Lookup Service**

```python
# src/services/company_lookup.py
from typing import List, Optional
import aiohttp
from pydantic import BaseModel

class CompanyResult(BaseModel):
    id: str
    name: str
    legal_name: Optional[str]
    industry: Optional[str]
    location: str
    country_code: str
    founded: Optional[int]
    employees: Optional[str]  # "40-50"
    revenue_estimate: Optional[float]
    logo_url: Optional[str]
    confidence: float

class CompanyLookupService:
    """
    Search for companies across multiple data sources.
    """
    
    async def search(self, query: str, country: Optional[str]) -> List[CompanyResult]:
        """
        Search company across multiple sources in parallel.
        """
        
        async with aiohttp.ClientSession() as session:
            # Run all searches in parallel
            results = await asyncio.gather(
                self._search_company_registry(session, query, country),
                self._search_linkedin(session, query),
                self._search_clearbit(session, query),
                return_exceptions=True,
            )
        
        # Merge and deduplicate results
        merged = self._merge_results(results)
        
        # Sort by confidence
        return sorted(merged, key=lambda x: x.confidence, reverse=True)
    
    async def _search_company_registry(
        self, session: aiohttp.ClientSession, query: str, country: Optional[str]
    ) -> List[CompanyResult]:
        """
        Search official company registries.
        
        Germany: Handelsregister (North Data API)
        UK: Companies House API
        France: INSEE Sirene API
        """
        
        if country == "DE":
            return await self._search_handelsregister(session, query)
        elif country == "GB":
            return await self._search_companies_house(session, query)
        elif country == "FR":
            return await self._search_sirene(session, query)
        else:
            return []
    
    async def _search_handelsregister(
        self, session: aiohttp.ClientSession, query: str
    ) -> List[CompanyResult]:
        """
        Search German Handelsregister via North Data API.
        """
        # Implementation using North Data or OpenCorporates
        pass
    
    async def _search_companies_house(
        self, session: aiohttp.ClientSession, query: str
    ) -> List[CompanyResult]:
        """
        Search UK Companies House API (free).
        """
        url = f"https://api.company-information.service.gov.uk/search/companies"
        params = {"q": query}
        
        async with session.get(url, params=params, auth=("API_KEY", "")) as resp:
            data = await resp.json()
            
            return [
                CompanyResult(
                    id=company["company_number"],
                    name=company["title"],
                    location=company.get("address_snippet"),
                    country_code="GB",
                    founded=int(company.get("date_of_creation", "").split("-")[0]),
                    confidence=0.9,
                )
                for company in data.get("items", [])
            ]
    
    async def _search_linkedin(
        self, session: aiohttp.ClientSession, query: str
    ) -> List[CompanyResult]:
        """
        Search LinkedIn for company info (web scraping or API).
        """
        # Implementation using Bright Data or Apify
        pass
    
    async def _search_clearbit(
        self, session: aiohttp.ClientSession, query: str
    ) -> List[CompanyResult]:
        """
        Search Clearbit Company API for logos and metadata.
        """
        url = f"https://company.clearbit.com/v2/companies/find"
        params = {"name": query}
        
        async with session.get(url, params=params, headers={"Authorization": f"Bearer {CLEARBIT_API_KEY}"}) as resp:
            if resp.status == 200:
                data = await resp.json()
                return [
                    CompanyResult(
                        id=data["id"],
                        name=data["name"],
                        logo_url=data.get("logo"),
                        industry=data.get("category", {}).get("industry"),
                        employees=str(data.get("metrics", {}).get("employees")),
                        founded=data.get("foundedYear"),
                        confidence=0.85,
                    )
                ]
            return []
```

#### **Required Infrastructure**

| Data Source | Coverage | Cost | API |
|-------------|----------|------|-----|
| **Companies House (UK)** | UK only | Free | ✅ Official API |
| **Handelsregister (DE)** | Germany | €50-100/mo | North Data |
| **INSEE Sirene (FR)** | France | Free | ✅ Official API |
| **Clearbit** | Global logos | $99/mo | Logo enrichment |
| **LinkedIn** | Global | ~$200/mo | Web scraping |

---

## ✅ **Feature 3: Real-Time Preview (DONE!)**

### **Status**: ✅ **ALREADY IMPLEMENTED**

**Frontend**: ✅ Debounced input → calls `/quick` endpoint  
**Backend**: ✅ `/api/v1/valuation/quick` already exists

**No work needed!**

---

## 📊 **Implementation Priority**

### **Recommended Order**

1. ✅ **Real-Time Preview** (DONE)
2. 🔄 **Company Lookup** (Medium complexity, high value)
3. 🔄 **Document Upload** (High complexity, highest value)

**Rationale**:
- Company lookup is easier to build and test
- Document upload requires more AI testing and iteration
- Both provide massive UX improvements

---

## 💰 **Cost Breakdown**

### **Initial Setup** (One-time)
| Item | Cost | Notes |
|------|------|-------|
| OpenAI API setup | $0 | Free to start |
| S3 bucket setup | $0 | AWS free tier |
| API key procurement | $0 | Self-service |
| **Total** | **$0** | |

### **Monthly Operating Costs**

| Service | Usage | Cost |
|---------|-------|------|
| **OpenAI GPT-4 Vision** | 1,000 documents/mo @ $0.15 ea | $150 |
| **Companies House API** | Unlimited | $0 (free) |
| **North Data (DE registry)** | 1,000 lookups/mo | $50 |
| **Clearbit** | Logo enrichment | $99 |
| **S3 Storage** | 10GB temp storage | $5 |
| **Total** | | **$304/month** |

**Break-even**: 100 paying customers @ $3/ea in cost savings

---

## 🚀 **Implementation Timeline**

### **Week 1: Backend Foundation**
- [ ] Day 1-2: Document upload endpoint + S3 integration
- [ ] Day 3-5: GPT-4 Vision integration + prompt engineering
- [ ] Day 6-7: Company lookup endpoints (UK + Germany)

### **Week 2: Frontend Integration**
- [ ] Day 1-2: File upload UI component
- [ ] Day 3-4: Company search UI component
- [ ] Day 5: Extracted data review component
- [ ] Day 6-7: Integration testing + bug fixes

### **Week 3: Testing & Refinement**
- [ ] Day 1-3: Test with 50 real documents
- [ ] Day 4-5: Fix extraction accuracy issues
- [ ] Day 6-7: Polish UX, deploy to staging

---

## ✅ **Definition of Done**

### **Feature 1: Document Upload**
- [x] User can upload PDF, Excel, CSV
- [x] AI extracts 15+ financial fields
- [x] Extraction accuracy >85%
- [x] User can review and edit extracted data
- [x] System handles bad documents gracefully
- [x] Average processing time <10 seconds
- [x] Deployed to production

### **Feature 2: Company Lookup**
- [x] User can search by company name
- [x] System finds 70%+ of European companies
- [x] Results show logo, industry, location
- [x] Auto-fills 5+ form fields
- [x] User can edit auto-filled data
- [x] Deployed to production

---

## 📚 **Additional Resources**

- [OpenAI GPT-4 Vision Docs](https://platform.openai.com/docs/guides/vision)
- [Companies House API](https://developer-specs.company-information.service.gov.uk/)
- [North Data API (Germany)](https://www.northdata.com/api)
- [Clearbit Company API](https://clearbit.com/docs#enrichment-api)

---

**Status**: 📋 **DOCUMENTED - READY FOR PHASE 2 KICKOFF**

Phase 1 (manual forms) must be complete and tested before starting Phase 2.

