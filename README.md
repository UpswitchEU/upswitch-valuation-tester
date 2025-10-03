# 🚀 Upswitch Valuation Engine - Standalone Tester

**Version**: 1.0.0  
**Status**: ✅ Phase 1 Complete, 📋 Phase 2 Ready  
**Tech Stack**: React 18 + TypeScript + Tailwind + Vite

---

## 📋 Overview

This is a **standalone React application** for testing the Upswitch AI-Powered Business Valuation Engine. It provides a beautiful, brand-consistent UI for:

- ✅ **Manual valuation entry** (Phase 1 - DONE)
- ✅ **Real-time preview** as you type (Phase 1 - DONE)
- 📋 **Document upload** with AI parsing (Phase 2 - UI ready)
- 📋 **Company lookup** with auto-fill (Phase 2 - UI ready)
- ✅ **Comprehensive results** with charts (Phase 1 - DONE)

---

## 🎯 Purpose

This standalone app enables:
1. **Internal QA testing** - Test valuation engine changes
2. **External beta testing** - Share with 10-20 business owners
3. **Sales demos** - Live valuations in calls
4. **Marketing content** - Screenshots and videos
5. **Partnership demos** - Show to M&A advisors

---

## 🏗️ Architecture

```
React App (Port 3001) → Python Valuation Engine (Port 8000)
                        ├─ /api/v1/valuation/quick ✅
                        ├─ /api/v1/valuation/calculate ✅
                        ├─ /api/v1/documents/parse ⏳ Phase 2
                        └─ /api/v1/companies/lookup ⏳ Phase 2
```

---

## 🚀 Quick Start

### **Prerequisites**
- Node.js 20+ and npm
- Python valuation engine running on port 8000

### **Installation**
```bash
# Navigate to project
cd /Users/matthiasmandiau/Downloads/upswitch/apps/upswitch-valuation-tester

# Install dependencies
npm install

# Copy brand assets from main frontend
cp ../upswitch-frontend/public/UpSwitch_logo_var1.svg ./public/
cp ../upswitch-frontend/public/upswitch_favicon.svg ./public/

# Start development server
npm run dev
```

**Access**: http://localhost:3001

### **Verify Python Engine is Running**
```bash
curl http://localhost:8000/health
# Should return: {"status":"healthy"}
```

---

## 📦 What's Included

### **Phase 1: Core Functionality** ✅ COMPLETE

| Feature | Status | Description |
|---------|--------|-------------|
| Manual Entry Form | ✅ | Input financial data manually |
| Real-Time Preview | ✅ | Live estimate as you type (800ms debounce) |
| Comprehensive Calculation | ✅ | Full DCF + Multiples valuation |
| Results Display | ✅ | Charts, metrics, insights |
| Export JSON | ✅ | Download valuation results |
| Beta Disclaimer | ✅ | Legal protection for testing |
| Upswitch Branding | ✅ | Logo, colors, fonts match main app |

### **Phase 2: Next-Gen UX** 📋 UI READY

| Feature | Status | Backend Needed |
|---------|--------|----------------|
| Document Upload UI | ✅ | `/documents/parse` endpoint |
| Company Lookup UI | ✅ | `/companies/lookup` endpoint |
| AI Data Extraction | 📋 | GPT-4 integration |
| Smart Suggestions | 📋 | Field impact analysis |

**Phase 2 Status**: Frontend components are built and ready. Backend endpoints need implementation (see `docs/PHASE2_BACKEND_API_SPEC.md`).

---

## 🎨 Branding

### **Colors** (matching main Upswitch app)
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
│   ├── UpSwitch_logo_var1.svg      # Copy from main frontend
│   └── upswitch_favicon.svg        # Copy from main frontend
├── src/
│   ├── components/
│   │   ├── Header.tsx              # Logo + Beta badge
│   │   ├── DocumentUpload.tsx      # Phase 2: Drag-drop UI
│   │   ├── CompanyLookup.tsx       # Phase 2: Search autocomplete
│   │   ├── ValuationForm.tsx       # Manual entry form
│   │   ├── LivePreview.tsx         # Real-time estimate panel
│   │   └── Results.tsx             # Valuation results display
│   ├── hooks/
│   │   ├── useRealTimePreview.ts   # Debounced quick calc
│   │   └── useValuation.ts         # Main calculation hook
│   ├── services/
│   │   └── api.ts                  # Axios client
│   ├── store/
│   │   └── useValuationStore.ts    # Zustand state
│   ├── types/
│   │   └── valuation.ts            # TypeScript types
│   ├── App.tsx                     # Main app component
│   ├── main.tsx                    # React entry point
│   └── index.css                   # Tailwind + custom styles
├── docs/
│   ├── CTO_IMPLEMENTATION_GUIDE.md # Complete implementation guide
│   └── PHASE2_BACKEND_API_SPEC.md  # Backend API specifications
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
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### **Environment Variables**
```bash
# .env (create from .env.example)
VITE_VALUATION_API_URL=http://localhost:8000

# Phase 2 (optional)
VITE_OPENAI_API_KEY=sk-...
VITE_COMPANIES_HOUSE_API_KEY=...
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

### **Option 2: Netlify**
```bash
# Build
npm run build

# Deploy
npx netlify-cli deploy --prod --dir=dist
```

### **Option 3: Static Hosting**
```bash
# Build
npm run build

# Upload dist/ folder to:
# - AWS S3 + CloudFront
# - GitHub Pages
# - Any static host
```

---

## 🧪 Testing

### **Manual Testing Checklist**
- [ ] Form validation (required fields)
- [ ] Real-time preview updates
- [ ] Full calculation works
- [ ] Results display correctly
- [ ] Charts render properly
- [ ] Export JSON works
- [ ] Mobile responsive
- [ ] Logo displays correctly
- [ ] Beta disclaimer visible

### **Test Scenarios**
```bash
# Scenario 1: Quick Estimate
- Revenue: €2,500,000
- EBITDA: €500,000
- Industry: Technology
- Country: Germany
Expected: €8-14M valuation

# Scenario 2: Negative EBITDA
- Revenue: €1,000,000
- EBITDA: -€50,000
Expected: Asset-based valuation only

# Scenario 3: Historical Data
- Add 3 years of historical data
Expected: Higher confidence score
```

---

## 📚 Documentation

### **For Developers**
- [`CTO_IMPLEMENTATION_GUIDE.md`](./docs/CTO_IMPLEMENTATION_GUIDE.md) - Complete technical guide
- [`PHASE2_BACKEND_API_SPEC.md`](./docs/PHASE2_BACKEND_API_SPEC.md) - Backend endpoint specs

### **For Product Team**
- See UI screenshots in `/docs/screenshots/`
- Test scenarios in `/docs/test-scenarios.json`

### **For External Testers**
- **URL**: http://localhost:3001 (or deployed URL)
- **Test Duration**: 15-20 minutes
- **Feedback Form**: [Link to feedback form]

---

## 🐛 Troubleshooting

### **Issue**: "Failed to connect to valuation engine"
**Solution**: Verify Python engine is running on port 8000
```bash
curl http://localhost:8000/health
```

### **Issue**: "Logo not displaying"
**Solution**: Copy logo from main frontend
```bash
cp ../upswitch-frontend/public/UpSwitch_logo_var1.svg ./public/
```

### **Issue**: "Real-time preview not working"
**Solution**: Check browser console. Ensure valuation engine has CORS enabled for `http://localhost:3001`

### **Issue**: TypeScript errors
**Solution**: Run type check
```bash
npm run type-check
```

---

## 📊 Success Metrics

### **Phase 1 Beta Testing**
- **Completion Rate**: Target > 60%
- **Time to Complete**: Target < 5 minutes
- **User Satisfaction**: Target > 4/5
- **Calculation Accuracy**: Target > 90% within ±15%

### **Phase 2 Goals**
- **Document Upload Success Rate**: > 80%
- **Company Lookup Accuracy**: > 85%
- **Time to Valuation**: < 2 minutes (vs 5 min manual)

---

## 🔒 Security

### **Current (Phase 1)**
- ✅ No authentication required (testing tool)
- ✅ No data persistence
- ✅ CORS configured
- ✅ Rate limiting on backend (100/hour per IP)

### **Phase 2 Additions**
- [ ] File upload validation (whitelist, size limits)
- [ ] Virus scanning
- [ ] PII detection and redaction

---

## 🤝 Contributing

This is an internal testing tool. For contributions:
1. Create feature branch
2. Follow existing code style
3. Add TypeScript types
4. Test manually before PR
5. Update documentation

---

## 📞 Support

### **For Technical Issues**
- Check `docs/CTO_IMPLEMENTATION_GUIDE.md`
- Review browser console for errors
- Verify Python engine health: `curl http://localhost:8000/health`

### **For Phase 2 Implementation**
- See `docs/PHASE2_BACKEND_API_SPEC.md` for backend requirements
- Contact backend team for API implementation timeline

---

## 📅 Roadmap

### **Phase 1** ✅ COMPLETE (October 2025)
- [x] Project setup
- [x] Branding and UI
- [x] Manual entry form
- [x] Real-time preview
- [x] Results display
- [x] Documentation

### **Phase 2** 📋 UI READY, BACKEND PENDING
- [ ] Backend: Document parsing endpoint (6-8 hours)
- [ ] Backend: Company lookup endpoint (4-6 hours)
- [ ] Testing: Document upload flow
- [ ] Testing: Company lookup flow

### **Phase 3** 🔮 FUTURE
- [ ] Integration with main Upswitch frontend
- [ ] Authentication and user accounts
- [ ] Data persistence (save valuations)
- [ ] PDF export of results
- [ ] Email sharing

---

## ✅ Summary

**Current Status**: ✅ Phase 1 Complete and Ready for Beta Testing

**What Works**:
- ✅ Manual financial data entry with validation
- ✅ Real-time valuation preview (updates as you type)
- ✅ Comprehensive valuation calculation (DCF + Multiples)
- ✅ Beautiful results display with charts
- ✅ JSON export functionality
- ✅ Upswitch branding (logo, colors, fonts)

**What's Next**:
1. **Ship Phase 1 for beta testing** (recommended)
2. **Gather user feedback** on core functionality
3. **Build Phase 2 backend endpoints** based on feedback
4. **Iterate and improve** UX

---

**Built with** ❤️ **by the Upswitch Team**  
**For questions**: Contact CTO / Engineering Lead

---

**Last Updated**: October 3, 2025  
**Version**: 1.0.0  
**License**: Proprietary (Internal Use Only)
