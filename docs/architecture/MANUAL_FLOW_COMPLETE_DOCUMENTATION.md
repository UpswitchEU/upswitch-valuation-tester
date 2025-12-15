# Complete Manual Flow Documentation: Input → Report Generation

**Purpose**: Document the complete end-to-end flow from manual form input to report generation (main report preview, info tab, and PDF download)  
**Last Updated**: December 2025  
**Scope**: Frontend → Node.js → Python → Node.js → Frontend

---

## 🎯 Overview

The manual flow allows users to fill out a form with business data, submit it for valuation calculation, and receive a complete HTML report with preview, info tab, and PDF download capabilities.

**Key Principle**: All calculations happen in Python backend. Frontend only collects data and displays results.

---

## 📋 Complete Flow Sequence

### Phase 1: User Input & Form Submission

#### Step 1.1: User Fills Manual Form
**Location**: `apps/upswitch-valuation-tester/src/components/ValuationForm/ValuationForm.tsx`

**User Actions**:
- Fills out form sections:
  - Basic Information (company name, country, industry)
  - Financial Data (revenue, EBITDA, historical years)
  - Business Metrics (employees, owners, business model)
  - Optional: Comparables, business context

**Data Storage**:
- Form data stored in `useValuationFormStore.formData` (Zustand store)
- Real-time validation and field-level updates

**Code Flow**:
```typescript
// Form sections update store
useValuationFormStore.setState({ formData: { ...formData, field: value } })
```

---

#### Step 1.2: User Submits Form
**Location**: `apps/upswitch-valuation-tester/src/components/ValuationForm/hooks/useValuationFormSubmission.ts`

**Trigger**: User clicks "Calculate Valuation" button

**Process**:
1. **Validation**:
   ```typescript
   // Employee count validation
   if (formData.business_type === 'company' && 
       formData.number_of_owners > 0 && 
       formData.number_of_employees === undefined) {
     setEmployeeCountError('Employee count required')
     return
   }
   ```

2. **Convert Form Data**:
   ```typescript
   // Convert to DataResponse[] format (unified pipeline)
   const dataResponses = convertFormDataToDataResponses(formData)
   setCollectedData(dataResponses) // Store in form store
   ```

3. **Build Valuation Request**:
   ```typescript
   // Build ValuationRequest from formData
   const request = buildValuationRequest(formData)
   // Includes: company_name, country_code, industry, current_year_data, 
   //           historical_years_data, business_type_id, etc.
   ```

4. **Call API**:
   ```typescript
   const result = await calculateValuation(request)
   // Uses ValuationAPI.calculateValuationUnified()
   ```

**Files Involved**:
- `src/components/ValuationForm/hooks/useValuationFormSubmission.ts` (lines 52-109)
- `src/utils/buildValuationRequest.ts` (builds request object)
- `src/utils/convertFormDataToDataResponses.ts` (converts to unified format)

---

### Phase 2: Frontend → Node.js Backend

#### Step 2.1: API Call from Frontend
**Location**: `apps/upswitch-valuation-tester/src/services/api/valuation/ValuationAPI.ts`

**Endpoint Called**: `POST /api/valuations/calculate`

**Request Payload**:
```typescript
{
  ...valuationRequest,  // ValuationRequest object
  dataSource: 'manual'   // Identifies manual flow (FREE, no credits)
}
```

**Code**:
```typescript
async calculateValuationUnified(data: ValuationRequest): Promise<ValuationResponse> {
  const backendData = {
    ...data,
    dataSource: 'manual'  // Manual flow is FREE
  }
  
  return await this.executeRequest<ValuationResponse>({
    method: 'POST',
    url: '/api/valuations/calculate',
    data: backendData,
  })
}
```

**Files Involved**:
- `src/services/api/valuation/ValuationAPI.ts` (lines 111-147)
- `src/services/api/HttpClient.ts` (handles HTTP requests, retries, errors)

---

#### Step 2.2: Node.js Backend Receives Request
**Location**: `apps/upswitch-backend/src/controllers/valuation.controller.ts`

**Route**: `POST /api/valuations/calculate`  
**Handler**: `ValuationController.calculateValuation` (line 889)

**Process**:
1. **Extract Request Data**:
   ```typescript
   const valuationRequest: ValuationRequest & { dataSource?: 'manual' | 'ai-guided' } = req.body
   const userId = req.user?.id || `guest_${Date.now()}`
   const dataSource = valuationRequest.dataSource || 'manual'
   ```

2. **Credit Check** (Manual = FREE):
   ```typescript
   const creditCost = dataSource === 'manual' ? 0 : 1
   // Manual flow: No credit check, no deduction
   // AI-guided flow: Check credits, deduct 1 credit
   ```

3. **Enhance Request**:
   ```typescript
   const enhancedRequest: ValuationRequest = {
     ...valuationRequest,
     business_model: mapBusinessModelToPythonEnum(valuationRequest.business_model),
     founding_year: valuationRequest.founding_year ?? new Date().getFullYear() - 5,
     country_code: valuationRequest.country_code ?? 'BE',
     industry: valuationRequest.industry ?? 'services',
     // ... defaults and normalization
   }
   ```

4. **Forward to Python Engine**:
   ```typescript
   const result = await pythonEngineService.calculateValuation(enhancedRequest, correlationId)
   ```

**Files Involved**:
- `src/controllers/valuation.controller.ts` (lines 889-1027)
- `src/services/pythonEngine.service.ts` (line 148: `calculateValuation()`)

---

### Phase 3: Node.js → Python Engine

#### Step 3.1: Node.js Proxies to Python
**Location**: `apps/upswitch-backend/src/services/pythonEngine.service.ts`

**Python Endpoint**: `POST /api/v1/valuation/calculate`

**Process**:
1. **Prepare Request**:
   ```typescript
   const headers: Record<string, string> = {}
   if (correlationId) {
     headers['X-Correlation-ID'] = correlationId
   }
   headers['X-Request-Fingerprint'] = generateRequestFingerprint(request)
   ```

2. **HTTP Call**:
   ```typescript
   const response = await this.client.post(
     '/api/v1/valuation/calculate',
     request,
     { 
       timeout: 90000,  // 90 seconds
       headers
     }
   )
   ```

3. **Extract Response**:
   ```typescript
   const response: ValuationResponse = axiosResponse.data
   // Contains: valuation_id, equity_value_low/mid/high, html_report, info_tab_html, etc.
   ```

**Files Involved**:
- `src/services/pythonEngine.service.ts` (lines 115-238)
- Uses Axios client configured with `PYTHON_ENGINE_URL`

---

#### Step 3.2: Python Engine Receives Request
**Location**: `apps/upswitch-valuation-engine/src/api/routes/valuation/valuation_orchestrator.py`

**Python Route**: `POST /api/v1/valuation/calculate`  
**Handler**: `calculate_comprehensive_valuation()` (orchestrator)

**Process**:
1. **Parse Request**:
   ```python
   valuation_request: ValuationRequest = request body
   correlation_id: str = headers.get('X-Correlation-ID')
   ```

2. **Execute Valuation**:
   ```python
   # Comprehensive valuation calculation
   valuation_response = await orchestrator.process_comprehensive_valuation(
       valuation_request,
       correlation_id=correlation_id
   )
   ```

3. **Generate HTML Reports**:
   ```python
   # Generate Accountant View HTML (main report)
   html_report = html_report_service.generate_accountant_view_html(
       valuation_response, 
       valuation_request
   )
   
   # Generate Info Tab HTML (detailed breakdown)
   info_tab_html = html_report_service.generate_info_tab_html(
       valuation_response,
       valuation_request
   )
   
   # Attach to response
   valuation_response.html_report = html_report
   valuation_response.info_tab_html = info_tab_html
   ```

**Files Involved**:
- `src/api/routes/valuation/valuation_orchestrator.py` (orchestrator)
- `src/services/infrastructure/html_report_service.py` (HTML generation)
- `src/services/infrastructure/template_service.py` (Jinja2 rendering)

---

#### Step 3.3: Python Generates HTML Reports

**Main Report (`html_report`)**:
- **Service**: `HTMLReportService.generate_accountant_view_html()`
- **Template**: `templates/accountant_view_report.html` (Jinja2)
- **Size**: ~50-80KB HTML
- **Content**: Complete Accountant View (20-30 pages)
  - Executive Summary
  - Company Overview
  - Financial Analysis
  - Valuation Methodologies (DCF, Multiples)
  - Valuation Conclusion
  - Appendices

**Info Tab (`info_tab_html`)**:
- **Service**: `HTMLReportService.generate_info_tab_html()`
- **Template**: `templates/info_tab_report.html` (Jinja2)
- **Size**: ~30-50KB HTML
- **Content**: 12-step calculation breakdown
  - Data Collection Summary
  - Methodology Selection
  - Financial Normalization
  - DCF Calculation Steps
  - Multiples Calculation Steps
  - Risk Adjustments
  - Final Valuation Range

**Files Involved**:
- `src/services/infrastructure/html_report_service.py` (lines 76-1657)
- `src/services/infrastructure/template_service.py` (lines 71-650)
- `templates/accountant_view_report.html` (Jinja2 template)
- `templates/info_tab_report.html` (Jinja2 template)

---

#### Step 3.4: Python Returns Response
**Response Structure**:
```python
ValuationResponse(
    valuation_id: str,
    company_name: str,
    equity_value_low: float,
    equity_value_mid: float,
    equity_value_high: float,
    html_report: str,          # Main report HTML (~50-80KB)
    info_tab_html: str,        # Info tab HTML (~30-50KB)
    methodology: str,
    confidence_score: float,
    # ... other fields
)
```

**HTTP Response**:
- Status: `200 OK`
- Headers: `X-Correlation-ID: <correlation_id>`
- Body: JSON with `ValuationResponse` data

---

### Phase 4: Python → Node.js → Frontend

#### Step 4.1: Node.js Receives Python Response
**Location**: `apps/upswitch-backend/src/services/pythonEngine.service.ts`

**Process**:
1. **Extract Response Data**:
   ```typescript
   const response: ValuationResponse = axiosResponse.data
   ```

2. **Log Response**:
   ```typescript
   creditLogger.info('Python engine valuation completed', {
     valuationId: response.valuation_id,
     hasHtmlReport: !!response.html_report,
     htmlReportLength: response.html_report?.length || 0,
     hasInfoTabHtml: !!response.info_tab_html,
     infoTabHtmlLength: response.info_tab_html?.length || 0
   })
   ```

3. **Save Guest Report** (if guest user):
   ```typescript
   if (!req.user && guestSessionId && result.valuation_id) {
     await saveGuestReport(result.valuation_id, guestSessionId, result)
   }
   ```

**Files Involved**:
- `src/services/pythonEngine.service.ts` (lines 148-238)
- `src/controllers/valuation.controller.ts` (lines 1001-1020)

---

#### Step 4.2: Node.js Returns to Frontend
**Location**: `apps/upswitch-backend/src/controllers/valuation.controller.ts`

**Response**:
```typescript
return res.json({
  success: true,
  data: result,  // ValuationResponse with html_report and info_tab_html
  correlationId
})
```

**HTTP Response**:
- Status: `200 OK`
- Headers: `X-Correlation-ID: <correlation_id>`
- Body: `{ success: true, data: ValuationResponse }`

---

#### Step 4.3: Frontend Receives Response
**Location**: `apps/upswitch-valuation-tester/src/services/api/valuation/ValuationAPI.ts`

**Process**:
1. **Parse Response**:
   ```typescript
   const response = await this.executeRequest<ValuationResponse>({...})
   return response.data  // ValuationResponse
   ```

2. **Store in Results Store**:
   ```typescript
   // In useValuationFormSubmission.ts
   const result = await calculateValuation(request)
   setResult(result)  // Stores in useValuationResultsStore
   ```

**Files Involved**:
- `src/services/api/valuation/ValuationAPI.ts` (lines 111-147)
- `src/components/ValuationForm/hooks/useValuationFormSubmission.ts` (line 109-114)
- `src/store/useValuationResultsStore.ts` (stores result)

---

### Phase 5: Frontend Display

#### Step 5.1: Main Report Preview (Preview Tab)
**Location**: `apps/upswitch-valuation-tester/src/components/results/Results.tsx`

**Component**: `<Results />`

**Process**:
1. **Get Result from Store**:
   ```typescript
   const { result } = useValuationResultsStore()
   ```

2. **Render HTML Report**:
   ```typescript
   <div
     className="accountant-view-report"
     dangerouslySetInnerHTML={{ __html: result.html_report }}
   />
   ```

**Display**:
- Full HTML report rendered directly from `result.html_report`
- Styled with CSS from Python backend
- Scrollable, print-friendly format

**Files Involved**:
- `src/components/results/Results.tsx` (lines 19-86)
- `src/store/useValuationResultsStore.ts` (provides result)

---

#### Step 5.2: Info Tab Display
**Location**: `apps/upswitch-valuation-tester/src/components/ValuationInfoPanel.tsx`

**Component**: `<ValuationInfoPanel />`

**Process**:
1. **Get Result from Store**:
   ```typescript
   const { result } = useValuationResultsStore()
   ```

2. **Render Info Tab HTML**:
   ```typescript
   <div
     className="info-tab-content"
     dangerouslySetInnerHTML={{ __html: result.info_tab_html }}
   />
   ```

**Display**:
- Detailed calculation breakdown HTML
- 12-step methodology explanation
- Lazy loaded when Info tab is clicked

**Files Involved**:
- `src/components/ValuationInfoPanel.tsx`
- `src/store/useValuationResultsStore.ts` (provides result)

---

#### Step 5.3: Source Tab Display
**Location**: `apps/upswitch-valuation-tester/src/components/HTMLView.tsx`

**Component**: `<HTMLView />`

**Process**:
1. **Get Result from Store**:
   ```typescript
   const { result } = useValuationResultsStore()
   ```

2. **Display Raw HTML**:
   ```typescript
   <pre className="html-source">
     {result.html_report}
   </pre>
   ```

**Display**:
- Raw HTML markup for debugging/integration
- Syntax highlighted (if configured)

**Files Involved**:
- `src/components/HTMLView.tsx`
- `src/store/useValuationResultsStore.ts` (provides result)

---

### Phase 6: Report Saving

#### Step 6.1: Save Completed Report
**Location**: `apps/upswitch-valuation-tester/src/components/ValuationReport.tsx`

**Trigger**: After valuation completes successfully

**Process**:
```typescript
const handleValuationComplete = async (result: ValuationResponse) => {
  try {
    await reportApiService.completeReport(reportId, result)
  } catch (error) {
    // Don't block user - report already displayed locally
  }
}
```

**Files Involved**:
- `src/components/ValuationReport.tsx` (lines 41-49)
- `src/services/reportApi.ts` (lines 93-115)

---

#### Step 6.2: Backend Save Endpoint
**Location**: `apps/upswitch-backend/src/controllers/valuation.controller.ts`

**Endpoint**: `POST /api/valuations/save`  
**Handler**: `ValuationController.saveValuation` (line 107 in routes)

**Process**:
1. **Extract Request**:
   ```typescript
   const { reportId, valuationData } = req.body
   ```

2. **Save to Database**:
   ```typescript
   // Save valuation result to database
   await ValuationService.saveValuation(reportId, valuationData)
   ```

3. **Return Success**:
   ```typescript
   return res.json({ success: true, data: savedValuation })
   ```

**Files Involved**:
- `src/controllers/valuation.controller.ts` (`saveValuation` method)
- `src/routes/valuations.ts` (line 107: `router.post('/save', ...)`)

---

### Phase 7: PDF Download

#### Step 7.1: User Clicks Download PDF
**Location**: `apps/upswitch-valuation-tester/src/hooks/valuationToolbar/useValuationToolbarDownload.ts`

**Trigger**: User clicks "Download PDF" button in toolbar

**Process**:
```typescript
const handleDownload = async (valuationData: ValuationData) => {
  const { DownloadService } = await import('../../services/downloadService')
  await DownloadService.downloadAccountantViewPDF(valuationData, {
    format: 'pdf',
    filename: `valuation-${companyName}-${Date.now()}.pdf`
  })
}
```

**Files Involved**:
- `src/hooks/valuationToolbar/useValuationToolbarDownload.ts` (lines 27-70)
- `src/services/downloadService.ts` (lines 360-489)

---

#### Step 7.2: Frontend Calls PDF Endpoint
**Location**: `apps/upswitch-valuation-tester/src/services/api/report/ReportAPI.ts`

**Endpoint**: `POST /api/valuations/pdf/accountant-view`

**Request**:
```typescript
const response = await this.client.request({
  method: 'POST',
  url: '/api/valuations/pdf/accountant-view',
  data: { reportId },
  responseType: 'blob',  // Important: binary PDF data
  timeout: 120000,  // 2 minutes
})
```

**Files Involved**:
- `src/services/api/report/ReportAPI.ts` (lines 78-194)
- `src/services/downloadService.ts` (line 413: `backendAPI.downloadAccountantViewPDF()`)

---

#### Step 7.3: Node.js Proxies PDF Request
**Location**: `apps/upswitch-backend/src/controllers/valuation.controller.ts`

**Endpoint**: `POST /api/valuations/pdf/accountant-view`  
**Handler**: `ValuationController.downloadAccountantViewPDF` (line 2249)

**Process**:
1. **Extract Request**:
   ```typescript
   const valuationRequest: ValuationRequest = req.body
   ```

2. **Call Python Engine**:
   ```typescript
   const pdfBuffer = await pythonEngineService.downloadAccountantViewPDF(
     valuationRequest,
     correlationId
   )
   ```

3. **Return PDF**:
   ```typescript
   res.setHeader('Content-Type', 'application/pdf')
   res.setHeader('Content-Disposition', `attachment; filename=${filename}`)
   res.send(pdfBuffer)
   ```

**Files Involved**:
- `src/controllers/valuation.controller.ts` (lines 2249-2380)
- `src/services/pythonEngine.service.ts` (lines 419-550)

---

#### Step 7.4: Python Generates PDF
**Location**: `apps/upswitch-valuation-engine/src/api/routes/valuation_pdf.py`

**Endpoint**: `POST /api/v1/valuation/pdf/accountant-view`  
**Handler**: `generate_accountant_view_pdf()` (line 508)

**Process**:
1. **Calculate Valuation** (if not already calculated):
   ```python
   # Re-calculate or load from cache
   valuation_response = await calculate_comprehensive_valuation(
       valuation_request,
       correlation_id=correlation_id
   )
   ```

2. **Generate PDF from HTML**:
   ```python
   # Option 1: Use stored html_report if available
   html_content = valuation_response.html_report
   
   # Option 2: Generate HTML if not available
   if not html_content:
       html_content = html_report_service.generate_accountant_view_html(
           valuation_response,
           valuation_request
       )
   
   # Convert HTML to PDF using WeasyPrint
   pdf_bytes = pdf_generator.generate_pdf_from_html(
       html_content,
       template_data=valuation_data
   )
   ```

3. **Return PDF**:
   ```python
   return Response(
       content=pdf_bytes,
       media_type="application/pdf",
       headers={
           "Content-Disposition": f"attachment; filename={filename}",
           "Content-Type": "application/pdf"
       }
   )
   ```

**Files Involved**:
- `src/api/routes/valuation_pdf.py` (lines 508-798)
- `src/services/infrastructure/html_report_service.py` (lines 1563-1657)
- `src/services/infrastructure/template/coordinators/pdf_generation_coordinator.py`

---

#### Step 7.5: Frontend Downloads PDF
**Location**: `apps/upswitch-valuation-tester/src/services/downloadService.ts`

**Process**:
1. **Receive PDF Blob**:
   ```typescript
   const pdfBlob = await backendAPI.downloadAccountantViewPDF(reportId)
   ```

2. **Create Download Link**:
   ```typescript
   const url = URL.createObjectURL(pdfBlob)
   const link = document.createElement('a')
   link.href = url
   link.download = filename
   document.body.appendChild(link)
   link.click()
   document.body.removeChild(link)
   URL.revokeObjectURL(url)
   ```

**Files Involved**:
- `src/services/downloadService.ts` (lines 360-489)
- `src/services/api/report/ReportAPI.ts` (lines 78-194)

---

## 🔄 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    MANUAL FLOW: INPUT → REPORT                   │
└─────────────────────────────────────────────────────────────────┘

1. USER INPUT
   │
   ├─ ValuationForm.tsx
   │  └─ User fills form fields
   │     └─ Updates useValuationFormStore.formData
   │
   └─ User clicks "Calculate Valuation"
      │
      ▼

2. FRONTEND SUBMISSION
   │
   ├─ useValuationFormSubmission.ts
   │  ├─ Validates form data
   │  ├─ Converts formData → DataResponse[]
   │  ├─ Builds ValuationRequest
   │  └─ Calls calculateValuation(request)
   │
   ├─ ValuationAPI.ts
   │  └─ POST /api/valuations/calculate
   │     └─ { ...request, dataSource: 'manual' }
   │
   └─ HTTP Request to Node.js Backend
      │
      ▼

3. NODE.JS BACKEND
   │
   ├─ routes/valuations.ts
   │  └─ router.post('/calculate', ValuationController.calculateValuation)
   │
   ├─ ValuationController.calculateValuation()
   │  ├─ Extract request: ValuationRequest + dataSource
   │  ├─ Credit check: Manual = FREE (0 credits)
   │  ├─ Enhance request (defaults, normalization)
   │  └─ Call pythonEngineService.calculateValuation()
   │
   ├─ pythonEngine.service.ts
   │  └─ POST /api/v1/valuation/calculate
   │     └─ Forward to Python engine
   │
   └─ HTTP Request to Python Engine
      │
      ▼

4. PYTHON ENGINE
   │
   ├─ valuation_orchestrator.py
   │  └─ process_comprehensive_valuation()
   │     ├─ Calculate valuation (DCF, Multiples)
   │     ├─ Generate html_report (Accountant View)
   │     ├─ Generate info_tab_html (Info Tab)
   │     └─ Return ValuationResponse
   │
   ├─ html_report_service.py
   │  ├─ generate_accountant_view_html()
   │  │  └─ TemplateService.render_accountant_view_report()
   │  │     └─ Jinja2 template → HTML string (~50-80KB)
   │  │
   │  └─ generate_info_tab_html()
   │     └─ TemplateService.render_info_tab_report()
   │        └─ Jinja2 template → HTML string (~30-50KB)
   │
   └─ HTTP Response to Node.js
      │
      ▼

5. NODE.JS BACKEND (Response)
   │
   ├─ pythonEngine.service.ts
   │  └─ Extract ValuationResponse from Python
   │
   ├─ ValuationController.calculateValuation()
   │  ├─ Save guest report (if guest user)
   │  └─ Return JSON response
   │
   └─ HTTP Response to Frontend
      │
      ▼

6. FRONTEND (Display)
   │
   ├─ ValuationAPI.ts
   │  └─ Parse ValuationResponse
   │
   ├─ useValuationFormSubmission.ts
   │  └─ setResult(result) → useValuationResultsStore
   │
   ├─ Results.tsx (Preview Tab)
   │  └─ dangerouslySetInnerHTML({ __html: result.html_report })
   │     └─ Displays main report
   │
   ├─ ValuationInfoPanel.tsx (Info Tab)
   │  └─ dangerouslySetInnerHTML({ __html: result.info_tab_html })
   │     └─ Displays calculation breakdown
   │
   └─ HTMLView.tsx (Source Tab)
      └─ <pre>{result.html_report}</pre>
         └─ Displays raw HTML

7. REPORT SAVING
   │
   ├─ ValuationReport.tsx
   │  └─ handleValuationComplete(result)
   │     └─ reportApiService.completeReport(reportId, result)
   │
   ├─ reportApi.ts
   │  └─ backendAPI.saveValuation(result, reportId)
   │
   ├─ BackendAPI.ts
   │  └─ POST /api/valuations/save
   │
   └─ ValuationController.saveValuation()
      └─ Save to database

8. PDF DOWNLOAD
   │
   ├─ useValuationToolbarDownload.ts
   │  └─ DownloadService.downloadAccountantViewPDF()
   │
   ├─ downloadService.ts
   │  └─ backendAPI.downloadAccountantViewPDF(reportId)
   │
   ├─ ReportAPI.ts
   │  └─ POST /api/valuations/pdf/accountant-view
   │     └─ responseType: 'blob'
   │
   ├─ ValuationController.downloadAccountantViewPDF()
   │  └─ pythonEngineService.downloadAccountantViewPDF()
   │
   ├─ Python: valuation_pdf.py
   │  └─ generate_accountant_view_pdf()
   │     ├─ Load or generate html_report
   │     ├─ Convert HTML → PDF (WeasyPrint)
   │     └─ Return PDF bytes
   │
   └─ Frontend: Download PDF blob
      └─ Create download link → Browser downloads file
```

---

## 📁 Key Files Reference

### Frontend (upswitch-valuation-tester)

**Form & Submission**:
- `src/components/ValuationForm/ValuationForm.tsx` - Main form component
- `src/components/ValuationForm/hooks/useValuationFormSubmission.ts` - Submission logic
- `src/utils/buildValuationRequest.ts` - Builds request object
- `src/utils/convertFormDataToDataResponses.ts` - Converts to unified format

**API Services**:
- `src/services/api/valuation/ValuationAPI.ts` - Valuation API client
- `src/services/api/HttpClient.ts` - HTTP client with retry logic
- `src/services/api/report/ReportAPI.ts` - PDF download API

**State Management**:
- `src/store/useValuationFormStore.ts` - Form data store
- `src/store/useValuationResultsStore.ts` - Results store
- `src/store/useValuationApiStore.ts` - API state store

**Display Components**:
- `src/components/results/Results.tsx` - Main report preview
- `src/components/ValuationInfoPanel.tsx` - Info tab display
- `src/components/HTMLView.tsx` - Source tab display

**Download**:
- `src/services/downloadService.ts` - PDF download service
- `src/hooks/valuationToolbar/useValuationToolbarDownload.ts` - Download hook

**Report Saving**:
- `src/services/reportApi.ts` - Report persistence API
- `src/components/ValuationReport.tsx` - Report completion handler

---

### Node.js Backend (upswitch-backend)

**Routes**:
- `src/routes/valuations.ts` - Valuation routes
- `src/routes/index.ts` - Main router (mounts `/api/valuations`)

**Controllers**:
- `src/controllers/valuation.controller.ts`:
  - `calculateValuation()` (line 889) - Unified calculation endpoint
  - `saveValuation()` (line 107 in routes) - Save report endpoint
  - `downloadAccountantViewPDF()` (line 2249) - PDF download endpoint

**Services**:
- `src/services/pythonEngine.service.ts`:
  - `calculateValuation()` (line 148) - Proxy to Python
  - `downloadAccountantViewPDF()` (line 419) - PDF proxy

---

### Python Engine (upswitch-valuation-engine)

**API Routes**:
- `src/api/routes/valuation/valuation_orchestrator.py` - Main orchestrator
- `src/api/routes/valuation_pdf.py` - PDF generation endpoint

**HTML Generation**:
- `src/services/infrastructure/html_report_service.py`:
  - `generate_accountant_view_html()` - Main report HTML
  - `generate_info_tab_html()` - Info tab HTML

**Template Rendering**:
- `src/services/infrastructure/template_service.py`:
  - `render_accountant_view_report()` - Render main report template
  - `render_info_tab_report()` - Render info tab template
  - `generate_accountant_view_pdf()` - Generate PDF from HTML

**Templates**:
- `templates/accountant_view_report.html` - Main report Jinja2 template
- `templates/info_tab_report.html` - Info tab Jinja2 template

**PDF Generation**:
- `src/services/infrastructure/template/coordinators/pdf_generation_coordinator.py` - PDF coordinator
- Uses WeasyPrint to convert HTML → PDF

---

## 🔍 Critical Data Transformations

### 1. Form Data → ValuationRequest
**Location**: `src/utils/buildValuationRequest.ts`

**Transformation**:
```typescript
FormData {
  company_name: string
  country_code: string
  industry: string
  revenue: number
  ebitda: number
  // ... form fields
}
  ↓
ValuationRequest {
  company_name: string
  country_code: string
  industry: string
  current_year_data: {
    year: number
    revenue: number
    ebitda: number
  }
  historical_years_data: Array<{...}>
  business_type_id: string
  // ... normalized structure
}
```

---

### 2. ValuationRequest → Python Calculation
**Location**: Python orchestrator

**Process**:
- Validates request structure
- Extracts financial data
- Applies business type rules
- Calculates DCF valuation
- Calculates Multiples valuation
- Generates ValuationResponse

---

### 3. ValuationResponse → HTML Reports
**Location**: `html_report_service.py`

**Transformation**:
```python
ValuationResponse {
  valuation_id: str
  equity_value_low: float
  equity_value_mid: float
  equity_value_high: float
  methodology: str
  # ... calculation data
}
  ↓
Template Data Dictionary {
  company_name: str
  valuation_date: date
  equity_value_range: {...}
  dcf_valuation: {...}
  multiples_valuation: {...}
  # ... template-friendly format
}
  ↓
HTML String (~50-80KB)
```

---

### 4. HTML Report → PDF
**Location**: `pdf_generation_coordinator.py`

**Process**:
```python
HTML String (html_report)
  ↓
WeasyPrint HTML Parser
  ↓
PDF Bytes (~200-500KB)
```

---

## ✅ Verification Checklist

**To verify the complete flow works**:

- [ ] **Form Submission**: User can fill form and click "Calculate Valuation"
- [ ] **API Call**: Frontend makes POST to `/api/valuations/calculate` with `dataSource: 'manual'`
- [ ] **Node.js Processing**: Backend receives request, checks credits (FREE), forwards to Python
- [ ] **Python Calculation**: Python calculates valuation, generates `html_report` and `info_tab_html`
- [ ] **Response**: Python returns ValuationResponse with HTML reports
- [ ] **Frontend Display**: 
  - [ ] Preview tab shows `html_report` via `dangerouslySetInnerHTML`
  - [ ] Info tab shows `info_tab_html` via `dangerouslySetInnerHTML`
  - [ ] Source tab shows raw HTML
- [ ] **Report Saving**: Frontend calls `/api/valuations/save` after completion
- [ ] **PDF Download**: 
  - [ ] User clicks download → Frontend calls `/api/valuations/pdf/accountant-view`
  - [ ] Node.js proxies to Python `/api/v1/valuation/pdf/accountant-view`
  - [ ] Python generates PDF from `html_report` → Returns PDF bytes
  - [ ] Frontend receives PDF blob → Browser downloads file

---

## 🐛 Common Issues & Solutions

### Issue 1: `html_report` is null/undefined
**Symptoms**: Preview tab shows "Report not available"

**Possible Causes**:
1. Python failed to generate HTML report
2. Response parsing issue in Node.js
3. Frontend not receiving `html_report` field

**Debug Steps**:
1. Check Python logs for HTML generation errors
2. Check Node.js logs for `hasHtmlReport: false`
3. Check browser network tab for response structure
4. Verify `html_report_service.generate_accountant_view_html()` returns non-null

**Solution**: Ensure Python template service is initialized and templates are available

---

### Issue 2: Info Tab shows "Not Available"
**Symptoms**: Info tab shows empty state even after calculation

**Possible Causes**:
1. `info_tab_html` is null/undefined
2. HTML validation failed in Python
3. Template rendering error

**Debug Steps**:
1. Check Python logs for Info Tab generation errors
2. Verify `info_tab_html` length > minimum threshold
3. Check template validation logs

**Solution**: Ensure Info Tab template is valid and data transformation succeeds

---

### Issue 3: PDF Download Fails
**Symptoms**: PDF download button doesn't work or returns error

**Possible Causes**:
1. `reportId` missing from request
2. Python PDF generation fails
3. WeasyPrint not installed
4. HTML report not available for PDF conversion

**Debug Steps**:
1. Check frontend logs for PDF request
2. Check Node.js logs for proxy errors
3. Check Python logs for PDF generation errors
4. Verify WeasyPrint is installed in Python environment

**Solution**: Ensure Python has WeasyPrint installed and `html_report` is available

---

### Issue 4: Report Not Saving
**Symptoms**: Report completes but doesn't persist

**Possible Causes**:
1. `/api/valuations/save` endpoint returns 404
2. Database save fails
3. Frontend save call fails silently

**Debug Steps**:
1. Check browser network tab for save request
2. Check Node.js logs for save endpoint errors
3. Verify database connection
4. Check frontend error logs

**Solution**: Ensure `/api/valuations/save` route is registered and database is accessible

---

## 📊 Performance Benchmarks

**Expected Timings**:
- Form submission → API call: < 100ms
- Node.js processing: < 50ms
- Python calculation: 30-60 seconds
- HTML generation: 1-3 seconds
- Total time to report: 35-65 seconds
- PDF generation: 5-15 seconds

**Payload Sizes**:
- ValuationRequest: ~5-10KB JSON
- ValuationResponse: ~150-250KB JSON (with HTML reports)
- HTML Report: ~50-80KB
- Info Tab HTML: ~30-50KB
- PDF: ~200-500KB

---

## 🎯 Summary

**Complete Flow**:
1. ✅ User fills manual form → Form data stored in Zustand store
2. ✅ User submits → Frontend calls `/api/valuations/calculate` with `dataSource: 'manual'`
3. ✅ Node.js receives → Checks credits (FREE), enhances request, proxies to Python
4. ✅ Python calculates → Generates valuation, creates `html_report` and `info_tab_html`
5. ✅ Python returns → ValuationResponse with HTML reports
6. ✅ Node.js forwards → Returns JSON response to frontend
7. ✅ Frontend displays → Preview tab shows `html_report`, Info tab shows `info_tab_html`
8. ✅ Report saves → Frontend calls `/api/valuations/save` to persist
9. ✅ PDF downloads → Frontend calls `/api/valuations/pdf/accountant-view`, Python generates PDF from HTML

**Key Principle**: Frontend is purely presentational. All calculations, HTML generation, and PDF creation happen in Python backend.

---

**Document Version**: 1.0  
**Created**: December 2025  
**Next Review**: After production verification

