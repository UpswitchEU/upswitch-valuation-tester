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
- ✅ **Document upload** with AI parsing (Phase 2)
- ✅ **Company lookup** with auto-fill from registries
- ✅ **Comprehensive results** with charts and insights
- ✅ **Registry-first approach** - Automatic data from Companies House, KBO/BCE

**📚 Backend Documentation**: For valuation engine documentation, see [../upswitch-valuation-engine/docs/](../upswitch-valuation-engine/docs/README.md)

---

## 🏗️ Architecture

```
React Frontend (Port 3001)
    ↓
Valuation Engine API (Port 8000)
    ├─ /api/v1/valuation/quick ✅
    ├─ /api/v1/valuation/calculate ✅
    ├─ /api/v1/documents/parse ✅
    ├─ /api/v1/companies/lookup ✅
    └─ /api/v1/registry/:country/:id ✅
```

**Note**: This is a frontend-only application. For backend/engine documentation, see the valuation-engine docs.

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

## 📦 What's Included

### **Core Features** ✅

| Feature | Status | Description |
|---------|--------|-------------|
| Manual Entry Form | ✅ | Input financial data manually with validation |
| Real-Time Preview | ✅ | Live valuation estimate (updates as you type) |
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

**Last Updated**: October 5, 2025  
**Version**: 1.0.0  
**Status**: Production-Ready Frontend  
**License**: Proprietary (Internal Use Only)# Deployment trigger Wed Oct 22 22:56:30 CEST 2025
