# 🚀 Upswitch Valuation Tester (Frontend)

**Standalone React application for testing the Upswitch Valuation Engine**

**Version**: 1.0.0  
**Status**: ✅ Production-Ready Frontend  
**Tech Stack**: React 18 + TypeScript + Tailwind + Vite

---

## 🎯 Purpose

This is a **standalone React frontend application** for testing and demonstrating the Upswitch AI-Powered Business Valuation Engine. It provides a beautiful, brand-consistent UI for:

- ✅ **Manual valuation entry** - Input financial data manually
- ✅ **Real-time preview** - Live estimate as you type (800ms debounce)
- ✅ **Progressive reports** - Real-time, section-by-section report generation
- ✅ **Document upload** with AI parsing (Phase 2)
- ✅ **Company lookup** with auto-fill from registries
- ✅ **Comprehensive results** with charts and insights
- ✅ **Registry-first approach** - Automatic data from Companies House, KBO/BCE
- ✅ **AI-guided valuation** - Conversational valuation with intelligent triage
- ✅ **Detailed calculation breakdown** - Real data display in Info tab

**📚 Backend Documentation**: For valuation engine documentation, see [../upswitch-valuation-engine/docs/](../upswitch-valuation-engine/docs/README.md)

---

## 🏗️ Architecture

```
React Frontend (Port 3001)
    ↓
Valuation Engine API (Port 8000)
    ├─ /api/v1/valuation/calculate ✅ (Unified endpoint - handles all valuation types)
    ├─ /api/v1/valuation/calculate/stream ✅ (Streaming endpoint)
    ├─ /api/v1/documents/parse ✅
    ├─ /api/v1/companies/lookup ✅
    ├─ /api/v1/registry/:country/:id ✅
    └─ /api/valuations/progressive-report/* 🆕
        ├─ /start - Start progressive report generation
        ├─ /stream/:sessionId - Stream real-time updates
        └─ /status/:sessionId - Get report status
```

**Note**: This is a frontend-only application. For backend/engine documentation, see the valuation-engine docs.

---

## 📄 Report Rendering Architecture

### Server-Side HTML Generation

All calculation data and reports are generated server-side in Python for optimal performance and consistency.

**Data Flow**:
1. **User Input** → Form submission in `ManualValuationFlow.tsx`
2. **Node.js Backend** → Forwards request to Python engine
3. **Python Engine** → Calculates valuation via triage system (11 steps)
4. **Python Engine** → Generates HTML reports:
   - `html_report`: Main report HTML (~50-80KB)
   - `info_tab_html`: Info tab breakdown HTML (~30-50KB)
5. **Streaming Response** → HTML reports streamed to frontend
6. **Frontend** → Renders HTML directly via `dangerouslySetInnerHTML`

### Main Report (Preview Tab)

**Streaming Behavior**:
- **Trigger**: User clicks "Calculate" button
- **Source**: `result.html_report` (server-generated HTML)
- **Component**: `src/components/ProgressiveValuationReport.tsx`
- **Rendering**: Streams HTML sections as they're generated, then renders complete HTML
- **Size**: ~50-80KB HTML
- **Endpoint**: `/api/v1/valuation/calculate/stream` (SSE streaming)

**Implementation**:
- Uses `manualValuationStreamService` for SSE streaming
- Progressive rendering shows sections as they arrive
- Falls back to full HTML when streaming completes

### Info Tab (Lazy Loading)

**Lazy Loading Behavior**:
- **Trigger**: User clicks "Info" tab
- **Source**: `result.info_tab_html` (server-generated HTML)
- **Component**: `src/components/ValuationInfoPanel.tsx`
- **Rendering**: `dangerouslySetInnerHTML` (only when tab is active)
- **Size**: ~30-50KB HTML
- **Loading**: HTML included in streaming response completion event, rendered on-demand

**Implementation**:
- Info tab HTML is included in streaming response but only rendered when tab is clicked
- No separate API call needed (HTML already in response)
- Shows loading state if HTML not yet available

### Benefits

- **Consistency**: Single source of truth (server-side Python templates)
- **Performance**: Smaller bundle, faster load, less runtime processing
- **Payload**: 50-70% reduction in response size (~100-180KB saved per request)
- **Maintainability**: No complex frontend data extraction logic
- **Bundle Size**: ~150-200KB reduction (gzipped JavaScript)
- **Streaming**: Progressive rendering for better UX
- **Lazy Loading**: Info tab only loads when needed

### Architecture Flow

```
User Input (Form)
    ↓
Node.js Backend (/api/valuations/calculate/manual)
    ↓
Python Engine (/api/v1/valuation/calculate)
    ├─ Calculate valuation (triage system - 11 steps)
    ├─ Generate html_report (main report HTML)
    └─ Generate info_tab_html (info tab HTML)
    ↓
Streaming Response (SSE)
    ├─ Stream html_report sections progressively
    └─ Include info_tab_html in completion event
    ↓
Frontend
    ├─ Main Report: Stream and render via ProgressiveValuationReport
    └─ Info Tab: Render info_tab_html when tab clicked (lazy loading)
```

### Migration History

**Before (Legacy)**:
- Frontend React components rendered calculation steps
- Complex data extraction logic (`stepDataMapper.ts`, `calculationStepsNormalizer.ts`)
- Large response payloads with detailed calculation data
- ~5,500+ lines of frontend rendering code
- Calculation data sent as JSON, frontend extracted and rendered

**After (Current)**:
- Server-side HTML generation in Python
- Simple frontend rendering via `dangerouslySetInnerHTML`
- Reduced payload (detailed data excluded when HTML present)
- Single source of truth for report rendering
- Streaming for progressive UX
- Lazy loading for info tab

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 20+ and npm/yarn
- Python valuation engine running on port 8000 (see [../upswitch-valuation-engine/](../upswitch-valuation-engine/))

### **Installation**
```bash
# Navigate to project
cd /Users/matthiasmandiau/Downloads/upswitch/apps/upswitch-valuation-tester

# Install dependencies
yarn install

# Copy brand assets (if needed)
cp ../upswitch-frontend/public/UpSwitch_logo_var1.svg ./public/
cp ../upswitch-frontend/public/upswitch_favicon.svg ./public/

# Start development server
yarn dev
```

**Access**: http://localhost:3001

### **Verify Backend is Running**
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

---

## 🧠 Business Type Intelligence Integration (NEW - January 2025)

### Overview
Frontend now features dynamic question flows, real-time validation, and enhanced business type selection powered by PostgreSQL intelligence.

### New Components

**Core Components (5):**
1. `src/components/BusinessTypeSelector.tsx` - Enhanced type selector with metadata
2. `src/components/DynamicQuestionFlow.tsx` - Orchestrates question flow
3. `src/components/DynamicQuestionRenderer.tsx` - Renders individual questions
4. `src/components/ValidationMessage.tsx` - Real-time validation feedback
5. `src/components/PhaseProgress.tsx` - Visual progress indicator

### New Hooks

**Data Fetching (3):**
1. `src/hooks/useBusinessTypeFull.ts` - Fetch complete business type metadata
2. `src/hooks/useRealTimeValidation.ts` - Real-time validation
3. `src/hooks/useBusinessTypeQuestions.ts` - Dynamic questions

### API Integration

**Backend Endpoints:**
- `GET /api/business-types/types/:id/full` - Complete metadata
- `GET /api/business-types/types/:id/questions` - Dynamic questions
- `POST /api/business-types/types/:id/validate` - Validation
- `GET /api/business-types/types/:id/benchmarks` - Benchmarks

### Usage Example

```typescript
import { useBusinessTypeFull } from '@/hooks/useBusinessTypeFull';

function BusinessTypeForm({ typeId }: { typeId: string }) {
  const { data, loading, error } = useBusinessTypeFull(typeId);
  
  if (loading) return <Loading />;
  if (error) return <Error message={error} />;
  
  return (
    <div>
      <h2>{data.title}</h2>
      <p>Questions: {data.questions.length}</p>
      <p>Benchmarks: {data.benchmarks.length}</p>
      
      {data.questions.map(q => (
        <DynamicQuestion key={q.id} question={q} />
      ))}
    </div>
  );
}
```

### API Service

**Updated:** `src/services/businessTypesApi.ts`

```typescript
// Fetch complete metadata
const bakeryData = await businessTypesApi.getBusinessTypeFull('bakery');
// Returns: {questions: [...], validations: [...], benchmarks: [...]}

// Real-time validation
const validation = await businessTypesApi.validateBusinessTypeData('bakery', {
  revenue: 450000,
  ebitda: 60000
});
// Returns: {valid: true, errors: [], warnings: [...]}
```

### Documentation
- [Component Documentation](/docs/components/BUSINESS_TYPE_INTELLIGENCE_COMPONENTS.md)
- [API Integration](/docs/api/BUSINESS_TYPE_INTELLIGENCE_API.md)

---

## 📦 What's Included

### **Core Features** ✅

| Feature | Status | Description |
|---------|--------|-------------|
| Manual Entry Form | ✅ | Input financial data manually with validation |
| Real-Time Preview | ✅ | Live valuation estimate (updates as you type) |
| Progressive Reports | ✅ | Real-time, section-by-section report generation |
| Registry Lookup | ✅ | Auto-fill from Companies House, KBO/BCE |
| Document Upload | ✅ | Upload PDFs, Excel files for parsing |
| Comprehensive Results | ✅ | Charts, metrics, DCF, multiples analysis |
| Export JSON | ✅ | Download valuation results |
| Privacy-First UI | ✅ | Clear separation of public vs private data |
| Upswitch Branding | ✅ | Logo, colors, fonts match main app |

### **Frontend Technologies**

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **API Client**: Axios
- **Charts**: Recharts
- **Forms**: React Hook Form

---

## 🎨 Branding

### **Colors** (matching Upswitch brand)
- **Primary**: Teal `#14B8A6`
- **Success**: Green `#22c55e`
- **Warning**: Amber `#f59e0b`
- **Error**: Red `#ef4444`

### **Fonts**
- **Body**: Inter
- **Display**: DM Sans

### **Logo**
- Source: `/public/UpSwitch_logo_var1.svg`
- Fallback: Main frontend assets

---

## 📁 Project Structure

```
upswitch-valuation-tester/
├── public/
│   ├── UpSwitch_logo_var1.svg
│   └── upswitch_favicon.svg
├── src/
│   ├── components/
│   │   ├── Header.tsx                    # Logo + navigation
│   │   ├── DocumentUpload.tsx            # Drag-drop file upload
│   │   ├── CompanyLookup.tsx             # Registry search
│   │   ├── ValuationForm.tsx             # Manual entry form
│   │   ├── LivePreview.tsx               # Real-time estimate
│   │   ├── Results.tsx                   # Results display
│   │   ├── SmartValuationFlow.tsx        # Main flow orchestrator
│   │   └── registry/                     # Registry-specific components
│   │       ├── RegistryDataPreview.tsx
│   │       ├── AIAssistedValuation.tsx
│   │       └── ConversationalChat.tsx
│   ├── services/
│   │   ├── api.ts                        # API client
│   │   └── registryService.ts            # Registry API integration
│   ├── store/
│   │   └── useValuationStore.ts          # Zustand state management
│   ├── types/
│   │   ├── valuation.ts                  # TypeScript types
│   │   └── registry.ts                   # Registry types
│   ├── pages/
│   │   └── PrivacyExplainer.tsx          # Privacy information page
│   ├── App.tsx                           # Main app component
│   └── main.tsx                          # React entry point
├── docs/                                  # Frontend-specific documentation
│   ├── README.md                         # Documentation index
│   ├── frontend/                         # Frontend implementation docs
│   ├── ux/                               # UX design docs
│   ├── privacy/                          # Privacy UI docs
│   ├── implementation/                   # Frontend implementation
│   ├── status/                           # Project status reports
│   └── archive/                          # Completed milestones
├── README.md                             # This file
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts
```

---

## 🛠️ Development

### **Available Scripts**
```bash
# Start development server (port 3001)
yarn dev

# Build for production
yarn build

# Preview production build
yarn preview

# Type checking
yarn type-check

# Lint code
yarn lint
```

### **Environment Variables**
```bash
# .env (create from .env.example)
VITE_VALUATION_API_URL=http://localhost:8000
VITE_ENABLE_REGISTRY=true
VITE_ENABLE_DOCUMENT_UPLOAD=true
```

---

## 🚢 Deployment

### **Option 1: Vercel** (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

**Result**: `https://valuation-tester.vercel.app`

### **Option 2: Static Hosting**
```bash
# Build
yarn build

# Upload dist/ folder to:
# - AWS S3 + CloudFront
# - GitHub Pages
# - Netlify
# - Any static host
```

---

## 🧪 Testing Scenarios

### **Scenario 1: Manual Entry**
```
User Flow:
1. Enter financial data manually
2. See real-time preview (updates as typing)
3. Click "Calculate Valuation"
4. View comprehensive results with charts

Expected: Full valuation report in <5 seconds
```

### **Scenario 2: Registry Lookup**
```
User Flow:
1. Select country (UK, Belgium, etc.)
2. Enter company number or name
3. System fetches public registry data
4. Data pre-fills form automatically
5. User can supplement with current year data
6. Click "Calculate Valuation"

Expected: Pre-filled form with historical data
```

### **Scenario 3: Document Upload**
```
User Flow:
1. Upload PDF or Excel file
2. System parses financial data
3. Data pre-fills form
4. User reviews and confirms
5. Click "Calculate Valuation"

Expected: Extracted data in form, ready for calculation
```

---

## 📚 Documentation

### **Frontend Documentation** (this repo)

Located in [docs/](./docs/):

- **[README.md](./docs/README.md)** - Documentation index
- **[frontend/](./docs/frontend/)** - Frontend implementation guides
- **[ux/](./docs/ux/)** - UX design documentation
- **[privacy/](./docs/privacy/)** - Privacy UI implementation
- **[implementation/](./docs/implementation/)** - Implementation roadmap
- **[status/](./docs/status/)** - Project status reports
- **[archive/](./docs/archive/)** - Completed milestones

### **Backend/Engine Documentation**

For valuation engine, API, architecture, and backend documentation:

👉 **See**: [../upswitch-valuation-engine/docs/](../upswitch-valuation-engine/docs/README.md)

### **🆕 Progressive Reports Documentation**

For progressive report generation, real-time streaming, and template system:

👉 **See**: [../upswitch-valuation-engine/docs/architecture/progressive-reports/](../upswitch-valuation-engine/docs/architecture/progressive-reports/ARCHITECTURE.md)

**Key Components**:
- **[Architecture Overview](../upswitch-valuation-engine/docs/architecture/progressive-reports/ARCHITECTURE.md)** - System design and 4-phase model
- **[Frontend Integration](../upswitch-valuation-engine/docs/architecture/progressive-reports/api/FRONTEND_INTEGRATION.md)** - React component usage
- **[Quick Start Guide](../upswitch-valuation-engine/docs/architecture/progressive-reports/guides/QUICK_START.md)** - Development setup
- **[Template Development](../upswitch-valuation-engine/docs/architecture/progressive-reports/guides/TEMPLATE_DEVELOPMENT.md)** - Creating templates

---

## 🔒 Privacy & Security

### **Frontend Privacy Features**

- ✅ **Clear Data Classification**: Visual indicators for public vs private data
- ✅ **Privacy Explainer Page**: User education about data handling
- ✅ **Registry-First Messaging**: Clear communication about public data sources
- ✅ **Consent Management**: User consent for different data types
- ✅ **No Local Storage of Sensitive Data**: Financial data not persisted locally

### **Backend Privacy**

For backend privacy architecture (3-pipeline system):
- See [../upswitch-valuation-engine/docs/privacy/](../upswitch-valuation-engine/docs/privacy/)

---

## 🐛 Troubleshooting

### **Issue**: "Failed to connect to valuation engine"
**Solution**: Verify Python engine is running
```bash
curl http://localhost:8000/health
# If not running, start the engine:
cd ../upswitch-valuation-engine
uvicorn src.api.main:app --reload --port 8000
```

### **Issue**: "Logo not displaying"
**Solution**: Copy logo from main frontend
```bash
cp ../upswitch-frontend/public/UpSwitch_logo_var1.svg ./public/
```

### **Issue**: "Real-time preview not working"
**Solution**: 
1. Check browser console for errors
2. Verify debounce is working (800ms delay)
3. Ensure backend CORS allows `http://localhost:3001`

### **Issue**: TypeScript errors
**Solution**: Run type check
```bash
yarn type-check
```

---

## 📊 Success Metrics

### **User Experience Metrics**
- **Time to First Valuation**: Target < 2 minutes
- **Form Completion Rate**: Target > 70%
- **User Satisfaction**: Target > 4.5/5
- **Registry Auto-fill Success**: Target > 85%

### **Technical Metrics**
- **Page Load Time**: Target < 2 seconds
- **Real-time Preview Latency**: Target < 100ms
- **API Response Time**: Target < 3 seconds
- **Error Rate**: Target < 1%

---

## 🤝 Contributing

### **Frontend Development Guidelines**

1. **Component Structure**: Use functional components with hooks
2. **TypeScript**: Always use proper types, avoid `any`
3. **Styling**: Use Tailwind utility classes
4. **State Management**: Use Zustand for global state
5. **API Calls**: Use the centralized API service
6. **Testing**: Write tests for complex logic
7. **Documentation**: Update docs for UI changes

### **Code Style**

```typescript
// Good: Properly typed component
interface Props {
  companyName: string;
  onSubmit: (data: ValuationData) => void;
}

export const ValuationForm: React.FC<Props> = ({ companyName, onSubmit }) => {
  // Implementation
};

// Bad: Untyped component
export const ValuationForm = (props: any) => {
  // Implementation
};
```

---

## 🎯 Roadmap

### **Completed** ✅
- [x] Manual entry form with validation
- [x] Real-time preview functionality
- [x] Registry lookup integration (UK, Belgium)
- [x] Document upload UI
- [x] Comprehensive results display
- [x] Privacy-first architecture UI
- [x] Upswitch branding
- [x] AI-guided valuation flow
- [x] Critical fixes (hardcoded data, download PDF, business profile)
- [x] Info tab with real calculation data

### **In Progress** 🟡
- [ ] Enhanced document parsing UI feedback
- [ ] Mobile responsive improvements
- [ ] Accessibility (WCAG 2.1 AA)

### **Future** 🔮
- [ ] Multi-language support (EN, FR, NL, DE)
- [ ] PDF export of results
- [ ] Email sharing functionality
- [ ] Save valuation history (with auth)
- [ ] Comparison mode (multiple valuations)

---

## 📞 Support

### **Technical Issues**
- Check [docs/](./docs/) for frontend documentation
- Review browser console for errors
- Verify backend is running: `curl http://localhost:8000/health`

### **Backend/API Issues**
- See [../upswitch-valuation-engine/docs/](../upswitch-valuation-engine/docs/)
- Check API logs
- Review [operations guide](../upswitch-valuation-engine/docs/operations/)

### **Architecture Questions**
- Frontend: See [docs/frontend/](./docs/frontend/)
- Backend: See [../upswitch-valuation-engine/docs/architecture/](../upswitch-valuation-engine/docs/architecture/)

---

## 🏆 Summary

**Current Status**: ✅ Production-Ready Frontend Application

**What Works**:
- ✅ Complete React frontend with TypeScript
- ✅ Manual and registry-based data entry
- ✅ Real-time valuation preview
- ✅ Document upload interface
- ✅ Comprehensive results visualization
- ✅ Privacy-first UI/UX
- ✅ Upswitch branding

**Separate Concerns**:
- **This repo**: Frontend UI/UX only
- **Valuation Engine**: Backend API, calculations, architecture

**Integration**:
- Frontend calls backend API endpoints
- Backend handles all valuation logic
- Clear separation allows independent development

---

**Built with** ❤️ **by the Upswitch Team**  
**For questions**: Contact Frontend Team

**Backend Questions**: See [../upswitch-valuation-engine/](../upswitch-valuation-engine/)

---

## 🆕 Recent Updates

### October 2025: Critical Fixes Implementation

**Status**: ✅ COMPLETED | **Build**: ✅ Passing | **Production**: ✅ Ready

- **Fixed Hardcoded Data**: Info tab now displays real user input data instead of fake €1M revenue/€200K EBITDA
- **Restored Download PDF**: Download functionality works via browser print API
- **Added Business Profile Context**: Shows actual company information (industry, country, founding year)
- **Enhanced AI-Guided Flow**: Added calculation details to AI-guided flow Info tab

**Documentation**: [Critical Fixes Implementation](../../docs/product/valuation-tester/implementations/critical-fixes-2025-10/README.md)

---

**Last Updated**: October 26, 2025  
**Version**: 1.1.0  
**Status**: Production-Ready Frontend  
**License**: Proprietary (Internal Use Only)
