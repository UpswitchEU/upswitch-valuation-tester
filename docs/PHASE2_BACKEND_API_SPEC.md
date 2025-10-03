# 🔌 Phase 2 Backend API Specification

**Version**: 1.0.0  
**Target Implementation**: Python FastAPI Valuation Engine  
**Estimated Development Time**: 10-14 hours

---

## 📄 Document Parsing Endpoint

### **POST /api/v1/documents/parse**

Parses financial documents using AI to extract structured valuation data.

#### **Request**
```http
POST /api/v1/documents/parse
Content-Type: multipart/form-data

file: <binary>
```

**Parameters**:
- `file` (required): Financial document (PDF, Excel, CSV, or image)
- Max file size: 10MB
- Supported formats: `.pdf`, `.xlsx`, `.xls`, `.csv`, `.png`, `.jpg`

#### **Response** (200 OK)
```json
{
  "extracted_data": {
    "company_name": "Acme GmbH",
    "country_code": "DE",
    "industry": "technology",
    "founding_year": 2018,
    "current_year_data": {
      "year": 2024,
      "revenue": 2500000,
      "ebitda": 500000,
      "operating_expenses": 1500000,
      "net_income": 350000
    },
    "historical_data": [
      {
        "year": 2023,
        "revenue": 2000000,
        "ebitda": 400000
      }
    ]
  },
  "confidence": 0.85,
  "warnings": [
    "Could not extract CapEx data - please enter manually",
    "Tax expense estimated based on German corporate tax rate"
  ],
  "metadata": {
    "file_type": "pdf",
    "pages_processed": 3,
    "extraction_method": "gpt-4-vision",
    "processing_time_ms": 4521
  }
}
```

#### **Response** (400 Bad Request)
```json
{
  "detail": "Unsupported file format. Supported: PDF, Excel, CSV, PNG, JPG"
}
```

#### **Response** (413 Payload Too Large)
```json
{
  "detail": "File size exceeds 10MB limit"
}
```

---

### **Implementation Guide**

#### **Dependencies**
```python
# requirements.txt additions
openai>=1.0.0          # GPT-4 Vision
anthropic>=0.7.0       # Claude (alternative)
pypdf2>=3.0.0          # PDF parsing
openpyxl>=3.1.0        # Excel parsing
pandas>=2.0.0          # Data manipulation
pillow>=10.0.0         # Image processing
pytesseract>=0.3.10    # OCR fallback
```

#### **Code Structure**
```python
# src/services/document_parser.py

from openai import AsyncOpenAI
from typing import Dict, Any, List
import pypdf2
import openpyxl
import pandas as pd

class DocumentParser:
    def __init__(self):
        self.openai_client = AsyncOpenAI()
        self.confidence_threshold = 0.7
    
    async def parse_document(self, file_content: bytes, file_type: str) -> Dict[str, Any]:
        """
        Main parsing orchestrator.
        """
        # 1. Extract text based on file type
        if file_type == 'pdf':
            text = await self._extract_pdf_text(file_content)
        elif file_type in ['xlsx', 'xls']:
            text = await self._extract_excel_text(file_content)
        elif file_type == 'csv':
            text = await self._extract_csv_text(file_content)
        else:
            # Image - use OCR
            text = await self._ocr_extract(file_content)
        
        # 2. AI-powered extraction
        extracted = await self._extract_with_gpt4(text)
        
        # 3. Validation and confidence scoring
        validated = self._validate_extraction(extracted)
        confidence = self._calculate_confidence(extracted)
        warnings = self._generate_warnings(validated)
        
        return {
            "extracted_data": validated,
            "confidence": confidence,
            "warnings": warnings
        }
    
    async def _extract_with_gpt4(self, text: str) -> Dict[str, Any]:
        """
        Use GPT-4 to extract structured financial data.
        """
        prompt = """
        Extract financial data from this document into JSON format.
        
        Required fields:
        - company_name
        - revenue (annual, in EUR)
        - ebitda
        - operating_expenses
        - industry (choose from: technology, manufacturing, retail, etc.)
        
        Optional fields:
        - founding_year
        - employees
        - net_income
        - total_debt
        - cash
        
        Return ONLY valid JSON. Use null for missing data.
        """
        
        response = await self.openai_client.chat.completions.create(
            model="gpt-4-1106-preview",
            messages=[
                {"role": "system", "content": "You are a financial analyst extracting data from documents."},
                {"role": "user", "content": f"{prompt}\n\nDocument:\n{text}"}
            ],
            response_format={"type": "json_object"}
        )
        
        return json.loads(response.choices[0].message.content)
```

---

## 🔍 Company Lookup Endpoint

### **GET /api/v1/companies/lookup**

Searches public company registries and databases to auto-fill company information.

#### **Request**
```http
GET /api/v1/companies/lookup?name=Acme+GmbH&country=DE
```

**Parameters**:
- `name` (required): Company name to search
- `country` (optional): 2-letter country code (DE, UK, FR, etc.)
- `limit` (optional): Max results to return (default: 10)

#### **Response** (200 OK)
```json
{
  "results": [
    {
      "name": "Acme GmbH",
      "legal_name": "Acme Gesellschaft mit beschränkter Haftung",
      "industry": "technology",
      "country": "DE",
      "city": "Berlin",
      "founding_year": 2018,
      "employees": 50,
      "business_model": "B2B SaaS",
      "description": "Cloud-based project management software",
      "data_sources": ["handelsregister", "linkedin"],
      "confidence": 0.92,
      "registry_id": "HRB 123456 B",
      "website": "https://acme-gmbh.de"
    },
    {
      "name": "Acme Solutions GmbH",
      "industry": "consulting",
      "country": "DE",
      "founding_year": 2015,
      "employees": 25,
      "confidence": 0.65
    }
  ],
  "total_results": 2,
  "search_time_ms": 1250
}
```

#### **Response** (400 Bad Request)
```json
{
  "detail": "Company name is required"
}
```

---

### **Implementation Guide**

#### **Data Sources**

**Germany**:
```python
# Handelsregister (German Commercial Registry)
# https://www.handelsregister.de/

async def search_handelsregister(company_name: str) -> List[Dict]:
    """
    Scrape or API call to German registry.
    """
    # Note: No official API - requires web scraping or paid service
    url = f"https://www.handelsregister.de/rp_web/search.xhtml?fulltext={company_name}"
    response = await httpx.get(url)
    # Parse HTML with BeautifulSoup
    companies = parse_registry_html(response.text)
    return companies
```

**United Kingdom**:
```python
# Companies House API
# https://developer-specs.company-information.service.gov.uk/

async def search_companies_house(company_name: str) -> List[Dict]:
    """
    Official UK company registry API (free).
    """
    api_key = os.getenv("COMPANIES_HOUSE_API_KEY")
    url = f"https://api.company-information.service.gov.uk/search/companies"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            params={"q": company_name},
            auth=(api_key, '')
        )
        data = response.json()
        return data["items"]
```

**LinkedIn**:
```python
# LinkedIn Company Search (scraping)
async def search_linkedin(company_name: str) -> List[Dict]:
    """
    Extract employee count and description from LinkedIn.
    
    Note: Requires LinkedIn scraping (use Selenium or Playwright)
    Or use RapidAPI LinkedIn proxy
    """
    # Use RapidAPI: https://rapidapi.com/rockapis-rockapis-default/api/linkedin-api8
    # OR Apify: https://apify.com/apify/linkedin-company-scraper
    pass
```

**Crunchbase**:
```python
# Crunchbase API (paid: $99/month)
async def search_crunchbase(company_name: str) -> List[Dict]:
    """
    Get funding, valuation, and growth data.
    """
    api_key = os.getenv("CRUNCHBASE_API_KEY")
    url = f"https://api.crunchbase.com/api/v4/autocompletes"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            url,
            params={"query": company_name},
            headers={"X-cb-user-key": api_key}
        )
        return response.json()["entities"]
```

#### **Code Structure**
```python
# src/services/company_lookup.py

class CompanyLookupService:
    def __init__(self):
        self.registries = {
            "DE": HandelsregisterAdapter(),
            "UK": CompaniesHouseAdapter(),
            "FR": InpiAdapter(),
            "US": SECAdapter()
        }
        self.enrichers = {
            "linkedin": LinkedInEnricher(),
            "crunchbase": CrunchbaseEnricher()
        }
    
    async def lookup(self, company_name: str, country: Optional[str] = None) -> List[Dict]:
        results = []
        
        # 1. Search registries
        if country:
            registry = self.registries.get(country)
            if registry:
                results.extend(await registry.search(company_name))
        else:
            # Search all registries
            tasks = [adapter.search(company_name) for adapter in self.registries.values()]
            all_results = await asyncio.gather(*tasks)
            results = [r for sublist in all_results for r in sublist]
        
        # 2. Enrich with LinkedIn data
        for result in results:
            linkedin_data = await self.enrichers["linkedin"].enrich(result["name"])
            result.update(linkedin_data)
        
        # 3. Deduplicate and rank
        unique_results = self._deduplicate(results)
        ranked = self._rank_by_relevance(unique_results, company_name)
        
        return ranked[:10]
```

---

## 🔧 Additional Endpoints (Optional)

### **POST /api/v1/valuation/auto**
Combines company lookup + document parsing + valuation in one call.

```json
{
  "company_name": "Acme GmbH",
  "document": "<base64_encoded_pdf>"
}
```

Returns full valuation result with auto-filled data.

---

## 📊 Implementation Priority

| Endpoint | Priority | Time | Value |
|----------|----------|------|-------|
| `/documents/parse` | ⭐⭐⭐ High | 6-8h | Biggest UX win |
| `/companies/lookup` | ⭐⭐ Medium | 4-6h | Nice convenience |
| `/valuation/auto` | ⭐ Low | 2h | Combine above |

**Recommended**: Start with document parsing, then add company lookup later.

---

## 🧪 Testing Checklist

### **Document Parsing**
- [ ] PDF with clear financial tables
- [ ] Excel with multiple sheets
- [ ] CSV with proper headers
- [ ] Scanned PDF (poor quality)
- [ ] Multi-page documents
- [ ] Non-financial PDFs (should fail gracefully)
- [ ] Corrupted files
- [ ] Files > 10MB (should reject)

### **Company Lookup**
- [ ] Exact company name match
- [ ] Partial name match
- [ ] Common name (many results)
- [ ] Non-existent company
- [ ] Company in different countries
- [ ] Special characters in name
- [ ] Rate limiting (100 requests)

---

## 📈 Expected Performance

| Metric | Target | Notes |
|--------|--------|-------|
| Document parse time | < 5s | GPT-4 API latency |
| Company lookup time | < 2s | Registry API calls |
| Accuracy (documents) | > 80% | Well-formatted PDFs |
| Accuracy (company lookup) | > 90% | Official registries |
| Cost per parse | $0.10 | GPT-4 pricing |
| Cost per lookup | $0.00 | Free APIs |

---

## 🔐 Security Requirements

### **Document Upload**
- [ ] File type whitelist (no executables)
- [ ] Virus scanning (ClamAV or CloudFlare)
- [ ] Size limits (10MB max)
- [ ] Temporary file cleanup
- [ ] No storage of uploaded files

### **API Keys**
- [ ] Store in environment variables
- [ ] Rotate monthly
- [ ] Use different keys per environment
- [ ] Monitor usage/costs

### **Rate Limiting**
- [ ] 100 requests/hour per IP (documents)
- [ ] 200 requests/hour per IP (lookup)
- [ ] Exponential backoff for API calls

---

**Last Updated**: October 3, 2025  
**Owner**: Backend Engineering Team  
**Review Date**: After Phase 1 beta testing

