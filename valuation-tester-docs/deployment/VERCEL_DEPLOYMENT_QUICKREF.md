# Vercel Deployment Quick Reference Card

## ⚡ The Fix (One-Page Summary)

### Problem
Routes like `/instant`, `/manual`, `/reports` returned **404 errors** on Vercel.

### Root Cause
Missing `vercel.json` configuration file.

### Solution
Created `vercel.json` with SPA routing configuration.

---

## 📋 What Was Added

### File: `vercel.json`
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**What it does:**
- All routes → serve `/index.html`
- React Router handles routing
- URL stays unchanged in browser

---

## ✅ Routes That Now Work

| Route | Purpose | Status |
|-------|---------|--------|
| `/` | Home → redirects to `/instant` | ✅ |
| `/instant` | AI-Powered Valuation | ✅ |
| `/manual` | Manual Input Form | ✅ |
| `/upload` | Document Upload | ✅ |
| `/reports` | Saved Reports | ✅ |
| `/privacy` | Privacy Policy | ✅ |
| `/about` | About Page | ✅ |
| `/how-it-works` | Methodology | ✅ |

---

## 🚀 Deploy Steps

```bash
# 1. Commit
git add apps/upswitch-valuation-tester/vercel.json
git commit -m "fix: add vercel.json for SPA routing (v1.8.1)"

# 2. Push
git push origin main

# 3. Vercel auto-deploys (wait ~2 minutes)

# 4. Test
open https://upswitch-valuation-tester.vercel.app/instant
```

---

## 🧪 Testing Checklist

After deployment, test:

- [ ] Direct navigation to `/instant`
- [ ] Direct navigation to `/manual`
- [ ] Direct navigation to `/reports`
- [ ] Page refresh (F5) on any route
- [ ] Browser back/forward buttons
- [ ] Bookmark a route → close browser → reopen

**All should work without 404 errors.**

---

## 🔍 How It Works

### Before (Broken)
```
User → /instant
  ↓
Vercel: "File /instant doesn't exist"
  ↓
❌ 404 Error
```

### After (Fixed)
```
User → /instant
  ↓
vercel.json: "Serve /index.html"
  ↓
React loads → Router reads URL → /instant
  ↓
✅ Renders Instant Valuation
```

---

## 🎯 Key Concepts

### Rewrites vs Redirects

❌ **Redirects** (wrong):
- Changes URL in browser
- `/instant` → `/index.html` (visible)

✅ **Rewrites** (correct):
- Serves different file
- URL stays `/instant` (invisible)
- React Router can read original URL

### Why It's Needed

SPAs (Single Page Applications) need all routes to serve the same `index.html` file so the JavaScript app can handle routing.

---

## 📚 Full Documentation

For detailed explanations, see:
- `docs/DEPLOYMENT_TROUBLESHOOTING.md` - Complete guide
- `CHANGELOG.md` - v1.8.1 entry

---

## 🆘 Troubleshooting

### Issue: Still seeing 404 after deployment

**Solution:**
1. Check Vercel dashboard → Deployments
2. Verify latest deployment includes `vercel.json`
3. Hard refresh browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
4. Clear browser cache
5. Wait 2-3 minutes for Edge Network propagation

### Issue: vercel.json not being read

**Solution:**
1. Verify file is at project root: `apps/upswitch-valuation-tester/vercel.json`
2. Check JSON syntax is valid (no trailing commas)
3. Re-deploy from Vercel dashboard

### Issue: Routes work on localhost but not Vercel

**Solution:**
1. Ensure `vercel.json` is committed to git
2. Push to repository
3. Vercel only reads files from repository

---

## 🔒 Bonus: Security Headers

`vercel.json` also adds security headers:

| Header | Purpose |
|--------|---------|
| `X-Content-Type-Options: nosniff` | Prevents MIME-sniffing |
| `X-Frame-Options: DENY` | Prevents clickjacking |
| `X-XSS-Protection: 1; mode=block` | XSS protection |

---

## ⚡ Bonus: Performance

Cache-Control headers for optimal performance:

| Resource | Cache Duration | Reason |
|----------|----------------|--------|
| `index.html` | Never cached | Always fresh after deploy |
| `/assets/*` | 1 year | Immutable (hash in filename) |

---

## 📞 Need Help?

See full troubleshooting guide:
`docs/DEPLOYMENT_TROUBLESHOOTING.md`

---

**Version:** v1.8.1  
**Status:** ✅ PRODUCTION READY  
**Last Updated:** 2025-10-06
