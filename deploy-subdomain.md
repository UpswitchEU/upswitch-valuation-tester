# 🚀 Subdomain Deployment Guide: tester.upswitch.com

## 🎯 **Strategy Overview**

Deploy the Upswitch Valuation Tester as a standalone subdomain for:
- **Focused Performance Testing** - Isolated analytics and metrics
- **Independent Deployments** - Deploy valuation features without affecting main app
- **User Segmentation** - Track valuation-specific conversion funnels
- **A/B Testing** - Test different valuation UX approaches

---

## 📋 **Pre-Deployment Checklist**

### ✅ **1. Domain Configuration**
```bash
# DNS Setup (in your domain provider)
tester.upswitch.com → CNAME → cname.vercel-dns.com
```

### ✅ **2. Environment Variables**
Create `.env.production`:
```bash
VITE_VALUATION_API_URL=https://api.upswitch.com
VITE_ENABLE_REGISTRY=true
VITE_ENABLE_DOCUMENT_UPLOAD=true
VITE_APP_NAME=Upswitch Valuation Tester
VITE_APP_VERSION=1.0.0
VITE_ANALYTICS_ID=GTM-XXXXXXX
VITE_ENVIRONMENT=production
```

### ✅ **3. Analytics Setup**
- **Google Analytics**: Separate property for tester subdomain
- **Hotjar/FullStory**: Dedicated session recording
- **Mixpanel/Amplitude**: Track valuation-specific events

---

## 🚀 **Deployment Options**

### **Option 1: Vercel (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy with custom domain
cd /Users/matthiasmandiau/Downloads/upswitch/apps/upswitch-valuation-tester
vercel --prod --name upswitch-tester

# Add custom domain in Vercel dashboard
# Domain: tester.upswitch.com
```

### **Option 2: Netlify**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist

# Add custom domain in Netlify dashboard
```

### **Option 3: AWS S3 + CloudFront**
```bash
# Build the app
npm run build

# Upload to S3 bucket
aws s3 sync dist/ s3://tester.upswitch.com --delete

# Configure CloudFront distribution
# Point to tester.upswitch.com
```

---

## 📊 **Analytics Configuration**

### **Google Analytics 4**
```javascript
// Add to index.html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID', {
    page_title: 'Valuation Tester',
    page_location: 'https://tester.upswitch.com'
  });
</script>
```

### **Custom Events to Track**
```javascript
// Valuation-specific events
gtag('event', 'valuation_started', {
  event_category: 'valuation',
  event_label: 'manual_entry'
});

gtag('event', 'valuation_completed', {
  event_category: 'valuation',
  event_label: 'success',
  value: valuation_amount
});

gtag('event', 'valuation_exported', {
  event_category: 'valuation',
  event_label: 'pdf_export'
});
```

---

## 🔧 **Performance Optimizations**

### **1. Bundle Optimization**
```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['recharts'],
          ui: ['@heroui/react', 'framer-motion']
        }
      }
    }
  }
});
```

### **2. CDN Configuration**
```json
// vercel.json
{
  "headers": [
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

---

## 📈 **Key Metrics to Track**

### **Conversion Funnel**
1. **Landing Page Views** → `tester.upswitch.com`
2. **Form Started** → User begins entering data
3. **Form Completed** → All required fields filled
4. **Valuation Calculated** → API call successful
5. **Results Viewed** → User sees results
6. **Export Action** → PDF/JSON downloaded

### **Performance Metrics**
- **Page Load Time** < 2 seconds
- **Valuation Calculation** < 5 seconds
- **Mobile Responsiveness** > 95% score
- **Error Rate** < 1%

### **User Experience Metrics**
- **Time to First Valuation** < 3 minutes
- **Form Abandonment Rate** < 30%
- **Return User Rate** > 20%
- **Export Usage** > 15%

---

## 🧪 **A/B Testing Opportunities**

### **Test 1: Form Layout**
- **A**: Current multi-step form
- **B**: Single-page form with sections

### **Test 2: Results Display**
- **A**: Current detailed breakdown
- **B**: Simplified summary view

### **Test 3: CTA Buttons**
- **A**: "Calculate Valuation" button
- **B**: "Get My Valuation" button

---

## 🔒 **Security Considerations**

### **CORS Configuration**
```javascript
// Backend API needs to allow tester.upswitch.com
CORS_ORIGINS = [
  "https://upswitch.com",
  "https://tester.upswitch.com",
  "https://app.upswitch.com"
]
```

### **Rate Limiting**
- **Valuation API**: 10 requests per minute per IP
- **Registry Lookup**: 5 requests per minute per IP
- **Document Upload**: 3 requests per minute per IP

---

## 📱 **Mobile Optimization**

### **Progressive Web App (PWA)**
```json
// public/manifest.json
{
  "name": "Upswitch Valuation Tester",
  "short_name": "Valuation Tester",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#3b82f6"
}
```

---

## 🚀 **Launch Checklist**

### **Pre-Launch**
- [ ] Domain DNS configured
- [ ] SSL certificate active
- [ ] Analytics tracking installed
- [ ] Performance monitoring setup
- [ ] Error tracking configured
- [ ] Mobile testing completed

### **Post-Launch**
- [ ] Monitor conversion rates
- [ ] Track performance metrics
- [ ] Collect user feedback
- [ ] Optimize based on data
- [ ] Plan feature iterations

---

## 📞 **Support & Monitoring**

### **Error Tracking**
```javascript
// Sentry integration
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "YOUR_SENTRY_DSN",
  environment: "production",
  tracesSampleRate: 1.0,
});
```

### **Performance Monitoring**
```javascript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

---

## 🎯 **Success Metrics**

### **Week 1 Goals**
- [ ] 100+ unique visitors
- [ ] 50+ valuations completed
- [ ] < 2% error rate
- [ ] > 90% mobile score

### **Month 1 Goals**
- [ ] 1,000+ unique visitors
- [ ] 500+ valuations completed
- [ ] 20%+ conversion rate
- [ ] 4.5+ user satisfaction score

### **Quarter 1 Goals**
- [ ] 10,000+ unique visitors
- [ ] 5,000+ valuations completed
- [ ] 30%+ conversion rate
- [ ] Feature parity with main app

---

## 🔄 **Next Steps**

1. **Set up domain DNS** → Point tester.upswitch.com to hosting
2. **Configure analytics** → Set up tracking and monitoring
3. **Deploy to production** → Use Vercel/Netlify/AWS
4. **Monitor performance** → Track key metrics
5. **Iterate and optimize** → Based on user feedback and data

---

**Ready to launch? Let's make tester.upswitch.com the best valuation testing experience! 🚀**
