# Production Environment Variables Setup

## 🎯 Production Configuration (Vercel)

Your production environment variables are correctly configured:

```env
# Node.js Backend (Railway)
VITE_API_BASE_URL=https://web-production-8d00b.up.railway.app

# Python Valuation Engine (Railway)
VITE_VALUATION_ENGINE_URL=<hidden>

# Main Platform
VITE_PARENT_DOMAIN=https://upswitch.biz

# Supabase
VITE_SUPABASE_URL=https://vrxsdtmsvdjpteynqnqc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZyeHNkdG1zdmRqcHRleW5xbnFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDYzNTcsImV4cCI6MjA3MzA4MjM1N30.QPB6lW9GjET-WDdWL29RccD1gnhpDWOnhSQVnSowIxE
```

## 📋 Environment Variable Usage Mapping

### 1. **Authentication & Saving Valuations** (Node.js Backend)
**Service**: `web-production-8d00b.up.railway.app`

Used by:
- `src/contexts/AuthContext.tsx` → `/api/auth/me`, `/api/auth/exchange-token`
- `src/store/useValuationStore.ts` → `/api/valuations/save`

Fallback chain:
```typescript
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 
                    import.meta.env.VITE_API_BASE_URL || 
                    'http://localhost:5001';
```

✅ **Production**: Uses `VITE_API_BASE_URL=https://web-production-8d00b.up.railway.app`  
✅ **Local**: Falls back to `http://localhost:5001`

---

### 2. **Valuation Calculations** (Python Engine)
**Service**: Railway Python backend

Used by:
- `src/services/api.ts` → `/api/v1/valuation/calculate`
- `src/services/registryService.ts` → `/api/v1/registry/*`
- `src/controllers/chat/valuationChatController.ts` → Chat endpoints
- `src/config.ts` → API base configuration

Fallback chain:
```typescript
const ENGINE_URL = import.meta.env.VITE_VALUATION_ENGINE_URL || 
                   import.meta.env.VITE_VALUATION_API_URL || 
                   'https://upswitch-valuation-engine-production.up.railway.app';
```

✅ **Production**: Uses `VITE_VALUATION_ENGINE_URL`  
✅ **Local**: Falls back to production Railway URL

---

### 3. **PostMessage Communication**
**Service**: Main platform (upswitch.biz)

Used by:
- `src/store/useValuationStore.ts` → Notify parent window of valuation save

```typescript
const targetOrigin = import.meta.env.VITE_PARENT_DOMAIN || 'https://upswitch.biz';
```

✅ **Production**: Uses `VITE_PARENT_DOMAIN=https://upswitch.biz`  
✅ **Local**: Falls back to `https://upswitch.biz`

---

## 🔧 Local Development Setup

1. **Copy environment template**:
   ```bash
   cp .env.example .env.local
   ```

2. **Verify `.env.local` contents**:
   ```env
   # Node.js Backend (local)
   VITE_API_BASE_URL=http://localhost:5001
   VITE_BACKEND_URL=http://localhost:5001
   
   # Python Valuation Engine (production Railway)
   VITE_VALUATION_ENGINE_URL=https://upswitch-valuation-engine-production.up.railway.app
   VITE_VALUATION_API_URL=https://upswitch-valuation-engine-production.up.railway.app
   
   # Main Platform (local)
   VITE_PARENT_DOMAIN=http://localhost:3000
   
   # Supabase (shared)
   VITE_SUPABASE_URL=https://vrxsdtmsvdjpteynqnqc.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

3. **Start services**:
   ```bash
   # Terminal 1: Node.js backend
   cd apps/upswitch-backend
   PORT=5001 npm run dev
   
   # Terminal 2: Valuation tester
   cd apps/upswitch-valuation-tester
   npm run dev  # Runs on port 3001
   ```

---

## ✅ Production Verification Checklist

When deploying to production (Vercel), ensure:

- [ ] `VITE_API_BASE_URL` points to Node.js backend Railway
- [ ] `VITE_VALUATION_ENGINE_URL` points to Python engine Railway
- [ ] `VITE_PARENT_DOMAIN` is set to `https://upswitch.biz`
- [ ] `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are configured
- [ ] All environment variables are set in Vercel project settings
- [ ] CORS is enabled on both Railway backends for `https://valuation.upswitch.biz`

---

## 🚀 Deployment

The code is now configured to work correctly in both environments:

### Production Flow:
1. User visits `https://valuation.upswitch.biz`
2. Auth requests → `https://web-production-8d00b.up.railway.app/api/auth/*`
3. Valuation calculations → Python Railway backend
4. Save valuation → `https://web-production-8d00b.up.railway.app/api/valuations/save`
5. Notify parent → `postMessage` to `https://upswitch.biz`

### Local Flow:
1. User visits `http://localhost:3001`
2. Auth requests → `http://localhost:5001/api/auth/*`
3. Valuation calculations → Production Python Railway backend
4. Save valuation → `http://localhost:5001/api/valuations/save`
5. Notify parent → `postMessage` to `http://localhost:3000`

---

## 📝 Notes

- All environment variables use the `VITE_` prefix for Vite compatibility
- Fallback chains ensure the app works even if some vars are missing
- Production URLs are hardcoded as final fallback for safety
- `.env.local` is gitignored to prevent committing secrets

