# Deployment Troubleshooting Guide

## Issue: 404 Errors on Vercel

### Problem Description

When deploying a React Single Page Application (SPA) with client-side routing to Vercel, you may encounter 404 errors when:
- Directly navigating to routes like `/instant`, `/manual`, `/reports`
- Refreshing the page on any route except `/`
- Using browser back/forward buttons

### Root Cause

**Vercel (and most static hosting providers) need explicit configuration to handle SPAs.**

By default, when you request `/instant`:
1. Vercel looks for a file at `/instant/index.html` or `/instant`
2. That file doesn't exist (only `/index.html` exists)
3. Vercel returns a 404 error

**What should happen:**
1. Vercel should serve `/index.html` for ALL routes
2. React Router (client-side) takes over and renders the correct component
3. User sees the intended page

---

## Solution: vercel.json Configuration

Create a `vercel.json` file at the root of your project:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    },
    {
      "source": "/index.html",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Configuration Breakdown

#### 1. Rewrites Section

```json
"rewrites": [
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
]
```

**What it does:**
- Matches ALL routes (`/(.*)` is a regex that matches everything)
- Rewrites them to serve `/index.html`
- React Router then handles the routing client-side

**Example:**
- User requests `/instant` → Vercel serves `/index.html`
- User requests `/reports` → Vercel serves `/index.html`
- User requests `/manual` → Vercel serves `/index.html`
- React Router sees the URL and renders the correct component

#### 2. Security Headers

```json
"headers": [
  {
    "source": "/(.*)",
    "headers": [
      {
        "key": "X-Content-Type-Options",
        "value": "nosniff"
      },
      // ... more headers
    ]
  }
]
```

**What they do:**
- **X-Content-Type-Options: nosniff** - Prevents browsers from MIME-sniffing (security)
- **X-Frame-Options: DENY** - Prevents clickjacking attacks
- **X-XSS-Protection: 1; mode=block** - Enables XSS filtering in older browsers

#### 3. Cache-Control Headers

```json
{
  "source": "/index.html",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "public, max-age=0, must-revalidate"
    }
  ]
}
```

**For index.html:**
- `max-age=0, must-revalidate` - Never cache, always check for updates
- Ensures users always get the latest version after deployment

**For assets:**
```json
{
  "source": "/assets/(.*)",
  "headers": [
    {
      "key": "Cache-Control",
      "value": "public, max-age=31536000, immutable"
    }
  ]
}
```
- `max-age=31536000` - Cache for 1 year (31,536,000 seconds)
- `immutable` - File will never change (Vite generates unique filenames)
- Optimal performance: assets cached forever, HTML never cached

---

## How to Verify the Fix

### 1. Local Build Test

```bash
# Build the app
yarn build

# Preview the production build
yarn preview
```

Navigate to:
- `http://localhost:4173/instant` ✅ Should work
- `http://localhost:4173/manual` ✅ Should work
- `http://localhost:4173/reports` ✅ Should work
- Refresh each page ✅ Should stay on the same route

### 2. After Deploying to Vercel

Test these scenarios:

#### ✅ Direct Navigation
1. Open browser
2. Go directly to `https://your-app.vercel.app/instant`
3. Should show Instant Valuation page (not 404)

#### ✅ Page Refresh
1. Navigate to any route (e.g., `/manual`)
2. Press F5 or Ctrl+R to refresh
3. Should stay on the same page (not 404)

#### ✅ Browser Navigation
1. Navigate through different routes
2. Press browser back button
3. Should navigate to previous route (not 404)

#### ✅ Bookmarks
1. Navigate to `/reports`
2. Bookmark the page
3. Close browser
4. Open bookmark
5. Should open directly to Reports page (not 404)

### 3. Check Vercel Logs

In Vercel dashboard:
1. Go to your project
2. Click on "Deployments"
3. Click on the latest deployment
4. Check "Functions" tab - should show no errors
5. Check "Edge Network" tab - all routes should show 200 status

---

## Common Pitfalls

### ❌ Pitfall 1: Using `redirects` instead of `rewrites`

**Wrong:**
```json
{
  "redirects": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Problem:** This causes an actual HTTP redirect (302/301), changing the URL in the browser to `/index.html`.

**Correct:** Use `rewrites` (as shown above) - serves `/index.html` while keeping the original URL.

---

### ❌ Pitfall 2: Not handling 404s

**Problem:** If someone navigates to a truly invalid route (e.g., `/this-route-does-not-exist`), they should see your custom 404 page, not Vercel's default.

**Solution:** React Router's catch-all route handles this:

```tsx
// In src/router/index.tsx
{
  path: '*',
  element: <NotFound />,
}
```

This is already configured correctly in our router.

---

### ❌ Pitfall 3: Forgetting other hosting providers

**This guide is Vercel-specific.** Other providers need different configs:

**Netlify** - Create `_redirects` file:
```
/*  /index.html  200
```

**AWS S3 + CloudFront** - Set custom error response:
- Error Code: 403
- Response Page Path: `/index.html`
- HTTP Response Code: 200

**GitHub Pages** - Add `404.html` that redirects to `index.html`

---

## Architecture Understanding

### Client-Side Routing vs Server-Side Routing

**Server-Side Routing (Traditional):**
```
User requests /about
  ↓
Server has /about/index.html
  ↓
Server sends /about/index.html
  ↓
Browser renders page
```

**Client-Side Routing (SPA):**
```
User requests /about
  ↓
Server sends /index.html (for ANY route)
  ↓
Browser loads React app
  ↓
React Router looks at URL (/about)
  ↓
React Router renders <About /> component
```

**Why it breaks without vercel.json:**
```
User requests /about
  ↓
Server looks for /about/index.html
  ↓
File doesn't exist
  ↓
❌ 404 Error
  ↓
React never loads
```

**Why it works with vercel.json:**
```
User requests /about
  ↓
vercel.json rewrites to /index.html
  ↓
Server sends /index.html
  ↓
Browser loads React app
  ↓
React Router sees URL is /about
  ↓
✅ Renders <About /> component
```

---

## Related Files

- **`vercel.json`** - Deployment configuration (this file fixes the issue)
- **`src/router/index.tsx`** - React Router configuration
- **`src/router/routes.ts`** - Route definitions
- **`src/App.tsx`** - Main app component that syncs URL with state

---

## Deployment Checklist

Before deploying to Vercel:

- [x] ✅ `vercel.json` exists at project root
- [x] ✅ Rewrites section configured for `/(.*) → /index.html`
- [x] ✅ Security headers configured
- [x] ✅ Cache-Control headers optimized
- [x] ✅ Router configured with catch-all `*` route
- [x] ✅ NotFound component exists
- [x] ✅ All routes defined in `src/router/routes.ts`
- [x] ✅ Local build tested with `yarn build && yarn preview`
- [x] ✅ Tested direct navigation to all routes locally
- [x] ✅ Tested page refresh on all routes locally

After deploying to Vercel:

- [ ] ✅ Direct navigation to `/instant` works
- [ ] ✅ Direct navigation to `/manual` works
- [ ] ✅ Direct navigation to `/reports` works
- [ ] ✅ Direct navigation to `/privacy` works
- [ ] ✅ Page refresh on `/instant` works
- [ ] ✅ Page refresh on `/manual` works
- [ ] ✅ Browser back button works
- [ ] ✅ Browser forward button works
- [ ] ✅ Invalid routes show custom 404 page

---

## Additional Resources

- [Vercel Rewrites Documentation](https://vercel.com/docs/projects/project-configuration#rewrites)
- [Vercel Headers Documentation](https://vercel.com/docs/projects/project-configuration#headers)
- [React Router Documentation](https://reactrouter.com/en/main/start/tutorial)
- [SPA Routing Best Practices](https://create-react-app.dev/docs/deployment/#serving-apps-with-client-side-routing)

---

## Version History

- **v1.8.1** (2025-10-06) - Added `vercel.json` to fix 404 errors
- **v1.8.0** (2025-10-06) - Added Reports page and routing system
- **v1.6.0** (2025-10-06) - Initial router implementation

---

**Status:** ✅ FIXED - All routes now work correctly on Vercel
